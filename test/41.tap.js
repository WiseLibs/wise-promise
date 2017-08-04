'use strict'
var Thenable = require('../tools/test/thenable')
require('../tools/test/describe')('.tap', function (Promise, expect) {
	it('should return a new promise', function () {
		var original = Promise.resolve()
		var tapped = original.tap()
		expect(tapped).to.be.an.instanceof(Promise)
		expect(original).to.not.equal(tapped)
	})
	it('should ignore non-function arguments', function (done) {
		Promise.resolve(555)
			.tap()
			.tap('foo')
			.then(function (value) {
				expect(value).to.equal(555)
				done()
			})
	})
	describe('when used on a fulfilled promise', function () {
		it('should invoke the callback with the fulfillment value', function (done) {
			Promise.resolve(555).tap(function (value) {
				expect(value).to.equal(555)
				done()
			})
		})
		it('should not be changed by the callback return value', function (done) {
			Promise.resolve(555).tap(function () {
				return 999
			}).then(function (value) {
				expect(value).to.equal(555)
				done()
			})
		})
		it('should be delayed if the callback returns a promise', function (done) {
			var timedOut = false
			Promise.resolve(555).tap(function () {
				return new Promise(function (resolve, reject) {
					setTimeout(function () {
						timedOut = true
						resolve(999)
					}, 100)
				})
			}).then(function (value) {
				expect(value).to.equal(555)
				expect(timedOut).to.be.true
				done()
			})
		})
		it('should be delayed if the callback returns a thenable', function (done) {
			var thenable
			Promise.resolve(555).tap(function () {
				return thenable = new Thenable({async: 50}).resolve('foo')
			}).then(function (value) {
				expect(value).to.equal(555)
				expect(thenable.isDone()).to.be.true
				done()
			})
		})
		it('should be rejected if the callback returns a rejected promise', function (done) {
			var error = new Error('foo')
			Promise.resolve(555).tap(function () {
				return Promise.reject(error)
			}).then(function () {
				done(new Error('This promise should have be rejected.'))
			}, function (reason) {
				expect(reason).to.equal(error)
				done()
			})
		})
		it('should be rejected if the callback returns a rejected thenable', function (done) {
			var thenable
			var error = new Error('foo')
			Promise.resolve(555).tap(function () {
				return thenable = new Thenable({async: 50}).reject(error)
			}).then(function () {
				done(new Error('This promise should have be rejected.'))
			}, function (reason) {
				expect(reason).to.equal(error)
				expect(thenable.isDone()).to.be.true
				done()
			})
		})
		it('should be rejected if the callback throws', function (done) {
			var error = new Error('foo')
			Promise.resolve(555).tap(function () {
				throw error
			}).then(function () {
				done(new Error('This promise should have be rejected.'))
			}, function (reason) {
				expect(reason).to.equal(error)
				done()
			})
		})
	})
	describe('when used on a rejected promise', function () {
		it('should not invoke the callback', function (done) {
			var error = new Error('foo')
			Promise.reject(error).tap(function () {
				done(new Error('This callback should not have been invoked.'))
			}).catch(function (reason) {
				expect(reason).to.equal(error)
				done()
			})
		})
	})
})
