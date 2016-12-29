module.exports.A = function() {
	console.log('call from A');
}

module.exports.ClassName = class ClassName {
	call() {
		console.log('Callf rom ClassName class')
	}
}

module.exports.B = function() {
	var id = Math.rand();
	return function() {
		console.log('only one function! - ' + id);
	}
}
