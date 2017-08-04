'use strict';
const toString = require('../tools/to-string');
require('../tools/describe')('Promise.isPromise', function (Promise, expect) {
	const falseWhenGiven = (value, string) => {
		specify('given: ' + (string || toString(value)), function () {
			expect(Promise.isPromise(value)).to.be.false;
		});
	};
	const trueWhenGiven = (value, string) => {
		specify('given: ' + (string || toString(value)), function () {
			expect(Promise.isPromise(value)).to.be.true;
		});
	};
	
	it('should throw when accessing .then throws', function () {
		expect(() => {
			Promise.isPromise({ get then() { throw new RangeError('foo'); } });
		}).to.throw(RangeError);
	});
	describe('should return false when', function () {
		falseWhenGiven(undefined);
		falseWhenGiven(null);
		falseWhenGiven(0);
		falseWhenGiven(123);
		falseWhenGiven(NaN);
		falseWhenGiven(Infinity);
		falseWhenGiven(true);
		falseWhenGiven(false);
		falseWhenGiven('foo');
		falseWhenGiven({}, '{}');
		falseWhenGiven([]);
		falseWhenGiven(function then() {});
		falseWhenGiven({ then: true }, '{ then: true }');
		falseWhenGiven({ then: { name: 'then' } }, '{ then: { name: "then" } }');
		falseWhenGiven({ then: Object.create(Function.prototype) }, '{ then: Object.create(Function.prototype) }');
		falseWhenGiven({ Then: () => {} }, '{ Then: () => {} }');
		falseWhenGiven({ THEN: () => {} }, '{ THEN: () => {} }');
		falseWhenGiven({ 'then ': () => {} }, '{ "then ": () => {} }');
		
		specify('given: "foo" with String.prototype.then', function () {
			const thenInString = 'then' in String.prototype;
			const originalStringThen = String.prototype.then;
			String.prototype.then = () => {};
			try {
				expect(Promise.isPromise('foo')).to.be.false;
			} finally {
				if (thenInString) {
					String.prototype.then = originalStringThen;
				} else {
					delete String.prototype.then;
				}
			}
		});
		
		const fn = () => {};
		fn.then = {};
		falseWhenGiven(fn, '(() => {}).then = {}');
		
		falseWhenGiven(Symbol());
		falseWhenGiven({ then: Symbol() }, '{ then: Symbol() }');
	});
	describe('should return true when', function () {
		const unnamedFunction = () => {};
		trueWhenGiven({ then: unnamedFunction }, '{ then: () => {} }');
		
		const nullObject = Object.create(null);
		nullObject.then = () => {};
		trueWhenGiven(nullObject, 'Object.create(null).then = () => {}');
		
		const fn = () => {};
		fn.then = () => {};
		trueWhenGiven(fn, '(() => {}).then = () => {}');
	});
});
