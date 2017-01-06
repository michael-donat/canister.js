const Builder = require('./../../src/builder');
const Container = require('./../../src/container');
const Definition = require('./../../src/definition');
const uuid = require('uuid');

const functionModule = {

}

const testClassModule = {
	TestClass: class TestClass {
		constructor(...args) { this.args = args; this.id = uuid.v1(); this.vals = {}};
		setValue(key, val) { this.vals[key] = val;}
	},
	prop: 1
};

const ExportClass = class {

}

const stubMap = {
	'test.class': testClassModule,
	'export.class': ExportClass,
	'function.module': functionModule
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
	});

	it('builds module as Class instance', function() {
		this.builder.addDefinition(Definition.class('a', null, 'export.class'));

		const container = this.builder.build();

		const instance = container.get('a');

		expect(instance).to.equal(container.get('a'));

		expect(instance).to.be.an.instanceOf(stubMap['export.class']);
	});

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

	it('builds Class instance with nested references', function() {
		const definition = Definition.class('a', 'TestClass', 'test.class');
		definition.constructWith(
			Definition.structure([1,2,Definition.reference('ref')])
		);
		definition.addCall(Definition.call('setValue', Definition.value('a'), Definition.structure({
			b: {c: {d: Definition.reference('ref')}}
		})));

		this.builder.addDefinition(definition);
		this.builder.addDefinition(Definition.parameter('ref', 'refValue'));

		const container = this.builder.build();

		const instance = container.get('a');

		expect(instance).to.be.an.instanceOf(stubMap['test.class'].TestClass);

		expect(instance.args).to.be.eql([[1,2,'refValue']]);
		expect(instance.vals).to.be.eql({
			a: {b: {c: {d: 'refValue'}}}
		});
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
	});

	it('calls methods on returned instances', function() {

		const definitionA = Definition.class('a', 'TestClass', 'test.class', true);
		const definitionB = Definition.class('b', 'TestClass', 'test.class');

		definitionA.addCall(Definition.call('setValue', Definition.value('a'), Definition.value(1)));
		definitionA.addCall(Definition.call('setValue', Definition.value('b'), Definition.reference('b')));

		this.builder.addDefinition(definitionA);
		this.builder.addDefinition(definitionB);

		const container = this.builder.build();

		const instance = container.get('a');

		expect(instance.vals['a']).to.equal(1);
		expect(instance.vals['b']).to.equal(container.get('b'));

	});

	it('calls factory method with parameters', function() {

		functionModule.A = sinon.stub();

		const definitionA = Definition.factory(
			'function.module', 'A', 'function.module', false,
			Definition.value(1), Definition.reference('B'),
			Definition.structure({a: {b: {c: Definition.reference('B')}}})
		);

		const definitionB = Definition.parameter('B', 2);

		this.builder.addDefinition(definitionA);
		this.builder.addDefinition(definitionB);

		this.builder.build();

		expect(functionModule.A).to.have.been.calledWith(1, 2, {
			a: {b: {c: 2}}
		});

	});

	it('calls factory method when module is factory', function() {

		stubMap['factory.module'] = sinon.stub();

		const definitionA = Definition.factory(
			'factory.module', null, 'factory.module', false,
			Definition.value(1), Definition.reference('B')
		);

		const definitionB = Definition.parameter('B', 2);

		this.builder.addDefinition(definitionA);
		this.builder.addDefinition(definitionB);

		this.builder.build();

		expect(stubMap['factory.module']).to.have.been.calledWith(1, 2);

	})

	it('returns definitions by id', function() {
		const definition = Definition.parameter('a', 1);

		this.builder.addDefinition(definition);

		expect(this.builder.getDefinitionById(('a'))).to.equal(definition);
	});

	it('throws when unknown definition requested', function() {
		expect(()=>this.builder.getDefinitionById('unknown')).to.throw(/Unknown definition/);
	});

	it('returns definitions by tag', function() {
		const definition = Definition.parameter('a', 1);
		definition.addTag(Definition.tag('tag'));

		this.builder.addDefinition(definition);

		expect(this.builder.getDefinitionsByTag('tag')).to.eql([definition]);
	})
})
