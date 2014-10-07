/**
 * searching.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * @overview
 * Module for searching for strings of token in markup
 * @namespace searching
 */
define([
	'dom',
	'boundaries',
	'functions'
], function (
	Dom,
	Boundaries,
	Fn
) {
	'use strict';

	/**
	 * Joins the given list of text nodes' text strings into a single string.
	 *
	 * @private
	 * @param  {Array.<Node>} nodes
	 * @return {string}
	 */
	function joinText(nodes) {
		return nodes.reduce(function (list, node) {
			return list.concat(node.data);
		}, []).join('');
	}

	/**
	 * Given a list of text nodes, will return a boundary of the position that
	 * is `index` offsets into the cumulative node lengths.
	 *
	 * @private
	 * @param  {Array.<Node>} List of text nodes
	 * @param  {number}       index
	 * @return {?Boundary}
	 */
	function boundaryInNodeList(nodes, index) {
		var cumulative = 0;
		var node;
		for (var i = 0; i < nodes.length; i++) {
			node = nodes[i];
			if (cumulative + Dom.nodeLength(node) >= index) {
				return Boundaries.create(node, index - cumulative);
			}
			cumulative += node.length;
		}
		return null;
	}

	/**
	 * Collects all preceeding text node along with the given in document order.
	 *
	 * @private
	 * @param  {!Node} node
	 * @return {Array.<Node>}
	 */
	function collectContiguiousTextNodes(node, collect) {
		return collect(node, function (node) {
			return !Dom.isTextNode(node) || Dom.isEditingHost(node);
		});
	}

	function searchBackward(boundary, regex) {
		var offset;
		var start = Boundaries.nodeBefore(boundary);
		if (start) {
			offset = Dom.nodeLength(start);
		} else {
			start = Boundaries.container(boundary);
			offset = Boundaries.offset(boundary);
		}
		var node = start;
		do {
			if (Dom.isTextNode(node)) {
				var nodes = collectContiguiousTextNodes(node, Dom.nodeAndPrevSiblings).reverse();
				var text = joinText(nodes);
				var index = text.search(regex);
				if (index > -1) {
					if (start !== node || index < offset) {
						return boundaryInNodeList(nodes, index);
					}
					index = text.substr(0, offset).search(regex);
					if (index > -1) {
						return boundaryInNodeList(nodes, index);
					}
				}
			}
			node = Dom.backward(node);
		} while (node && !Dom.isEditingHost(node));
		return null;
	}

	function searchForward(boundary, regex) {
		var offset;
		var start = Boundaries.nodeAfter(boundary);
		if (start) {
			offset = 0;
		} else {
			start = Boundaries.container(boundary);
			offset = Boundaries.offset(boundary);
		}
		var node = start;
		do {
			if (Dom.isTextNode(node)) {
				var nodes = collectContiguiousTextNodes(node, Dom.nodeAndNextSiblings);
				var text = joinText(nodes);
				if (node === start) {
					text = text.substr(offset);
				}
				var index = text.search(regex);
				if (index > -1) {
					return boundaryInNodeList(nodes, offset + index);
				}
			}
			node = Dom.forward(node);
		} while (node && !Dom.isEditingHost(node));
		return null;
	}

	/**
	 * Collects all preceeding text node along with the given in document order.
	 *
	 * @param  {!Boundary} node
	 * @param  {!RexExp}   regex
	 * @param  {string}    direction "forward" or "backward"
	 * @return {?Boundary}
	 * @memberOf searching
	 */
	function search(boundary, regex, direction) {
		return ('backward' === direction)
		     ? searchBackward(boundary, regex)
		     : searchForward(boundary, regex);
	}

	/**
	 * Find the given string backward of the given boundary.
	 *
	 * @param  {!Boundary} boundary
	 * @param  {string}    str
	 * @return {?Boundary}
	 * @memberOf searching
	 */
	function backward(boundary, str) {
		return searchBackward(boundary, new RegExp(str + '(?!.*' + str + ')'));
	}
	/**
	 * Find the given string forward of the given boundary.
	 *
	 * @param  {!Boundary} boundary
	 * @param  {string}    str
	 * @return {?Boundary}
	 * @memberOf searching
	 */
	function forward(boundary, str) {
		return searchForward(boundary, new RegExp(str));
	}

	return {
		search   : search,
		forward  : forward,
		backward : backward
	};
});
