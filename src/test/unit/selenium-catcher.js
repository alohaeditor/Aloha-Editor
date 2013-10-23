window.onerror = function(message, filename, lineno, colno, error) {
	window.err = {};
	window.err.message = message;
	window.err.filename = filename;
	window.err.lineno = lineno;
	window.err.colno = colno;
	window.err.stack = error.stack;
};
