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
	describe('Class', function() {
		it('only allows Definitions as constructor arguments', function() {
			expect(()=>Definition.class().constructWith(1)).to.throw(/instance of Definition/)
		});
	});
})
