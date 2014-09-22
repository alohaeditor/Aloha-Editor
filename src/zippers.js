/**
 * zippers.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'paths',
	'Boromir'
], function (
	Paths,
	Boromir
) {
	'use strict';

	function isTextRecord(record) {
		return '#text' === record.name();
	}

	function contents(record, content) {
		record = arguments[0];
		if (!record) {
			throw 'You must call children() with at least one argument';
		}
		var isText = isTextRecord(record);
		if (1 === arguments.length) {
			return isText ? record.text() : record.children();
		}
		if (isText) {
			return record.text(content.join(''));
		}
		return record.children(content.map(function (item) {
			return item instanceof Boromir ? item : Boromir(item);
		}));
	}

	function prev(loc, stride) {
		stride = stride || 1;
		return {
			lefts  : loc.lefts.slice(0, -stride),
			rights : loc.lefts.slice(-stride).concat(loc.rights),
			trunk  : loc.trunk.concat()
		};
	}

	function next(loc, stride) {
		stride = 'number' === typeof stride ? stride : 1;
		return {
			lefts  : loc.lefts.concat(loc.rights.slice(0, stride)),
			rights : loc.rights.slice(stride),
			trunk  : loc.trunk.concat()
		};
	}

	function down(loc) {
		return {
			lefts  : [],
			rights : contents(loc.rights[0]),
			trunk  : loc.trunk.concat(loc)
		};
	}

	function up(loc) {
		var kids  = loc.lefts.concat(loc.rights);
		var frame = loc.trunk.slice(-1)[0];
		var first = contents(frame.rights[0], kids);
		return {
			lefts  : frame.lefts.concat(),
			rights : [first].concat(frame.rights.slice(1)),
			trunk  : loc.trunk.slice(0, -1)
		};
	}

	function create(root) {
		return {
			lefts  : [],
			rights : [Boromir(root)],
			trunk  : []
		};
	}

	function hint(loc) {
		var print = function (content) {
			if (content instanceof Boromir) {
				var node = content.domNode();
				return node.data || node.outerHTML;
			}
			return content;
		};
		return loc.lefts.map(print).concat('▓', loc.rights.map(print)).join('');
	}

	function fromBoundary(root, boundary) {
		var path = Paths.fromBoundary(root, boundary).reverse();
		var loc = create(root);
		while (path.length) {
			var offset = path.pop();
			if (isTextRecord(loc.rights[0])) {
				var text = contents(loc.rights[0]);
				return {
					lefts  : text.substr(0, offset),
					rights : text.substr(offset),
					trunk  : loc.trunk.concat(loc)
				};
			}
			loc = down(loc);
			if (offset > 0) {
				loc = next(loc, offset);
			}
		}
		return loc;
	}

	return {
		create       : create,
		prev         : prev,
		next         : next,
		up           : up,
		down         : down,
		fromBoundary : fromBoundary,
		hint         : hint
	};
});
