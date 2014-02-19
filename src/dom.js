/**
 * dom.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom/attrs',
	'dom/classes',
	'dom/mutation',
	'dom/nodes',
	'dom/style',
	'dom/traversing'
], function Dom(
	Attrs,
	Classes,
	Mutation,
	Nodes,
	Style,
	Traversing
) {
	'use strict';

	/**
	 * Checks whether the given node is content editable.  An editing host is a
	 * node that is either an Element with a contenteditable attribute set to
	 * the true state, or the Element child of a Document whose designMode is
	 * enabled.
	 *
	 * An element with the class "aloha-editable" is considered an editing
	 * host.
	 *
	 * @param {!Node} node
	 * @return {boolean} True if `node` is content editable.
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
	 */
	function isContentEditable(node) {
		return Nodes.isElementNode(node) && 'true' === node.contentEditable;
	}

	/**
	 * Checks whether the given element is editable.
	 *
	 * An element with the class "aloha-editable" is considered editable.
	 *
	 * @reference:
	 * http://www.whatwg.org/specs/web-apps/current-work/multipage/editing.html#contenteditable
	 * http://www.whatwg.org/specs/web-apps/current-work/multipage/editing.html#designMode
	 *
	 * @param {!Node} node
	 * @return {boolean}
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

	function isEditableNode(node) {
		return isEditable(Nodes.isTextNode(node) ? node.parentNode : node);
	}

	/**
	 * Checks whether the given element is an editing host.
	 *
	 * @param {!Node} node
	 * @return {boolean}
	 */
	function editingHost(node) {
		if (isEditingHost(node)) {
			return node;
		}
		if (!isEditable(node)) {
			return null;
		}
		var ancestor = node.parentNode;
		while (ancestor && !isEditingHost(ancestor)) {
			ancestor = ancestor.parentNode;
		}
		return ancestor;
	}

	function editableParent(node) {
		var ancestor = node.parentNode;
		while (ancestor && !isEditable(ancestor)) {
			ancestor = ancestor.parentNode;
		}
		return ancestor;
	}

	var parser = document.createElement('DIV');

	function parseNode(html) {
		parser.innerHTML = html;
		var node = parser.firstChild;
		parser.removeChild(node);
		return node;
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

	function stringify(node) {
		return Serializer.serializeToString(node);
	}

	function isNode(node) {
		var str = Object.prototype.toString.call(node);
		// TODO: is this really the best way to do it?
		return (/^\[object (Text|Comment|HTML\w*Element)\]$/).test(str);
	}

	function parseReviver(key, value) {
		if (value && value['type'] === 'Node') {
			var str = value['value'];
			if (null != str) {
				value = parseNode(str);
			}
		}
		return value;
	}

	function stringifyReplacer(key, value) {
		if (value && isNode(value)) {
			value = {
				'type': 'Node',
				'value': stringify(value)
			};
		}
		return value;
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
		Style.set(elem, Browsers.VENDOR_PREFIX + '-user-select', 'all');
		elem.onselectstart = null;
	}

	function disableSelection(elem) {
		elem.removeAttribute('unselectable', 'on');
		Style.set(elem, Browsers.VENDOR_PREFIX + '-user-select', 'none');
		elem.onselectstart = Fn.returnFalse;
	}

	/**
	 * Gets the window to which the given document belongs.
	 *
	 * @param   {Document} doc
	 * @returns {Window}
	 */
	function documentWindow(doc) {
		return doc['defaultView'] || doc['parentWindow'];
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
		isTextNode              : Nodes.isTextNode,
		isElementNode           : Nodes.isElementNode,
		isFragmentNode          : Nodes.isFragmentNode,
		isEmptyTextNode         : Nodes.isEmptyTextNode,
		equals                  : Nodes.equals,
		contains                : Nodes.contains,
		followedBy              : Nodes.followedBy,
		hasText                 : Nodes.hasText,
		fragmentHtml            : Nodes.fragmentHtml,

		append            : Mutation.append,
		merge             : Mutation.merge,
		moveNextAll       : Mutation.moveNextAll,
		moveBefore        : Mutation.moveBefore,
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

		addClass     : Classes.add,
		removeClass  : Classes.remove,
		hasClass     : Classes.has,

		attrNames    : Attrs.attrNames,
		hasAttrs     : Attrs.has,
		attrs        : Attrs.attrs,
		setAttr      : Attrs.set,
		setAttrNS    : Attrs.setNS,
		getAttr      : Attrs.get,
		getAttrNS    : Attrs.getNS,
		removeAttr   : Attrs.remove,
		removeAttrNS : Attrs.removeNS,
		removeAttrs  : Attrs.removeAll,

		removeStyle       : Style.remove,
		setStyle          : Style.set,
		getStyle          : Style.get,
		getComputedStyle  : Style.getComputedStyle,
		getComputedStyles : Style.getComputedStyles,

		query                        : Traversing.query,
		nextSiblings                 : Traversing.nextSiblings,
		nextWhile                    : Traversing.nextWhile,
		prevWhile                    : Traversing.prevWhile,
		upWhile                      : Traversing.upWhile,
		walk                         : Traversing.walk,
		walkRec                      : Traversing.walkRec,
		walkUntil                    : Traversing.walkUntil,
		walkUntilNode                : Traversing.walkUntilNode,
		findBackward                 : Traversing.findBackward,
		findForward                  : Traversing.findForward,
		climbUntil                   : Traversing.climbUntil,
		childAndParentsUntil         : Traversing.childAndParentsUntil,
		childAndParentsUntilIncl     : Traversing.childAndParentsUntilIncl,
		childAndParentsUntilNode     : Traversing.childAndParentsUntilNode,
		childAndParentsUntilInclNode : Traversing.childAndParentsUntilInclNode,

		stringify         : stringify,
		stringifyReplacer : stringifyReplacer,
		parseReviver      : parseReviver,

		ensureExpandoId   : ensureExpandoId,

		enableSelection   : enableSelection,
		disableSelection  : disableSelection,

		// FIXME: move to html.js
		isEditable        : isEditable,
		isEditableNode    : isEditableNode,
		isEditingHost     : isEditingHost,
		isContentEditable : isContentEditable,

		documentWindow     : documentWindow,
		editingHost        : editingHost,
		editableParent     : editableParent
	};
});
