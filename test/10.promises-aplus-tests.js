'use strict';
const tests = require('promises-aplus-tests');
const Promise = require('../.');

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
