# ProfX
A Mutant Testing Tool for Javascript

### How to use

Currently, profx needs to be built into a build system. Plugins can be easily created to run the tool. The inputs are simply the source file and the test file for that source. Works best with source code that is already split into easily testable components.

**Do not use in production systems.**

**Use with version controlled projects only!**

#### Installation

```
npm install profx
```

#### Code usage

```
var profx = require('profx');

profx(<path to source js>, <path to test js>, function(err, score){
	// Do things...
});

```

#### TODO:

- Write tests for profx (Inception...)
- Make test runner agnostic (choose through config options)
- Create gulp and grunt plugins for profx