'use strict';
const Promise = require('../.');
const Thenable = require('./thenable');
const memo = {};

// This class is used to test Promise.props, which accepts an object whose iterable
// keys are values or promises/thenables.

// These are the functions used to map source values to input values.
// Each permutation of these options will be tested for a given source object.
// These functions are invoked with a `this` value of a Context object.
const options = [

	// the value itself
	function (key, i) {
		this.input[key] = valueOf(this.source[key]);
		this.description[i] = 'value';
	},

	// a settled promise of the value
	function (key, i) {
		this.input[key] = promiseOf(this.source[key]).catchLater();
		this.description[i] = 'settled promise';
	},

	// an eventually-settled promise of the value
	function (key, i) {
		this.input[key] = new Promise((res, rej) => {
			this.afters.push(() => {
				setTimeout(() => {
					resolveWith(res, rej, this.source[key]);
				}, 1);
			});
		});
		this.description[i] = 'eventual promise';
	},

	// a foreign thenable object that synchronously delivers the value
	function (key, i) {
		const thenable = this.input[key] = new Thenable;
		resolveWith(x => thenable.resolve(x), x => thenable.reject(x), this.source[key]);
		this.description[i] = 'settled thenable';
	},

	// a foreign thenable object that asynchronously delivers the value
	function (key, i) {
		const thenable = this.input[key] = new Thenable;
		this.afters.push(() => {
			setTimeout(() => {
				resolveWith(x => thenable.resolve(x), x => thenable.reject(x), this.source[key]);
			}, 1);
		});
		this.description[i] = 'eventual thenable';
	}
];

// This function runs the given test for each possible permutation of the
// given source object. Permutations are created by transforming the source
// object's items through different "options" (listed above).
exports.test = (source, test) => {
	const keys = Object.keys(source);
	let permutations = memo[keys.length];

	if (!permutations) {
		memo[keys.length] = permutations = permutate(options, keys.length)
		// In addition to the standard permutations, we also want to have
		// test cases where every value in the source object is transformed
		// through the same option.
		for (const option of options) {
			const extraTextCase = new Array(keys.length);
			for (let i = 0; i < keys.length; ++i) {
				extraTextCase[i] = option;
			}
			permutations.push(extraTextCase);
		}
	}

	permutations.forEach((options) => {
		const context = new Context(source);
		for (let i = 0, len = keys.length; i < len; ++i) {
			options[i].call(context, keys[i], i);
		}
		context.doTest(test, keys);
	});
};

// Used to communicate that a certain source value should be a rejected promise.
class Rejected {
	constructor(value) {
		this.value = value;
	}
}
exports.reject = value => new Rejected(value);

const valueOf = value => value instanceof Rejected ? Promise.reject(value.value).catchLater() : value;
const promiseOf = value => value instanceof Rejected ? Promise.reject(value.value).catchLater() : Promise.resolve(value);
const resolveWith = (res, rej, value) => value instanceof Rejected ? rej(value.value) : res(value);

// Objects of this class are used to store information required to build a
// single test case.
class Context {
	constructor(source) {
		this.source = source;
		this.input = {};
		this.description = new Array(Object.keys(source).length);
		this.afters = [];
	}
	doTest(test, keys) {
		const ctx = this;
		const keysOfRaceWinners = getRaceWinners(ctx.description, keys);
		specify(`{ ${ctx.description.join(', ')} }`, function () {
			const ret = test(ctx.input, ctx.source, keysOfRaceWinners);
			ctx.afters.forEach(fn => fn());
			return ret;
		});
	}
}

// This function accepts a description array, and an array of matching keys, and
// returns an array of keys that COULD win a race.
const getRaceWinners = (description, keys) => {
	const winners = [];
	const len = description.length;
	for (let i = 0; i < len; ++i) {
		const type = description[i];
		if (type === 'value' || type === 'settled promise') {
			winners.push(keys[i]);
		}
	}
	if (winners.length) {
		return winners;
	}
	for (let i = 0; i < len; ++i) {
		const type = description[i];
		if (type === 'settled thenable') {
			winners.push(keys[i]);
		}
	}
	if (winners.length) {
		return winners;
	}
	for (let i = 0; i < len; ++i) {
		const type = description[i];
		if (type === 'eventual promise' || type === 'eventual thenable') {
			winners.push(keys[i]);
		}
	}
	if (winners.length) {
		return winners;
	}
	throw new Error('No recognized value descriptions found');
}

const permutate = (inputArr, resultLength) => {
	const results = [];

	const permute = (arr, memo = []) => {
		let cur;

		for (let i = 0; i < arr.length; ++i) {
			cur = arr.splice(i, 1);
			if (memo.length === resultLength - 1) {
				results.push(memo.concat(cur));
			}
			permute(arr.slice(), memo.concat(cur));
			arr.splice(i, 0, cur[0]);
		}

		return results;
	};

	return permute(inputArr);
};
