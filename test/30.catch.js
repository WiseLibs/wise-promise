'use strict';
require('../tools/describe')('.catch', function (Promise, expect) {
	function shouldNotFulfill() {
		throw new Error('This promise should not have been fulfilled.');
	}
	describe('should return a new promise', function () {
		specify('when 0 arguments are supplied', function () {
			const p = Promise.resolve(5);
			return expect(p.catch()).to.be.an.instanceof(Promise).and.not.equal(p);
		});
		specify('when 1 argument is supplied', function () {
			const p = Promise.resolve(5);
			return expect(p.catch(() => {})).to.be.an.instanceof(Promise).and.not.equal(p);
		});
		specify('when 2 arguments are supplied', function () {
			const p = Promise.resolve(5);
			return expect(p.catch(() => true, () => {})).to.be.an.instanceof(Promise).and.not.equal(p);
		});
	});
	describe('should not catch fulfilled promises', function () {
		specify('when 0 arguments are supplied', function () {
			const err = new Error('foo');
			return expect(
				Promise.resolve(err).catch()
			).to.eventually.equal(err);
		});
		specify('when 1 argument is supplied', function () {
			const err = new Error('foo');
			return expect(
				Promise.resolve(err).catch(() => 'bar')
			).to.eventually.equal(err);
		});
		specify('when 2 arguments are supplied', function () {
			const err = new Error('foo');
			return expect(
				Promise.resolve(err).catch(Error, () => 'bar')
			).to.eventually.equal(err);
		});
		specify('when an array of predicates are supplied', function () {
			const err = new Error('foo');
			return expect(
				Promise.resolve(err).catch([() => true, Error], () => 'bar')
			).to.eventually.equal(err);
		});
	});
	describe('should ignore non-function handlers', function () {
		specify('when 0 predicates are supplied', function () {
			return Promise.reject(3).catch(10).then(shouldNotFulfill, (reason) => {
				expect(reason).to.equal(3);
			});
		});
		specify('when 1 predicate is supplied', function () {
			return Promise.reject(3).catch(() => true, 10).then(shouldNotFulfill, (reason) => {
				expect(reason).to.equal(3);
			});
		});
		specify('when an array of predicates are supplied', function () {
			return Promise.reject(3).catch([() => true], 10).then(shouldNotFulfill, (reason) => {
				expect(reason).to.equal(3);
			});
		});
	});
	it('should catch rejected promises', function () {
		return expect(
			Promise.reject(44).catch(reason => reason / 2)
		).to.become(22);
	});
	it('should accept class pedicates for conditional catching', function () {
		return expect(
			Promise.reject(new SyntaxError('foo'))
				.catch([TypeError, RangeError], () => {})
				.catch([URIError, SyntaxError], reason => reason.message + 'z')
				.catch([TypeError, RangeError], () => {})
		).to.become('fooz');
	});
	it('should accept function pedicates for conditional catching', function () {
		const isBar = (err) => err.message === 'bar';
		const isBaz = (err) => err.message === 'baz';
		const is5 = (err) => err.message.length === 5;
		const is3 = (err) => err.message.length === 3;
		return expect(
			Promise.reject(new Error('foo'))
				.catch(isBaz, () => {})
				.catch([isBar, is5], () => {})
				.catch(is3, reason => reason.message + 'd')
				.catch(isBaz, () => {})
		).to.become('food');
	});
	it('should ignore non-matching pedicates', function () {
		const isBar = (err) => err.message === 'bar';
		const err = new Error('foo');
		return Promise.reject(err)
			.catch(SyntaxError, () => {})
			.catch(isBar, () => {})
			.catch(() => {}, () => {})
			.catch([], () => {})
			.catch([SyntaxError, isBar], () => {})
			.then(shouldNotFulfill, (reason) => {
				expect(reason).to.equal(err)
			});
	});
	it('should not ignore good predicates when a bad pedicate exists', function () {
		return expect(
			Promise.reject(new Error('foo'))
				.catch(() => false, () => {})
				.catch([() => false, err => err.message === 'foo'], () => 'bar')
				.catch(() => false, () => {})
		).to.become('bar');
	});
	it('should catch instances of class predicates', function () {
		return expect(
			Promise.reject(new SyntaxError())
				.catch(Error, () => 3)
		).to.become(3);
	});
	it('should treat non-Error classes as function predicates', function () {
		function BlahError() {
			return false;
		}
		const obj = Object.create(BlahError.prototype);
		return Promise.reject(obj)
			.catch(BlahError, () => 3)
			.then(shouldNotFulfill, (reason) => {
				expect(reason).to.equal(obj);
			});
	});
	describe('should throw if an invalid predicate is used', function () {
		const testInvalidPredicate = (value) => {
			const obj = {};
			return Promise.reject(obj)
				.catch(value, () => {})
				.then(shouldNotFulfill, (reason) => {
					expect(reason).to.not.equal(obj);
					expect(reason).to.be.an.instanceof(TypeError);
				});
		};
		specify('123', function () {
			return testInvalidPredicate(123);
		});
		specify('null', function () {
			return testInvalidPredicate(null);
		});
		specify('undefined', function () {
			return testInvalidPredicate(undefined);
		});
		specify('object', function () {
			return testInvalidPredicate({});
		});
		specify('string', function () {
			return testInvalidPredicate('foo');
		});
		specify('regular expression', function () {
			return testInvalidPredicate(/foo/);
		});
	});
});
