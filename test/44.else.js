'use strict'
require('../tools/test/describe')('.else', function (Promise, expect) {
	function alwaysTrue() {return true}
	describe('should return a new promise', function () {
		specify('when 0 arguments are supplied', function () {
			var p = Promise.resolve(5)
			return expect(p.else()).to.be.an.instanceof(Promise).and.not.equal(p)
		})
		specify('when 1 argument is supplied', function () {
			var p = Promise.resolve(5)
			return expect(p.else('foo')).to.be.an.instanceof(Promise).and.not.equal(p)
		})
		specify('when 2 arguments are supplied', function () {
			var p = Promise.resolve(5)
			return expect(p.else(alwaysTrue, 'foo')).to.be.an.instanceof(Promise).and.not.equal(p)
		})
	})
	describe('should not catch fulfilled promises', function () {
		specify('when 0 arguments are supplied', function () {
			var err = new Error('foo')
			return expect(
				Promise.resolve(err).else()
			).to.eventually.equal(err)
		})
		specify('when 1 argument is supplied', function () {
			var err = new Error('foo')
			return expect(
				Promise.resolve(err).else('bar')
			).to.eventually.equal(err)
		})
		specify('when 2 arguments are supplied', function () {
			var err = new Error('foo')
			return expect(
				Promise.resolve(err).else(Error, 'bar')
			).to.eventually.equal(err)
		})
		specify('when an array of predicates are supplied', function () {
			function alwaysTrue() {return true}
			var err = new Error('foo')
			return expect(
				Promise.resolve(err).else([alwaysTrue, Error], 'bar')
			).to.eventually.equal(err)
		})
	})
	it('should provide default values for rejected promises', function () {
		return expect(
			Promise.reject(44).else(9)
		).to.become(9)
	})
	it('should accept class pedicates for conditional catching', function () {
		return expect(
			Promise.reject(new SyntaxError('foo'))
				.else([TypeError, RangeError], 'bar')
				.else([URIError, SyntaxError], 'quux')
				.else([TypeError, RangeError], 'bar')
		).to.become('quux')
	})
	it('should accept function pedicates for conditional catching', function () {
		function isBar(err) {return err.message === 'bar'}
		function isBaz(err) {return err.message === 'baz'}
		function is5(err) {return err.message.length === 5}
		function is3(err) {return err.message.length === 3}
		return expect(
			Promise.reject(new Error('foo'))
				.else(isBaz, 'wrong')
				.else([isBar, is5], 'wrong')
				.else(is3, 'right')
				.else(isBaz, 'wrong')
		).to.become('right')
	})
	it('should ignore non-matching pedicates', function () {
		function isBar(err) {return err.message === 'bar'}
		var err = new Error('foo')
		return expect(Promise.reject(err)
			.else(SyntaxError, 'quux')
			.else(isBar, 'quux')
			.else(123, 'quux')
			.else(null, 'quux')
			.else(undefined, 'quux')
			.else({}, 'quux')
			.else(function () {}, 'quux')
			.else('foo', 'quux')
			.else(/foo/, 'quux')
			.else([SyntaxError, isBar], function () {})
			.else([], function () {}))
		.to.be.rejectedWith(err)
	})
	it('should not ignore good predicates when a bad pedicate exists', function () {
		return expect(
			Promise.reject(new Error('foo'))
				.else(null, 'quux')
				.else([null, function (err) {return err.message === 'foo'}], 'bar')
				.else(null, 'quux')
		).to.become('bar')
	})
	it('should catch instances of class predicates', function () {
		return expect(
			Promise.reject(new SyntaxError()).else(Error, 3)
		).to.become(3)
	})
	it('should treat non-Error classes as function predicates', function () {
		function BlahError() {
			return false
		}
		var obj = Object.create(BlahError.prototype)
		return Promise.reject(obj)
			.else(BlahError, 3)
			.then(function () {
				throw new Error('This promise should not have been fulfilled.')
			}, function (reason) {
				expect(reason).to.equal(obj)
			})
	})
})
