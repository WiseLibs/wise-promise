'use strict';
const Promise = require('../.');
const expect = require('chai').expect;
require('chai').use(require('chai-as-promised'));

module.exports = (description, fn) => {
	describe(description, function () {
		return fn.call(this, Promise, expect);
	});
};
