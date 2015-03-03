module.exports = function() {

	var balance = 0;

	this.getBalance = function() {
		return balance;
	};

	this.deposit = function(amount) {
		balance += amount;
	};

	this.withdraw = function(amount) {
		if (balance >= amount) {
			balance -= amount;
			return true;
		} else {
			return false;
		}
	};

	return this;

};