/**
 * traversing.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'html',
	'strings',
	'boundaries'
], function (
	Html,
	Strings,
	Boundaries
) {
	'use strict';

	function nextCharacter(boundary) {
		var ahead = Html.next(boundary, 'char');
		if (ahead && Boundaries.isTextBoundary(ahead)) {
			var node = Boundaries.container(ahead);
			var offset = Boundaries.offset(ahead);
			return node.data.substr(offset - 1, 1);
		}
		return null;
	}

	function prev(boundary, unit) {
		var behind = Html.prev(boundary, unit);
		if ('word' === unit) {
			var chr = nextCharacter(behind, 'char');
			if (chr && Strings.WORD_BOUNDARY.test(chr)) {
				return prev(behind, unit);
			}
		}
		return behind;
	}

	function next(boundary, unit) {
		if ('word' === unit) {
			var chr = nextCharacter(boundary, 'char');
			if (chr && Strings.WORD_BOUNDARY.test(chr)) {
				return next(Html.next(boundary, 'char'), unit);
			}
		}
		return Html.next(boundary, unit);
	}

	return {
		next : next,
		prev : prev
	};
});
