const path = require('path');
const _mapValues = require('lodash.mapvalues');
const _map = require('lodash.map');
const Definition = require('./definition');

const _isArray = Array.isArray;

module.exports = class Parser {
	constructor(basePath) {
		this.basePath = basePath;
	}

	__parseReference(v) {
		if (v === '@canister') {
			return Definition.self();
		}

		let value = v.replace(/^@/, '');
		let prop;
		let reference = value;
		let match = value.match(/(.*?)::(.*)/);
		if (match) {
			[, reference, prop] = match;
		}

		return Definition.reference(reference, prop);
	}

	__parseStruct(v) {
		const method = _isArray(v) ? _map : _mapValues;
		return method(v, val => {
			if (/^@/.test(val)) {
				return this.__parseReference(val);
			}
			if (typeof val !== 'object') {
				return val;
			}
			return this.__parseStruct(val);
		});
	}

	__parseArgs(args) {
		if (!args) {
			return [];
		}

		return args.map(v => {
			if (/^@/.test(v)) {
				return this.__parseReference(v);
			}
			if (typeof v !== 'object') {
				return Definition.value(v);
			}
			return Definition.structure(this.__parseStruct(v));
		});
	}

	__getPath(modulePath) {
		if (!this.basePath) {
			return modulePath;
		}

		if (!/^__/.test(modulePath)) {
			return modulePath;
		}

		return path.join(this.basePath, modulePath.replace(/^__/, ''));
	}

	* parse(dictionary) {
		for (let id in dictionary.parameters) {
			if (Object.prototype.hasOwnProperty.call(dictionary.parameters, id)) {
				let value = dictionary.parameters[id];
				yield Definition.parameter(id, value);
			}
		}

		for (var id in dictionary.components) {
			if (Object.prototype.hasOwnProperty.call(dictionary.components, id)) {
				let yieldValue = null;
				let value = dictionary.components[id];
				if (value.module) {
					let {module} = value;
					yieldValue = Definition.module(id, this.__getPath(module));
				}
				if (value.property) {
					let [, module, prop] = value.property.match(/(.*?)::(.*)/);
					yieldValue = Definition.property(id, prop, this.__getPath(module));
				}
				if (value.class) {
					let match = value.class.match(/(.*?)::(.*)/);
					let module = value.class;
					let klass = null;

					if (match) {
						[, module, klass] = match;
					}

					let definition = Definition.class(id, klass, this.__getPath(module), Boolean(value.transient));
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
				if (value.factory) {
					let match = value.factory.match(/(.*?)::(.*)/);
					let module = value.factory;
					let method = null;

					if (match) {
						[, module, method] = match;
					}

					yieldValue = Definition.factory(id, method, this.__getPath(module), Boolean(value.transient), ...this.__parseArgs(value.with));
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
