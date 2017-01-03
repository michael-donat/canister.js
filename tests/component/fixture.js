const uuid = require('uuid');

module.exports.SomeClass = class {
	constructor (...args) {
		this.id = uuid.v1();
		this.args = args;
	}
}


module.exports.A = 'prop.A.value';

module.exports.TaggedClass = class {
	setA(a) {
		this.a = a;
	}
	setB(...b) {
		this.b = b;
	}
}
