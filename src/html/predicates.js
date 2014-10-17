/**
 * html/predicates.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([], function () {
	'use strict';

	/**
	 * Void elements are elements which are not permitted to contain content.
	 * https://developer.mozilla.org/en-US/docs/Web/HTML/Element
	 *
	 * @private
	 * @type {Object.<string, boolean>}
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
		'KEYGEN'  : true,
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
	 * @private
	 * @type {Object.<string, boolean>}
	 */
	var BLOCK_LEVEL_ELEMENTS = {
		'ADDRESS'    : true,
		'ARTICLE'    : true,
		'ASIDE'      : true,
		'AUDIO'      : true,
		'BLOCKQUOTE' : true,
		'CANVAS'     : true,
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
		'SECTION'    : true,
		'TABLE'      : true,
		'TFOOT'      : true,
		'UL'         : true,
		'VIDEO'      : true
	};

	/**
	 * Elements which don't constitue a word boundaries limit.
	 *
	 * @see
	 * http://www.w3.org/TR/html5/text-level-semantics.html
	 * https://developer.mozilla.org/en/docs/Web/Guide/HTML/HTML5/HTML5_element_list#Text-level_semantics
	 *
	 * @private
	 * @type {Object.<string, true>}
	 */
	var TEXT_LEVEL_SEMANTIC_ELEMENTS = {
		'A'      : true,
		'ABBR'   : true,
		'B'      : true,
		'BDI'    : true,
		'BDO'    : true,
		'BR'     : true,
		'CITE'   : true,
		'CODE'   : true,
		'DATA'   : true,
		'DFN'    : true,
		'EM'     : true,
		'I'      : true,
		'KBD'    : true,
		'MARK'   : true,
		'Q'      : true,
		'RP'     : true,
		'RT'     : true,
		'RUBY'   : true,
		'S'      : true,
		'SAMP'   : true,
		'SMALL'  : true,
		'SPAN'   : true,
		'STRONG' : true,
		'SUB'    : true,
		'SUP'    : true,
		'TIME'   : true,
		'U'      : true,
		'VAR'    : true,
		'WBR'    : true
	};

	/**
	 * Tags representing list container elements.
	 *
	 * @type {Object.<string, boolean>}
	 */
	var LIST_CONTAINERS = {
		'OL'   : true,
		'UL'   : true,
		'DL'   : true,
		'MENU' : true
	};

	/**
	 * Tags representing list item elements.
	 *
	 * @private
	 * @type {Object.<string, boolean>}
	 */
	var LIST_ITEMS = {
		'LI' : true,
		'DT' : true,
		'DD' : true
	};

	/**
	 * These element's cannot be simply unwrapped because they have dependent
	 * children.
	 *
	 * @private
	 * @see   GROUPED_CONTAINERS
	 * @param {Object.<string, boolean>}
	 */
	var GROUP_CONTAINERS = {
		'FIELDSET' : true,
		'OBJECT'   : true,
		'FIGURE'   : true,
		'AUDIO'    : true,
		'SELECT'   : true,
		'COLGROUP' : true,
		'HGROUP'   : true,
		'TABLE'    : true,
		'TBODY'    : true,
		'TR'       : true,
		'OL'       : true,
		'UL'       : true,
		'DL'       : true,
		'MENU'     : true
	};

	/**
	 * These element's cannot be simply unwrapped because they parents only
	 * allows these as their immediate child nodes.
	 *
	 * @private
	 * @see   GROUP_CONTAINERS
	 * @param {Object.<string, Array.<string>>}
	 */
	var GROUPED_ELEMENTS = {
		'LI'    : ['OL', 'UL', 'DL'],
		'DT'    : ['DL'],
		'DD'    : ['DL'],
		'TBODY' : ['TABLE'],
		'TR'    : ['TABLE', 'TBODY'],
		'TH'    : ['TABLE', 'TBODY'],
		'TD'    : ['TR', 'TH']
	};

	/**
	 * Checks if the given node is grouping container.
	 *
	 * Grouping containers include TABLE, FIELDSET, SELECT.  
	 *
	 * @see    GROUP_CONTAINERS
	 * @param  {Node} node
	 * @return {boolean}
	 * @memberOf html
	 */
	function isGroupContainer(node) {
		return GROUP_CONTAINERS[node.nodeName];
	}

	/**
	 * Checks if the given node an element that can only be a child of a group
	 * container.
	 *
	 * LI, TD are the classic cases.
	 *
	 * @see    GROUPED_CONTAINER
	 * @param  {Node} node
	 * @return {boolean}
	 * @memberOf html
	 */
	function isGroupedElement(node) {
		return !!GROUPED_ELEMENTS[node.nodeName];
	}

	/**
	 * Checks if the given node is one of the 4 list item elements.
	 *
	 * @param  {Node} node
	 * @return {boolean}
	 * @memberOf html
	 */
	function isListItem(node) {
		return !!LIST_ITEMS[node.nodeName];
	}

	/**
	 * Checks if the given node is one of the 4 list grouping containers.
	 *
	 * @param  {Node} node
	 * @return {boolean}
	 * @memberOf html
	 */
	function isListContainer(node) {
		return !!LIST_CONTAINERS[node.nodeName];
	}

	/**
	 * Checks whether `node` is the TABLE element.
	 *
	 * @param  {Node} node
	 * @return {boolean}
	 * @memberOf html
	 */
	function isTableContainer(node) {
		return node.nodeName === 'TABLE';
	}

	/**
	 * Check whether the given node is a void element type.
	 *
	 * @param  {Node} node
	 * @return {boolean}
	 * @memberOf html
	 */
	function isVoidNode(node) {
		return !!VOID_ELEMENTS[node.nodeName];
	}

	/**
	 * Similar to hasBlockStyle() except relies on the nodeName of the given
	 * node which works for attached as well as and detached nodes.
	 *
	 * Will return true if the given node is a block node type--regardless of
	 * how it is rendered.
	 *
	 * @param  {Node} node
	 * @return {boolean}
	 * @memberOf html
	 */
	function isBlockNode(node) {
		return !!BLOCK_LEVEL_ELEMENTS[node.nodeName];
	}

	/**
	 * Similar to hasInlineStyle() in the same sense as isBlockNode() is similar
	 * to hasBlockStyle().
	 *
	 * Will return true if the given node is an inline node type--regardless of
	 * how it is rendered.
	 *
	 * @param  {Node} node
	 * @return {boolean}
	 * @memberOf html
	 */
	function isInlineNode(node) {
		return !isBlockNode(node);
	}

	/**
	 * Check whether the given node is a text-level semantic element type.
	 *
	 * @param  {Node} node
	 * @return {boolean}
	 * @memberOf html
	 */
	function isTextLevelSemanticNode(node) {
		return !!TEXT_LEVEL_SEMANTIC_ELEMENTS[node.nodeName];
	}

	/**
	 * Heading tag names.
	 *
	 * @private
	 * @type {Object.<string, boolean>}
	 */
	var HEADINGS = {
		'H1' : true,
		'H2' : true,
		'H3' : true,
		'H4' : true,
		'H5' : true,
		'H6' : true
	};

	/**
	 * Whether the given node is a heading element.
	 *
	 * @param  {Node} node
	 * @return {boolean}
	 * @memberOf html
	 */
	function isHeading(node) {
		return !!HEADINGS[node.nodeName];
	}

	return {
		isBlockNode             : isBlockNode,
		isGroupContainer        : isGroupContainer,
		isGroupedElement        : isGroupedElement,
		isHeading               : isHeading,
		isInlineNode            : isInlineNode,
		isListContainer         : isListContainer,
		isListItem              : isListItem,
		isTableContainer        : isTableContainer,
		isTextLevelSemanticNode : isTextLevelSemanticNode,
		isVoidNode              : isVoidNode
	};
});
