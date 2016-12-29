const Builder = require('./../../src/builder');
const Container = require('./../../src/container');
const Definition = require('./../../src/definition');
const uuid = require('uuid');

const testClassModule = {
	TestClass: class TestClass { constructor(...args) { this.args = args; this.id = uuid.v1();}},
	prop: 1
};
const stubMap = {
	'test.class': testClassModule
}

class StubLoader {
	loadModule(path) {
		return stubMap[path];
	}
}

describe('Builder', function() {
	beforeEach(function() {
		this.builder = new Builder(new StubLoader());
	});

	it('fails on dupe definition', function() {
		const definition = Definition.parameter('a', 1);
		this.builder.addDefinition(definition);

		expect(() => this.builder.addDefinition(definition));
	});

	it('throws on unsupported definition', function() {
		this.builder.addDefinition(new Definition('some'));
		expect(()=>this.builder.build()).to.throw();
	})

	it('builds a frozen Container', function() {
		const container = this.builder.build();
		expect(container).to.be.an.instanceOf(Container);
		expect(container).to.be.frozen;
	});

	it('builds parameter components from definition', function() {
		this.builder.addDefinition(Definition.parameter('a', 1));
		const container = this.builder.build();

		expect(container.get('a')).to.equal(1);
	});

	it('builds Class instance components from definition', function() {
		this.builder.addDefinition(Definition.class('a', 'TestClass', 'test.class'));

		const container = this.builder.build();

		const instance = container.get('a');

		expect(instance).to.equal(container.get('a'));

		expect(instance).to.be.an.instanceOf(stubMap['test.class'].TestClass);
	});

	it('builds transient Class instance components from definition', function() {
		this.builder.addDefinition(Definition.class('a', 'TestClass', 'test.class', true));

		const container = this.builder.build();

		const instanceA = container.get('a');
		const instanceB = container.get('a');

		expect(instanceA).to.not.equal(instanceB);

		expect(instanceA).to.be.an.instanceOf(stubMap['test.class'].TestClass);
		expect(instanceB).to.be.an.instanceOf(stubMap['test.class'].TestClass);
	})

	it('builds Class instance with constructor parameters', function() {
		const definition = Definition.class('a', 'TestClass', 'test.class');
		definition.constructWith(
			Definition.value(1),
			Definition.value(2),
			Definition.value(3)
		);

		this.builder.addDefinition(definition);

		const container = this.builder.build();

		const instance = container.get('a');

		expect(instance).to.be.an.instanceOf(stubMap['test.class'].TestClass);

		expect(instance.args).to.be.eql([1,2,3]);
	});

	it('builds module component from definition', function() {
		const definition = Definition.module('a', 'test.class');

		this.builder.addDefinition(definition);

		const container = this.builder.build();

		expect(container.get('a')).to.equal(testClassModule);
		expect(container.get('a')).to.equal(testClassModule);
	});

	it('builds property component from definition', function() {
		const definition = Definition.property('a', 'prop', 'test.class');

		this.builder.addDefinition(definition);

		const container = this.builder.build();

		expect(container.get('a')).to.equal(1);
	});

	it('builds Class instance with nested service argument', function() {
		const definition = Definition.class('a', 'TestClass', 'test.class');

		definition.constructWith(
			Definition.reference('param'),
			Definition.reference('test.class.prop'),
			Definition.reference('test.class.instance')
		);

		this.builder.addDefinition(definition);

		this.builder.addDefinition(Definition.parameter('param', 0));
		this.builder.addDefinition(Definition.property('test.class.prop', 'prop', 'test.class'));
		this.builder.addDefinition(Definition.class('test.class.instance', 'TestClass', 'test.class'));

		const container = this.builder.build();

		const instance = container.get('a');

		expect(instance.args[0]).to.equal(0);
		expect(instance.args[1]).to.equal(container.get('test.class.prop'));
		expect(instance.args[2]).to.equal(container.get('test.class.instance'));
	});

	it('recognises cyclic dependencies', function() {
		const definitionA = Definition.class('a', 'TestClass', 'test.class');
		const definitionB = Definition.class('b', 'TestClass', 'test.class');

		definitionA.constructWith(Definition.reference('b'));
		definitionB.constructWith(Definition.reference('a'));

		this.builder.addDefinition(definitionA);
		this.builder.addDefinition(definitionB);

		expect(()=>this.builder.build()).to.throw();
	})
})
