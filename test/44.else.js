'use strict';
require('../tools/describe')('.else', function (Promise, expect) {
	describe('should return a new promise', function () {
		specify('when 0 arguments are supplied', function () {
			const p = Promise.resolve(5);
			return expect(p.else()).to.be.an.instanceof(Promise).and.not.equal(p);
		});
		specify('when 1 argument is supplied', function () {
			const p = Promise.resolve(5);
			return expect(p.else('foo')).to.be.an.instanceof(Promise).and.not.equal(p);
		});
		specify('when 2 arguments are supplied', function () {
			const p = Promise.resolve(5);
			return expect(p.else(() => true, 'foo')).to.be.an.instanceof(Promise).and.not.equal(p);
		});
	});
	describe('should not catch fulfilled promises', function () {
		specify('when 0 arguments are supplied', function () {
			const err = new Error('foo');
			return expect(
				Promise.resolve(err).else()
			).to.eventually.equal(err);
		});
		specify('when 1 argument is supplied', function () {
			const err = new Error('foo');
			return expect(
				Promise.resolve(err).else('bar')
			).to.eventually.equal(err);
		});
		specify('when 2 arguments are supplied', function () {
			const err = new Error('foo');
			return expect(
				Promise.resolve(err).else(Error, 'bar')
			).to.eventually.equal(err);
		});
		specify('when an array of predicates are supplied', function () {
			const err = new Error('foo');
			return expect(
				Promise.resolve(err).else([() => true, Error], 'bar')
			).to.eventually.equal(err);
		});
	});
	it('should provide default values for rejected promises', function () {
		return expect(
			Promise.reject(44).else(9)
		).to.become(9);
	});
	it('should accept class pedicates for conditional catching', function () {
		return expect(
			Promise.reject(new SyntaxError('foo'))
				.else([TypeError, RangeError], 'bar')
				.else([URIError, SyntaxError], 'quux')
				.else([TypeError, RangeError], 'bar')
		).to.become('quux');
	});
	it('should accept function pedicates for conditional catching', function () {
		const isBar = (err) => err.message === 'bar';
		const isBaz = (err) => err.message === 'baz';
		const is5 = (err) => err.message.length === 5;
		const is3 = (err) => err.message.length === 3;
		return expect(
			Promise.reject(new Error('foo'))
				.else(isBaz, 'wrong')
				.else([isBar, is5], 'wrong')
				.else(is3, 'right')
				.else(isBaz, 'wrong')
		).to.become('right');
	});
	it('should ignore non-matching pedicates', function () {
		const isBar = (err) => err.message === 'bar';
		const err = new Error('foo');
		return expect(Promise.reject(err)
			.else(SyntaxError, 'quux')
			.else(isBar, 'quux')
			.else(() => {}, 'quux')
			.else([], () => {})
			.else([SyntaxError, isBar], () => {})
		).to.be.rejectedWith(err);
	});
	it('should not ignore good predicates when a bad pedicate exists', function () {
		return expect(
			Promise.reject(new Error('foo'))
				.else(() => false, 'quux')
				.else([() => false, err => err.message === 'foo'], 'bar')
				.else(() => false, 'quux')
		).to.become('bar');
	});
	it('should catch instances of class predicates', function () {
		return expect(
			Promise.reject(new SyntaxError()).else(Error, 3)
		).to.become(3);
	});
	it('should treat non-Error classes as function predicates', function () {
		function BlahError() {
			return false;
		}
		const obj = Object.create(BlahError.prototype);
		return Promise.reject(obj)
			.else(BlahError, 3)
			.then(() => {
				throw new Error('This promise should not have been fulfilled');
			}, (reason) => {
				expect(reason).to.equal(obj);
			});
	});
	describe('should throw if an invalid predicate is used', function () {
		const testInvalidPredicate = (value) => {
			const obj = {};
			return Promise.reject(obj)
				.else(value, 'foobar')
				.then(() => {
					throw new Error('This promise should not have been fulfilled');
				}, (reason) => {
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
