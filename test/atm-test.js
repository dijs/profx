require('should');

describe('ATM Module', function() {

	var atm;

	beforeEach(function() {
		atm = require('./data/atm')();
	});

	it('should deposit', function() {
		var initial = atm.getBalance();
		atm.deposit(50);
		atm.getBalance().should.equal(initial + 50);
	});

	it('should withdraw', function() {
		var initial = atm.getBalance();
		atm.deposit(40);
		atm.withdraw(30).should.be.true;
		atm.getBalance().should.equal(initial + 40 - 30);
	});

	it('should not withdraw', function() {
		var initial = atm.getBalance();
		atm.withdraw(initial + 10).should.be.false;
		atm.getBalance().should.equal(initial);
	});

});