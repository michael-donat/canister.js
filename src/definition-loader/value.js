module.exports = class ValueLoader {

	constructor() {
		this.dictionary = {
			parameters: {},
			components: {}
		};
	}

	parameter(name, value) {
		this.dictionary.parameters[name] = value;
	}

	component(name, value) {
		this.dictionary.components[name] = {value};
	}

	toJS() {
		return this.dictionary;
	}
};
