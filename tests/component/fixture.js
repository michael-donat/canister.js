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
};

module.exports.factoryFunction = function(...args) {
	return {args, id: uuid.v1()};
}

module.exports.nested = {
	nestedFactoryFunction(...args) {
		return {args};
	},
	SomeClass: module.exports.SomeClass
}

module.exports.D = {
	a: {
		b: 1
	}
}
