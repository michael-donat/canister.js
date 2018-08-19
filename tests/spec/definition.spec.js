const Definition = require('./../../src/definition');

describe('Definition', function() {
	it('only allows Tag instances to be added as tags', function() {
		expect(()=>(new Definition()).addTag('whaa')).to.throw(/instance of Tag/);
	});
	describe('Call', function() {
		it('only allows Definitions as arguments', function() {
			expect(()=>Definition.call('m', 1)).to.throw(/instance of Definition/)
		})
	})
	it('only accepts Call as a call', function() {
		expect(()=>Definition.class().addCall(1)).to.throw(/instance of Call/)
	})
	it('allows to prepend a call', function() {
		const call1 = Definition.call('a')
		const call2 = Definition.call('b')

		const Klass = Definition.class()
		Klass.addCall(call1)
		Klass.addCall(call2, true)

		expect(Klass.calls[0]).to.eql(call2)
	})
	describe('Class', function() {
		it('only allows Definitions as constructor arguments', function() {
			expect(()=>Definition.class().constructWith(1)).to.throw(/instance of Definition/)
		});
	});
})
