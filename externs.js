var pos = {
	// Because of traversing.prevNodeBoundary()
	container: null, 

	// Because of cursor.js
	node: null, 
	atEnd: false
};

var opts = {};
// Editing.split()
opts.clone = function () {};
opts.until = function () {};
opts.below = function () {};
opts.normalizeRange = true;
// Editing.format()
opts.createWrapper = function () {};
opts.isPrunable = function () {};
opts.isStyleEqual = function () {};
opts.isObstruction = function () {};
// Editing.wrap()
opts.createWrapper = function () {};
opts.isReusable = function () {};
