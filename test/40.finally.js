'use strict';
const Thenable = require('../tools/thenable');
require('../tools/describe')('.finally', function (Promise, expect) {
	it('should return a new promise', () => {
		const original = Promise.resolve();
		const finallyed = original.finally();
		expect(finallyed).to.be.an.instanceof(Promise);
		expect(original).to.not.equal(finallyed);
	});
	it('should ignore non-function arguments', function (done) {
		Promise.resolve(555)
			.finally()
			.finally('foo')
			.then((value) => {
				expect(value).to.equal(555);
				done();
			});
	});
	describe('when used on a fulfilled promise', function () {
		it('should invoke the callback with no arguments', function (done) {
			Promise.resolve(555).finally(function () {
				expect(arguments.length).to.equal(0);
				done();
			});
		});
		it('should not be changed by the callback return value', function (done) {
			Promise.resolve(555).finally(() => 999).then((value) => {
				expect(value).to.equal(555);
				done();
			});
		});
		it('should be delayed if the callback returns a promise', function (done) {
			let timedOut = false;
			Promise.resolve(555).finally(() => {
				return new Promise((resolve, reject) => {
					setTimeout(() => {
						timedOut = true;
						resolve(999);
					}, 100);
				});
			}).then((value) => {
				expect(value).to.equal(555);
				expect(timedOut).to.be.true;
				done();
			});
		});
		it('should be delayed if the callback returns a thenable', function (done) {
			let thenable;
			Promise.resolve(555).finally(() => {
				return thenable = new Thenable({ async: 50 }).resolve('foo');
			}).then((value) => {
				expect(value).to.equal(555);
				expect(thenable.isDone()).to.be.true;
				done();
			});
		});
		it('should be rejected if the callback returns a rejected promise', function (done) {
			const error = new Error('foo');
			Promise.resolve(555).finally(() => {
				return Promise.reject(error);
			}).then(() => {
				done(new Error('This promise should have be rejected'));
			}, (reason) => {
				expect(reason).to.equal(error);
				done();
			});
		});
		it('should be rejected if the callback returns a rejected thenable', function (done) {
			let thenable;
			const error = new Error('foo');
			Promise.resolve(555).finally(() => {
				return thenable = new Thenable({ async: 50 }).reject(error);
			}).then(() => {
				done(new Error('This promise should have be rejected'));
			}, (reason) => {
				expect(reason).to.equal(error);
				expect(thenable.isDone()).to.be.true;
				done();
			});
		});
		it('should be rejected if the callback throws', function (done) {
			const error = new Error('foo');
			Promise.resolve(555).finally(() => {
				throw error;
			}).then(() => {
				done(new Error('This promise should have be rejected'));
			}, (reason) => {
				expect(reason).to.equal(error);
				done();
			});
		});
	});
	describe('when used on a rejected promise', function () {
		it('should invoke the callback with no arguments', function (done) {
			Promise.reject(new Error('foo')).finally(function () {
				expect(arguments.length).to.equal(0);
				done();
			}).catchLater();
		});
		it('should not be fulfilled by the callback return value', function (done) {
			const error = new Error('foo');
			Promise.reject(error).finally(() => {
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
			Promise.reject(error).finally(() => {
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
			Promise.reject(error).finally(() => {
				return thenable = new Thenable({ async: 50 }).resolve('foo');
			}).then(() => {
				done(new Error('This promise should have be rejected'));
			}, (reason) => {
				expect(reason).to.equal(error);
				expect(thenable.isDone()).to.be.true;
				done();
			});
		})
		it('should be re-rejected if the callback returns a rejected promise', function (done) {
			const error = new SyntaxError('foo');
			Promise.reject(new TypeError('bar')).finally(() => {
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
			Promise.reject(new TypeError('bar')).finally(() => {
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
			Promise.reject(new TypeError('bar')).finally(() => {
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
