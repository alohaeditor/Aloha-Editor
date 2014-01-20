/**
 * transform/ms-word/utils.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'predicates',
	'paste-utils'
], function(
	Dom,
	Predicates,
	PasteUtils
) {
	'use strict';

	/**
	 * Checks the givne element has any textContent.
	 *
	 * @param  {Element} element
	 * @return {boolean}
	 */
	function hasText(element) {
		return Dom.textContent(element).trim().length > 0;
	}

	/**
	 * Get next sibling ignoring empty Text Nodes
	 *
	 * @param  {Element} node
	 * @return {Element} Next sibling
	 */
	function nextNotEmptyElementSibling(node) {
		node = node.nextElementSibling;
		while (node && !hasText(node)) {
			node = node.nextElementSibling;
		}
		return node;
	}

	/**
	 * Create a heading HTML destination with the children of 'node'
	 *
	 * @param {Element} source
	 * @param {Element} destination
	 */
	function moveChildren(source, destination) {
		if (Dom.isTextNode(source)) {
			destination.appendChild(source.cloneNode(true));
		} else {
			while (source.firstChild) {
				destination.appendChild(source.firstChild);
			}
		}
	}

	/**
	 * Replaces the node by other.
	 *
	 * @param {Element} source
	 * @param {Element} destination
	 */
	function replaceNode(source, destination) {
		moveChildren(source, destination);
		if (source.parentNode) {
			source.parentNode.replaceChild(destination, source);
		}
	}

	/**
	 * Get the next sibling and removes the actual element
	 *
	 * @param {Element} element
	 * @param {Element} parentNode
	 * @return {Element}
	 */
	function nextNotEmptyElementSiblingAndRemoves(element, parentNode) {
		var nextSibling = nextNotEmptyElementSibling(element);
		parentNode.removeChild(element);
		return nextSibling;
	}

	/**
	 * Removes empty child elements and returns those who are not
	 *
	 * @param node
	 * @return {NodeList}
	 */
	function removeEmptyChildren(node) {
		var childNodes = node.childNodes;

		for (var i = 0, len = childNodes.length; i < len; i++) {
			if (childNodes[i] && !hasText(childNodes[i])) {
				node.removeChild(childNodes[i]);
			}
		}
	}

	/**
	 * Removes recursively any child when 'conditionFn' returns true.
	 *
	 * @param {Element} node
	 * @param {function} conditionFn Function which returns true or false to decide if
	 *                   the child should be removed
	 */
	function removeDescendants(node, conditionFn) {
		PasteUtils.walkDescendants(node, conditionFn, Dom.remove);
	}

	/**
	 * Unwraps any child of 'node' when the function 'conditionFn' is true.
	 *
	 * @param {Element} node
	 * @param {function(Element):boolean} conditionFn
	 */
	function unwrapDescendants(node, conditionFn) {
		PasteUtils.walkDescendants(node, conditionFn, function(child) {
			Dom.removeShallow(child);
		});
	}

	/**
	 * Wrap several childNodes in a new 'nodeName' HTML element.
	 * childNodes belongs to the same parent.
	 *
	 * @param {Array.<Element>} childNodes
	 * @param {string} nodeName
	 */
	function wrapChildNodes(childNodes, nodeName) {
		if (childNodes.length === 0) {
			return;
		}

		var parentNode = childNodes[0].parentNode,
		    tag = parentNode.ownerDocument.createElement(nodeName);

		parentNode.insertBefore(tag, childNodes[0]);

		for (var i = 0, len = childNodes.length; i < len; i++) {
			tag.appendChild(childNodes[i]);
		}
	}

	/**
	 * Removes all attributes from an element.
	 *
	 * @param {!Element} element
	 */
	function removeAllAttributes(element) {
		var attributes = element.attributes;
		if (!attributes) {
			return;
		}
		for (var i = attributes.length - 1; i >= 0 ; i--) {
			if (attributes[i] !== undefined && element.hasAttribute(attributes[i].name)) {
				Dom.removeAttr(element, attributes[i].name);
			}
		}
	}

	/**
	 * Cleans the given element.
	 *
	 * @param {Element} element
	 */
	function cleanElement(element) {
		var child,
		    prev,
			textLevelElement;

		removeAllAttributes(element);

		unwrapDescendants(element, function(node) {
			return node.nodeName === 'SPAN' || node.nodeName === 'FONT';
		});

		PasteUtils.walkDescendants(element, function(node) {
			return node.nodeName !== 'IMG' && node.nodeName !== 'A';
		}, removeAllAttributes);

		child = element.firstChild;

		while (child) {
			textLevelElement = Predicates.isTextLevelSemanticNode(child)
			                   && !Predicates.isVoidNode(child);

			if (child.nodeName === 'SPAN' || child.nodeName === 'FONT'
			    || (!hasText(child) && textLevelElement)) {
				Dom.removeShallow(child);
				child = prev || element.firstChild;
			} else {
				prev = child;
				child = child.nextSibling;
			}
		}
	}

	/**
	 * Creates a nested list.
	 * @param {integer} actualLevel
	 * @param {integer} lastLevel
	 * @param {Element} listHTML
	 * @param {function():Element} createListFn
	 * @return {Element}
	 */
	function createNestedList(actualLevel, lastLevel, listHTML, createListFn) {
		var newList;

		while (actualLevel > lastLevel) {
			newList = createListFn();
			listHTML.appendChild(newList);
			listHTML = newList;
			lastLevel++;
		}

		while (actualLevel < lastLevel) {
			if (listHTML.parentNode === null) {
				newList = createListFn();
				newList.appendChild(listHTML);
			}
			listHTML = listHTML.parentNode;
			lastLevel--;
		}
		return listHTML;
	}

	return {
		wrapChildNodes: wrapChildNodes,
		moveChildren: moveChildren,
		hasText: hasText,
		removeEmptyChildren: removeEmptyChildren,
		removeDescendants: removeDescendants,
		unwrapDescendants: unwrapDescendants,
		nextNotEmptyElementSibling: nextNotEmptyElementSibling,
		nextSiblingAndRemoves: nextNotEmptyElementSiblingAndRemoves,
		replaceNode: replaceNode,
		removeAllAttributes: removeAllAttributes,
		cleanElement: cleanElement,
		createNestedList: createNestedList
	};
});
