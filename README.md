adi
==

Adi is a micro DI framework inspired by Angular, and implemented with the liberal abuse of Object.defineProperty

## Features
- Incredibly easy to use.
- Object properties as providers.
- Factories and services available for complex resolution.
- Enforced constants. Optional object freeze.
- Parses function arguments to inject providers.
- Singleton creation by default.
- Throws error on circular depedencies.
- Pure javascript.
- Method chaining.
- Lazy.

## Installation
	npm install adi

## How it works
Adi functions primarily by dynamically defining properties on it's own instance with getters for lazy dependency
resolution. Once a depdendency is resolved, if it's a singleton, it replaces the getter so the resolution chain only needs
to execute once. What this means for you? *It couldn't be easier to use.*

## Resolution
Everything can be resolved via ```adi[name]``` or ```adi.name```,
and all properties on the instance are automatically injectable.

Yes, it's that easy.
#### Example:
```
var adi = require('adi')();
// More on factories below.
adi.factory('yourFactoryNameGoesHere', function() {
    return 4;
});
var a = adi.yourFactoryNameGoesHere; // a==4
```
## Injection
Adi supports function argument injection. A call to ```adi.invoke(fn, ctx)``` will parse the expected arguments
of fn and resolve them against the current instance before invocation.
```
var adi = require('adi')();
adi.someValue = 5;
adi.constant('aConstant', 6);
adi.invoke(function(someValue, aConstant) {
    // someValue == 5
    // aConstant == 6
});
```
## Factories
Adi isn't limited to simple object properties. By defining getters, we can create complex resolvers. The following registers a function with dependencies. The singleton flag determines if the return value replaces the property accessor or if we'd like to invoke this factory each time it's resolved. The singleton flag is optional and defaults to true.
```
adi.factory('yourFactoryNameGoesHere', function(allYourDepedencies, commaSeperated) {
    return 4;
}, singletonFlag);

adi.invoke(function(yourFactoryNameGoesHere) {
    // yourFactoryNameGoesHere == 4
});
```
## Services
Similar to factories, Adi provides a service method that instantiates a constructor when resolved. Similar to factory,
the singleton flag determines if we replace the property accessor or create a new object on each resolution.
```
adi.service('yourServiceName', function(anyDepedencies) {
    this.x = 5;
}, singletonFlag);
console.log(adi.yourServiceName.x); // outputs 5.
```

## Run blocks
Adi also provides a way to register code to run once wiring is complete. There is no guarantee on execution order,
but it will be in the order they were registered.
```
adi.run(function(youKnowTheDrillByNow) {
    // do stuff
});
// call with no arguments to execute.
adi.run(); 
```

## Special properties
Adi currently supports two special properties. ```module.exports.$adi``` and ```adi.$adi```.

```module.exports.$adi``` is a shared Adi instance on the module.

```adi.$adi``` is a constant reference to the current instance and can be injected like any other property.

It's recommended you avoid these, but they're there if you need them.

## Examples
```
var adi = require('adi')();
adi
	.value('value1', 1)
	.value('value2', {x: 2})
	.value('value3', 'three')
	.constant('const1', 1)
    .constant('const2', 'two')
    .constant('const3', {y: 'three'}, true) // freeze object
	.factory('exampleFactory', function(value1, const3) {
		return 'anything';
	})
	.service('exampleService', function(exampleFactory) {
		// exampleFactory === 'anything'
		this.y = 4;
	}, false) // Not a singleton.
	.run(function(exampleService, exampleFactory, $adi, suppliedAfter) {
		// suppliedAfter = 5
		// exampleFactory == anything
		console.log(exampleService, exampleFactory, suppliedAfter);
	});
adi.suppliedAfter = 5;

adi.run(); // Invoke registered run blocks (call run() with zero arguments)
```
## Tests
```
npm test
```

## Release History
* 1.0.0
