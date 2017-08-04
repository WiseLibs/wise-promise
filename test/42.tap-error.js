'use strict'
var Thenable = require('../tools/thenable')
require('../tools/describe')('.tapError', function (Promise, expect) {
	it('should return a new promise', function () {
		var original = Promise.resolve()
		var rollbacked = original.tapError()
		expect(rollbacked).to.be.an.instanceof(Promise)
		expect(original).to.not.equal(rollbacked)
	})
	it('should ignore non-function arguments', function (done) {
		Promise.resolve(555)
			.tapError()
			.tapError('foo')
			.then(function (value) {
				expect(value).to.equal(555)
				done()
			})
	})
	describe('when used on a fulfilled promise', function () {
		it('should not invoke the callback', function (done) {
			Promise.resolve(555).tapError(function () {
				done(new Error('This callback should not have been invoked'))
			}).then(function (value) {
				expect(value).to.equal(555)
				done()
			})
		})
	})
	describe('when used on a rejected promise', function () {
		it('should invoke the callback with the rejection reason', function (done) {
			var error = new Error('foo')
			Promise.reject(error).tapError(function (reason) {
				expect(reason).to.equal(error)
				done()
			}).catchLater()
		})
		it('should not be fulfilled by the callback return value', function (done) {
			var error = new Error('foo')
			Promise.reject(error).tapError(function () {
				return 999
			}).then(function () {
				done(new Error('This promise should have be rejected'))
			}, function (reason) {
				expect(reason).to.equal(error)
				done()
			})
		})
		it('should be delayed if the callback returns a promise', function (done) {
			var timedOut = false
			var error = new Error('foo')
			Promise.reject(error).tapError(function () {
				return new Promise(function (resolve, reject) {
					setTimeout(function () {
						timedOut = true
						resolve(999)
					}, 100)
				})
			}).then(function () {
				done(new Error('This promise should have be rejected'))
			}, function (reason) {
				expect(reason).to.equal(error)
				expect(timedOut).to.be.true
				done()
			})
		})
		it('should be delayed if the callback returns a thenable', function (done) {
			var thenable
			var error = new Error('foo')
			Promise.reject(error).tapError(function () {
				return thenable = new Thenable({async: 50}).resolve('foo')
			}).then(function () {
				done(new Error('This promise should have be rejected'))
			}, function (reason) {
				expect(reason).to.equal(error)
				expect(thenable.isDone()).to.be.true
				done()
			})
		})
		it('should be re-rejected if the callback returns a rejected promise', function (done) {
			var error = new SyntaxError('foo')
			Promise.reject(new TypeError('bar')).tapError(function () {
				return Promise.reject(error)
			}).then(function () {
				done(new Error('This promise should have be rejected'))
			}, function (reason) {
				expect(reason).to.equal(error)
				done()
			})
		})
		it('should be re-rejected if the callback returns a rejected thenable', function (done) {
			var thenable
			var error = new SyntaxError('foo')
			Promise.reject(new TypeError('bar')).tapError(function () {
				return thenable = new Thenable({async: 50}).reject(error)
			}).then(function () {
				done(new Error('This promise should have be rejected'))
			}, function (reason) {
				expect(reason).to.equal(error)
				expect(thenable.isDone()).to.be.true
				done()
			})
		})
		it('should be re-rejected if the callback throws', function (done) {
			var error = new SyntaxError('foo')
			Promise.reject(new TypeError('bar')).tapError(function () {
				throw error
			}).then(function () {
				done(new Error('This promise should have be rejected'))
			}, function (reason) {
				expect(reason).to.equal(error)
				done()
			})
		})
	})
})
