const path = require('path');

module.exports = class Loader {
	constructor(root) {
		this.root = root;
	}

	path(module) {
		if (path.isAbsolute(module)) {
			return module;
		}

		if (/^[^.^/]/.test(module)) {
			return module;
		}

		return path.join(this.root, module);
	}

	loadModule(module) {
		// eslint-disable-next-line import/no-dynamic-require
		return require(this.path(module));
	}
};
