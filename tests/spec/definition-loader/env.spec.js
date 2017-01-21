const Loader = require('./../../../src/definition-loader/env');

describe('loader::YAML', function() {
	beforeEach(function() {
		this.config = {}
		this.loader = new Loader(this.config);
	});

	it('loads from environmen by default', function() {
		const loader = new Loader();

		expect(loader.config).to.equal(process.env);
	})

	it('parses environment with default config', function() {
		this.config.CONFIG_A = '1';
		this.config.NOT_CONFIG_B = '2';

		this.loader.load();

		expect(this.loader.toJS()).to.eql({parameters:{a: 1}});
	});

	it('casts booleans and numbers', function() {
		this.config.CONFIG_A = '1';
		this.config.CONFIG_B = 'true';
		this.config.CONFIG_C = 'false';
		this.config.CONFIG_D = '1e1';
		this.config.CONFIG_E = 'iaa';

		this.loader.load();

		expect(this.loader.toJS()).to.eql({parameters:{
			a: 1, b: true, c: false, d: 10, e: 'iaa'
		}});
	});

	it('can use different prefix', function() {
		this.config.CONFIG_A = '1';
		this.config.ABC_B = 'true';

		this.loader.load({prefix: /^ABC_/});

		expect(this.loader.toJS()).to.eql({parameters:{
			b: true
		}});
	});

	it('can use different key inflector', function() {
		this.config.CONFIG_A = '1';

		this.loader.load({getKey: (key, prefix) => key.toLowerCase()});

		expect(this.loader.toJS()).to.eql({parameters:{
			config_a: 1
		}});
	});

	it('can use different value casting', function() {
		this.config.CONFIG_A = '1';

		this.loader.load({castValue: value => value});

		expect(this.loader.toJS()).to.eql({parameters:{
			a: '1'
		}});
	})

	it('understands nested keys', function() {
		this.config.CONFIG_A_B_C__C__B__A = 1;

		this.loader.load();

		expect(this.loader.toJS()).to.eql({parameters:{
			'a_b_c.c.b.a': 1
		}})
	})
})
