const uuid = require('uuid');

module.exports.SomeClass = class {
	constructor (...args) {
		this.id = uuid.v1();
		this.args = args;
	}
}


module.exports.A = 'prop.A.value';
