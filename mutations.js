module.exports = {
	'Numeric': [{
		id: 'negative',
		fn: function(n) {
			return -parseFloat(n, 10) | 0;
		}
	}, {
		id: 'zero',
		fn: function() {
			return 0;
		}
	}, {
		id: 'less',
		fn: function(n) {
			return parseFloat(n, 10) | 0 - Math.random() * parseFloat(n, 10) | 0 - 1;
		}
	}, {
		id: 'more',
		fn: function(n) {
			return parseFloat(n, 10) | 0 + Math.random() * parseFloat(n, 10) | 0 + 1;
		}
	}],
	'Relational': [{
		id: 'less-than',
		fn: function() {
			return '<';
		}
	}, {
		id: 'less-than-or-equal',
		fn: function() {
			return '<=';
		}
	}, {
		id: 'more-than',
		fn: function() {
			return '>';
		}
	}, {
		id: 'more-than-or-equal',
		fn: function() {
			return '>=';
		}
	}],
	'Equality': [{
		id: 'equal',
		fn: function() {
			return '==';
		}
	}, {
		id: 'not-equal',
		fn: function() {
			return '!=';
		}
	}],
	'Identity': [{
		id: 'is',
		fn: function() {
			return '===';
		}
	}, {
		id: 'isnt',
		fn: function() {
			return '!==';
		}
	}]
};