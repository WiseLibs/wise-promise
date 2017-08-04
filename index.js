'use strict';

require('./lib/promisify');
module.exports = require('./lib/honest-promise');
module.exports.TimeoutError = require('./lib/timeout-error');
