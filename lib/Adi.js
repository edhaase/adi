'use strict';
var CircularDependencyError = require('./CircularDependencyError'),
	ConstantViolationError = require('./ConstantViolationError'),
	params = require('./param'),
	util = require('util');

/**
* Adi dependency injection constructor
* @constructor
* @param {object} [opts] - Options
* @author Edward Haase
*/
function Adi(opts) {	
	if(!(this instanceof Adi))
		return new Adi(opts);
		
	if(!opts)
		opts = { enumerable: true };
		
	Object.defineProperty(this, 'opts', defaultDescriptor(opts));
	Object.defineProperty(this, '$adi', defaultDescriptor(this));
	// Injector chain, for detecting circular dependency.
	this.chain = [];	
	this.runblocks = [];
	
	return this;
}

Adi.prototype.CircularDependencyError = require('./CircularDependencyError');
Adi.prototype.ConstantViolationError = require('./ConstantViolationError');

/**
* Invoke a function and inject dependencies.
* @param {function} fn - Function to invoke
* @param {object} ctx - Context or 'This' object for function.
* @returns function result
*/
Adi.prototype.invoke = function invoke(fn, ctx) {	
	var expected = params(fn);	
	return fn.apply(ctx, this.resolve(expected));		
};

/**
* Registers a function. Call again with no arguments to invoke all registered functions.
* @param {function} fn - Function to invoke.
* @param {object} [ctx] - Optional 'this' value to set for function.
* @returns this (for chaining)
* @example 
* // register a function
* adi.run(function(someService, someFactory, someConstant) {
* 
* });
* @example
* // run all registered
* adi.run();
*/
Adi.prototype.run = function run(fn, ctx) {
	
	if(arguments.length === 0) {
		// this.invoke(fn, ctx);
		while(this.runblocks.length > 0) {
			var block = this.runblocks.shift();
			this.invoke(block, ctx); // || {});
		}
	} else
		this.runblocks.push(fn);
	return this;
};

/**
* Registers a factory, executed during resolve.
* If singleton is true, the returned object replaces the factory.
* Otherwise the supplied function remains and is called
* each time injection occurs.
*
* @param {string} name - Name of the factory. Required for lookup.
* @param {function} fn - Function to invoke during resolution. 
* @param {boolean} [singleton] - Desiginate the factory as a singleton. Optional. Defaults to true.
* // Factory singleton, invoked once. Return value replaces factory.
* adi.service('someServiceName', function(anotherService, aFactory, someConstantValue) {
*	return whatever;
* });
* @example
* // Non-singleton service, instantiated on each injection.
* adi.service('someServiceName', function(anotherService, aFactory, someConstantValue) {
*
* }, false);
*/
Adi.prototype.factory = function factory(name, fn, singleton) {	
	this.def(name)({
		configurable: (singleton===true)?false:true,
		enumerable: this.opts.enumerable,
		get: function() {
			if(this.chain.indexOf(name) > -1)
				throw new CircularDependencyError(name, this.chain);
				
			try {
				this.chain.push(name);				
				var result = this.invoke(fn, {});
				if(singleton!==false)
					this.constant(name, result, false); 
				return result;
			} finally {
				this.chain.pop();
			}
		}	
	});	
	return this;
};

/**
* Registers a service, instantiated during resolve.
* If singleton is true, the returned object replaces the service.
* Otherwise the supplied constructer remains and a new instance is
* created at each injection.
*
* @param {string} name - Name of the service. Required for lookup.
* @param {function} fn - Constructor to apply. 
* @param {boolean} [singleton] - Desiginate the service as a singleton. Optional. Defaults to true.
* @example
* // Service singleton, instantiated once.
* adi.service('someServiceName', function(anotherService, aFactory, someConstantValue) {
*	this.x = 42;
* });
* @example
* // Non-singleton service, instantiated on each injection.
* adi.service('someServiceName', function(anotherService, aFactory, someConstantValue) {
*
* }, false);
*/
Adi.prototype.service = function service(name, constructor, singleton) {
	if(!constructor.prototype)
		throw new Error("Constructor has no prototype");
		
	return this.factory(name, function() {
		var expected = params(constructor);	
		var f = Object.create(constructor.prototype);
		constructor.apply(f, this.resolve(expected));
		return f;
	}.bind(this), singleton);
};


/**
* Registers a value. Equivalant to adi[name] = value;
* @param {string} name - Name of the value. Required for lookup.
* @param value - Value to set.
* @example adi.value('someValue', 32);
* @example adi.value('anotherValue', 'Boring string literal');
*/
Adi.prototype.value = function value(name, val) {	
	this.def(name)({
		configurable: true,
		writable: true,
		value: val,
		enumerable: this.opts.enumerable
	});	
	return this;
};

/**
* <p>Registers a constant, disallowing changes. If opts.strictConstants is false,
* then constant will only throw error in strict mode ('use strict'). If opts.strictConstants
* is true, a setter will be defined which throws an error on attempt to modify.</p>
*
* <p>Note, a constant defined this way only prevents itself from being changed. If you supply an object
* as the constant, it's properties will still be modifiable unless you specify you want the object frozen.</p>
* 
* <p>You could call Object.freeze yourself or you can let this method take care of it for you.</p>
*
* @param {string} name - Name of the value. Required for lookup.
* @param value - Value to set.
* @param {boolean} [freeze] - Invoke Object.freeze on supplied object (Does nothing if not an object).
* @example adi.constant('someConstant', 5);
* @example adi.constant('anotherConstant', anObject, true);
*/
Adi.prototype.constant = function constant(name, value, freeze) {
	if(typeof(value)==='object') {		
		if(freeze === undefined) {
			if(this.opts.freeze)
				value = Object.freeze(value);
		} else if(freeze) {
			value = Object.freeze(value);
		}
	}
	
	// If we don't supply a setter, won't it fail anyways?
	if(this.opts.strictConstants) {
		Object.defineProperty(this, name, {
			// __proto__: null,
			get: function() { return value; },
			set: function() { 
				throw new ConstantViolationError(name);
			},
			enumerable: this.opts.enumerable,
			configurable: false
		});
	} else {
		// Only throws error in strict mode.
		Object.defineProperty(this, name, {
			value: value,
			writable: false,
			enumerable: this.opts.enumerable,
			configurable: false
		});
	}	
	return this;
};

/**
* Resolve item or array.
* @param val - Item or array
*/
Adi.prototype.resolve = function resolve(val) {
	if(!util.isArray(val)) {
		return this[val];
	}
	
	return val.map(this.resolve.bind(this));	
};

/**
* @ignore
*/
Adi.prototype.def = function(name) {
	return Object.defineProperty.bind(null, this, name);	
};


/*
*	Opts:
*		Throw on override.
*		Seal, freeze objects
*/
function defaultDescriptor(value, cfg) {
	return {
		value: value,
		configurable: cfg || false,
		enumerable: false,
		writable: false,		
	};
}

module.exports = Adi;
module.exports.$adi = new Adi();