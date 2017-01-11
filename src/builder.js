const EventEmitter = require('events').EventEmitter;
const _filter = require('lodash.filter');
const _mapValues = require('lodash.mapvalues');
const _isArray = require('lodash.isarray');
const _map = require('lodash.map');
const _get = require('lodash.get');
const DepGraph = require('dependency-graph').DepGraph;
const Container = require('./container');
const Definition = require('./definition');

function getReference(container, argDefinition) {

	if (argDefinition.isSelf()) {
		return container;
	}

	let value = container.get(argDefinition.id);

	if (argDefinition.prop) {
		return _get(value, argDefinition.prop);
	}
	return value;
}


function getStructureDeps(structure) {
	return [].concat.apply([], _map(structure, val => {
		if (val instanceof Definition) {
			if (val.isSelf()) {
				return null;
			}

			return val.id;
		}

		if (typeof val !== 'object') {
			return null;
		}

		return getStructureDeps(val);
	})).filter(v => v);
}

function prepareStructure(container, structure) {
	const method = _isArray(structure) ? _map : _mapValues;
	return method(structure, val => {
		if (val instanceof Definition) {
			return getReference(container, val)
		}

		if (typeof val !== 'object') {
			return val;
		}
		return prepareStructure(container, val);
	});
}

function prepareArgument(container, argDefinition) {
	if (argDefinition.isValue()) {
		return argDefinition.value;
	}

	if (argDefinition.isStructure()) {
		return prepareStructure(container, argDefinition.value);
	}

	return getReference(container, argDefinition);
}

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
			return definition.tags.filter(tag => tag.name === tagName).length > 0;
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

	__buildFactory(definition) {
		let loadedModule = this.loader.loadModule(definition.module);
		let method;
		let call = definition.calls[0];

		if (call.method && !loadedModule[call.method]) {
			throw new Error(`Can't find factory method '${call.method}' in module '${definition.module}' for definition '${definition.id}'`);
		}

		if (call.method) {
			method = loadedModule[call.method];
		}

		let getParams = () => [];
		if (call.getArguments().length > 0) {
			getParams = container => {
				const params = [];
				call.getArguments().forEach(argDefinition => {
					params.push(prepareArgument(container, argDefinition));
				});
				return params;
			};
		}

		let constructorFunction = function (container) {
			return method ?
				method(...getParams(container)) :
				loadedModule(...getParams(container));
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
					params.push(prepareArgument(container, argDefinition));
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
					let callParams = call.args.map(arg => prepareArgument(container, arg));
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
			if (this.definitions[id].isValue() || this.definitions[id].isStructure()) {
				continue;
			}
			graph.addNode(id);
		}
		for (let id in this.definitions) {
			if (Object.prototype.hasOwnProperty.call(this.definitions, id)) {
				let definition = this.definitions[id];
				if (definition.isValue() || definition.isStructure() || definition.isSelf()) {
					continue;
				}
				if (definition.isClass() && definition.hasConstructorArguments()) {
					definition.getConstructorArguments().forEach(arg => {
						if (arg.isValue() || arg.isSelf()) {
							return;
						}
						if (arg.isStructure()) {
							getStructureDeps(arg).forEach(ref => {
								graph.addDependency(id, ref);
							});
							return;
						}
						graph.addDependency(id, arg.id);
					});
				}
				if (definition.hasCalls()) {
					definition.calls.forEach(call => {
						call.getArguments().forEach(arg => {
							if (arg.isValue() || arg.isSelf()) {
								return;
							}
							if (arg.isStructure()) {
								getStructureDeps(arg).forEach(ref => {
									graph.addDependency(id, ref);
								});
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
				case definition.isFactory(): {
					builtValue = this.__buildFactory(definition)(container);
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
						const error = new Error(`Can't load module '${definition.module}' for definition '${definition.id}'. [${err.message}]`);
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
