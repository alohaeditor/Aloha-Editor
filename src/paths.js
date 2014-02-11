/**
 * paths.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'arrays',
	'boundaries'
], function Paths(
	Dom,
	Arrays,
	Boundaries
) {
	'use strict';

	/**
	 * Returns a "path" from the given boundary position, up to the specified
	 * node.  The `limit` node must contain the given boundary position.
	 *
	 * @param  {Node}     limit
	 * @param  {Boundary} boundary
	 * @return {Array.<number>}
	 */
	function fromBoundary(limit, boundary) {
		var offset = Boundaries.offset(boundary);
		var container = Boundaries.container(boundary);
		if (container === limit) {
			return [offset];
		}
		var chain = Dom.childAndParentsUntilNode(container, limit);
		var path = chain.reduce(function (path, node) {
			return path.concat(Dom.nodeIndex(node));
		}, [offset]);
		path.reverse();
		return path;
	}

	/**
	 * Resolves the given path to a boundary positioned inside DOM tree whose
	 * root is `container`.
	 *
	 * @param  {Node}           container
	 * @param  {Array.<number>} path
	 * @return {Boundary}
	 */
	function toBoundary(container, path) {
		var node = path.slice(0, -1).reduce(function (node, offset) {
			return node.childNodes[offset] || node;
		}, container);
		return Boundaries.raw(node, Arrays.last(path) || 0);
	}

	return {
		toBoundary   : toBoundary,
		fromBoundary : fromBoundary
	};
});
