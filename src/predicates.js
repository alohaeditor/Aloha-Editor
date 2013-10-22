/* dom.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'maps',
	'arrays',
	'strings',
	'browser',
	'functions',
	'misc'
], function Dom(
	maps,
	arrays,
	strings,
	browser,
	fn,
	misc
) {
	'use strict';

	/**
	 * Void elements are elements which are not permitted to contain content.
	 * https://developer.mozilla.org/en-US/docs/Web/HTML/Element
	 *
	 * @type {Object}
	 */
	var VOID_ELEMENTS = {
		'AREA'    : true,
		'BASE'    : true,
		'BR'      : true,
		'COL'     : true,
		'COMMAND' : true,
		'EMBED'   : true,
		'HR'      : true,
		'IMG'     : true,
		'INPUT'   : true,
		'KEYGEN'  : true, // HTML5
		'LINK'    : true,
		'META'    : true,
		'PARAM'   : true,
		'SOURCE'  : true,
		'TRACK'   : true,
		'WBR'     : true
	};

	/**
	 * A map of node tag names which are classified as block-level element.
	 *
	 * NB: "block-level" is not technically defined for elements that are new in
	 * HTML5.
	 *
	 * @type {Object}
	 */
	var BLOCK_LEVEL_ELEMENTS = {
		'ADDRESS'    : true,
		'ARTICLE'    : true, // HTML5
		'ASIDE'      : true, // HTML5
		'AUDIO'      : true, // HTML5
		'BLOCKQUOTE' : true,
		'CANVAS'     : true, // HTML5
		'DD'         : true,
		'DIV'        : true,
		'DL'         : true,
		'FIELDSET'   : true,
		'FIGCAPTION' : true,
		'FIGURE'     : true,
		'FOOTER'     : true,
		'FORM'       : true,
		'H1'         : true,
		'H2'         : true,
		'H3'         : true,
		'H4'         : true,
		'H5'         : true,
		'H6'         : true,
		'HEADER'     : true,
		'HGROUP'     : true,
		'HR'         : true,
		'NOSCRIPT'   : true,
		'OL'         : true,
		'OUTPUT'     : true,
		'P'          : true,
		'PRE'        : true,
		'SECTION'    : true, // HTML5
		'TABLE'      : true,
		'TFOOT'      : true,
		'UL'         : true,
		'VIDEO'      : true  // HTML5
	};

	var TEXT_LEVEL_SEMANTIC_ELEMENTS = {
		'A'      : true,
		'ABBR'   : true,
		'B'      : true,
		'BDI'    : true, // HTML5
		'BDO'    : true,
		'BR'     : true,
		'CITE'   : true,
		'CODE'   : true,
		'DATA'   : true, // HTML5
		'DFN'    : true,
		'EM'     : true,
		'I'      : true,
		'KBD'    : true,
		'MARK'   : true, // HTML5
		'Q'      : true,
		'RP'     : true, // HTML5
		'RT'     : true, // HTML5
		'RUBY'   : true, // HTML5
		'S'      : true,
		'SAMP'   : true,
		'SMALL'  : true,
		'SPAN'   : true,
		'STRONG' : true,
		'SUB'    : true,
		'SUP'    : true,
		'TIME'   : true, // HTML5
		'U'      : true,
		'VAR'    : true,
		'WBR'    : true  // HTML5
	};

	/**
	 * Check whether the given node is a void element type.
	 *
	 * @param {DOMObject} node
	 * @return {Boolean}
	 */
	function isVoidNode(node) {
		return !!VOID_ELEMENTS[node.nodeName];
	}

	/**
	 * Similar to hasBlockStyle() except relies on the nodeName of the given
	 * node which works for attached as well as and detached nodes.
	 *
	 * @param {DOMObject} node
	 * @return {Boolean}
	 *         True if the given node is a block node type--regardless of how it
	 *         is rendered.
	 */
	function isBlockNode(node) {
		return !!BLOCK_LEVEL_ELEMENTS[node.nodeName];
	}

	/**
	 * Similar to hasInlineStyle() in the same sense as isBlockNode() is similar
	 * to hasBlockStyle()
	 *
	 * @param {DOMObject} node
	 * @return {Boolean}
	 *         True if the given node is an inline node type--regardless of how
	 *         it is rendered.
	 */
	function isInlineNode(node) {
		return !isBlockNode(node);
	}

	/**
	 * Check whether the given node is a text-level semantic element type.
	 *
	 * @param {DOMObject} node
	 * @return {Boolean}
	 */
	function isTextLevelSemanticNode(node) {
		return !!TEXT_LEVEL_SEMANTIC_ELEMENTS[node.nodeName];
	}


	var exports = {
		isVoidNode: isVoidNode,
		isBlockNode: isBlockNode,
		isInlineNode: isInlineNode,
		isTextLevelSemanticNode: isTextLevelSemanticNode,
	};

	exports['isVoidNode'] = exports.isVoidNode;
	exports['isBlockNode'] = exports.isBlockNode;
	exports['isInlineNode'] = exports.isInlineNode;
	exports['isTextLevelSemanticNode'] = exports.isTextLevelSemanticNode;

	return exports;
});
