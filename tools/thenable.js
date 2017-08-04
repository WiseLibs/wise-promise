'use strict';

// A generic Thenable class used for testing.
module.exports = class Thenable {
	constructor({ async = 0 } = {}) {
		this._value = undefined;
		this._state = 0;
		this._onFulfilled = [];
		this._onRejected = [];
		this._async = ~~async;
	}
	then(onFulfilled, onRejected) {
		typeof onFulfilled === 'function' && this._onFulfilled.push(onFulfilled);
		typeof onRejected === 'function' && this._onRejected.push(onRejected);
		this._state && this._flush();
	}
	resolve(value) {
		if (!this._state) {
			this._state = 1;
			this._value = value;
			this._flush();
		}
		return this;
	}
	reject(reason) {
		if (!this._state) {
			this._state = -1;
			this._value = reason;
			this._flush();
		}
		return this;
	}
	isDone() {
		return !!this._state;
	}
	_flush() {
		const handlers = this._state === 1 ? this._onFulfilled : this._onRejected;
		this._onFulfilled = [];
		this._onRejected = [];
		if (handlers.length) {
			if (this._async) {
				setTimeout(() => {
					handlers.forEach((fn) => { fn(this._value); });
				}, this._async);
			} else {
				handlers.forEach((fn) => { fn(this._value); });
			}
		}
	}
};
