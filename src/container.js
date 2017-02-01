module.exports = class Container {
	constructor() {
		this.registry = {};
	}

	get(name) {
		if (!Object.prototype.hasOwnProperty.call(this.registry, name)) {
			throw new Error('Unrecognised component: ' + name);
		}

		const component = this.registry[name];

		return component && component.__canisterBuilderProxy ? component(this) : component;
	}

	register(name, value) {
		if (Object.isFrozen(this)) {
			throw new Error('Container is locked, can\'t register any more components');
		}

		if (Object.prototype.hasOwnProperty.call(this.registry, name)) {
			throw new Error(`Component (${name}) already registered.`);
		}

		this.registry[name] = value;
	}

	lock() {
		Object.freeze(this);
		Object.freeze(this.registry);
	}

};
