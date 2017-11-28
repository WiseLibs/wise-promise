'use strict';
const NOOP = () => {};
process.on('unhandledRejection', NOOP);
process.on('rejectionHandled', NOOP);
const tests = require('promises-aplus-tests');
require('../tools/describe')('A+ tests', function (Promise) {
	after(function () {
		process.removeListener('unhandledRejection', NOOP);
		process.removeListener('rejectionHandled', NOOP);
		process.on('unhandledRejection', (err) => { throw err; });
	});
	tests.mocha({
		deferred: () => {
			let resolve, reject;
			const promise = new Promise((res, rej) => {
				resolve = res;
				reject = rej;
			});
			return { promise, resolve, reject };
		},
		resolved: Promise.resolve,
		rejected: Promise.reject,
	});
});
