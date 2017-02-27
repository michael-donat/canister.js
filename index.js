const canister = function canister(configPath, root) {
	if (!root) {
		root = process.cwd();
	}

	const moduleLoader = new canister.ModuleLoader(root);
	const builder = new canister.Builder(moduleLoader);
	const yamlLoader = new canister.definitionLoader.YAML();
	const envLoader = new canister.definitionLoader.Environment();

	yamlLoader.fromFile(configPath);

	return {
		build: () => {
			const parser = new canister.Parser();

			for (let definition of parser.parse(yamlLoader.toJS())) {
				builder.addDefinition(definition);
			}

			for (let definition of parser.parse(envLoader.toJS())) {
				builder.addDefinition(definition);
			}

			return builder.build();
		},
		configure: (configPath) => {
			yamlLoader.fromFile(configPath);
		},
		env: (prefix) => {
			envLoader.load(prefix);
		}
	}
}

canister.Definition = require('./src/definition');
canister.Builder = require('./src/builder');
canister.Parser = require('./src/parser');
canister.ModuleLoader = require('./src/loader');
canister.definitionLoader = {
	YAML: require('./src/definition-loader/yaml'),
	Environment: require('./src/definition-loader/env'),
	Value: require('./src/definition-loader/value')
};

module.exports = canister;
