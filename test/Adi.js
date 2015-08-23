var assert = require('assert'),
	param = require('../lib/param'),
	should = require('should'),
	Adi = require('../lib/Adi');
	
// TODO: Test handler for circular depedencies.
// TODO: Test passing null in bad places.
describe('Adi', function() {
	var adi = Adi();
	// var adi = Adi.$adi;
	/*
	*
	*/	
	it('should instantiate', function() {
		adi.should.not.be.null();
	});
	
	it('should correctly parse function arguments', function() {
		var expected = param(function(a,b,c) {});
		expected.should.eql(['a','b','c']);
	});
	
	/*
	*
	*/
	describe('#value', function() {
		it('should return self for chaining', function() {
			adi.value('name', 'test').should.equal(adi);			
		});
		it('adi should have property after registration', function() {
			// adi.name.should.not.be.null();
			adi.should.have.property('name');
		});
		it('must be mutable', function() {
			adi.value('name', 4);	
			adi.name.should.equal(4);
			
			adi['name'] = 'another';
			adi.name.should.equal('another');
		});
			
	});
	
	/*
	*
	*/
	describe('#constant', function() {
		var scope;
		it('should allow redefinition from #value', function() {
			assert.doesNotThrow(function() {
				scope = adi.constant('name', 42);
				adi.name.should.equal(42);
				adi.constant('anotherConstant', 'stuff');
			});			
		});		
		it('should return self for chaining', function() {
			scope.should.equal(adi);
		});
		it('adi should have property after registration', function() {
			adi.name.should.not.be.null();
			adi.anotherConstant.should.not.be.null();
		});		
		it('must not be mutable', function() {
			assert.throws(function() {
				'use strict';
				adi.name = 4;
			});
			// adi.name = 4;
			adi.name.should.equal(42);
		});
		it('must support object freezing', function() {
			adi.constant('aConstantObject', {x:5}, true);
			assert.throws(function() {
				'use strict';
				adi.aConstantObject.x = 1;
				console.log(adi.aConstantObject);
			});			
		});
		
		
	});
	
	/*
	*
	*/
	describe('#factory', function() {
		var called = 0;
		it('should return self for chaining', function() {
			adi.factory('aFactory', function(name) {				
				return ++called;
			}).should.equal(adi);
			
			
			adi.factory('anotherFactory', function(name) {
				return ++called;
			}, false).should.equal(adi);
		});
		
		it('should resolve correctly', function() {
			adi.aFactory.should.equal(1);			
			adi.anotherFactory.should.equal(2);
			adi.anotherFactory.should.equal(3);
		});
	});
	
	/*
	*
	*/
	describe('#service', function() {
		var called = 0;
		it('should return self for chaining', function() {
			adi.service('aService', function(aFactory) {				
				this.num = ++called;
			}).should.equal(adi);
			
			
			adi.service('anotherService', function(name) {
				this.num = ++called;
			}, false).should.equal(adi);
		});
		
		it('should resolve correctly', function() {
			adi.aService.num.should.equal(1);
			adi.anotherService.num.should.equal(2);
			adi.anotherService.num.should.equal(3);
		});
	});
	
	/*
	*
	*/
	describe('#run', function() {
		it('should work', function() {
			adi.run(function($adi) {
				$adi.should.equal(adi);
			});
			adi.run();
		});
	});
	
});