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
	'ranges',
	'editing',
	'mutation',
	'traversing',
	'boundaries'
], function (
	Fn,
	Dom,
	Maps,
	Keys,
	Ranges,
	Editing,
	Mutation,
	Traversing,
	Boundaries
) {
	'use strict';

	function code(start, end) {
		console.error('create CODE');
		return end;
	}

	function ascii(symbol, start, end) {
		var boundaries = Editing.remove(Ranges.envelopeInvisibleCharacters(
			Ranges.fromBoundaries(start, end)
		));
		return Mutation.insertTextAtBoundary(symbol, boundaries[0], true);
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

		'|>' : Fn.partial(ascii, '►'),
		'<|' : Fn.partial(ascii, '◄')
	};

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

	function handle(event) {
		if ('keydown' !== event.type || !event.editable || !event.range) {
			return event;
		}
		if (
			Keys.CODES['tab'  ] !== event.keycode &&
			Keys.CODES['space'] !== event.keycode &&
			Keys.CODES['enter'] !== event.keycode
		) {
			return event;
		}
		var boundary = Boundaries.fromRangeStart(event.range);
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
			event.range = Ranges.fromBoundaries(boundary, boundary);
		}
		return event;
	}

	return {
		handle: handle
	};
});
