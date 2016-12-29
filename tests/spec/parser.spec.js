const Parser = require('./../../src/parser');
const Definition = require('./../../src/definition');

describe('Parser', function() {
	it('parses parameters', function() {
		const parser = new Parser({
			parameters: { param: 'value' }
		});

		const definition = parser.parse().next().value;

		expect(definition).to.be.an.instanceOf(Definition);
		expect(definition).to.be.eql({_id: 'param', value: 'value'})
	});

	it('parses modules', function() {
		const parser = new Parser({
			components: { 'my.module': {module: 'lib/smth'} }
		});

		const definition = parser.parse().next().value;

		expect(definition).to.be.an.instanceOf(Definition);
		expect(definition).to.be.eql({_id: 'my.module', module: 'lib/smth'})
	});

	it('parses properties', function() {
		const parser = new Parser({
			components: { 'my.prop': {property: 'lib/smth::A'} }
		});

		const definition = parser.parse().next().value;

		expect(definition).to.be.an.instanceOf(Definition);
		expect(definition).to.be.eql({_id: 'my.prop', module: 'lib/smth', property: 'A'})
	});

	it('parses classes', function() {
		const parser = new Parser({
			components: { 'my.class': {class: 'lib/smth::B', transient: true} }
		});

		const definition = parser.parse().next().value;

		expect(definition).to.be.an.instanceOf(Definition);
		expect(definition).to.be.eql({_id: 'my.class', module: 'lib/smth', class: 'B', transient: true})
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
		expect(definition).to.be.eql({
			_id: 'my.class',
			module: 'lib/smth',
			class: 'B',
			transient: false,
			args: [
				Definition.value(1),Definition.value(2),Definition.value(3)
			]
		})
	})

	it('parses classes where module is a class', function() {
		const parser = new Parser({
			components: { 'my.class': {
				class: 'lib/smth'
			} }
		});

		const definition = parser.parse().next().value;
		expect(definition).to.be.an.instanceOf(Definition);
		expect(definition).to.be.eql({
			_id: 'my.class',
			module: 'lib/smth',
			class: null,
			transient: false
		})
	})

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

		expect(definition).to.be.an.instanceOf(Definition);
		expect(definition).to.be.eql({
			_id: 'my.class',
			module: 'lib/smth',
			class: 'B',
			transient: false,
			args: [
				Definition.reference('dependency')
			]
		})
	})
})
