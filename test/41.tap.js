'use strict';
const Thenable = require('../tools/thenable');
require('../tools/describe')('.tap', function (Promise, expect) {
	it('should return a new promise', function () {
		const original = Promise.resolve();
		const tapped = original.tap();
		expect(tapped).to.be.an.instanceof(Promise);
		expect(original).to.not.equal(tapped);
	});
	it('should ignore non-function arguments', function (done) {
		Promise.resolve(555)
			.tap()
			.tap('foo')
			.then((value) => {
				expect(value).to.equal(555);
				done();
			});
	});
	describe('when used on a fulfilled promise', function () {
		it('should invoke the callback with the fulfillment value', function (done) {
			Promise.resolve(555).tap((value) => {
				expect(value).to.equal(555);
				done();
			});
		});
		it('should not be changed by the callback return value', function (done) {
			Promise.resolve(555).tap(() => {
				return 999;
			}).then((value) => {
				expect(value).to.equal(555);
				done();
			});
		});
		it('should be delayed if the callback returns a promise', function (done) {
			let timedOut = false;
			Promise.resolve(555).tap(() => {
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
			Promise.resolve(555).tap(() => {
				return thenable = new Thenable({ async: 50 }).resolve('foo');
			}).then((value) => {
				expect(value).to.equal(555);
				expect(thenable.isDone()).to.be.true;
				done();
			});
		});
		it('should be rejected if the callback returns a rejected promise', function (done) {
			const error = new Error('foo');
			Promise.resolve(555).tap(() => {
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
			Promise.resolve(555).tap(() => {
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
			Promise.resolve(555).tap(() => {
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
		it('should not invoke the callback', function (done) {
			const error = new Error('foo');
			Promise.reject(error).tap(() => {
				done(new Error('This callback should not have been invoked'));
			}).catch((reason) => {
				expect(reason).to.equal(error);
				done();
			});
		});
	});
});
