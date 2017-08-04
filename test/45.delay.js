'use strict'
require('../tools/test/describe')('.delay', function (Promise, expect) {
	function delayTest(ms, minTime, maxTime) {
		var p = Promise.resolve('foo')
		var time = Date.now()
		return p.delay(ms).then(function (value) {
			expect(Date.now() - time).to.be.within(minTime, maxTime)
			expect(value).to.equal('foo')
		})
	}
	
	it('should return a new promise', function () {
		var original = Promise.resolve()
		var delayed = original.delay()
		expect(delayed).to.be.an.instanceof(Promise)
		expect(original).to.not.equal(delayed)
	})
	it('should delay resolved promises, maintaining their fulfillment value', function () {
		return delayTest(100, 90, 110)
	})
	it('should not delay or catch rejected promises', function () {
		this.timeout(15)
		var err = new Error('foo')
		return expect(Promise.reject(err).delay(100))
			.to.be.rejectedWith(err)
	})
	it('should treat numeric strings as valid time values', function () {
		return delayTest('1.0e2', 90, 110)
	})
	it('should treat number objects as valid time values', function () {
		var obj = {valueOf: function () {return '1.0e2'}}
		return delayTest(obj, 90, 110)
	})
	describe('should treat non-numeric or negative arguments as zero', function () {
		specify('argument is null', function () {
			return delayTest(null, 0, 15)
		})
		specify('argument is undefined', function () {
			return delayTest(undefined, 0, 15)
		})
		specify('argument is -100', function () {
			return delayTest(-100, 0, 15)
		})
		specify('argument is NaN', function () {
			return delayTest(NaN, 0, 15)
		})
		specify('argument is Infinity', function () {
			return delayTest(Infinity, 0, 15)
		})
		specify('argument is "foo"', function () {
			return delayTest('foo', 0, 15)
		})
		specify('argument is {}', function () {
			return delayTest({}, 0, 15)
		})
		specify('argument is function () {return 100}', function () {
			return delayTest(function () {return 100}, 0, 15)
		})
	})
})
