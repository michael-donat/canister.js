const Loader = require('./../../src/loader');
const path = require('path');

describe('Loader', function() {
	beforeEach(function() {
		this.loader = new Loader(__dirname);
	});

	it('knows absolute paths', function() {
		expect(this.loader.path('/absolute/path')).to.equal('/absolute/path');
	});

	it('knows node modules', function() {
		expect(this.loader.path('v8')).to.equal('v8');
	});

	it('knows paths relative to defined root', function() {
		expect(this.loader.path('./loader.spec.js')).to.equal(path.join(__dirname, 'loader.spec.js'));
	});

	it('loads node modules', function() {
		expect(this.loader.loadModule('http')).to.equal(require('http'));
	});

	it('loads relative modules', function() {
		expect(this.loader.loadModule('./loader.spec.js')).to.equal(require(__filename));
	});

	it('loads local node modules', function() {
		expect(this.loader.loadModule('mocha')).to.equal(require('mocha'));
	});
})
