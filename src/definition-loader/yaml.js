const fs = require('fs');
const yaml = require('js-yaml');
const merge = require('merge');

module.exports = class YamlLoader {
	constructor() {
		this.dictionary = {};
		this.merge = merge.recursive.bind(false, this.dictionary);
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
