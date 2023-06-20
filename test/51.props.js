'use strict';
const ObjectTester = require('../tools/object-tester');
const shallowEquals = require('../tools/object-shallow-equals');
const toString = require('../tools/to-string');
require('../tools/describe')('Promise.props', function (Promise, expect) {
	const expectToMatch = (input, source) => {
		return expect(Promise.props(input)).to.eventually.satisfy(shallowEquals(source));
	};

	it('should be fulfilled given an empty object', function () {
		const obj = {};
		return expectToMatch(obj, obj);
	});
	it('should not treat arrays in a special way', function () {
		const array = new Array(3);
		array[1] = 'foo';
		return expectToMatch(array, { 1: 'foo' });
	});
	it('should not treat functions in a special way', function () {
		const fn = () => {};
		fn.foo = 'bar';
		return expectToMatch(fn, { foo: 'bar' });
	});
	it('should not treat null-prototype objects in a special way', function () {
		const obj = Object.create(null);
		obj.foo = 'bar';
		return expectToMatch(obj, { foo: 'bar' });
	});
	it('should only access each enumerable key\'s value once', function () {
		const obj = {};
		let fooValue = 3;
		Object.defineProperties(obj, {
			foo: {
				get: () => fooValue++,
				enumerable: true,
				configerable: false
			},
			bar: {
				get: () => { throw new Error('Should not access non-enumerable properties'); },
				enumerable: false,
				configerable: false
			}
		});
		return Promise.props(obj).then((result) => {
			expect(result).to.satisfy(shallowEquals({ foo: 3 }));
			expect(fooValue).to.equal(4);
		});
	});
	it('should accept arbitrary subclasses of Object', function () {
		function Ignore() {}
		Ignore.prototype.quux = 'ignore me';

		function Foo() { this.bar = 'baz'; }
		Object.setPrototypeOf(Foo.prototype, Ignore.prototype);
		Foo.prototype.thud = 'also ignored';

		return expectToMatch(new Foo, { bar: 'baz' });
	});
	describe('should be rejected on invalid input', function () {
		const testInvalidInput = (value) => {
			specify('given: ' + toString(value), function () {
				return expect(Promise.props(value)).to.be.rejectedWith(TypeError);
			});
		};
		testInvalidInput(undefined);
		testInvalidInput(null);
		testInvalidInput(0);
		testInvalidInput(123);
		testInvalidInput(NaN);
		testInvalidInput(Infinity);
		testInvalidInput(true);
		testInvalidInput(false);
		testInvalidInput('foo');
		testInvalidInput(Symbol());
	});
	describe('should be fulfilled with an object of matching enumerable key-value pairs', function () {
		const irrelevantPromise = Promise.reject(new Error('baz')).catchLater();
		ObjectTester.test({ foo: [irrelevantPromise], bar: 123 }, expectToMatch);
	});
	describe('should not be affected by changing the input object after invocation', function () {
		ObjectTester.test({ foo: 'bar', '': 'baz' }, (input, source) => {
			const ret = Promise.props(input);
			input.foo = 'quux';
			delete input[''];
			return expect(ret).to.eventually.satisfy(shallowEquals({ foo: 'bar', '': 'baz' }));
		});
	});
	describe('should be rejected with the rejection reason of a rejected promise', function () {
		const err = new Error('baz');
		ObjectTester.test({ a: 123, b: ObjectTester.reject(err) }, (input, source) => {
			return expect(Promise.props(input)).to.be.rejectedWith(err);
		});
	});
	describe('should be rejected by the earliest rejected promise', function () {
		const shouldBeRejected = () => {
			throw new Error('This promise should have been rejected');
		};
		const errors = { foo: new Error('baz'), bar: new Error('quux') };
		ObjectTester.test({ foo: ObjectTester.reject(errors.foo), bar: ObjectTester.reject(errors.bar) }, (input, source, raceWinners) => {
			return Promise.props(input).then(shouldBeRejected, (reason) => {
				for (const key of raceWinners) {
					if (reason === errors[key]) return;
				}
				throw new Error('None of the potential race winners were the rejection reason');
			});
		});
	});
});
