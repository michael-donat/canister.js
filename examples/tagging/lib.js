class Transport {
	constructor(name) {
		this.name = name;
	}
}

module.exports.Transport = Transport;

module.exports.Logger = class {
	constructor() {
		this.transports = [];
	}
	addTransport(transport) {
		if (!(transport instanceof Transport)) {
			throw new Error('Expected Transport instance');
		}
		this.transports.push(transport);
	}
}
