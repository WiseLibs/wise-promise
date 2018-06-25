'use strict';

require('./lib/promisify');
module.exports = require('./lib/wise-promise');
module.exports.TimeoutError = require('./lib/timeout-error');
