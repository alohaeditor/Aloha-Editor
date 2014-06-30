var cursor = {
	// Because of cursor.js
	node  : null,
	atEnd : false
};

var opts = {
	// Editing.split()
	clone          : function () {},
	until          : function () {},
	below          : function () {},
	normalizeRange : true,
	// Editing.format()
	createWrapper  : function () {},
	isPrunable     : function () {},
	isStyleEqual   : function () {},
	isObstruction  : function () {},
	// Editing.wrap()
	isReusable     : function () {}
};

// Undo
var change = {
	type    : '',
	path    : [],
	content : [],
	attrs   : [{
		name     : '',
		ns       : '',
		oldValue : '',
		newValue : ''
	}]
};

var changeSet = {
	changes   : [],
	meta      : {},
	selection : {
		type    :'',
		newRange : {
			start : {},
			end   : {}
		},
		oldRange : {}
	}
};

// Undo
var changeSet = { changes: [] };

var opts = {
	// Undo.createContext()
	noMutationObserver : true,
	combineCharsMax    : 20,
	// Undo.enter() / Undo.capture()
	partitionRecords   : true,
	noObserve          : true,
	meta               : {}
};

var MutationObserver = {
	takeRecords: null
};

var alohaEvent = {
	chr         : '',
	type        : '',
	meta        : '',
	which       : '',
	range       : null,
	editor      : null,
	editable    : null,
	nativeEvent : null,
	isTextInput : false
};

var editable = {
	selectContext : null,
	undoContext   : null,
	overrides     : [],
	dndContext    : {
		observer     : null,
		frame        : {
			opts     : {},
			records  : [],
			oldRange : null,
			newRange : null
		},
		elem         : null,
		stack        : [],
		history      : [],
		historyIndex : 0,
		opts         : {
			disconnect     : function () {},
			observeAll     : function () {},
			takeChanges    : function () {},
			discardChanges : function () {}
		}
	}
};

var SelectionContext = {
	caret          : null,
	range          : null,
	focus          : '',
	dragging       : false,
	mousedown      : false,
	doubleclicking : false,
	tripleclicking : false
};

var editor = {
	stack            : [],
	editables        : {},
	BLOCK_CLASS      : '',
	CARET_CLASS      : '',
	selectionContext : null
};

var action = {
	clearOverrides : true,
	preventDefault : true,
	undo           : '',
	mutate         : function () {}
};
