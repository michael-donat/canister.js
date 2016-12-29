const Definition = require('./definition');

module.exports = class Parser {
	constructor (dictionary) {
		this.dictionary = dictionary;
	}

	* parse() {
		for (var id in this.dictionary.parameters) {
			let value = this.dictionary.parameters[id];
			yield Definition.parameter(id, value);
		}

		for (var id in this.dictionary.components) {
			let value = this.dictionary.components[id];
			if (value.module) {
				let { module } = value;
				yield Definition.module(id, module);
			}
			if (value.property) {
				let [ , module, prop ] = value.property.match(/(.*?)::(.*)/);
				yield Definition.property(id, prop, module)
			}
			if (value.class) {
				let [ , module, klass ] = value.class.match(/(.*?)::(.*)/);
				let definition = Definition.class(id, klass, module, !!value.transient);
				if (value.with) {
					let params = value.with.map((v) => {
						if (/^@/.test(v)) {
							return Definition.reference(v.replace(/^@/, ''))
						}
						return Definition.value(v)
					});
					definition.constructWith(...params);
				}
				yield definition;
			}
		}
	}
}
