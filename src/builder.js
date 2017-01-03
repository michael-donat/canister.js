const EventEmitter = require('events').EventEmitter;
const DepGraph = require('dependency-graph').DepGraph;
const Container = require('./container');
const Definition = require('./definition');
const _filter = require('lodash.filter')

module.exports = class Builder extends EventEmitter {
	constructor(loader) {
		super();
		this.loader = loader;
		this.definitions = {};
		this.cycles = [];
	}

	addCycle(cycle) {
		this.cycles.push(cycle);
	}

	getDefinitionsByTag(tagName) {
		return _filter(this.definitions, definition => {
			return definition.tags.filter(tag => tag.name === tagName).length > 0
		});
	}

	getDefinitionById(id) {
		if (!this.definitions[id]) {
			throw new Error(`Unknown definition ${id}`);
		}

		return this.definitions[id];
	}

	addDefinition(definition) {
		if (!(definition instanceof Definition)) {
			throw new Error('Expected an instance of Definition');
		}
		if (definition.isValue()) {
			throw new Error('Unexpected instance of value definition');
		}
		if (this.definitions[definition.id]) {
			throw new Error(`Duplicate definition '${definition.id}'`);
		}
		this.definitions[definition.id] = definition;
	}

	__buildClass(definition) {
		let loadedModule = this.loader.loadModule(definition.module);
		let Klass = loadedModule;

		if (definition.class) {
			Klass = loadedModule[definition.class];
		}

		if (!Klass) {
			throw new Error(`Can't find class '${definition.class}' in module '${definition.module}' for definition '${definition.id}'`);
		}

		let getParams = () => [];
		let applyCalls = f => f;

		if (definition.hasConstructorArguments()) {
			getParams = container => {
				const params = [];
				definition.getConstructorArguments().forEach(argDefinition => {
					params.push(argDefinition.isValue() ? argDefinition.value : container.get(argDefinition.id));
				});
				return params;
			};
		}

		if (definition.hasCalls()) {
			applyCalls = (instance, container) => {
				definition.calls.forEach(call => {
					if (!instance[call.method]) {
						throw new Error(`Can't find method '${call.method}' of class '${definition.class}' in module '${definition.module}' for definition '${definition.id}'`);
					}
					let callParams = call.args.map(arg => arg.isValue() ? arg.value : container.get(arg.id));
					instance[call.method](...callParams);
				});
			};
		}

		let constructorFunction = function (container) {
			const instance = new Klass(...getParams(container));
			applyCalls(instance, container);
			return instance;
		};
		constructorFunction.__canisterBuilderProxy = true;

		let returnFunction = constructorFunction;

		if (definition.isTransient()) {
			returnFunction = function () {
				return constructorFunction;
			};
		}

		return returnFunction;
	}

	__buildGraph() {
		const graph = new DepGraph();
		for (let id in this.definitions) {
			if (this.definitions[id].isValue()) {
				continue;
			}
			graph.addNode(id);
		}
		for (let id in this.definitions) {
			if (Object.prototype.hasOwnProperty.call(this.definitions, id)) {
				let definition = this.definitions[id];
				if (definition.isValue()) {
					continue;
				}
				if (definition.isClass() && definition.hasConstructorArguments()) {
					definition.getConstructorArguments().forEach(arg => {
						if (arg.isValue()) {
							return;
						}
						graph.addDependency(id, arg.id);
					});
				}
				if (definition.isClass() && definition.hasCalls()) {
					definition.calls.forEach(call => {
						call.getArguments().forEach(arg => {
							if (arg.isValue()) {
								return;
							}
							graph.addDependency(id, arg.id);
						});
					});
				}
			}
		}
		return graph;
	}

	build() {
		const container = new Container();

		this.cycles.forEach(cycle => {
			cycle.execute(this);
		});

		const graph = this.__buildGraph();

		graph.overallOrder().forEach(id => {
			let definition = this.definitions[id];
			let builtValue;
			switch (true) {
				case definition.isParameter(): {
					builtValue = definition.value;
					break;
				}
				case definition.isClass(): {
					builtValue = this.__buildClass(definition)(container);
					break;
				}
				case definition.isModule(): {
					try {
						builtValue = this.loader.loadModule(definition.module);
					} catch (err) {
						const error = new Error(`Can't load module '${definition.module}' for definition '${definition.id}'`);
						error.previous = err;
						throw error;
					}
					break;
				}
				case definition.isProperty(): {
					let loadedModule;
					try {
						loadedModule = this.loader.loadModule(definition.module);
					} catch (err) {
						const error = new Error(`Can't load module '${definition.module}' for definition '${definition.id}'`);
						error.previous = err;
						throw error;
					}

					let property = loadedModule[definition.property];

					if (property === undefined) {
						throw new Error(`Can't locate property '${definition.property}' from module '${definition.module}' for definition '${definition.id}'`);
					}

					builtValue = property;
					break;
				}
				default: {
					throw new Error(`Unsupported definition type for '${definition.id}'`);
				}
			}

			container.register(definition.id, builtValue);
		});

		container.lock();
		return container;
	}

};
