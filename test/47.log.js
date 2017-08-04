'use strict'
require('../tools/test/describe')('.log', function (Promise, expect) {
	function hookConsole() {
		var consoleLog = console.log
		var wasInvoked = false
		var isPending = true
		var passed0, passed1, passed2
		console.log = function (arg0, arg1, arg2) {
			if (isPending) {
				isPending = false
				console.log = consoleLog
				wasInvoked = true
				passed0 = arg0
				passed1 = arg1
				passed2 = arg2
			}
		}
		return {
			cancel: function () {
				if (isPending) {
					isPending = false
					console.log = consoleLog
				}
			},
			get: function () {
				var arr = [passed0, passed1, passed2]
				arr.invoked = wasInvoked
				return arr
			}
		}
	}
	
	it('should return a new promise', function () {
		var controller = hookConsole()
		var original = Promise.resolve()
		var logged = original.log()
		var success = (logged instanceof Promise) && original !== logged
		return logged.finally(function () {
			controller.cancel()
			if (!success) {throw new Error('The method did not return a new promise.')}
		})
	})
	describe('should log the rejection value without changing it', function () {
		specify('already rejected', function () {
			var err = new Error('foo')
			var controller = hookConsole()
			return Promise.reject(err).log().catch(function (reason) {
				expect(reason).to.equal(err)
				expect(controller.get()[0]).to.equal('<rejected>')
				expect(controller.get()[1]).to.equal(err)
				expect(controller.get()[2]).to.be.undefined
			}).finally(controller.cancel)
		})
		specify('eventually rejected', function () {
			var err = new Error('foo')
			var controller = hookConsole()
			var promise = new Promise(function (res, rej) {
				setTimeout(function () {rej(err)}, 50)
			})
			return promise.log().catch(function (reason) {
				expect(reason).to.equal(err)
				expect(controller.get()[0]).to.equal('<rejected>')
				expect(controller.get()[1]).to.equal(err)
				expect(controller.get()[2]).to.be.undefined
			}).finally(controller.cancel)
		})
	})
	describe('should log the fulfillment value without changing it', function () {
		specify('already fulfilled', function () {
			var obj = {}
			var controller = hookConsole()
			return Promise.resolve(obj).log().then(function (value) {
				expect(value).to.equal(obj)
				expect(controller.get()[0]).to.equal('<fulfilled>')
				expect(controller.get()[1]).to.equal(obj)
				expect(controller.get()[2]).to.be.undefined
			}).finally(controller.cancel)
		})
		specify('eventually fulfilled', function () {
			var obj = {}
			var controller = hookConsole()
			var promise = new Promise(function (res) {
				setTimeout(function () {res(obj)}, 50)
			})
			return promise.log().then(function (value) {
				expect(value).to.equal(obj)
				expect(controller.get()[0]).to.equal('<fulfilled>')
				expect(controller.get()[1]).to.equal(obj)
				expect(controller.get()[2]).to.be.undefined
			}).finally(controller.cancel)
		})
	})
	describe('should accept an argument which is prepended to the logged value', function () {
		specify('argument is undefined', function () {
			var obj = {}
			var arg = undefined
			var controller = hookConsole()
			return Promise.resolve(obj).log(arg).then(function (value) {
				expect(value).to.equal(obj)
				expect(controller.get()[0]).to.equal(arg)
				expect(controller.get()[1]).to.equal('<fulfilled>')
				expect(controller.get()[2]).to.equal(obj)
			}).finally(controller.cancel)
		})
		specify('argument is value', function () {
			var obj = {}
			var arg = [1, 2, 3]
			var controller = hookConsole()
			return Promise.resolve(obj).log(arg).then(function (value) {
				expect(value).to.equal(obj)
				expect(controller.get()[0]).to.equal(arg)
				expect(controller.get()[1]).to.equal('<fulfilled>')
				expect(controller.get()[2]).to.equal(obj)
			}).finally(controller.cancel)
		})
	})
})
