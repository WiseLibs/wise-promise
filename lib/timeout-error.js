'use strict';

class TimeoutError extends Error {}
TimeoutError.prototype.name = 'TimeoutError';

module.exports = TimeoutError;
