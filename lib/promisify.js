'use strict';
const WisePromise = require('./wise-promise');

WisePromise.promisify = (fn, { deoptimize = false, multiArgs = false } = {}) => {
	if (typeof fn !== 'function') throw new TypeError('Expected argument to be a function');
	const likelyArgCount = deoptimize ? 0 : Math.max(0, Math.min(1024, fn.length) - 1) || 0;
	const minArgCount = deoptimize ? 0 : Math.max(0, likelyArgCount - 3);
	const maxArgCount = deoptimize ? 127 : Math.max(3, likelyArgCount);
	const argGuesses = [likelyArgCount];
	for (let i = likelyArgCount - 1; i >= minArgCount; --i) argGuesses.push(i);
	for (let i = likelyArgCount + 1; i <= maxArgCount; ++i) argGuesses.push(i);
	const body = `'use strict';
return function promisified(${generateArgumentList(maxArgCount).join(', ')}) {
	return new WisePromise((resolve, reject) => {
		const cb = (err, ${multiArgs ? '...' : ''}val) => err ? reject(err) : resolve(val);
		switch (arguments.length) {
			${argGuesses.map(generateSwitchCase).join('\n\t\t\t')}
			default: fn.call(this, ...arguments, cb);
		}
	});
};`;
	return new Function(['WisePromise', 'fn'], body)(WisePromise, fn);
};

WisePromise.nodeify = (fn) => {
	if (typeof fn !== 'function') throw new TypeError('Expected argument to be a function');
	return function nodeified() {
		if (arguments.length === 0) {
			fn.call(this);
			return this;
		}
		const cb = arguments[arguments.length - 1];
		if (typeof cb !== 'function') {
			fn.apply(this, arguments);
			return this;
		}
		const args = [...arguments];
		args.length -= 1;
		WisePromise.resolve(fn.apply(this, args)).then((value) => {
			cb(null, value);
		}, (reason) => {
			cb(reason || new Error(reason));
		});
		return this;
	};
};

const generateArgumentList = (count) => {
	const args = new Array(count);
	for (let i = 0; i < count; ++i) args[i] = 'a_' + i;
	return args;
};

const generateSwitchCase = (guess) => {
	return `case ${guess}: fn.call(${['this', ...generateArgumentList(guess), 'cb'].join(', ')}); break;`;
};
