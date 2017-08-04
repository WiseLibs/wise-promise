'use strict';
const conditionalCatch = Symbol();

class HonestPromise extends Promise {
	
	static any(iterable) {
		
	}
	
	static props(obj) {
		
	}
	
	static settle(iterable) {
		
	}
	
	static after(ms, value) {
		
	}
	
	static isPromise(value) {
		
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
	
	rollback(handler) {
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
