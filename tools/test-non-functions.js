'use strict';
const toString = require('./to-string');

// This function runs the given test several times, once for each possible
// non-function value. Each non-function value is passed as the first argument
// to the given test function.
module.exports = (test) => {
	const testInput = (value) => {
		specify('given: ' + toString(value), function () {
			return test(value);
		});
	};

	testInput(undefined);
	testInput(null);
	testInput(0);
	testInput(123);
	testInput(NaN);
	testInput(Infinity);
	testInput(true);
	testInput(false);
	testInput('foo');
	testInput({});
	testInput([]);
	testInput(Symbol());

	const fakeFunction = Object.create(Function.prototype);
	fakeFunction.toString = () => 'Object.create(Function.prototype)';
	testInput(fakeFunction);
};
