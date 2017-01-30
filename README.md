# Canister.js  

<p align="center">
  <img src="https://raw.githubusercontent.com/michael-donat/canister.js/master/logo.jpg" alt="canister.js"/>
</p>

[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)]()
[![Build Status](https://img.shields.io/travis/michael-donat/canister.js.svg?style=flat-square)](https://travis-ci.org/michael-donat/canister.js)
[![Dependencies](https://img.shields.io/david/michael-donat/canister.js.svg?style=flat-square)](https://david-dm.org/michael-donat/canister.js)
[![Dependencies](https://img.shields.io/coveralls/michael-donat/canister.js.svg?style=flat-square)](https://coveralls.io/github/michael-donat/canister.js)

Heavily inspired by [Symfony Dependency Injecion Component](https://symfony.com/doc/current/components/dependency_injection.html)
 
## Requirements

You will need `node v6.0.0` or higher to be able to use canister. Please get in touch or submit a PR if you need compatibility with lower versions or iojs.

## Installation

```bash
yarn add canister.js
//or
npm install --save canister.js
```

## Changes from version 1.7.x

The parser now accepts dictionary on each parse call rather than on construction. If you used the default bootstrap then there's no changes to be made, if you decided to assemble the container yourself you will need to adjust.

## Usage

Canister.js provides a simplistic bootstrap method as its default export, it will take a path to yaml config as well as the root dir of your modules (or assume `process.cwd()` if not provided). 

```node
const canister = require('canister.js')(
  './path/to/my/config.yml',
  __dirname
);

if(process.env.NODE_ENV === 'test') {
  canister.configure('./test.services.yml'); //load test mocks	
}

canister.env(); //load environment overrides

const container = canister.build();

container.get('reference');

```

If you require more control over configuration, you can assemble the container yourself using the exposed API, below will achieve the same result as the bootstrap above:

```node
const canister = require('canister.js');
const moduleLoader = new canister.ModuleLoader(__dirname);
const builder = new canister.Builder(moduleLoader);
const yamlLoader = new canister.definitionLoader.YAML();
const envLoader = new canister.definitionLoader.Environment();

yamlLoader.fromFile('./path/to/my/config.yml');
envLoader.load();

const parser = new canister.Parser();

for (let definition of parser.parse(yamlLoader.toJS())) {
  builder.addDefinition(definition);
}

for (let definition of parser.parse(envLoader.toJS())) {
  builder.addDefinition(definition);
}

const container = builder.build();
```

## Configuration

Currently, only yml configuration is supported, following examples cover allowed schema.

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

Where a class is the only export from a module you need to provide the module path as the sole value of `class` key.

By default, the container will only ever return the same instance of a Class on each request, to change that behaviour you need to provide the `transient: true` flag.

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

Above will result in an invocation equivalent to `new require('./module').ClassName)('first argument', 2, [1, 2])`.
 
Classes with constructor arguments can also be transient.

### Registering factory methods

```yml
components:
  my.factory.as.only.export: {factory: './module' }
  my.factory:
    factory: './module::factoryFunction'
    with:
     - first argument
     - 2
  my.instances:
    factory: './module::factoryFunction'
    transient: true
```

### Calling methods before returning an instance

```yml
components:
  my.class:
    class: ./module::ClassName
    call:
      - method: setValue
        with:
          - key
          - value
```

### Referencing other components

Class arguments can reference another component registered in the container. To do this, you need to prefix reference name with `@`

```yml
parameters:
  db.host: mongodb://localhost
components:
  db.connection:
    class: ./db
    with:
      - '@db.host'
  user.repository:
    class: ./repository::User
    with:
      - '@db.connection'
```

Canister will build components using an order obtained from dependency graph, if cyclic dependency is detected it will fail hard during build phase.

### Referencing properties of components as other components arguments

Useful when you want to get access to some properties of a registered component without having to define each one as a property.

Kinda bad:

```yml
components:
  name:
    property: './package.json::name'
  logger:
    factory: 'bunyan::createLogger'
	with:
      - {name: '@name'}
```

Much better:

```yml
components:
	pkg: 
		module: './package.json'
	logger:
	 	factory: 'bunyan::createLogger'
	 	with:
	 		- {name: '@pkg::name'}
```

### Referencing the container itself

While not recommended it is possible to pass the entire container as an argument. To do this just reference it with `@canister`.

### Tagging

```yml
components:
  my.class:
    class: ./module::ClassName
    tags:
      myTagName: myTagValue
      'my tag name': 'my tag value'
```

By using tags you can dynamically modify definitions held by the builder before the container is built. 
This allows for 'dynamic' service composition as illustrated by [this](examples/tagging) example. 

### Exposing canister.js from within another library

If you are developig a library or framework that can expose canister.js for further configuration, you need to ensure that the components
pulled in via your configuration come from your library node modules and not from the implementing project.

You will need to provide a second parameter to the parser which is a basePath and your components need to provide relative path to node_modules starting with `__/`

```
const parser = new canister.Parser(yamlLoader.toJS(), __dirname);

components:
	express:
		module: __/src/logger
```

You can then expose alternative loader and parser for the implementing application.

### Loading environment variables

You can use the supplied environment loader during container build, this method is available via both the simplistic bootstrap and manual assembly (check examples above).

By default the env loader will load all variables starting with `CONFIG_` prefix, lowercasing all keys and replacing `__` with `.`. Since environment variables are all strings the default config for this loader will cast them to the 'nearest' type. Example below:

```
process.env.CONFIG_A=1                 ==> {a: 1}
process.env.CONFIG_B='1'               ==> {b: 1}
process.env.CONFIG_C='1e1'             ==> {c: 10} // watch out on this one, it will also take bi/oct/hex notations
process.env.CONFIG_D='true'            ==> {d: true}
process.env.CONFIG_E='false'           ==> {e: false}
process.env.CONFIG_F='abc'             ==> {f: 'abc}
process.env.CONFIG_G__H__I_J='abc'     ==> {'g.h.u_j': 'abc}
```

This behaviour can be controlled by configuring env loader according to below interface:

```
envLoader.load({
	prefix: RegExp,
	getKey: fn(key, prefix) : string,
	castValue: fn(value) : mixed
});
```

Environment loader **can only load parameters**, not components. 

## Usage

One the container is built, it will be frozen so no further modifications are possible.

The only method exposed by container is `get(key)` which returns value under requested key.

## Contributing

All contributions are more than welcome. Fork and PR not forgetting about linting and testing.

## License

MIT
