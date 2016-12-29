const canister = function canister(configPath, root) {
	if (!root) {
		root = process.cwd();
	}

	const moduleLoader = new canister.ModuleLoader(root);
	const builder = new canister.Builder(moduleLoader);
	const yamlLoader = new canister.definitionLoader.YAML();

	yamlLoader.fromFile(config);

	const parser = new canister.Parser(yamlLoader.toJS());

	for (let definition of parser.parse()) {
		builder.addDefinition(definition);
	}

	return builder.build();
}

canister.Builder = require('./src/builder');
canister.Parser = require('./src/parser');
canister.ModuleLoader = require('./src/loader');
canister.definitionLoader = {
	YAML: require('./src/definition-loader/yaml')
};

module.exports = canister;
