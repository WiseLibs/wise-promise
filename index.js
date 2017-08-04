'use strict';
const conditionalCatch = Symbol();
const noException = Symbol();
const hasOwnProperty = Object.prototype.hasOwnProperty;

class HonestPromise extends Promise {
	
	static any(iterable) {
		return new HonestPromise((resolve, reject) => {
			if (iterable == null || typeof iterable[Symbol.iterator] !== 'function') {
				throw new TypeError('Expected argument to be an iterable object');
			}
			let firstException = noException;
			let pendings = 0;
			const fail = (reason) => {
				if (firstException === noException) firstException = reason;
				if (--pendings === 0) reject(firstException);
			};
			for (const value of iterable) {
				pendings += 1;
				HonestPromise.resolve(value).then(resolve, fail);
			}
			pendings || reject(new RangeError('The iterable argument contained no items'));
		});
	}
	
	static props(obj) {
		return new HonestPromise((resolve, reject) => {
			if (obj == null || (typeof obj !== 'object' && typeof obj !== 'function')) {
				throw new TypeError('Expected argument to be an object');
			}
			let pendings = 0;
			const result = {};
			const resolveItem = (key) => (value) => {
				result[key] = value;
				if (--pendings === 0) resolve(result);
			};
			for (const key in obj) {
				if (hasOwnProperty.call(obj, key)) {
					const value = obj[key];
					if (HonestPromise.isPromise(value)) {
						pendings += 1;
						HonestPromise.resolve(value).then(resolveItem(key), reject);
					} else {
						result[key] = value;
					}
				}
			}
			pendings || resolve(result);
		});
	}
	
	static settle(iterable) {
		return new HonestPromise((resolve) => {
			if (iterable == null || typeof iterable[Symbol.iterator] !== 'function') {
				throw new TypeError('Expected argument to be an iterable object');
			}
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
				HonestPromise.resolve(value).then(resolveItem(pendings), rejectItem(pendings));
				pendings += 1;
			}
			pendings ? (result.length = pendings) : resolve(result);
		});
	}
	
	static after(ms, value) {
		if (HonestPromise.isPromise(value)) value.then(undefined, () => {});
		return new HonestPromise((resolve) => {
			setTimeout(() => resolve(value), ~~ms);
		});
	}
	
	static isPromise(value) {
		return value != null
			&& (typeof value === 'object' || typeof value === 'function')
			&& typeof value.then === 'function';
	}
	
	static promisify(fn, options) {
		
	}
	
	static nodeify(fn) {
		
	}
	
	catch(predicate, handler) {
		if (arguments.length === 1) return this.then(undefined, predicate);
		if (typeof handler !== 'function') return this.then();
		return this[conditionalCatch](predicate, handler);
	}
	
	catchLater() {
		this.then(undefined, () => {});
		return this;
	}
	
	finally(handler) {
		if (typeof handler !== 'function') return this.then();
		return this.then((value) => {
			const ret = handler();
			return HonestPromise.isPromise(ret) ? HonestPromise.resolve(ret).then(() => value) : value;
		}, (reason) => {
			const ret = handler();
			if (HonestPromise.isPromise(ret)) return HonestPromise.resolve(ret).then(() => { throw reason });
			throw reason;
		});
	}
	
	tap(handler) {
		if (typeof handler !== 'function') return this.then();
		return this.then((value) => {
			const ret = handler();
			return HonestPromise.isPromise(ret) ? HonestPromise.resolve(ret).then(() => value) : value;
		});
	}
	
	tapError(handler) {
		if (typeof handler !== 'function') return this.then();
		return this.then(undefined, (reason) => {
			const ret = handler();
			if (HonestPromise.isPromise(ret)) return HonestPromise.resolve(ret).then(() => { throw reason });
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
		return this.then(value => HonestPromise.after(ms, value));
	}
	
	timeout(ms, reason) {
		return new HonestPromise((resolve, reject) => {
			this.then(
				(value) => { clearTimeout(timer); resolve(value); },
				(reason) => { clearTimeout(timer); reject(reason); }
			);
			const timer = setTimeout(() => reject(
				arguments.length === 1 ? new TimeoutError(`The operation timed out after ${~~ms > 0 ? ~~ms : 0}ms`)
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

class TimeoutError extends Error {}
TimeoutError.prototype.name = 'TimeoutError';

module.exports = HonestPromise;
module.exports.TimeoutError = TimeoutError;
