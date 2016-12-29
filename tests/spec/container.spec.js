const Container = require('./../../src/container');

describe('Container', function() {
	beforeEach(function() {
		this.container = new Container();
	});

	it('returns registered components', function() {
		this.container.register('a', 1);
		expect(this.container.get('a')).to.equal(1);
	});

	it('returns the same value each time if value is not a function', function() {
		this.container.register('a', 1);
		expect(this.container.get('a')).to.equal(this.container.get('a'));
	});

	it('invokes value on each get if value is a function', function() {
		let a = 0;
		this.container.register('a', () => { return ++a; });

		expect(this.container.get('a')).to.equal(1);
		expect(this.container.get('a')).to.equal(2);
		expect(this.container.get('a')).to.equal(3);
	});

	it('throws when getting unknown component', function() {
		expect(()=>this.container.get('unknown')).to.throw();
	});

	it('throws when trying to register the same component again', function() {
		this.container.register(1,1);
		expect(()=>this.container.register(1,1)).to.throw();
	});

	it('can freeze itself', function() {
		this.container.lock();

		expect(this.container).to.be.locked;
	})
})
