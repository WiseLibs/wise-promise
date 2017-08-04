'use strict'
var testNonFunctions = require('../tools/test/test-non-functions')
require('../tools/test/describe')('Promise.promisify', function (Promise, expect) {
	if (!Promise.promisify) {return}
	function makeFunction(argCount, error, options, async) {
		var args = []
		for (var i=0; i<argCount; i++) {args.push('a_' + i)}
		var pre = 'var args = [].slice.call(arguments); '
		var callback = 'args[args.length - 1](error, args.slice(0, -1).reduce(function (a, b) {return a + b}, 0))'
		if (!async) {
			return Promise.promisify(new Function('error', 'return function (' + args.join(', ') + ') {' + pre + callback + '}')(error), options)
		} else {
			return Promise.promisify(new Function('error', 'return function (' + args.join(', ') + ') {' + pre + 'setTimeout(function () {' + callback + '}, ' + ~~async + ')}')(error), options)
		}
	}
	function forManyStyles(error, test) {
		[0, 1, 2, 3, 4, 5, 6, 10, 50, 100, 200].forEach(function (n) {
			specify('length ' + n + ' (sync)', function () {
				return test(makeFunction(n, error, undefined))
			})
			specify('length ' + n + ' (async)', function () {
				return test(makeFunction(n, error, undefined, 1))
			})
			specify('length ' + n + ' (deoptimized)', function () {
				return test(makeFunction(n, error, {deoptimize: true}))
			})
		})
	}
	function makeCustomFunction(argCount, error, body, options) {
		var args = []
		for (var i=0; i<argCount; i++) {args.push('a_' + i)}
		return Promise.promisify(new Function('error', 'return function (' + args.join(', ') + ') {var callback = arguments[arguments.length - 1]; ' + body + '}')(error), options)
	}
	function forManyCustomStyles(error, body, test) {
		[0, 1, 2, 3, 4, 5, 6, 10, 50, 100, 200].forEach(function (n) {
			specify('length ' + n, function () {
				return test(makeCustomFunction(n, error, body, undefined))
			})
			specify('length ' + n + ' (deoptimized)', function () {
				return test(makeCustomFunction(n, error, body, {deoptimize: true}))
			})
		})
	}
	describe('should throw when not given a function', function () {
		testNonFunctions(function (value) {
			expect(function () {Promise.promisify(value)}).to.throw(TypeError)
		})
		specify('given: no arguments', function () {
			expect(function () {Promise.promisify()}).to.throw(TypeError)
		})
	})
	describe('should return a promise', function () {
		forManyCustomStyles({}, '', function (fn) {
			expect(fn()).to.be.an.instanceof(Promise)
		})
	})
	describe('should be invoked with the proper `this` value', function () {
		var obj = {}
		forManyCustomStyles(obj, 'this === error ? callback() : callback(new Error("Incorrect `this` value."))', function (fn) {
			return fn.call(obj)
		})
	})
	describe('should fulfill with the value of a successful callback', function () {
		describe('4 passed args', function () {
			forManyStyles(null, function (fn) {
				return expect(fn(1, 2, 6, 88)).to.become(97)
			})
		})
		describe('0 passed args', function () {
			forManyStyles(null, function (fn) {
				return expect(fn()).to.become(0)
			})
		})
		describe('11 passed args', function () {
			forManyStyles(null, function (fn) {
				return expect(fn(1, 2, 6, 88, 23, 254, 123, 7, 2, 5, 1)).to.become(512)
			})
		})
	})
	describe('should reject with the rejection reason of a failed callback', function () {
		var err = new Error('foobar')
		forManyStyles(err, function (fn) {
			return expect(fn(1, 2, 6, 88)).to.be.rejectedWith(err)
		})
	})
	describe('should be rejected if the function synchronously throws', function () {
		var err = new Error('foobar')
		forManyCustomStyles(err, 'throw error', function (fn) {
			return expect(fn(1, 2, 6, 88)).to.be.rejectedWith(err)
		})
	})
	describe('should treat non-null errors as rejections', function () {
		describe('error is 0', function () {
			forManyStyles(0, function (fn) {
				return fn(1, 2, 6, 88).then(function () {
					throw new Error('This promise should have been rejected.')
				}, function (reason) {
					expect(reason).to.equal(0)
				})
			})
		})
		describe('error is ""', function () {
			forManyStyles('', function (fn) {
				return fn(1, 2, 6, 88).then(function () {
					throw new Error('This promise should have been rejected.')
				}, function (reason) {
					expect(reason).to.equal('')
				})
			})
		})
		describe('error is undefined', function () {
			forManyStyles(undefined, function (fn) {
				return expect(fn(1, 2, 6, 88)).to.become(97)
			})
		})
		describe('error is null', function () {
			forManyStyles(null, function (fn) {
				return expect(fn(1, 2, 6, 88)).to.become(97)
			})
		})
	})
	describe('should convert thrown nulls and undefineds to errors', function () {
		describe('throw null', function () {
			forManyCustomStyles({}, 'throw null', function (fn) {
				return expect(fn(1, 2, 6, 88)).to.be.rejectedWith(Error)
			})
		})
		describe('throw undefined', function () {
			forManyCustomStyles({}, 'throw undefined', function (fn) {
				return expect(fn(1, 2, 6, 88)).to.be.rejectedWith(Error)
			})
		})
		describe('throw "foo"', function () {
			forManyCustomStyles({}, 'throw "foo"', function (fn) {
				return fn(1, 2, 6, 88).then(function () {
					throw new Error('This promise should have been rejected.')
				}, function (reason) {
					expect(reason).to.equal('foo')
				})
			})
		})
		describe('throw 0', function () {
			forManyCustomStyles({}, 'throw 0', function (fn) {
				return fn(1, 2, 6, 88).then(function () {
					throw new Error('This promise should have been rejected.')
				}, function (reason) {
					expect(reason).to.equal(0)
				})
			})
		})
	})
	describe('multiArgs options', function () {
		it('should fulfill with an array of values', function () {
			return expect(Promise.promisify(function (a, b, c, cb) {
				cb(null, a + b + c, a - b - c, a, b, c)
			}, {multiArgs: true})(5, 6, 8))
			.to.become([19, -9, 5, 6, 8])
		})
		it('should fulfill with an array of a single value', function () {
			return expect(Promise.promisify(function (a, b, c, cb) {
				cb(null, a + b + c)
			}, {multiArgs: true})(5, 6, 8))
			.to.become([19])
		})
		it('should be rejected with an error', function () {
			var err = new Error('foobar')
			return expect(Promise.promisify(function (a, b, c, cb) {
				cb(err, a + b + c, a - b - c, a, b, c)
			}, {multiArgs: true})(5, 6, 8))
			.to.be.rejectedWith(err)
		})
	})
})
