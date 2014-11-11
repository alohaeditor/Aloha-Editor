/**
 * dom.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 * @namespace dom
 */
define([
	'functions',
	'dom/attributes',
	'dom/classes',
	'dom/mutation',
	'dom/nodes',
	'dom/style',
	'dom/traversing',
	'browsers'
], function (
	Fn,
	Attributes,
	Classes,
	Mutation,
	Nodes,
	Style,
	Traversing,
	Browsers
) {
	'use strict';

	/**
	 * Checks whether the given node is content editable.  An editing host is a
	 * node that is either an Element with a contenteditable attribute set to
	 * the true state, or the Element child of a Document whose designMode is
	 * enabled.
	 *
	 * An element with the class "aloha-editable" is considered an editing host.
	 *
	 * @param {!Node} node
	 * @return {boolean} True if `node` is content editable.
	 * @memberOf dom
	 */
	function isEditingHost(node) {
		if (!Nodes.isElementNode(node)) {
			return false;
		}
		if ('true' === node.getAttribute('contentEditable')) {
			return true;
		}
		if (Classes.has(node, 'aloha-editable')) {
			return true;
		}
		var parent = node.paretNode;
		if (!parent) {
			return false;
		}
		if (parent.nodeType === Nodes.Nodes.DOCUMENT && 'on' === parent.designMode) {
			return true;
		}
	}

	/**
	 * Check if the given node's contentEditable attribute is `true`.
	 *
	 * @param  {Element} node
	 * @return {boolean}
	 * @memberOf dom
	 */
	function isContentEditable(node) {
		return Nodes.isElementNode(node) && 'true' === node.contentEditable;
	}

	/**
	 * Checks whether the given element is editable.
	 *
	 * An element with the class "aloha-editable" is considered editable.
	 *
	 * @see:
	 * http://www.whatwg.org/specs/web-apps/current-work/multipage/editing.html#contenteditable
	 * http://www.whatwg.org/specs/web-apps/current-work/multipage/editing.html#designMode
	 *
	 * @param {!Node} node
	 * @return {boolean}
	 * @memberOf dom
	 */
	function isEditable(node) {
		if (!Nodes.isElementNode(node)) {
			return false;
		}
		var contentEditable = node.getAttribute('contentEditable');
		if ('true' === contentEditable || '' === contentEditable) {
			return true;
		}
		if ('false' === contentEditable) {
			return false;
		}
		// Because the value of `contentEditable` can be "inherited" according
		// to specification, and null according to browser implementation.
		if (Classes.has(node, 'aloha-editable')) {
			return true;
		}
		var parent = node.parentNode;
		if (!parent) {
			return false;
		}
		if (parent.nodeType === Nodes.Nodes.DOCUMENT && 'on' === parent.designMode) {
			return true;
		}
		return isEditable(parent);
	}

	/**
	 * This function is missing documentation.
	 * @TODO Complete documentation.
	 * @memberOf dom
	 */
	function isEditableNode(node) {
		return isEditable(Nodes.isTextNode(node) ? node.parentNode : node);
	}

	/**
	 * Gets the given node's editing host.
	 *
	 * @param  {Node} node
	 * @return {boolean}
	 * @memberOf dom
	 */
	function editingHost(node) {
		if (isEditingHost(node)) {
			return node;
		}
		if (!isEditableNode(node)) {
			return null;
		}
		var ancestor = node.parentNode;
		while (ancestor && !isEditingHost(ancestor)) {
			ancestor = ancestor.parentNode;
		}
		return ancestor;
	}

	/**
	 * Finds the nearest editable ancestor of the given node.
	 *
	 * @param  {Node} node
	 * @return {Element}
	 * @memberOf dom
	 */
	function editableParent(node) {
		var ancestor = node.parentNode;
		while (ancestor && !isEditable(ancestor)) {
			ancestor = ancestor.parentNode;
		}
		return ancestor;
	}

	/**
	 * Used to serialize outerHTML of DOM elements in older (pre-HTML5) Gecko,
	 * Safari, and Opera browsers.
	 *
	 * Beware that XMLSerializer generates an XHTML string (<div class="team" />
	 * instead of <div class="team"></div>).  It is noted here:
	 * http://stackoverflow.com/questions/1700870/how-do-i-do-outerhtml-in-firefox
	 * that some browsers (like older versions of Firefox) have problems with
	 * XMLSerializer, and an alternative, albeit more expensive option, is
	 * described.
	 *
	 * @type {XMLSerializer}
	 */
	var Serializer = window.XMLSerializer && new window.XMLSerializer();

	function serialize(node) {
		return Serializer.serializeToString(node);
	}

	/**
	 * true if obj is a Node
	 * @param  {*} node
	 * @return {boolean}
	 */
	function isNode(obj) {
		var str = Object.prototype.toString.call(obj);
		// TODO: is this really the best way to do it?
		return (/^\[object (Text|Comment|HTML\w*Element)\]$/).test(str);
	}

	var expandoIdCnt = 0;
	var expandoIdProp = '!aloha-expando-node-id';

	/**
	 * @fix me jslint hates this. it generates 4 errors
	 */
	function ensureExpandoId(node) {
		return node[expandoIdProp] = node[expandoIdProp] || ++expandoIdCnt;
	}

	function enableSelection(elem) {
		elem.removeAttribute('unselectable', 'on');
		Style.set(elem, Browsers.VENDOR_PREFIX + 'user-select', 'all');
		elem.onselectstart = null;
	}

	function disableSelection(elem) {
		elem.removeAttribute('unselectable', 'on');
		Style.set(elem, Browsers.VENDOR_PREFIX + 'user-select', 'none');
		elem.onselectstart = Fn.returnFalse;
	}

	/**
	 * Gets the window to which the given document belongs.
	 *
	 * @param   {Document} doc
	 * @returns {Window}
	 * @memberOf dom
	 */
	function documentWindow(doc) {
		return doc['defaultView'] || doc['parentWindow'];
	}

	/**
	 * Returns scroll position from top.
	 *
	 * @param  {!Document} doc
	 * @return {number}
	 * @memberOf dom
	 */
	function scrollTop(doc) {
		var win = documentWindow(doc);
		if (!Fn.isNou(win.pageYOffset)) {
			return win.pageYOffset;
		}
		var docElem = doc.documentElement;
		var scrollTopElem = docElem.clientHeight ? docElem : doc.body;
		return scrollTopElem.scrollTop;
	}

	/**
	 * Returns scroll position from left.
	 *
	 * @param  {!Document} doc
	 * @return {number}
	 * @memberOf dom
	 */
	function scrollLeft(doc) {
		var win = documentWindow(doc);
		if (!Fn.isNou(win.pageXOffset)) {
			return win.pageXOffset;
		}
		var docElem = doc.documentElement;
		var scrollLeftElem = docElem.clientWidth ? docElem : doc.body;
		return scrollLeftElem.scrollLeft;
	}

	/**
	 * Calculate absolute offsetTop or offsetLeft properties
	 * for an element
	 *
	 * @private
	 * @param {!Element} element
	 * @param {string}   property
	 * @return {integer}
	 */
	function absoluteOffset(element, property) {
		var offset = element[property];
		var parent = element.offsetParent;
		while (parent) {
			offset += parent[property];
			parent = parent.offsetParent;
		}
		return offset;
	}

	/**
	 * Calculates the absolute top position
	 * of an element
	 *
	 * @param {!Element} element
	 * @return {integer}
	 * @memberOf dom
	 */
	function absoluteTop(element) {
		return absoluteOffset(element, 'offsetTop');
	}

	/**
	 * Calculates the absolute left position
	 * of an element
	 *
	 * @param {!Element} element
	 * @return {integer}
	 * @memberOf dom
	 */
	function absoluteLeft(element) {
		return absoluteOffset(element, 'offsetLeft');
	}

	return {
		Nodes                   : Nodes.Nodes,
		offset                  : Nodes.offset,
		cloneShallow            : Nodes.cloneShallow,
		clone                   : Nodes.clone,
		text                    : Nodes.text,
		children                : Nodes.children,
		nthChild                : Nodes.nthChild,
		numChildren             : Nodes.numChildren,
		nodeIndex               : Nodes.nodeIndex,
		nodeLength              : Nodes.nodeLength,
		hasChildren             : Nodes.hasChildren,
		nodeAtOffset            : Nodes.nodeAtOffset,
		normalizedNthChild      : Nodes.normalizedNthChild,
		normalizedNodeIndex     : Nodes.normalizedNodeIndex,
		realFromNormalizedIndex : Nodes.realFromNormalizedIndex,
		normalizedNumChildren   : Nodes.normalizedNumChildren,
		isNode                  : isNode,
		isTextNode              : Nodes.isTextNode,
		isElementNode           : Nodes.isElementNode,
		isFragmentNode          : Nodes.isFragmentNode,
		isEmptyTextNode         : Nodes.isEmptyTextNode,
		isSameNode              : Nodes.isSameNode,
		equals                  : Nodes.equals,
		contains                : Nodes.contains,
		followedBy              : Nodes.followedBy,
		hasText                 : Nodes.hasText,
		outerHtml               : Nodes.outerHtml,

		append            : Mutation.append,
		merge             : Mutation.merge,
		moveNextAll       : Mutation.moveNextAll,
		moveBefore        : Mutation.moveBefore,
		moveAfter         : Mutation.moveAfter,
		move              : Mutation.move,
		copy              : Mutation.copy,
		wrap              : Mutation.wrap,
		wrapWith          : Mutation.wrapWith,
		insert            : Mutation.insert,
		insertAfter       : Mutation.insertAfter,
		replace           : Mutation.replace,
		replaceShallow    : Mutation.replaceShallow,
		remove            : Mutation.remove,
		removeShallow     : Mutation.removeShallow,
		removeChildren    : Mutation.removeChildren,

		addClass     : Classes.add,
		removeClass  : Classes.remove,
		hasClass     : Classes.has,

		attrs        : Attributes.attrs,
		getAttr      : Attributes.get,
		getAttrNS    : Attributes.getNS,
		hasAttrs     : Attributes.has,
		removeAttr   : Attributes.remove,
		removeAttrNS : Attributes.removeNS,
		removeAttrs  : Attributes.removeAll,
		setAttr      : Attributes.set,
		setAttrNS    : Attributes.setNS,

		removeStyle       : Style.remove,
		setStyle          : Style.set,
		getStyle          : Style.get,
		getComputedStyle  : Style.getComputedStyle,
		getComputedStyles : Style.getComputedStyles,

		query                        : Traversing.query,
		nextNonAncestor              : Traversing.nextNonAncestor,
		nextWhile                    : Traversing.nextWhile,
		nextUntil                    : Traversing.nextUntil,
		nextSibling                  : Traversing.nextSibling,
		nextSiblings                 : Traversing.nextSiblings,
		prevWhile                    : Traversing.prevWhile,
		prevUntil                    : Traversing.prevUntil,
		prevSibling                  : Traversing.prevSibling,
		prevSiblings                 : Traversing.prevSiblings,
		nodeAndNextSiblings          : Traversing.nodeAndNextSiblings,
		nodeAndPrevSiblings          : Traversing.nodeAndPrevSiblings,
		walk                         : Traversing.walk,
		walkRec                      : Traversing.walkRec,
		walkUntilNode                : Traversing.walkUntilNode,
		forward                      : Traversing.forward,
		backward                     : Traversing.backward,
		findForward                  : Traversing.findForward,
		findBackward                 : Traversing.findBackward,
		upWhile                      : Traversing.upWhile,
		climbUntil                   : Traversing.climbUntil,
		childAndParentsUntil         : Traversing.childAndParentsUntil,
		childAndParentsUntilIncl     : Traversing.childAndParentsUntilIncl,
		childAndParentsUntilNode     : Traversing.childAndParentsUntilNode,
		childAndParentsUntilInclNode : Traversing.childAndParentsUntilInclNode,
		parentsUntil                 : Traversing.parentsUntil,
		parentsUntilIncl             : Traversing.parentsUntilIncl,
		forwardPreorderBacktraceUntil  : Traversing.forwardPreorderBacktraceUntil,
		backwardPreorderBacktraceUntil : Traversing.backwardPreorderBacktraceUntil,

		serialize         : serialize,
		ensureExpandoId   : ensureExpandoId,

		enableSelection   : enableSelection,
		disableSelection  : disableSelection,

		// FIXME: move to html.js
		isEditable        : isEditable,
		isEditableNode    : isEditableNode,
		isEditingHost     : isEditingHost,
		isContentEditable : isContentEditable,

		documentWindow    : documentWindow,
		editingHost       : editingHost,
		editableParent    : editableParent,
		scrollTop         : scrollTop,
		scrollLeft        : scrollLeft,
		absoluteTop       : absoluteTop,
		absoluteLeft      : absoluteLeft
	};
});
