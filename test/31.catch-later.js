'use strict';
require('../tools/describe')('.catchLater', function (Promise, expect) {
	function hookUnhandledRejections(cb) {
		let isPending = true;
		const hook = () => {
			if (isPending) cb();
			cancel();
		};
		const cancel = () => {
			isPending = false;
			process.removeListener('unhandledRejection', hook);
		};
		process.on('unhandledRejection', hook);
		return cancel;
	}
	function expectUnhandledRejection(done) {
		const timer = setTimeout(() => {
			cancel();
			done(new Error('An unhandled rejection did not occur'));
		}, 10);
		const cancel = hookUnhandledRejections(() => {
			clearTimeout(timer);
			done();
		});
	}
	function expectAllRejectionsHandled(done, promise) {
		const timer = setTimeout(() => {
			cancel();
			promise.then(() => { done(new Error('The promise was not rejected')); }, () => { done(); });
		}, 30);
		const cancel = hookUnhandledRejections(() => {
			clearTimeout(timer);
			done(new Error('An unhandled rejection occurred'));
		});
	}
	function testPromises(test) {
		specify('on a terminal promise', function (done) {
			return test(done, Promise.reject(new Error('foo bar')));
		});
		specify('on a following promise', function (done) {
			return test(done, new Promise((res) => {
				res(Promise.reject(new Error('foo bar')));
			}));
		});
		specify('on an eventually following promise', function (done) {
			return test(done, Promise.resolve().then(() => {
				return Promise.reject(new Error('foo bar'));
			}));
		});
	}

	describe('when omitted, should log an error for unhandled rejections', function () {
		testPromises((done, promise) => {
			expectUnhandledRejection(done);
		});
	});
	describe('should prevent an error from being logged for unhandled rejections', function () {
		testPromises((done, promise) => {
			promise.catchLater();
			expectAllRejectionsHandled(done, promise);
		});
	});
	describe('should not prevent a following promise from logging the unhandled rejection', function () {
		specify('on a following promise', function (done) {
			new Promise((res) => {
				res(Promise.reject(new Error('foo bar')).catchLater());
			});
			expectUnhandledRejection(done);
		});
		specify('on an eventually following promise', function (done) {
			Promise.resolve().then(() => {
				return Promise.reject(new Error('foo bar')).catchLater();
			});
			expectUnhandledRejection(done);
		});
	});
	describe('should respect each following promise', function () {
		it('logs the unhandled rejection when used on only 1/2 following promises', function (done) {
			const p = Promise.reject(new Error('foo bar'));
			new Promise(res => res(p)).catchLater();
			new Promise(res => res(p));
			expectUnhandledRejection(done);
		});
		it('doesn\'t log the unhandled rejection when used on both following promises', function (done) {
			const p = Promise.reject(new Error('foo bar'));
			new Promise(res => res(p)).catchLater();
			new Promise(res => res(p)).catchLater();
			expectAllRejectionsHandled(done, p);
		});
	});
});
