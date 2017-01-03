const Definition = require('./definition');

module.exports = class Parser {
	constructor(dictionary) {
		this.dictionary = dictionary;
	}

	__parseArgs(args) {
		if (!args) {
			return [];
		}

		return args.map(v => {
			if (/^@/.test(v)) {
				return Definition.reference(v.replace(/^@/, ''));
			}
			return Definition.value(v);
		});
	}

	* parse() {
		for (let id in this.dictionary.parameters) {
			if (Object.prototype.hasOwnProperty.call(this.dictionary.parameters, id)) {
				let value = this.dictionary.parameters[id];
				yield Definition.parameter(id, value);
			}
		}

		for (var id in this.dictionary.components) {
			if (Object.prototype.hasOwnProperty.call(this.dictionary.components, id)) {
				let yieldValue = null;
				let value = this.dictionary.components[id];
				if (value.module) {
					let {module} = value;
					yieldValue = Definition.module(id, module);
				}
				if (value.property) {
					let [, module, prop] = value.property.match(/(.*?)::(.*)/);
					yieldValue = Definition.property(id, prop, module);
				}
				if (value.class) {
					let match = value.class.match(/(.*?)::(.*)/);
					let module = value.class;
					let klass = null;

					if (match) {
						[, module, klass] = match;
					}

					let definition = Definition.class(id, klass, module, Boolean(value.transient));
					if (value.with) {
						definition.constructWith(...this.__parseArgs(value.with));
					}
					yieldValue = definition;

					if (value.call) {
						value.call.forEach(call => {
							yieldValue.addCall(
								Definition.call(call.method, ...this.__parseArgs(call.with))
							);
						});
					}
				}

				if (value.tags) {
					for (let name in value.tags) {
						if (Object.prototype.hasOwnProperty.call(value.tags, name)) {
							yieldValue.addTag(Definition.tag(name, value.tags[name]));
						}
					}
				}

				yield yieldValue;
			}
		}
	}
};
