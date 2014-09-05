/**
 * autoformat.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'functions',
	'dom',
	'maps',
	'keys',
	'editing',
	'mutation',
	'searching',
	'traversing',
	'boundaries'
], function (
	Fn,
	Dom,
	Maps,
	Keys,
	Editing,
	Mutation,
	Searching,
	Traversing,
	Boundaries
) {
	'use strict';

	/**
	 * Transforms ```foo("bar")``` into <code>foo("bar")</code>.
	 *
	 * @private
	 * @param  {Boundary} start
	 * @param  {Boundary} end
	 * @return {!Boundary}
	 */
	function code(start, end) {
		//  marker / front
		//    |
		//    |   ,--- pos1
		//    |   |
		//    |   |   ,--- start / pos2
		//    |   |   |
		//    |   |   |   ,--- end
		//    |   |   |   |
		//    v   v   v   v
		//     ``` foo ```
		//    .   .   .  .
		var marker = Searching.backward(start, '```');
		if (!marker) {
			return end;
		}
		var pos2 = Editing.remove(start, end)[1];
		var front = Searching.backward(pos2, '```');
		if (!front) {
			return pos2;
		}
		var behind = Searching.search(front, /[^`]|$/);
		if (!behind) {
			return pos2;
		}
		var pos1 = Editing.remove(front, behind)[0];
		return Editing.wrap('code', pos1, pos2)[1];
	}

	function ascii(symbol, start, end) {
		end = Traversing.envelopeInvisibleCharacters(end);
		var boundary = Editing.remove(start, end)[0];
		return Mutation.insertTextAtBoundary(symbol, boundary, true);
	}

	var triggers = {
		'```' : code,

		'(:'  : Fn.partial(ascii, '☺'),
		':)'  : Fn.partial(ascii, '☺'),

		':('  : Fn.partial(ascii, '☹'),
		'):'  : Fn.partial(ascii, '☹'),

		'<3'  : Fn.partial(ascii, '♥'),

		'--'  : Fn.partial(ascii, '—'),

		'-->' : Fn.partial(ascii, '→'),
		'<--' : Fn.partial(ascii, '←'),

		'==>' : Fn.partial(ascii, '⇒'),
		'<==' : Fn.partial(ascii, '⇐'),

		'|>'  : Fn.partial(ascii, '►'),
		'<|'  : Fn.partial(ascii, '◄')
	};

	/**
	 * A trie constructde from the trigger keys.
	 *
	 * @private
	 * @type {Object.<String, Object|function>}
	 */
	var dictionary = {};

	Maps.forEach(triggers, function(handler, trigger) {
		var level = dictionary;
		var tokens = trigger.split('').reverse();
		var count = tokens.length - 1;
		tokens.forEach(function (token, index, collection) {
			if (index === count) {
				level[token] = handler;
			} else if (!level[token]) {
				level = level[token] = {};
			} else {
				level = level[token];
			}
		});
	});

	function nextChar(boundary) {
		var node;
		if (Boundaries.isTextBoundary(boundary)) {
			node = Boundaries.container(boundary);
			return node.data.substr(Boundaries.offset(boundary), 1);
		}
		node = Boundaries.nextNode(boundary);
		if (Dom.isTextNode(node)) {
			return node.data.substr(0, 1);
		}
		return '';
	}

	function handleAutoFormat(event) {
		if ('keydown' !== event.type) {
			return event;
		}
		if (
			Keys.CODES['tab'  ] !== event.keycode &&
			Keys.CODES['space'] !== event.keycode &&
			Keys.CODES['enter'] !== event.keycode
		) {
			return event;
		}
		var boundary = event.selection.boundaries[0];
		var prev = Traversing.prev(boundary, 'visual');
		var token = prev && nextChar(prev);
		var level = dictionary;
		var handler;
		var start;
		while (token && level[token]) {
			level = level[token];
			if ('function' === typeof level) {
				handler = level;
				start = prev;
			}
			prev = Traversing.prev(prev, 'visual');
			token = prev && nextChar(prev);
		}
		if (handler) {
			boundary = handler(start, boundary);
			event.selection.boundaries = [boundary, boundary];
		}
		return event;
	}

	return {
		handleAutoFormat: handleAutoFormat
	};
});
