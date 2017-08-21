'use strict';
const NativePromise = Promise;
require('../tools/describe')('Compatibility with timing', function (Promise, expect) {
	describe('should cast native promises synchronously, without treating them as foreign', function () {
		const direct = (arg) => (write) => write(NativePromise.resolve(arg));
		const indirect = (arg) => (write) => NativePromise.resolve(arg).then(write);
		[
			[direct, direct, direct],
			[indirect, direct, direct],
			[direct, indirect, direct],
			[direct, direct, indirect],
			[indirect, indirect, direct],
			[indirect, direct, indirect],
			[direct, indirect, indirect],
			[indirect, indirect, indirect]
		].forEach((styles) => {
			specify(styles.map(fn => fn.name).join(', '), function () {
				let str = '';
				const write = (value) => {
					if (!Promise.isPromise(value)) str = str + value;
					else return Promise.resolve(value).then(value => str = str + value);
				};
				const promises = ['a', 'b', 'c'].map((x, i) => styles[i](x)).map(writer => writer(write));
				return expect(NativePromise.all(promises).then(() => str)).to.become('abc');
			});
		});
	});
});
