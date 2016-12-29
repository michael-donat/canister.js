module.exports.Builder = require('./src/builder');
module.exports.Parser = require('./src/parser');
module.exports.ModuleLoader = require('./src/loader');
module.exports.definitionLoader = {
	YAML: require('./src/definition-loader/yaml')
};
