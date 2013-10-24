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

// Undo
var change = {};
change.type = 'insert';
change.path = [];
change.content = [];
change.attrs = [{}];
change.attrs[0].name = 'name';
change.attrs[0].ns = 'namespace';
change.attrs[0].oldValue = 'value';
change.attrs[0].newValue = 'value';
var changeSet = {};
changeSet.changes = [];
changeSet.meta = {};
changeSet.selection = {};
changeSet.selection.type = 'update-range';
changeSet.selection.newRange = {};
changeSet.selection.newRange.start = {};
changeSet.selection.newRange.end = {};
changeSet.selection.oldRange = {};
changeSet.selection.oldRange.start = {};
changeSet.selection.oldRange.end = {};

// Undo
var changeSet = {};
changeSet.changes = [];

var opts = {};
// Undo.createContext()
opts.noMutationObserver = true;
opts.combineCharsMax = 20;
// Undo.enter() / Undo.capture()
opts.partitionRecords = true;
opts.noObserve = true;
opts.meta = {};
