'use strict'
require('../tools/describe')('.catch', function (Promise, expect) {
	function shouldNotFulfill() {
		throw new Error('This promise should not have been fulfilled.')
	}
	function alwaysTrue() {return true}
	describe('should return a new promise', function () {
		specify('when 0 arguments are supplied', function () {
			var p = Promise.resolve(5)
			return expect(p.catch()).to.be.an.instanceof(Promise).and.not.equal(p)
		})
		specify('when 1 argument is supplied', function () {
			var p = Promise.resolve(5)
			return expect(p.catch(function () {})).to.be.an.instanceof(Promise).and.not.equal(p)
		})
		specify('when 2 arguments are supplied', function () {
			var p = Promise.resolve(5)
			return expect(p.catch(alwaysTrue, function () {})).to.be.an.instanceof(Promise).and.not.equal(p)
		})
	})
	describe('should not catch fulfilled promises', function () {
		specify('when 0 arguments are supplied', function () {
			var err = new Error('foo')
			return expect(
				Promise.resolve(err).catch()
			).to.eventually.equal(err)
		})
		specify('when 1 argument is supplied', function () {
			var err = new Error('foo')
			return expect(
				Promise.resolve(err).catch(function () {return 'bar'})
			).to.eventually.equal(err)
		})
		specify('when 2 arguments are supplied', function () {
			var err = new Error('foo')
			return expect(
				Promise.resolve(err).catch(Error, function () {return 'bar'})
			).to.eventually.equal(err)
		})
		specify('when an array of predicates are supplied', function () {
			var err = new Error('foo')
			return expect(
				Promise.resolve(err).catch([alwaysTrue, Error], function () {return 'bar'})
			).to.eventually.equal(err)
		})
	})
	describe('should ignore non-function handlers', function () {
		specify('when 0 predicates are supplied', function () {
			return Promise.reject(3).catch(10).then(shouldNotFulfill, function (reason) {
				expect(reason).to.equal(3)
			})
		})
		specify('when 1 predicate is supplied', function () {
			return Promise.reject(3).catch(alwaysTrue, 10).then(shouldNotFulfill, function (reason) {
				expect(reason).to.equal(3)
			})
		})
		specify('when an array of predicates are supplied', function () {
			return Promise.reject(3).catch([alwaysTrue], 10).then(shouldNotFulfill, function (reason) {
				expect(reason).to.equal(3)
			})
		})
	})
	it('should catch rejected promises', function () {
		return expect(
			Promise.reject(44).catch(function (reason) {
				return reason / 2
			})
		).to.become(22)
	})
	it('should accept class pedicates for conditional catching', function () {
		return expect(
			Promise.reject(new SyntaxError('foo'))
				.catch([TypeError, RangeError], function () {})
				.catch([URIError, SyntaxError], function (reason) {
					return reason.message + 'z'
				})
				.catch([TypeError, RangeError], function () {})
		).to.become('fooz')
	})
	it('should accept function pedicates for conditional catching', function () {
		function isBar(err) {return err.message === 'bar'}
		function isBaz(err) {return err.message === 'baz'}
		function is5(err) {return err.message.length === 5}
		function is3(err) {return err.message.length === 3}
		return expect(
			Promise.reject(new Error('foo'))
				.catch(isBaz, function () {})
				.catch([isBar, is5], function () {})
				.catch(is3, function (reason) {
					return reason.message + 'd'
				})
				.catch(isBaz, function () {})
		).to.become('food')
	})
	it('should ignore non-matching pedicates', function () {
		function isBar(err) {return err.message === 'bar'}
		var err = new Error('foo')
		return Promise.reject(err)
			.catch(SyntaxError, function () {})
			.catch(isBar, function () {})
			.catch(123, function () {})
			.catch(null, function () {})
			.catch(undefined, function () {})
			.catch({}, function () {})
			.catch(function () {}, function () {})
			.catch('foo', function () {})
			.catch(/foo/, function () {})
			.catch([SyntaxError, isBar], function () {})
			.catch([], function () {})
			.then(shouldNotFulfill, function (reason) {
				expect(reason).to.equal(err)
			})
	})
	it('should not ignore good predicates when a bad pedicate exists', function () {
		return expect(
			Promise.reject(new Error('foo'))
				.catch(null, function () {})
				.catch([null, function (err) {return err.message === 'foo'}], function () {
					return 'bar'
				})
				.catch(null, function () {})
		).to.become('bar')
	})
	it('should catch instances of class predicates', function () {
		return expect(
			Promise.reject(new SyntaxError())
				.catch(Error, function () {
					return 3
				})
		).to.become(3)
	})
	it('should treat non-Error classes as function predicates', function () {
		function BlahError() {
			return false
		}
		var obj = Object.create(BlahError.prototype)
		return Promise.reject(obj)
			.catch(BlahError, function () {
				return 3
			})
			.then(shouldNotFulfill, function (reason) {
				expect(reason).to.equal(obj)
			})
	})
})
