'use strict'
require('../tools/describe')('.catchLater', function (Promise, expect) {
	if (Promise.suppressUnhandledRejections) {
		var originalSuppressionValue = Promise.suppressUnhandledRejections
		before(function () {
			Promise.suppressUnhandledRejections = false
		})
		after(function () {
			Promise.suppressUnhandledRejections = originalSuppressionValue
		})
	}

	function hookConsole(cb) {
		var consoleError = console.error
		var isPending = true
		console.error = function () {
			if (isPending) {
				isPending = false
				console.error = consoleError
				cb()
			}
		}
		return function cancel() {
			if (isPending) {
				isPending = false
				console.error = consoleError
			}
		}
	}
	function expectConsole(done) {
		var timer = setTimeout(function () {
			cancel()
			done(new Error('console.error was not invoked.'))
		}, 10)
		var cancel = hookConsole(function () {
			clearTimeout(timer)
			done()
		})
	}
	function expectNoConsole(done, promise) {
		var timer = setTimeout(function () {
			cancel()
			promise.then(function () {
				done(new Error('The promise was not rejected.'))
			}, function () {
				done()
			})
		}, 30)
		var cancel = hookConsole(function () {
			clearTimeout(timer)
			done(new Error('console.error was invoked.'))
		})
	}
	function testPromises(test) {
		specify('on a terminal promise', function (done) {
			return test(done, Promise.reject(new Error('foo bar')))
		})
		specify('on a following promise', function (done) {
			return test(done, new Promise(function (res) {
				res(Promise.reject(new Error('foo bar')))
			}))
		})
		specify('on an eventually following promise', function (done) {
			return test(done, Promise.resolve().then(function () {
				return Promise.reject(new Error('foo bar'))
			}))
		})
	}

	describe('when omitted, should log an error for unhandled rejections', function () {
		testPromises(function (done, promise) {
			expectConsole(done)
		})
	})
	describe('should prevent an error from being logged for unhandled rejections', function () {
		testPromises(function (done, promise) {
			promise.catchLater()
			expectNoConsole(done, promise)
		})
	})
	describe('should not prevent a following promise from logging the unhandled rejection', function () {
		specify('on a following promise', function (done) {
			new Promise(function (res) {
				res(Promise.reject(new Error('foo bar')).catchLater())
			})
			expectConsole(done)
		})
		specify('on an eventually following promise', function (done) {
			Promise.resolve().then(function () {
				return Promise.reject(new Error('foo bar')).catchLater()
			})
			expectConsole(done)
		})
	})
	describe('should respect each following promise', function () {
		it('logs the unhandled rejection when used on only 1/2 following promises', function (done) {
			var p = Promise.reject(new Error('foo bar'))
			new Promise(function (res) {res(p)}).catchLater()
			new Promise(function (res) {res(p)})
			expectConsole(done)
		})
		it('doesn\'t log the unhandled rejection when used on both following promises', function (done) {
			var p = Promise.reject(new Error('foo bar'))
			new Promise(function (res) {res(p)}).catchLater()
			new Promise(function (res) {res(p)}).catchLater()
			expectNoConsole(done, p)
		})
	})
})
