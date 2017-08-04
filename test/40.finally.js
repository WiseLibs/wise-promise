'use strict'
var Thenable = require('../tools/test/thenable')
require('../tools/test/describe')('.finally', function (Promise, expect) {
	it('should return a new promise', function () {
		var original = Promise.resolve()
		var finallyed = original.finally()
		expect(finallyed).to.be.an.instanceof(Promise)
		expect(original).to.not.equal(finallyed)
	})
	it('should ignore non-function arguments', function (done) {
		Promise.resolve(555)
			.finally()
			.finally('foo')
			.then(function (value) {
				expect(value).to.equal(555)
				done()
			})
	})
	describe('when used on a fulfilled promise', function () {
		it('should invoke the callback with no arguments', function (done) {
			Promise.resolve(555).finally(function () {
				expect(arguments.length).to.equal(0)
				done()
			})
		})
		it('should not be changed by the callback return value', function (done) {
			Promise.resolve(555).finally(function () {
				return 999
			}).then(function (value) {
				expect(value).to.equal(555)
				done()
			})
		})
		it('should be delayed if the callback returns a promise', function (done) {
			var timedOut = false
			Promise.resolve(555).finally(function () {
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
			Promise.resolve(555).finally(function () {
				return thenable = new Thenable({async: 50}).resolve('foo')
			}).then(function (value) {
				expect(value).to.equal(555)
				expect(thenable.isDone()).to.be.true
				done()
			})
		})
		it('should be rejected if the callback returns a rejected promise', function (done) {
			var error = new Error('foo')
			Promise.resolve(555).finally(function () {
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
			Promise.resolve(555).finally(function () {
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
			Promise.resolve(555).finally(function () {
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
		it('should invoke the callback with no arguments', function (done) {
			Promise.reject(new Error('foo')).finally(function () {
				expect(arguments.length).to.equal(0)
				done()
			}).catchLater()
		})
		it('should not be fulfilled by the callback return value', function (done) {
			var error = new Error('foo')
			Promise.reject(error).finally(function () {
				return 999
			}).then(function () {
				done(new Error('This promise should have be rejected.'))
			}, function (reason) {
				expect(reason).to.equal(error)
				done()
			})
		})
		it('should be delayed if the callback returns a promise', function (done) {
			var timedOut = false
			var error = new Error('foo')
			Promise.reject(error).finally(function () {
				return new Promise(function (resolve, reject) {
					setTimeout(function () {
						timedOut = true
						resolve(999)
					}, 100)
				})
			}).then(function () {
				done(new Error('This promise should have be rejected.'))
			}, function (reason) {
				expect(reason).to.equal(error)
				expect(timedOut).to.be.true
				done()
			})
		})
		it('should be delayed if the callback returns a thenable', function (done) {
			var thenable
			var error = new Error('foo')
			Promise.reject(error).finally(function () {
				return thenable = new Thenable({async: 50}).resolve('foo')
			}).then(function () {
				done(new Error('This promise should have be rejected.'))
			}, function (reason) {
				expect(reason).to.equal(error)
				expect(thenable.isDone()).to.be.true
				done()
			})
		})
		it('should be re-rejected if the callback returns a rejected promise', function (done) {
			var error = new SyntaxError('foo')
			Promise.reject(new TypeError('bar')).finally(function () {
				return Promise.reject(error)
			}).then(function () {
				done(new Error('This promise should have be rejected.'))
			}, function (reason) {
				expect(reason).to.equal(error)
				done()
			})
		})
		it('should be re-rejected if the callback returns a rejected thenable', function (done) {
			var thenable
			var error = new SyntaxError('foo')
			Promise.reject(new TypeError('bar')).finally(function () {
				return thenable = new Thenable({async: 50}).reject(error)
			}).then(function () {
				done(new Error('This promise should have be rejected.'))
			}, function (reason) {
				expect(reason).to.equal(error)
				expect(thenable.isDone()).to.be.true
				done()
			})
		})
		it('should be re-rejected if the callback throws', function (done) {
			var error = new SyntaxError('foo')
			Promise.reject(new TypeError('bar')).finally(function () {
				throw error
			}).then(function () {
				done(new Error('This promise should have be rejected.'))
			}, function (reason) {
				expect(reason).to.equal(error)
				done()
			})
		})
	})
})
