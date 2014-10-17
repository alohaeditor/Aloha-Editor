/**
 * html.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * @see
 * https://en.wikipedia.org/wiki/HTML_element#Content_vs._presentation
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Content_categories
 * http://www.whatwg.org/specs/web-apps/2007-10-26/multipage/section-contenteditable.html
 * http://lists.whatwg.org/htdig.cgi/whatwg-whatwg.org/2011-May/031577.html
 * https://dvcs.w3.org/hg/domcore/raw-file/tip/overview.html#concept-range-bp
 * http://lists.whatwg.org/htdig.cgi/whatwg-whatwg.org/2011-May/031577.html
 * @namespace html
 */
define([
	'html/styles',
	'html/elements',
	'html/mutation',
	'html/traversing',
	'html/predicates',
	'browsers', // Hack for require-pronto
	'cursors' // Hack for require-pronto
], function (
	Styles,
	Elements,
	Mutation,
	Traversing,
	Predicates,
	__hack1__,
	__hack2__
) {
	'use strict';

	return {
		isRendered                : Elements.isRendered,
		isUnrendered              : Elements.isUnrendered,
		isUnrenderedWhitespace    : Elements.isUnrenderedWhitespace,
		parse                     : Elements.parse,
		isVoidType                : Elements.isVoidType,

		isStyleInherited          : Styles.isStyleInherited,
		isWhiteSpacePreserveStyle : Styles.isWhiteSpacePreserveStyle,
		hasBlockStyle             : Styles.hasBlockStyle,
		hasInlineStyle            : Styles.hasInlineStyle,
		hasLinebreakingStyle      : Styles.hasLinebreakingStyle,

		prop                      : Mutation.prop,
		insertBreak               : Mutation.insertBreak,
		removeBreak               : Mutation.removeBreak,
		insertLineBreak           : Mutation.insertLineBreak,
		isRenderedBr              : Mutation.isRenderedBr,
		nextLineBreak             : Mutation.nextLineBreak,
		isVisuallyAdjacent        : Mutation.isVisuallyAdjacent,

		prev                      : Traversing.prev,
		next                      : Traversing.next,
		prevNode                  : Traversing.prevNode,
		nextNode                  : Traversing.nextNode,
		prevSignificantOffset     : Traversing.prevSignificantOffset,
		nextSignificantOffset     : Traversing.nextSignificantOffset,
		prevSignificantBoundary   : Traversing.prevSignificantBoundary,
		nextSignificantBoundary   : Traversing.nextSignificantBoundary,
		isAtStart                 : Traversing.isAtStart,
		isAtEnd                   : Traversing.isAtEnd,
		isBoundariesEqual         : Traversing.isBoundariesEqual,
		expandBackward            : Traversing.expandBackward,
		expandForward             : Traversing.expandForward,
		stepForward               : Traversing.stepForward,
		stepBackward              : Traversing.stepBackward,
		walkBetween               : Traversing.walkBetween,

		isBlockNode               : Predicates.isBlockNode,
		isGroupContainer          : Predicates.isGroupContainer,
		isGroupedElement          : Predicates.isGroupedElement,
		isHeading                 : Predicates.isHeading,
		isInlineNode              : Predicates.isInlineNode,
		isListContainer           : Predicates.isListContainer,
		isListItem                : Predicates.isListItem,
		isTableContainer          : Predicates.isTableContainer,
		isTextLevelSemanticNode   : Predicates.isTextLevelSemanticNode,
		isVoidNode                : Predicates.isVoidNode
	};
});
