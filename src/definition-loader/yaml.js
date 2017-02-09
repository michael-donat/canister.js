const fs = require('fs');
const yaml = require('js-yaml');
const merge = require('merge');

module.exports = class YamlLoader {
	constructor() {
		this.dictionary = {};
	}

	merge(definitions) {
		this.dictionary.parameters = merge(true, this.dictionary.parameters, definitions.parameters);
		this.dictionary.components = merge(true, this.dictionary.components, definitions.components);
	}

	fromFile(filePath) {
		try {
			const file = fs.readFileSync(filePath);
			this.merge(yaml.safeLoad(file, {filename: filePath}));
		} catch (err) {
			const error = new Error(`Error while parsing YAML file: ${err.message}`);
			error.previous = err;
			throw error;
		}
	}

	fromString(string) {
		try {
			this.merge(yaml.safeLoad(string));
		} catch (err) {
			const error = new Error(`Error while parsing YAML string: ${err.message}`);
			error.previous = err;
			throw error;
		}
	}

	toJS() {
		return this.dictionary;
	}
};
