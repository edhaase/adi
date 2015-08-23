'use strict';
var util = require('util');

/**
* Error type for representing a violation of a constant.
* @constructor
* @param {string} name - Value
*/
function ConstantViolationError(name) {
	this.message = util.format('%s is a constant and cannot be changed.', name);
}

util.inherits(ConstantViolationError, Error);

module.exports = ConstantViolationError;