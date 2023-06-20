'use strict';
const Promise = require('../.');
const Thenable = require('./thenable');
const memo = {};

// This tool is used to test promise APIs that accept arrays or iterable
// objects of values or promises/thenables.

// These are the functions used to map source values to input values.
// Each permutation of these options will be tested for a given source array.
// These functions are invoked with a `this` value of a Context object.
const options = [

	// the value itself
	function (i) {
		if (i in this.source) this.input[i] = valueOf(this.source[i]);
		this.description[i] = 'value';
	},

	// a settled promise of the value
	function (i) {
		this.input[i] = promiseOf(this.source[i]).catchLater();
		this.description[i] = 'settled promise';
	},

	// an eventually-settled promise of the value
	function (i) {
		this.input[i] = new Promise((res, rej) => {
			this.afters.push(() => {
				setTimeout(() => {
					resolveWith(res, rej, this.source[i]);
				}, 1);
			});
		});
		this.description[i] = 'eventual promise';
	},

	// an already-settled foreign thenable object
	function (i) {
		const thenable = this.input[i] = new Thenable;
		resolveWith(x => thenable.resolve(x), x => thenable.reject(x), this.source[i]);
		this.description[i] = 'settled thenable';
	},

	// an eventually-settled foreign thenable object
	function (i) {
		const thenable = this.input[i] = new Thenable;
		this.afters.push(() => {
			setTimeout(() => {
				resolveWith(x => thenable.resolve(x), x => thenable.reject(x), this.source[i]);
			}, 1);
		});
		this.description[i] = 'eventual thenable';
	}
];

// This function runs the given test for each possible permutation of the
// given source array. Permutations are created by transforming the source
// array items through different "options" (listed above).
exports.test = (source, test) => {
	let permutations = memo[source.length];

	if (!permutations) {
		memo[source.length] = permutations = permutate(options, source.length);
		// In addition to the standard permutations, we also want to have
		// test cases where every value in the source array is transformed
		// through the same option.
		for (const option of options) {
			const extraTextCase = new Array(source.length);
			for (let i = 0; i < source.length; ++i) {
				extraTextCase[i] = option;
			}
			permutations.push(extraTextCase);
		}
	}

	permutations.forEach((options) => {
		const context = new Context(source);
		for (let i = 0, len = source.length; i < len; ++i) {
			options[i].call(context, i);
		}
		context.doTest(test);
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
		this.input = new Array(source.length);
		this.description = new Array(source.length);
		this.afters = [];
	}
	doTest(test) {
		const ctx = this;
		const indexOfRaceWinner = getRaceWinner(ctx.description);
		specify(`[${ctx.description.join(', ')}]`, function () {
			const ret = test(ctx.input, ctx.source, indexOfRaceWinner);
			ctx.afters.forEach(fn => fn());
			return ret;
		});
	}
}

// This function accepts a description array, and returns the index of the item
// that SHOULD resolve a Promise.race() test.
const getRaceWinner = (description) => {
	const len = description.length;
	for (let i = 0; i < len; ++i) {
		const type = description[i];
		if (type === 'value' || type === 'settled promise') {
			return i;
		}
	}
	for (let i = 0; i < len; ++i) {
		const type = description[i];
		if (type === 'settled thenable') {
			return i;
		}
	}
	for (let i = 0; i < len; ++i) {
		const type = description[i];
		if (type === 'eventual promise' || type === 'eventual thenable') {
			return i;
		}
	}
	throw new Error('No recognized value descriptions found');
};

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
