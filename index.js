'use strict';

/* jshint node:true */

var esprima = require('esprima');
var fs = require('fs-extra');
var Path = require('path');
var _ = require('lodash');
var async = require('async');
var Mocha = require('mocha');

var mutations = require('./mutations');

var esprimaOptions = {
	tokens: true,
	loc: true
};

var profxOptions = {
	backupExt: '.profx-backup',
	verbose: true
};

function log(o) {
	console.log('PROFX: ' + o);
}

function getTokenType(token) {
	var relational = token.value === '<' || token.value === '<=' || token.value === '>' || token.value === '>=';
	var equality = token.value === '==' || token.value === '!=';
	var identity = token.value === '===' || token.value === '!==';
	if (relational) {
		return 'Relational';
	} else if (equality) {
		return 'Equality';
	} else if (identity) {
		return 'Identity';
	} else {
		return token.type;
	}
}

function getTokens(path) {
	return esprima.parse(fs.readFileSync(path), esprimaOptions).tokens.map(function(token, index) {
		return {
			type: getTokenType(token),
			line: token.loc.start.line,
			value: token.value,
			index: index
		};
	});
}

function createMutantSource(tokens, tokenIndex, value) {
	var mutant = '';
	var previous;
	tokens.forEach(function(token, index) {
		if (index === tokenIndex) {
			mutant += value;
		} else {
			if (previous === 'return' && (token.type === 'Keyword' || token.type === 'Identifier' || token.type === 'Boolean')) {
				mutant += ' ';
			}
			if (previous === 'var' && token.type === 'Identifier') {
				mutant += ' ';
			}
			mutant += token.value;
		}
		previous = token.value;
	});
	return mutant;
}

function getTestResult(test) {
	return {
		parent: test.parent ? test.parent.title : undefined,
		title: test.title,
		passed: test.state === 'passed'
	};
}

function test(path, callback) {
	var results = [];
	var mocha = new Mocha();
	mocha.addFile(path);
	log('added ' + path);
	mocha.run(function(failures) {
		callback(results);
	}).on('fail', function(test) {
		results.push(getTestResult(test));
	}).on('pass', function(test) {
		results.push(getTestResult(test));
	});
}

function byMutatable(token) {
	return _.has(mutations, token.type);
}

function byFailed(test) {
	return !test.passed;
}

function copyFile(source, target, cb) {
	var cbCalled = false;
	var rd = fs.createReadStream(source);
	rd.on('error', done);
	var wr = fs.createWriteStream(target);
	wr.on('error', done);
	wr.on('close', function(ex) {
		done();
	});
	rd.pipe(wr);

	function done(err) {
		if (!cbCalled) {
			cb(err);
			cbCalled = true;
		}
	}
}

function backupFile(path, callback) {
	log('Backing up ' + path);
	copyFile(path, path + profxOptions.backupExt, callback);
}

function restoreFile(path, callback) {
	log('Restoring ' + path);
	copyFile(path + profxOptions.backupExt, path, function(err) {
		if (err) {
			callback(err);
		} else {
			fs.unlink(path + profxOptions.backupExt, callback);
		}
	});
}

// Think about following local required files...

function run(sourcePath, testPath, callback) {
	// Run baseline test
	test(testPath, function(baselineTestResults) {
		if (baselineTestResults.filter(byFailed).length) {
			log('Fix your tests before you mutate!');
		} else {
			// Save original source
			backupFile(sourcePath, function(err) {
				if (err) {
					log(err);
				} else {

					var totalMutants = 0;
					var totalMutantsKilled = 0;

					var tokens = getTokens(sourcePath);
					console.log(tokens);
					var mutatableTokens = tokens.filter(byMutatable);
					async.eachSeries(mutatableTokens, function(token, doneMutatingToken) {
						log('Mutating #' + token.index + ' ' + token.type + ' token on line ' + token.line);
						async.eachSeries(mutations[token.type], function(mutation, doneTestingMutation) {
							log('Running ' + mutation.id + ' mutation...');
							// Create mutant
							log('Creating mutated source');
							var mutantSource = createMutantSource(tokens, token.index, mutation.fn(token.value));
							// Hack for forcing node to reload the source for testing
							delete require.cache[Path.resolve(sourcePath)];
							// Overwrite source
							log('Overwriting source for testing');
							fs.writeFile(sourcePath, mutantSource, function(err) {
								if (err) {
									log(err);
									doneTestingMutation();
								} else {
									var mutantTestPath = testPath + '-' + token.index + '.' + mutation.id + '-profx.js';
									fs.writeFileSync(mutantTestPath, fs.readFileSync(testPath));
									// Test mutant
									test(mutantTestPath, function(mutantTestResults) {
										var survivors = baselineTestResults.filter(function(result) {
											var mutantResult = _.findWhere(mutantTestResults, {
												parent: result.parent,
												title: result.title
											});
											// Check if mutant is killed
											return result.passed !== mutantResult.passed;
										});
										// Log/return survivor information
										survivors.forEach(function(survivor) {
											log('Test case "' + survivor.parent + ':' + survivor.title + '" survived the ' +
												token.type + ':' + mutation.id + ' mutation on the line ' + token.line);
										});
										fs.unlinkSync(mutantTestPath);
										totalMutants++;
										if (!survivors.length) {
											totalMutantsKilled++;
										}
										doneTestingMutation();
									});
								}
							});
						}, function(err) {
							log('Done mutating #' + token.index + ' ' + token.type + ' token on line ' + token.line);
							doneMutatingToken(err);
						});
					}, function(err) {
						log('Done mutating all tokens in source');
						// Restore original source
						restoreFile(sourcePath, function(err) {
							if (err) {
								log(err);
							}
						});
						log(totalMutantsKilled);
						log(totalMutants);
						// Mutation Score = (Killed Mutants / Total number of Mutants) * 100
						var score = Math.round(totalMutantsKilled / totalMutants * 100);
						log(score + '% of the generated mutants were killed by your test suite');
						callback(err, score);
					});

				}
			});
		}
	});
}

module.exports = run;