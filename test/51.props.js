'use strict'
var ObjectTester = require('../tools/test/object-tester')
var shallowEquals = require('../tools/test/object-shallow-equals')
var toString = require('../tools/test/to-string')
require('../tools/test/describe')('Promise.props', function (Promise, expect) {
	var objectTester = new ObjectTester(Promise)
	function expectToMatch(input, source) {
		return expect(Promise.props(input)).to.eventually.satisfy(shallowEquals(source))
	}

	it('should be fulfilled given an empty object', function () {
		var obj = {}
		return expectToMatch(obj, obj)
	})
	it('should not treat arrays in a special way', function () {
		var array = new Array(3)
		array[1] = 'foo'
		return expectToMatch(array, {1: 'foo'})
	})
	it('should not treat functions in a special way', function () {
		var fn = function () {}
		fn.foo = 'bar'
		return expectToMatch(fn, {foo: 'bar'})
	})
	it('should not treat null-prototype objects in a special way', function () {
		var obj = Object.create(null)
		obj.foo = 'bar'
		return expectToMatch(obj, {foo: 'bar'})
	})
	it('should only access each enumerable key\'s value once', function () {
		var obj = {}
		var fooValue = 3
		Object.defineProperties(obj, {
			foo: {
				get: function () {return fooValue++},
				enumerable: true,
				configerable: false
			},
			bar: {
				get: function () {throw new Error('Should not access non-enumerable properties.')},
				enumerable: false,
				configerable: false
			}
		})
		return Promise.props(obj).then(function (result) {
			expect(result).to.satisfy(shallowEquals({foo: 3}))
			expect(fooValue).to.equal(4)
		})
	})
	it('should accept arbitrary subclasses of Object', function () {
		function Ignore() {}
		Ignore.prototype.quux = 'ignore me'

		function Foo() {this.bar = 'baz'}
		Foo.prototype.__proto__ = Ignore.prototype
		Foo.prototype.thud = 'also ignored'

		return expectToMatch(new Foo, {bar: 'baz'})
	})
	describe('should be rejected on invalid input', function () {
		function testInvalidInput(value) {
			specify('given: ' + toString(value), function () {
				return expect(Promise.props(value)).to.be.rejectedWith(TypeError)
			})
		}
		testInvalidInput(undefined)
		testInvalidInput(null)
		testInvalidInput(0)
		testInvalidInput(123)
		testInvalidInput(NaN)
		testInvalidInput(Infinity)
		testInvalidInput(true)
		testInvalidInput(false)
		testInvalidInput('foo')
		if (typeof Symbol === 'function') {
			testInvalidInput(Symbol())
		}
	})
	describe('should be fulfilled with an object of matching enumerable key-value pairs', function () {
		var irrelevantPromise = Promise.reject(new Error('baz')).catchLater()
		objectTester.test({foo: [irrelevantPromise], bar: 123}, expectToMatch)
	})
	describe('should not be affected by changing the input object after invocation', function () {
		objectTester.test({foo: 'bar', '': 'baz'}, function (input, source) {
			var ret = Promise.props(input)
			input.foo = 'quux'
			delete input['']
			return expect(ret).to.eventually.satisfy(shallowEquals({foo: 'bar', '': 'baz'}))
		})
	})
	describe('should be rejected with the rejection reason of a rejected promise', function () {
		var err = new Error('baz')
		objectTester.test({a: 123, b: Promise.reject(err)}, function (input, source) {
			return expect(Promise.props(input)).to.be.rejectedWith(err)
		})
	})
	describe('should be rejected by the earliest rejected promise', function () {
		function shouldBeRejected() {throw new Error('This promise should have been rejected.')}
		var errors = {foo: new Error('baz'), bar: new Error('quux')}
		objectTester.test({foo: Promise.reject(errors.foo), bar: Promise.reject(errors.bar)}, function (input, source, raceWinners) {
			return Promise.props(input).then(shouldBeRejected, function (reason) {
				for (var i=0; i<raceWinners.length; i++) {
					var key = raceWinners[i]
					if (reason === errors[key]) {
						return
					}
				}
				throw new Error('None of the potential race winners were the rejection reason.')
			})
		})
	})
})
