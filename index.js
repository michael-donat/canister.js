module.exports.Builder = require('./src/Builder');
module.exports.Parser = require('./src/Parser');
module.exports.ModuleLoader = require('./src/Loader');
module.exports.definitionLoader = {
	YAML: require('./src/definition-loader/yaml')
};
