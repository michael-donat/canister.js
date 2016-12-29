const EventEmitter = require('events').EventEmitter;
const Container = require('./container');
const DepGraph = require('dependency-graph').DepGraph;
const Definition = require('./definition');

module.exports = class Builder extends EventEmitter {
	constructor (loader) {
		super();
		this.loader = loader;
		this.definitions = {};
		this.cycles = [];
	}

	addCycle(cycle) {
		this.cycles.push(cycle);
	}

	addDefinition (definition) {
		if (!(definition instanceof Definition)) {
			throw new Error('Expected an instance of Definition');
		}
		if (definition.isValue()) {
			throw new Error('Unexpected instance of value definition');
		}
		if (this.definitions[definition.id]) {
			throw new Error(`Duplicate definition ${definition.id}`);
		}
		this.definitions[definition.id] = definition;
	}

	__buildClass(definition) {
		let loadedModule = this.loader.loadModule(definition.module);
		let klass;
		if (!definition.class) {
			klass = loadedModule
		} else {
			klass = loadedModule[definition.class];
		}

		if (!klass) {
			throw new Error(`Can't find class '${definition.class}' in module '${definition.module}' for definition '${definition.id}'`)
		}

		let getParams = () => [];

		if (definition.hasConstructorArguments()) {
			getParams = (container) => {
				const params = [];
				definition.getConstructorArguments().forEach((argDefinition) => {
					params.push(argDefinition.isValue() ? argDefinition.value : container.get(argDefinition.id));
				})
				return params;
			}
		}

		let constructorFunction = function(container) { return new klass(...getParams(container)); };
		constructorFunction.__canisterBuilderProxy = true;

		let returnFunction = constructorFunction;

		if (definition.isTransient()) {
			returnFunction = function() { return constructorFunction; };
		}

		return returnFunction;
	}

	__buildGraph() {
		const graph = new DepGraph();
		for (let id in this.definitions) {
			if (this.definitions[id].isValue()) continue;
			graph.addNode(id);
		}
		for (let id in this.definitions) {
			let definition = this.definitions[id];
			if (definition.isValue()) continue;
			if (definition.isClass() && definition.hasConstructorArguments()) {
				definition.getConstructorArguments().forEach((arg) => {
					if(arg.isValue()) return;
					graph.addDependency(id, arg.id);
				});
			}
		}
		return graph;
	}

	build () {
		const container = new Container();

		this.cycles.forEach((cycle) => {
			cycle.execute(this);
		});

		const graph = this.__buildGraph();

		graph.overallOrder().forEach((id) => {
			let definition = this.definitions[id];
			switch(true) {
				case definition.isParameter():
					container.register(definition.id, definition.value);
					break;
				case definition.isClass():
					container.register(definition.id, this.__buildClass(definition)(container));
					break;
				case definition.isModule():
					try {
						container.register(definition.id, this.loader.loadModule(definition.module));
					} catch (err) {
						const error = new Error(`Can't load module '${definition.module}' for definition '${definition.id}'`);
						error.previous = err;
						throw error;
					}
					break;
				case definition.isProperty():
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

					container.register(definition.id, property);
					break;
				default:
					throw new Error(`Unsupported definition type for '${definition.id}'`);
			}
		});

		container.lock();
		return container;
	}

};
