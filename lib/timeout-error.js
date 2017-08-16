'use strict';
const descriptor = { writable: true, enumerable: false, configurable: true, value: 'TimeoutError' };

function TimeoutError(message) {
	if (new.target !== TimeoutError) return new TimeoutError(message);
	Error.call(this, message);
	descriptor.value = '' + message;
	Object.defineProperty(this, 'message', descriptor);
	Error.captureStackTrace(this, TimeoutError);
}
Object.setPrototypeOf(TimeoutError.prototype, Error.prototype);
Object.defineProperty(TimeoutError.prototype, 'name', descriptor);

module.exports = TimeoutError;
