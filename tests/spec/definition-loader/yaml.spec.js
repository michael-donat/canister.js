const Loader = require('./../../../src/definition-loader/yaml');
const path = require('path');
const validFixture = path.join(__dirname, 'fixture.yml');
const invalidFixture = path.join(__dirname, 'invalid.fixture.yml');
const overrideFixture = path.join(__dirname, 'override.fixture.yml');

describe('loader::YAML', function() {
	beforeEach(function() {
		this.loader = new Loader();
	});

	it('parses yaml', function() {
		this.loader.fromString('components: {a: 1}');

		expect(this.loader.toJS().components.a).to.eql(1);
	});

	it('throws on invalid yml', function() {
		expect(()=>this.loader.fromString('   - a\n - b')).to.throw();
	});

	it('loads files', function() {
		this.loader.fromFile(validFixture);
		expect(this.loader.toJS().components.a).to.eql(1);
	});

	it('throws on non readable/existing file', function() {
		expect(()=>this.loader.fromFile('obviously-invalid')).to.throw();
	})

	it('throws on invalid YAML in file', function() {
		expect(()=>this.loader.fromFile(invalidFixture)).to.throw();
	})

	it('overrides previous definitions (does not merge)', function() {
		this.loader.fromFile(validFixture);
		this.loader.fromFile(overrideFixture);
		expect(this.loader.toJS().components.b.c).to.eql({d: 2, f: 3});
	})
})
