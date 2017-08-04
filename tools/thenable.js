'use strict'

// A generic Thenable class used for testing.
function Thenable(options) {
	this._value = undefined
	this._state = 0
	this._onFulfilled = []
	this._onRejected = []
	this._async = !!options && ~~options.async
}
Thenable.prototype.then = function (onFulfilled, onRejected) {
	typeof onFulfilled === 'function' && this._onFulfilled.push(onFulfilled)
	typeof onRejected === 'function' && this._onRejected.push(onRejected)
	this._state && this._flush()
}
Thenable.prototype.resolve = function (value) {
	if (!this._state) {
		this._state = 1
		this._value = value
		this._flush()
	}
	return this
}
Thenable.prototype.reject = function (reason) {
	if (!this._state) {
		this._state = -1
		this._value = reason
		this._flush()
	}
	return this
}
Thenable.prototype.isDone = function () {
	return !!this._state
}
Thenable.prototype._flush = function () {
	var handlers = this._state === 1 ? this._onFulfilled : this._onRejected
	this._onFulfilled = []
	this._onRejected = []
	if (handlers.length) {
		var value = this._value
		if (this._async) {
			setTimeout(function ()  {
				handlers.forEach(function (fn) {fn(value)})
			}, this._async)
		} else {
			handlers.forEach(function (fn) {fn(value)})
		}
	}
}
module.exports = Thenable
