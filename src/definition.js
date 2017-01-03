class Tag {
	constructor(name, value) {
		this.name = name;
		this.value = value;
	}
}
class Definition {
	constructor(id) {
		this._id = id;
		this._tags = [];
	}

	get id() {
		return this._id;
	}

	get tags() {
		return this._tags;
	}

	addTag(tag) {
		if (!(tag instanceof Tag)) {
			throw new Error(`Expected an instance of Tag but got '${typeof (tag)}'`);
		}
		this._tags.push(tag);
	}
}

class Call {
	constructor(method) {
		this.method = method;
		this.args = [];
	}

	addArgument(arg) {
		if (!(arg instanceof Definition)) {
			throw new Error(`Unexpected method argument for '${this.method}', expected an instance of Definition`);
		}
		this.args.push(arg);
	}

	getArguments() {
		return this.args;
	}
}

class ValueDefinition extends Definition {
	constructor(value) {
		super(null);
		this.value = value;
	}
}

class ParameterDefinition extends Definition {

}

class ModuleDefinition extends Definition {

}

class PropertyDefinition extends Definition {

}

class ClassDefinition extends Definition {

	isTransient() {
		return Boolean(this.transient);
	}
	constructWith(...args) {
		if (args.filter(a => !(a instanceof Definition)).length > 0) {
			throw new Error(`Unexpected constructor value for definition '${this.id}', expected an instance of Definition`);
		}
		this.args = args;
	}

	hasConstructorArguments() {
		return !(this.args === undefined);
	}

	getConstructorArguments() {
		return this.args;
	}

	get calls() {
		return this._calls;
	}

	addCall(call) {
		if (!(call instanceof Call)) {
			throw new Error(`Expected an instance of Call but got '${typeof (call)}'`);
		}
		if (!this._calls) {
			this._calls = [];
		}
		this._calls.push(call);
	}

	hasCalls() {
		return this._calls && Boolean(this._calls.length);
	}
}

Definition.prototype.isValue = function () {
	return this instanceof ValueDefinition;
};

Definition.prototype.isParameter = function () {
	return this instanceof ParameterDefinition;
};

Definition.prototype.isClass = function () {
	return this instanceof ClassDefinition;
};

Definition.prototype.isModule = function () {
	return this instanceof ModuleDefinition;
};

Definition.prototype.isProperty = function () {
	return this instanceof PropertyDefinition;
};

Definition.value = function (value) {
	return new ValueDefinition(value);
};

Definition.parameter = function (id, value) {
	const definition = new ParameterDefinition(id);
	definition.value = value;
	return definition;
};

Definition.module = function (id, module) {
	const definition = new ModuleDefinition(id);
	definition.module = module;
	return definition;
};

Definition.property = function (id, property, module) {
	const definition = new PropertyDefinition(id);
	definition.property = property;
	definition.module = module;
	return definition;
};

Definition.class = function (id, klass, module, transient) {
	const definition = new ClassDefinition(id);
	definition.class = klass;
	definition.module = module;
	definition.transient = transient;
	return definition;
};

Definition.reference = function (id) {
	return new Definition(id);
};

Definition.tag = function (name, value) {
	return new Tag(name, value);
};

Definition.call = function (method, ...args) {
	const call = new Call(method);
	args.forEach(arg => call.addArgument(arg));
	return call;
};

module.exports = Definition;
