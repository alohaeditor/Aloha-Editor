/**
 * stable-range.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'arrays',
	'functions'
], function (
	Dom,
	Arrays,
	Fn
) {
	'use strict';

	/**
	 * Creates a "stable" copy of the given range.
	 *
	 * A native range is live, which means that modifying the DOM may mutate the
	 * range. Also, using setStart/setEnd may not set the properties correctly
	 * (the browser may perform its own normalization of boundary points). The
	 * behaviour of a native range is very erratic and should be converted to a
	 * stable range as the first thing in any algorithm.
	 *
	 * The StableRange implementation exposes a minimal API that mimics
	 * the corresponding DOM API, such that most functions that accept a
	 * live range can also accept a StableRange. A full implementation
	 * of the DOM API is not the goal of this implementation.
	 *
	 * @param {Range} range
	 * @return {StableRange}
	 */
	function StableRange(range) {
		if (!(this instanceof StableRange)) {
			return new StableRange(range);
		}
		range = range || {};
		this.startContainer = range.startContainer;
		this.startOffset = range.startOffset;
		this.endContainer = range.endContainer;
		this.endOffset = range.endOffset;
		this.commonAncestorContainer = range.commonAncestorContainer;
		this.collapsed = range.collapsed;
	}

	function commonAncestorContainer(start, end) {
		// Because we can avoid going all the way up and outside the
		// editable if start and end are relatively close together in
		// the DOM (which I assume to be the common case).
		var startAncestor = start;
		var i;
		for (i = 0; i < 4; i++) {
			startAncestor = startAncestor.parentNode || startAncestor;
		}
		var startAncestors = Dom.childAndParentsUntilInclNode(
			start,
			startAncestor
		);
		var endAncestors = Dom.childAndParentsUntilInclNode(
			end,
			startAncestor
		);

		if (startAncestor !== Arrays.last(endAncestors)) {
			startAncestors = Dom.childAndParentsUntil(start, Fn.returnFalse);
			endAncestors = Dom.childAndParentsUntil(end, Fn.returnFalse);
		}

		return Arrays.intersect(
			startAncestors,
			endAncestors
		)[0];
	}

	StableRange.prototype.update = function () {
		var start = this.startContainer;
		var end = this.endContainer;
		var startOffset = this.startOffset;
		var endOffset = this.endOffset;
		if (!start || !end) {
			return;
		}
		this.collapsed = (start === end && startOffset === endOffset);
		this.commonAncestorContainer = commonAncestorContainer(start, end);
	};

	StableRange.prototype.setStart = function (sc, so) {
		this.startContainer = sc;
		this.startOffset = so;
		this.update();
	};

	StableRange.prototype.setEnd = function (ec, eo) {
		this.endContainer = ec;
		this.endOffset = eo;
		this.update();
	};

	return StableRange;
});
