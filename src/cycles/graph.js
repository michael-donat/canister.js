const DepGraph = require('dependency-graph').DepGraph;

module.exports = class ParseCycle {
	execute(builder) {
		const graph = new DepGraph();
		for (let id in builder.definitions) {
			graph.addNode(id);
		}
		for (let id in builder.definitions) {
			let definition = builder.definitions[id];
			if (definition.isClass() && definition.hasConstructorArguments()) {
				definition.getConstructorArguments().forEach((arg) => {
					graph.addDependency(id, arg.id);
				});
			}
		}
		builder.graph = graph;
	}
};
