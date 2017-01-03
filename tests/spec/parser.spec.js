const Parser = require('./../../src/parser');
const Definition = require('./../../src/definition');

describe('Parser', function() {
	it('parses parameters', function() {
		const parser = new Parser({
			parameters: { param: 'value' }
		});

		const definition = parser.parse().next().value;

		expect(definition).to.be.eql(Definition.parameter('param', 'value'));
	});

	it('parses modules', function() {
		const parser = new Parser({
			components: { 'my.module': {module: 'lib/smth'} }
		});

		const definition = parser.parse().next().value;

		expect(definition).to.be.eql(Definition.module('my.module', 'lib/smth'));
	});

	it('parses properties', function() {
		const parser = new Parser({
			components: { 'my.prop': {property: 'lib/smth::A'} }
		});

		const definition = parser.parse().next().value;

		expect(definition).to.be.eql(Definition.property('my.prop', 'A', 'lib/smth'));
	});

	it('parses classes', function() {
		const parser = new Parser({
			components: { 'my.class': {class: 'lib/smth::B', transient: true} }
		});

		const definition = parser.parse().next().value;

		expect(definition).to.be.eql(Definition.class('my.class', 'B', 'lib/smth', true));
	});

	it('parses classes with value constructor params', function() {
		const parser = new Parser({
			components: { 'my.class': {
				class: 'lib/smth::B',
				with: [
					1, 2, 3
				]
			} }
		});

		const definition = parser.parse().next().value;

		expect(definition).to.be.an.instanceOf(Definition);

		const compare = Definition.class('my.class', 'B', 'lib/smth', false);
		compare.constructWith(Definition.value(1),Definition.value(2),Definition.value(3));

		expect(definition).to.be.eql(compare);

	})

	it('parses classes where module is a class', function() {
		const parser = new Parser({
			components: {
				'my.class': {
					class: 'lib/smth'
				}
			}
		});

		const definition = parser.parse().next().value;
		expect(definition).to.be.eql(Definition.class('my.class', null, 'lib/smth', false));
	});

	it('parses classes with reference constructor params', function() {
		const parser = new Parser({
			components: { 'my.class': {
				class: 'lib/smth::B',
				with: [
					'@dependency'
				]
			} }
		});

		const definition = parser.parse().next().value;
		const compare = Definition.class('my.class', 'B', 'lib/smth', false);
		compare.constructWith(Definition.reference('dependency'));


		expect(definition).to.be.eql(compare);
	});

	it('parses tags', function() {
		const parser = new Parser({
			components: { 'my.class': {
				class: 'lib/smth::B',
				tags: {name: 'value', otherName: 'otherValue'}
			} }
		});

		const definition = parser.parse().next().value;

		expect(definition.tags).to.eql([
			Definition.tag('name', 'value'),
			Definition.tag('otherName', 'otherValue')
		])
	});

	it('parses method calls', function() {
		const parser = new Parser({
			components: { 'my.class': {
				class: 'lib/smth::B',
				call:[
					{method: 'A'},
					{method: 'B', with: [1,2,'@dependency']}
				]
			} }
		});

		const definition = parser.parse().next().value;

		expect(definition.calls).to.eql([
			Definition.call('A'),
			Definition.call(
				'B',
				Definition.value(1),
				Definition.value(2),
				Definition.reference('dependency')
			)
		])
	})
})
