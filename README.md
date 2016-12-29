# Canister.js

Simple dependency injection container fronted with yaml configuration.
 
## Requirements

You will need `node v6.0.0` or higher to be able to use canister. Please get in touch or submit a PR if you need compatibility with lower versions or iojs.

## Installation

```bash
yarn add canister.js
//or
npm install --save canister.js
```

## Usage

Canister.js provides a simplistic bootstrap method as it's default export, it will take a path to your yaml config file as well as the you module root (or assume `process.cwd()` if not provided). 

```node
const container = require('canister')(
	'./path/to/my/config.yml',
	__dirname
);

container.get('reference');

```

If you require more control over configuration, you can assemble the container yourself using the exposed API, below will achieve the same result as the bootstrap above:

```node
const canister = require('canister');
const moduleLoader = new canister.ModuleLoader(__dirname);
const builder = new canister.Builder(moduleLoader);
const yamlLoader = new canister.definitionLoader.YAML();

yamlLoader.fromFile('./path/to/my/config.yml');

const parser = new canister.Parser(yamlLoader.toJS());

for (let definition of parser.parse()) {
	builder.addDefinition(definition);
}

const constainer = builder.build();
```

## Configuration

Currently, only yml configuration is supported, please to refer to following examples on the allowed schema.

### Registering parameters (flat config values)

```yml
parameters:
	my.parameter.name: "string value"
```

### Registering module as component

```yml
components:
	my.bespoke.module: { module: './relative/to/given/root' }
	my.node.module:
		module: http
	my.absolute.module:
		module: /absolute/path/to/a/module
```

### Pulling a property from a module

```yml
components:
	my.module.property: { property: './module::PropertyName' }
	my.node.property:
		property: 'path::join'
```

### Registering Classes

```yml
components:
	my.class.as.only.export: {class: './module' }
	my.class:
		class: './module::ClassName'
	my.instances:
		class: './module::OtherClass'
		transient: true
```

Where a class is the only export from a module you provide the module path as the value of the `class` key.

By default, the container will only ever return the same instance of a Class on each request, to change that behaviour an instantiate it on each call you need to provide the `transient: true` flag

#### Constructor arguments

```yml
components:
	my.class:
		class: ./module::ClassName
		with:
			- first argument
			- 2
			- - 1
		  	  - 2
```

Above will result in an invocation equivalent to `new ClassName('first argument', 2, [1, 2])`.
 
Classes with constructor arguments can also be transient.

### Referencing other components

Class arguments can reference another component registered in the container. To do this, you need to prefix key value with `@`

```yml
parameters:
	db.host: mongodb://localhost
components:
	db.connection
		class: ./db
		with:
			- '@db.host'
	user.repository:
		class: ./repository::User
		with:
			- '@db.connection'
```

Canister will build components using an order obtained from dependency graph, if cyclic dependency is detected it will fail hard during build phase.
