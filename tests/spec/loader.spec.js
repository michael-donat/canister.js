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
		expect(this.loader.path('util')).to.equal('util');
	});

	it('knows paths relative to defined root', function() {
		expect(this.loader.path('./util')).to.equal(path.join(__dirname, 'util'));
	});
})
