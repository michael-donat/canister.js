class Definition {
	constructor(id) {
		this._id = id;
	}

	get id() {
		return this._id;
	}

	isValue() {
		return this instanceof ValueDefinition;
	}

	isParameter() {
		return this instanceof ParameterDefinition;
	}

	isClass() {
		return this instanceof ClassDefinition;
	}

	isModule() {
		return this instanceof ModuleDefinition;
	}

	isProperty() {
		return this instanceof PropertyDefinition;
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
		return !!this.transient;
	}
	constructWith(...args) {
		if(args.filter((a) => !(a instanceof Definition)).length > 0) {
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
}

Definition.value = function(value) {
	return new ValueDefinition(value);
};

Definition.parameter = function(id, value) {
	const definition = new ParameterDefinition(id);
	definition.value = value;
	return definition;
};

Definition.module = function(id, module) {
	const definition = new ModuleDefinition(id);
	definition.module = module;
	return definition;
};

Definition.property = function(id, property, module) {
	const definition = new PropertyDefinition(id);
	definition.property = property;
	definition.module = module;
	return definition;
};

Definition.class = function(id, klass, module, transient) {
	const definition = new ClassDefinition(id);
	definition.class = klass;
	definition.module = module;
	definition.transient = transient;
	return definition;
};

Definition.reference = function(id) {
	return new Definition(id);
}
module.exports = Definition;
