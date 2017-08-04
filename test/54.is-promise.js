'use strict'
var toString = require('../tools/test/to-string')
require('../tools/test/describe')('Promise.isPromise', function (Promise, expect) {
	function falseWhenGiven(value, string) {
		specify('given: ' + (string || toString(value)), function () {
			expect(Promise.isPromise(value)).to.be.false
		})
	}
	function trueWhenGiven(value, string) {
		specify('given: ' + (string || toString(value)), function () {
			expect(Promise.isPromise(value)).to.be.true
		})
	}

	it('should throw when accessing .then throws', function () {
		expect(function () {
			Promise.isPromise({get then() {
				throw new RangeError('foo')
			}})
		}).to.throw(RangeError)
	})
	describe('should return false when', function () {
		falseWhenGiven(undefined)
		falseWhenGiven(null)
		falseWhenGiven(0)
		falseWhenGiven(123)
		falseWhenGiven(NaN)
		falseWhenGiven(Infinity)
		falseWhenGiven(true)
		falseWhenGiven(false)
		falseWhenGiven('foo')
		falseWhenGiven({}, '{}')
		falseWhenGiven([])
		falseWhenGiven(function then() {})
		falseWhenGiven({then: true}, '{then: true}')
		falseWhenGiven({then: {name: 'then'}}, '{then: {name: "then"}}')
		falseWhenGiven({then: Object.create(Function.prototype)}, '{then: Object.create(Function.prototype)}')
		falseWhenGiven({Then: function () {}}, '{Then: function () {}}')
		falseWhenGiven({THEN: function () {}}, '{THEN: function () {}}')
		falseWhenGiven({"then ": function () {}}, '{"then ": function () {}}')

		specify('given: "foo" with String.prototype.then', function () {
			var thenInString = 'then' in String.prototype
			var originalStringThen = String.prototype.then
			String.prototype.then = function () {}
			try {
				expect(Promise.isPromise('foo')).to.be.false
			} finally {
				if (thenInString) {
					String.prototype.then = originalStringThen
				} else {
					delete String.prototype.then
				}
			}
		})

		var fn = function () {}
		fn.then = {}
		falseWhenGiven(fn, '(function () {}).then = {}')

		if (typeof Symbol === 'function') {
			falseWhenGiven(Symbol())
			falseWhenGiven({then: Symbol()}, '{then: Symbol()}')
		}
	})
	describe('should return true when', function () {
		var unnamedFunction = function () {}
		trueWhenGiven({then: unnamedFunction}, '{then: function () {}}')

		var nullObject = Object.create(null)
		nullObject.then = function () {}
		trueWhenGiven(nullObject, 'Object.create(null).then = function () {}')

		var fn = function () {}
		fn.then = function () {}
		trueWhenGiven(fn, '(function () {}).then = function () {}')
	})
})
