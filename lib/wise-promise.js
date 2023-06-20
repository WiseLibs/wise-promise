'use strict';
const TimeoutError = require('./timeout-error');
const hasOwnProperty = Object.prototype.hasOwnProperty;
const conditionalCatch = Symbol();
const noException = Symbol();

class WisePromise extends Promise {

	static get [Symbol.species]() {
		return WisePromise;
	}

	static resolve(value) {
		return super.resolve.call(WisePromise, value);
	}

	static reject(reason) {
		return super.reject.call(WisePromise, reason);
	}

	static all(iterable) {
		if (notIterable(iterable)) return WisePromise.reject(new TypeError('Expected argument to be an iterable object'));
		return super.all.call(WisePromise, iterable);
	}

	static race(iterable) {
		if (notIterable(iterable)) return WisePromise.reject(new TypeError('Expected argument to be an iterable object'));
		return super.race.call(WisePromise, iterable);
	}

	static any(iterable) {
		return new WisePromise((resolve, reject) => {
			if (notIterable(iterable)) throw new TypeError('Expected argument to be an iterable object');
			let firstException = noException;
			let pendings = 0;
			const fail = (reason) => {
				if (firstException === noException) firstException = reason;
				if (--pendings === 0) reject(firstException);
			};
			for (const value of iterable) {
				pendings += 1;
				WisePromise.resolve(value).then(resolve, fail);
			}
			pendings || reject(new RangeError('The iterable argument contained no items'));
		});
	}

	static settle(iterable) {
		return new WisePromise((resolve) => {
			if (notIterable(iterable)) throw new TypeError('Expected argument to be an iterable object');
			let pendings = 0;
			const result = [];
			const resolveItem = (i) => (value) => {
				result[i] = { state: 'fulfilled', value };
				if (--pendings === 0) resolve(result);
			};
			const rejectItem = (i) => (reason) => {
				result[i] = { state: 'rejected', reason };
				if (--pendings === 0) resolve(result);
			};
			for (const value of iterable) {
				WisePromise.resolve(value).then(resolveItem(pendings), rejectItem(pendings));
				pendings += 1;
			}
			pendings ? (result.length = pendings) : resolve(result);
		});
	}

	static props(obj) {
		return new WisePromise((resolve, reject) => {
			if (!isObject(obj)) throw new TypeError('Expected argument to be an object');
			let pendings = 0;
			const result = {};
			const resolveItem = (key) => (value) => {
				result[key] = value;
				if (--pendings === 0) resolve(result);
			};
			for (const key in obj) {
				if (hasOwnProperty.call(obj, key)) {
					const value = obj[key];
					if (WisePromise.isPromise(value)) {
						pendings += 1;
						WisePromise.resolve(value).then(resolveItem(key), reject);
					} else {
						result[key] = value;
					}
				}
			}
			pendings || resolve(result);
		});
	}

	static after(ms, value) {
		return new WisePromise((resolve) => {
			if (WisePromise.isPromise(value)) {
				value = WisePromise.resolve(value);
				value.then(undefined, noop);
			}
			setTimeout(() => resolve(value), ~~ms);
		});
	}

	static isPromise(value) {
		return isObject(value) && typeof value.then === 'function';
	}

	catch(predicate, handler) {
		if (arguments.length === 1) return this.then(undefined, predicate);
		if (typeof handler !== 'function') return this.then();
		return this[conditionalCatch](predicate, handler);
	}

	catchLater() {
		this.then(undefined, noop);
		return this;
	}

	finally(handler) {
		if (typeof handler !== 'function') return this.then();
		return this.then((value) => {
			const ret = handler();
			return WisePromise.isPromise(ret) ? WisePromise.resolve(ret).then(() => value) : value;
		}, (reason) => {
			const ret = handler();
			if (WisePromise.isPromise(ret)) return WisePromise.resolve(ret).then(() => { throw reason });
			throw reason;
		});
	}

	tap(handler) {
		if (typeof handler !== 'function') return this.then();
		return this.then((value) => {
			const ret = handler(value);
			return WisePromise.isPromise(ret) ? WisePromise.resolve(ret).then(() => value) : value;
		});
	}

	tapError(handler) {
		if (typeof handler !== 'function') return this.then();
		return this.then(undefined, (reason) => {
			const ret = handler(reason);
			if (WisePromise.isPromise(ret)) return WisePromise.resolve(ret).then(() => { throw reason });
			throw reason;
		});
	}

	become(fulfilledValue, rejectedValue) {
		return this.then(() => fulfilledValue, arguments.length > 1 ? () => rejectedValue : undefined);
	}

	else(predicate, value) {
		if (arguments.length === 1) return this.then(undefined, () => predicate);
		return this[conditionalCatch](predicate, () => value);
	}

	delay(ms) {
		return this.then(value => WisePromise.after(ms, value));
	}

	timeout(ms, reason) {
		return new WisePromise((resolve, reject) => {
			this.then(
				(value) => { clearTimeout(timer); resolve(value); },
				(reason) => { clearTimeout(timer); reject(reason); }
			);
			const timer = setTimeout(() => reject(
				reason == null ? new TimeoutError(`The operation timed out after ${~~ms > 0 ? ~~ms : 0}ms`)
				: reason instanceof Error ? reason : new TimeoutError(String(reason))
			), ~~ms);
		});
	}

	log(prefix) {
		return this.then((value) => {
			if (arguments.length) console.log(prefix, '<fulfilled>', value);
			else console.log('<fulfilled>', value);
			return value;
		}, (reason) => {
			if (arguments.length) console.log(prefix, '<rejected>', reason);
			else console.log('<rejected>', reason);
			throw reason;
		});
	}

	[conditionalCatch](predicate, handler) {
		return this.then(undefined, (reason) => {
			if (Array.isArray(predicate)) {
				for (const p of predicate) {
					if (catchesError(p, reason)) return handler(reason);
				}
			} else if (catchesError(predicate, reason)) {
				return handler(reason);
			}
			throw reason;
		});
	}
}

const catchesError = (predicate, reason) => {
	if (typeof predicate === 'function') {
		if (predicate === Error || predicate.prototype instanceof Error) {
			return reason instanceof predicate;
		}
		return !!predicate(reason);
	}
	throw new TypeError('The predicate passed to .catch/else() is invalid');
};

const notIterable = x => x == null || typeof x[Symbol.iterator] !== 'function';
const isObject = x => x != null && (typeof x === 'object' || typeof x === 'function');
const noop = () => {};

module.exports = WisePromise;
