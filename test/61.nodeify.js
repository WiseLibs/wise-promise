'use strict'
var testNonFunctions = require('../tools/test/test-non-functions')
require('../tools/test/describe')('Promise.nodeify', function (Promise, expect) {
	if (!Promise.nodeify) {return}
	function makeFunction(argCount, error, async) {
		var args = []
		for (var i=0; i<argCount; i++) {args.push('a_' + i)}
		var resolve = 'error != null ? reject(error) : resolve(args.reduce(function (a, b) {return a + b}, 0))'
		if (!async) {
			return Promise.nodeify(new Function(['error', 'Promise'], 'return function (' + args.join(', ') + ') {var args = [].slice.call(arguments); return new Promise(function (resolve, reject) {' + resolve + '})}')(error, Promise))
		} else {
			return Promise.nodeify(new Function(['error', 'Promise'], 'return function (' + args.join(', ') + ') {var args = [].slice.call(arguments); return new Promise(function (resolve, reject) {setTimeout(function () {' + resolve + '}, ' + ~~async + ')})}')(error, Promise))
		}
	}
	function forManyStyles(error, test) {
		[0, 1, 2, 3, 4, 5, 6, 10, 50, 100].forEach(function (n) {
			specify('length ' + n + ' (sync)', function (done) {
				return test(makeFunction(n, error), done)
			})
			specify('length ' + n + ' (async)', function (done) {
				return test(makeFunction(n, error, 1), done)
			})
		})
	}
	function makeCustomFunction(argCount, error, body) {
		var args = []
		for (var i=0; i<argCount; i++) {args.push('a_' + i)}
		return Promise.nodeify(new Function(['error', 'Promise'], 'return function (' + args.join(', ') + ') {var self = this; var args = [].slice.call(arguments); return new Promise(function (resolve, reject) {' + body + '})}')(error, Promise))
	}
	function forManyCustomStyles(error, body, test) {
		[0, 1, 2, 3, 4, 5, 6, 10, 50, 100].forEach(function (n) {
			specify('length ' + n, function (done) {
				return test(makeCustomFunction(n, error, body), done)
			})
		})
	}
	describe('should throw when not given a function', function () {
		testNonFunctions(function (value) {
			expect(function () {Promise.nodeify(value)}).to.throw(TypeError)
		})
		specify('given: no arguments', function () {
			expect(function () {Promise.nodeify()}).to.throw(TypeError)
		})
	})
	describe('should return `this`', function () {
		forManyCustomStyles({}, '', function (fn, done) {
			var obj = {}
			expect(fn()).to.be.undefined
			expect(fn(function () {})).to.be.undefined
			expect(fn.call(obj)).to.equal(obj)
			expect(fn.call(obj, function () {})).to.equal(obj)
			done()
		})
	})
	describe('should be invoked with the proper `this` value', function () {
		var obj = {}
		forManyCustomStyles(obj, 'self === error ? resolve() : reject(new Error("Incorrect `this` value."))', function (fn, done) {
			fn.call(obj, done)
		})
	})
	describe('should invoke the callback with the fulfilled value', function () {
		describe('1 passed arg', function () {
			forManyStyles(null, function (fn, done) {
				fn(function (err, value) {
					expect(err).to.be.null
					expect(value).to.equal(0)
					done()
				})
			})
		})
		describe('5 passed args', function () {
			forManyStyles(null, function (fn, done) {
				fn(1, 2, 6, 88, function (err, value) {
					expect(err).to.be.null
					expect(value).to.equal(97)
					done()
				})
			})
		})
		describe('12 passed args', function () {
			forManyStyles(undefined, function (fn, done) {
				fn(1, 2, 6, 88, 23, 254, 123, 7, 2, 5, 1, function (err, value) {
					expect(err).to.be.null
					expect(value).to.equal(512)
					done()
				})
			})
		})
	})
	describe('should invoke the callback with the rejection reason', function () {
		var error = new Error('foobar')
		forManyStyles(error, function (fn, done) {
			fn(1, 2, 6, 88, function (err, value) {
				expect(err).to.equal(error)
				expect(value).to.be.undefined
				done()
			})
		})
	})
	describe('should be rejected if the function synchronously throws', function () {
		var error = new Error('foobar')
		forManyCustomStyles(error, 'throw error', function (fn, done) {
			fn(1, 2, 6, 88, function (err, value) {
				expect(err).to.equal(error)
				expect(value).to.be.undefined
				done()
			})
		})
	})
	describe('should convert rejected nulls and undefineds to errors', function () {
		describe('rejected null', function () {
			forManyCustomStyles({}, 'reject(null)', function (fn, done) {
				fn(1, 2, 6, 88, function (err, value) {
					expect(err).to.be.an.instanceof(Error)
					expect(value).to.be.undefined
					done()
				})
			})
		})
		describe('rejected undefined', function () {
			forManyCustomStyles({}, 'reject(undefined)', function (fn, done) {
				fn(1, 2, 6, 88, function (err, value) {
					expect(err).to.be.an.instanceof(Error)
					expect(value).to.be.undefined
					done()
				})
			})
		})
		describe('rejected "foo"', function () {
			forManyCustomStyles({}, 'reject("foo")', function (fn, done) {
				fn(1, 2, 6, 88, function (err, value) {
					expect(err).to.equal('foo')
					expect(value).to.be.undefined
					done()
				})
			})
		})
		describe('rejected 0', function () {
			forManyCustomStyles({}, 'reject(0)', function (fn, done) {
				fn(1, 2, 6, 88, function (err, value) {
					expect(err).to.equal(0)
					expect(value).to.be.undefined
					done()
				})
			})
		})
	})
	describe('should pass all arguments when no callback function is provided', function () {
		forManyCustomStyles({}, 'args[args.length - 1].foo = args.length', function (fn, done) {
			var obj = {}
			fn(1, 2, 6, 88, obj)
			expect(obj.foo).to.equal(5)
			done()
		})
	})
})
