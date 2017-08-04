'use strict';
const Thenable = require('../tools/thenable');
require('../tools/describe')('.tapError', function (Promise, expect) {
	it('should return a new promise', function () {
		const original = Promise.resolve();
		const rollbacked = original.tapError();
		expect(rollbacked).to.be.an.instanceof(Promise);
		expect(original).to.not.equal(rollbacked);
	});
	it('should ignore non-function arguments', function (done) {
		Promise.resolve(555)
			.tapError()
			.tapError('foo')
			.then((value) => {
				expect(value).to.equal(555);
				done();
			});
	});
	describe('when used on a fulfilled promise', function () {
		it('should not invoke the callback', function (done) {
			Promise.resolve(555).tapError(() => {
				done(new Error('This callback should not have been invoked'));
			}).then((value) => {
				expect(value).to.equal(555);
				done();
			});
		});
	});
	describe('when used on a rejected promise', function () {
		it('should invoke the callback with the rejection reason', function (done) {
			const error = new Error('foo');
			Promise.reject(error).tapError((reason) => {
				expect(reason).to.equal(error);
				done();
			}).catchLater();
		});
		it('should not be fulfilled by the callback return value', function (done) {
			const error = new Error('foo');
			Promise.reject(error).tapError(() => {
				return 999;
			}).then(() => {
				done(new Error('This promise should have be rejected'));
			}, (reason) => {
				expect(reason).to.equal(error);
				done();
			});
		});
		it('should be delayed if the callback returns a promise', function (done) {
			let timedOut = false;
			const error = new Error('foo');
			Promise.reject(error).tapError(() => {
				return new Promise((resolve, reject) => {
					setTimeout(() => {
						timedOut = true;
						resolve(999);
					}, 100);
				});
			}).then(() => {
				done(new Error('This promise should have be rejected'));
			}, (reason) => {
				expect(reason).to.equal(error);
				expect(timedOut).to.be.true;
				done();
			});
		});
		it('should be delayed if the callback returns a thenable', function (done) {
			let thenable;
			const error = new Error('foo');
			Promise.reject(error).tapError(() => {
				return thenable = new Thenable({ async: 50 }).resolve('foo');
			}).then(() => {
				done(new Error('This promise should have be rejected'));
			}, (reason) => {
				expect(reason).to.equal(error);
				expect(thenable.isDone()).to.be.true;
				done();
			});
		});
		it('should be re-rejected if the callback returns a rejected promise', function (done) {
			const error = new SyntaxError('foo');
			Promise.reject(new TypeError('bar')).tapError(() => {
				return Promise.reject(error);
			}).then(() => {
				done(new Error('This promise should have be rejected'));
			}, (reason) => {
				expect(reason).to.equal(error);
				done();
			});
		});
		it('should be re-rejected if the callback returns a rejected thenable', function (done) {
			let thenable;
			const error = new SyntaxError('foo');
			Promise.reject(new TypeError('bar')).tapError(() => {
				return thenable = new Thenable({ async: 50 }).reject(error);
			}).then(() => {
				done(new Error('This promise should have be rejected'));
			}, (reason) => {
				expect(reason).to.equal(error);
				expect(thenable.isDone()).to.be.true;
				done();
			});
		});
		it('should be re-rejected if the callback throws', function (done) {
			const error = new SyntaxError('foo');
			Promise.reject(new TypeError('bar')).tapError(() => {
				throw error;
			}).then(() => {
				done(new Error('This promise should have be rejected'));
			}, (reason) => {
				expect(reason).to.equal(error);
				done();
			});
		});
	});
});
