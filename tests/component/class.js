const uuid = require('uuid');

module.exports = class {
	constructor (...args) {
		this.id = uuid.v1();
		this.args = args;
	}
}
