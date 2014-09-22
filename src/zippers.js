/**
 * zippers.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define(['dom'], function (Dom) {
	'use strict';

	function children() {
		var node = arguments[0];
		if (1 === arguments.length) {
			return Dom.children(node);
		}
		if (2 === arguments.length) {
			Dom.children(node).forEach(Dom.remove);
			Dom.move(arguments[1], node);
			return node;
		}
		throw 'You must call children() with at least one argument'; 
	}

	function prev(loc) {
		return {
			lefts  : loc.lefts.slice(0, -1),
			rights : loc.lefts.slice(-1).concat(loc.rights),
			trunk  : loc.trunk.concat()
		};
	}

	function next(loc) {
		return {
			lefts  : loc.lefts.concat(loc.rights[0]),
			rights : loc.rights.slice(1),
			trunk  : loc.trunk.concat()
		};
	}

	function down(loc) {
		return {
			lefts  : [],
			rights : children(loc.rights[0]),
			trunk  : loc.trunk.concat(loc)
		};
	}

	function up(loc) {
		var kids  = loc.lefts.concat(loc.rights);
		var frame = loc.trunk.slice(-1)[0];
		var first = children(frame.rights[0], kids);
		return {
			lefts  : frame.lefts.concat(),
			rights : [first].concat(frame.rights.slice(1)),
			trunk  : loc.trunk.slice(0, -1)
		};
	}

	function create(root) {
		return {
			lefts  : [],
			rights : children(root),
			trunk  : []
		};
	}

	return {
		create : create,
		prev   : prev,
		next   : next,
		up     : up,
		down   : down
	};
});
