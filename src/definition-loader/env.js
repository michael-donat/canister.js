const merge = require('merge');

module.exports = class EnvironmentLoader {
	constructor(config = process.env) {
		this.dictionary = {};
		this.merge = merge.recursive.bind(false, this.dictionary);
		this.config = config;
	}

	load({
		prefix = /^CONFIG_/,
		getKey = (key, prefix) => {
			return key.replace(prefix, '').toLowerCase().split('__').join('.');
		},
		castValue = value => {
			if (value === "true") {
				return true;
			}
			if (value === "false") {
				return false;
			}
			if (isNaN(value)) {
				return value;
			}
			return +value; //cast to number
		}
	} = {}) {

		Object.keys(this.config).forEach(key => {
			if (!prefix.test(key)) {
				return;
			}
			this.dictionary[getKey(key, prefix)] = castValue(this.config[key]);
		})

	}

	toJS() {
		return {parameters: this.dictionary};
	}
};
