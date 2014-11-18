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

var Settings = {
	defaultBlockNodeName: '',
	defaultBlock: ''
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

var Frame = {
	opts     : {},
	records  : [],
	oldRange : null,
	newRange : null
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
	lastMouseEvent : '',
	type           : '',
	target         : [],
	editor         : null,
	editable       : null,
	nativeEvent    : null,
	selection      : {},
	meta           : '',
	keycode        : ''
};

var parseKeys = {
	meta    : '',
	keycode : '',
	key     : '',
	chr     : ''
};

var Boromir = {
	name         : function () {},
	text         : function () {},
	children     : function () {},
	affinity     : function () {},
	attrs        : function () {},
	attr         : function () {},
	style        : function () {},
	updateDom    : function () {},
	asDom        : function () {},
	create       : function () {},
	hasClass     : function () {},
	addClass     : function () {},
	removeClass  : function () {}
};

var Record = {
	domNode             : null,
	type                : null,
	name                : null,
	text                : null,
	children            : null,
	affinity            : false,
	classes             : {},
	define              : function () {},
	hookSetter          : function () {},
	hookSetterRecompute : function () {},
	asTransient         : function () {},
	asPersistent        : function () {},
	get                 : function () {},
	set                 : function () {},
	setT                : function () {},
	delay               : function () {},
	delayT              : function () {},
	realize             : function () {},
	obj                 : {}
};

var DelayedMap = {
	keys          : [],
	has           : function () {},
	isRealized    : function () {},
	mergeObject   : {},
	_map_opts     : {},
	_map_data     : null,
	_map_source   : null,
	_map_realized : null
};

var editable = {
	undo        : null,
	overrides   : []
};

var undoContext = {
	observer     : null,
	frame        : {},
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

var SelectionContext = {
	boundaries     : null,
	caret          : null,
	focus          : '',
	mousedown      : null,
	dragging       : false,
	doubleclicking : false,
	tripleclicking : false,
	formatting     : [],
	overrides      : []
};

var dndContext = {
	dropEffect : '',
	element    : null,
	target     : null,
	data       : []
};

var editor = {
	stack       : [],
	editables   : {},
	BLOCK_CLASS : '',
	CARET_CLASS : '',
	selection   : null,
	dnd         : null
};

var action = {
	clearOverrides : true,
	preventDefault : true,
	undo           : '',
	mutate         : function () {}
};

var Nodes = {
	ELEMENT                : 0,
	ATTR                   : 0,
	TEXT                   : 0,
	CDATA_SECTION          : 0,
	ENTITY_REFERENCE       : 0,
	ENTITY                 : 0,
	PROCESSING_INSTRUCTION : 0,
	COMMENT                : 0,
	DOCUMENT               : 0,
	DOCUMENTTYPE           : 0,
	DOCUMENT_FRAGMENT      : 0,
	NOTATION               : 0
};
