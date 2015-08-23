'use strict';
var util = require('util');

/**
* Error type for representing a circular dependency.
* @constructor
* @param {string} name - Provider name
* @param {array} chain - The current resolution chain.
*/
function CircularDependencyError(name, chain) {
	this.chain = chain;
	this.message = util.format("CircularDependencyError on %s", name);
}

util.inherits(CircularDependencyError, Error);

module.exports = CircularDependencyError;