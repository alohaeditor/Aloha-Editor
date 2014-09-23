/**
 * zippers.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'paths',
	'arrays',
	'Boromir'
], function (
	Dom,
	Paths,
	Arrays,
	Boromir
) {
	'use strict';

	function isTextRecord(record) {
		return '#text' === record.name();
	}

	function isTextLocation(loc) {
		return 'string' === typeof loc.rights[0];
	}

	function contents(record, content) {
		record = arguments[0];
		if (1 === arguments.length) {
			return isTextRecord(record) ? record.text() : record.children();
		}
		if (isTextRecord(record)) {
			return record.text(content.join(''));
		}
		return record.children(content.map(function (item) {
			return item instanceof Boromir ? item : Boromir(item);
		}));
	}

	function Location(lefts, rights, frames) {
		return {
			lefts  : lefts,
			rights : rights,
			frames : frames
		};
	}

	function prev(loc, stride) {
		stride = 'number' === typeof stride ? stride : 1;
		return Location(
			loc.lefts.slice(0, -stride),
			loc.lefts.slice(-stride).concat(loc.rights),
			loc.frames.concat()
		);
	}

	function next(loc, stride) {
		stride = 'number' === typeof stride ? stride : 1;
		return Location(
			loc.lefts.concat(loc.rights.slice(0, stride)),
			loc.rights.slice(stride),
			loc.frames.concat()
		);
	}

	function down(loc) {
		return Location([], contents(loc.rights[0]), loc.frames.concat(loc));
	}

	function up(loc) {
		var content = loc.lefts.concat(loc.rights);
		var frame = Arrays.last(loc.frames);
		var first = contents(frame.rights[0], content);
		return Location(
			frame.lefts.concat(),
			[first].concat(frame.rights.slice(1)),
			loc.frames.slice(0, -1)
		);
	}

	function create(root) {
		return Location([], [Boromir(root)], []);
	}

	function hint(loc) {
		var print = function (content) {
			return 'string' === content
			     ? content
			     : isTextRecord(content)
			     ? content.text()
			     : content.domNode().outerHTML;
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
				return Location(
					[text.substr(0, offset)],
					[text.substr(offset)],
					loc.frames.concat(loc)
				);
			}
			loc = down(loc);
			if (offset > 0) {
				loc = next(loc, offset);
			}
		}
		return loc;
	}

	function createRecord(type, content) {
		var node = '#text' === type
		         ? document.createTextNode('')
		         : document.createElement(type);
		return 'undefined' === typeof content
		     ? Boromir(node)
		     : contents(Boromir(node), content);
	}

	function root(loc) {
		return loc.frames.reduce(up, loc);
	}

	function update(loc) {
		if (isTextLocation(loc)) {
			loc = up(loc.rights);
		}
		return loc.rights[0].updateDom();
	}

	function clone(record) {
		return Boromir(Dom.cloneShallow(record.domNode()));
	}

	function split(loc, until) {
		if (until(loc)) {
			return loc;
		}
		var left, right;
		var upper = up(loc);
		if (isTextLocation(loc)) {
			left = createRecord('#text');
			right = createRecord('#text');
		} else {
			left = clone(upper.rights[0]);
			right = clone(upper.rights[0]);
		}
		left = contents(left, loc.lefts);
		right = contents(right, loc.rights);
		loc = Location(
			upper.lefts.concat(left),
			[right].concat(upper.rights.slice(1)),
			upper.frames
		);
		return split(loc, until);
	}

	return {
		hint         : hint,
		create       : create,
		prev         : prev,
		next         : next,
		up           : up,
		down         : down,
		root         : root,
		update       : update,
		split        : split,
		fromBoundary : fromBoundary
	};
});
