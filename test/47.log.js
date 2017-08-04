'use strict';
require('../tools/describe')('.log', function (Promise, expect) {
	const hookConsole = () => {
		const consoleLog = console.log;
		let wasInvoked = false;
		let isPending = true;
		let passed0, passed1, passed2;
		console.log = (arg0, arg1, arg2) => {
			if (isPending) {
				wasInvoked = true;
				passed0 = arg0;
				passed1 = arg1;
				passed2 = arg2;
			}
			cancel();
		};
		const cancel = () => {
			isPending = false;
			console.log = consoleLog;
		};
		const get = () => {
			const arr = [passed0, passed1, passed2];
			arr.invoked = wasInvoked;
			return arr;
		};
		return { cancel, get };
	};
	
	it('should return a new promise', function () {
		const controller = hookConsole();
		const original = Promise.resolve();
		const logged = original.log();
		const success = (logged instanceof Promise) && original !== logged;
		return logged.finally(() => {
			controller.cancel();
			if (!success) throw new Error('The method did not return a new promise');
		});
	});
	describe('should log the rejection value without changing it', function () {
		specify('already rejected', function () {
			const err = new Error('foo');
			const controller = hookConsole();
			return Promise.reject(err).log().catch((reason) => {
				expect(reason).to.equal(err);
				expect(controller.get()[0]).to.equal('<rejected>');
				expect(controller.get()[1]).to.equal(err);
				expect(controller.get()[2]).to.be.undefined;
			}).finally(controller.cancel);
		});
		specify('eventually rejected', function () {
			const err = new Error('foo');
			const controller = hookConsole();
			const promise = new Promise((res, rej) => {
				setTimeout(() => rej(err), 50);
			});
			return promise.log().catch((reason) => {
				expect(reason).to.equal(err);
				expect(controller.get()[0]).to.equal('<rejected>');
				expect(controller.get()[1]).to.equal(err);
				expect(controller.get()[2]).to.be.undefined;
			}).finally(controller.cancel);
		});
	});
	describe('should log the fulfillment value without changing it', function () {
		specify('already fulfilled', function () {
			const obj = {};
			const controller = hookConsole();
			return Promise.resolve(obj).log().then((value) => {
				expect(value).to.equal(obj);
				expect(controller.get()[0]).to.equal('<fulfilled>');
				expect(controller.get()[1]).to.equal(obj);
				expect(controller.get()[2]).to.be.undefined;
			}).finally(controller.cancel);
		});
		specify('eventually fulfilled', function () {
			const obj = {};
			const controller = hookConsole();
			const promise = new Promise((res) => {
				setTimeout(() => res(obj), 50);
			});
			return promise.log().then((value) => {
				expect(value).to.equal(obj);
				expect(controller.get()[0]).to.equal('<fulfilled>');
				expect(controller.get()[1]).to.equal(obj);
				expect(controller.get()[2]).to.be.undefined;
			}).finally(controller.cancel);
		});
	});
	describe('should accept an argument which is prepended to the logged value', function () {
		specify('argument is undefined', function () {
			const obj = {};
			const arg = undefined;
			const controller = hookConsole();
			return Promise.resolve(obj).log(arg).then((value) => {
				expect(value).to.equal(obj);
				expect(controller.get()[0]).to.equal(arg);
				expect(controller.get()[1]).to.equal('<fulfilled>');
				expect(controller.get()[2]).to.equal(obj);
			}).finally(controller.cancel);
		});
		specify('argument is value', function () {
			const obj = {};
			const arg = [1, 2, 3];
			const controller = hookConsole();
			return Promise.resolve(obj).log(arg).then((value) => {
				expect(value).to.equal(obj);
				expect(controller.get()[0]).to.equal(arg);
				expect(controller.get()[1]).to.equal('<fulfilled>');
				expect(controller.get()[2]).to.equal(obj);
			}).finally(controller.cancel);
		});
	});
});
