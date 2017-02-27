const canister = require('./../../index');
const path = require('path');
const fixtures = require('./fixture');
const classFixture = require('./class');

describe('Canister.js', function() {
	it('can build container from yml config file', function() {

		const injectedComponent = String('ABC');
		const injectedParameter = 12398;


		const moduleLoader = new canister.ModuleLoader(__dirname);
		const builder = new canister.Builder(moduleLoader);
		const yamlLoader = new canister.definitionLoader.YAML();
		const envLoader = new canister.definitionLoader.Environment({CONFIG_OVERRIDE: 1, CONFIG_NESTED_A_BIT__OVERRIDE: 2});
		const valueLoader = new canister.definitionLoader.Value();


		yamlLoader.fromFile(path.join(__dirname, './wiring.yml'));
		envLoader.load();
		valueLoader.parameter('injected.parameter', injectedParameter);
		valueLoader.component('injected.component', injectedComponent);

		const parser = new canister.Parser();

		for (let definition of parser.parse(yamlLoader.toJS())) {
			builder.addDefinition(definition);
		}

		for (let definition of parser.parse(envLoader.toJS())) {
			builder.addDefinition(definition);
		}

		for (let definition of parser.parse(valueLoader.toJS())) {
			builder.addDefinition(definition);
		}

		const container = builder.build();

		expect(container.get('my.parameter')).to.equal('parameterValue');
		expect(container.get('my.module')).to.equal(fixtures);

		expect(container.get('my.property')).to.equal(fixtures.A);

		expect(container.get('my.deep.property')).to.equal(fixtures.D.a.b);

		const singleton = container.get('my.singleton');

		expect(singleton).to.be.an.instanceOf(fixtures.SomeClass);
		expect(singleton).to.be.equal(container.get('my.singleton'));
		expect(singleton.args).to.be.eql([
			'string value', 123, 'prop.A.value', 'parameterValue'
		]);

		const instance = container.get('my.instance');
		expect(instance).to.not.be.equal(container.get('my.instance'));

		expect(container.get('my.property.class')).to.equal(fixtures.SomeClass);

		const singletonFromModule = container.get('my.module.class.singleton');

		expect(singletonFromModule).to.be.an.instanceOf(classFixture);
		expect(singletonFromModule).to.be.equal(container.get('my.module.class.singleton'));
		expect(singletonFromModule.args).to.be.eql([
			'string value'
		]);

		const instanceFromModule = container.get('my.module.class.instance');
		expect(instanceFromModule).to.not.be.equal(container.get('my.module.class.instance'));

		expect(container.get('node.path')).to.be.equal(path);

		expect(container.get('node.path.join')).to.be.equal(path.join);

		expect(container.get('my.tagged.service').a).to.be.eql([1,2,3]);
		expect(container.get('my.tagged.service').b).to.be.eql(
			['string value', 123, 'prop.A.value', 'parameterValue']
		);

		expect(container.get('my.factory.function').args).to.be.eql([1, 'parameterValue']);
		expect(container.get('my.factory.function')).to.be.equal(container.get('my.factory.function'))

		expect(container.get('my.double.nested.factory').args).to.be.eql([1, 'parameterValue']);
		expect(container.get('my.double.nested.factory')).to.be.equal(container.get('my.double.nested.factory'));

		expect(container.get('my.factory')).to.be.eql([2, 'prop.A.value']);

		expect(container.get('my.transient.factory')).to.not.be.equal(
			container.get('my.transient.factory')
		);

		expect(container.get('my.nested.constructor').args).to.be.eql([{
			prop: 'parameterValue', more: {param: 'parameterValue'}
		}]);

		expect(container.get('my.nested.factory').args).to.be.eql([{
			prop: 'parameterValue', more: {param: 'parameterValue'}
		}]);

		expect(container.get('my.prop.reference').args).to.be.eql(['objectParamValue', 1]);

		expect(container.get('override')).to.be.eql(1);
		expect(container.get('nested_a_bit.override')).to.be.eql(2);

		expect(container.get('injected.component')).to.be.equal(injectedComponent);
		expect(container.get('injected.parameter')).to.be.equal(injectedParameter);

		expect(container.get('my.nested.class')).to.be.an.instanceOf(fixtures.nested.SomeClass);
	})
})
