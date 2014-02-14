/**
 * transform/ms-word-transform-list.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'misc',
	'arrays',
	'functions'
], function (
	Dom,
	Misc,
	Arrays,
	Fn
) {
	'use strict';

	/**
	 * Matches list numbers:
	 *
	 * 1)
	 * iv)
	 * a)
	 * 1.
	 * 3.1.6.
	 *
	 * @private
	 * @type {RegExp}
	 */
	var LIST_NUMBERS = new RegExp('^\\s*'
	                 + '('
	                 + '(?:[0-9]{1,3}|[a-zA-Z]{1,5})+' // 123 or xiii
	                 + '[\\.\\)]'                      // .   or )
	                 + ')+'
	                 + '\\s*$');

	/**
	 * Matches mso-list ignore style.
	 *
	 * @private
	 * @type {RegExp}
	 */
	var LIST_IGNORE_STYLE = /mso-list:\s*Ignore/i;

	/**
	 * Extracts the number from an ordered list item.
	 *
	 * @param  {Element} element
	 * @return {?String}
	 */
	function extractNumber(element) {
		if (!element.firstChild) {
			return null;
		}
		var match = LIST_NUMBERS.exec(Dom.text(element.firstChild));
		if (!match) {
			return null;
		}
		match = /(\w+)/i.exec(match[0]);
		return match ? match[1] : null;
	}

	/**
	 * Gets the numbering if the list for an ordered list.
	 *
	 * Returns an object containing a property "type" that denotes what the
	 * numbering type for the list is, and a property "start" that indicates
	 * the start value of the numbering.
	 *
	 * @param  {Element} p
	 * @return {Object}
	 */
	function getNumbering(p) {
		var number = extractNumber(p);
		if (!number) {
			return {};
		}
		var start;
		var type;
		if (/\d+/.test(number)) {
			start = number;
			type = '1';
		} else if (/i/i.test(number)) {
			type = (/I/.test(number)) ? 'I' : 'i';
		} else {
			type = (/[A-Z]/.test(number)) ? 'A' : 'a';
		}
		return {
			start : start,
			type  : type
		};
	}

	/**
	 * Checks whether the given list-paragraph contains a leading span that
	 * denotes it as an ordered list.
	 *
	 * @param  {Element} p
	 * @return {boolean}
	 */
	function isOrderedList(p) {
		if (!p.firstChild) {
			return false;
		}
		var font = Dom.getStyle(p.firstChild, 'fontFamily');
		if (font === 'Wingdings' || font === 'Symbol') {
			return false;
		}
		return null !== extractNumber(p);
	}

	/**
	 * Checks whether the given node is a leading span that msword uses to as a
	 * list bullet point or list number.
	 *
	 * <p class="MsoListParagraphCxSp...">
	 *
	 *     <span style="font-family:Symbol...">
	 *                        (Bullet/Number + Indentation) => isIgnorableSpan
	 *                                       |
	 *                                       |-----------.
	 *                                       |           |
	 *                                       v           v
	 *         <span style="mso-list:Ignore">·<span>&nbsp;&nbsp;</span></span>
	 *     </span>
	 *
	 *     <span>List item</span>
	 * </p>
	 *
	 * @param  {Node} node
	 * @return {boolean}
	 */
	function isIgnorableSpan(node) {
		if ('SPAN' === node.nodeName
				&& LIST_IGNORE_STYLE.test(Dom.getAttr(node, 'style'))) {
			return true;
		}
		return !Dom.isTextNode(node) && isIgnorableSpan(node.firstChild);
	}

	/**
	 * Checks whether the given node is a msword list-paragraph.
	 *
	 * @param  {Node} node
	 * @return {boolean}
	 */
	function isListParagraph(node) {
		if ('P' !== node.nodeName) {
			return false;
		}
		return Dom.hasClass(node, 'MsoListParagraph')
		    || Dom.hasClass(node, 'MsoListParagraphCxSpFirst')
		    || Dom.hasClass(node, 'MsoListParagraphCxSpMiddle')
		    || Dom.hasClass(node, 'MsoListParagraphCxSpLast');
	}

	/**
	 * Checks whether the given node is a list-paragraph that denotes the start
	 * of a new list.
	 *
	 * @param  {Node} node
	 * @return {boolean}
	 */
	function isFirstListParagraph(node) {
		return ('P' === node.nodeName)
			&& Dom.hasClass(node, 'MsoListParagraphCxSpFirst');
	}

	/**
	 * Checks whether the given node is a list-paragraph that denotes a one
	 * item list.
	 *
	 * @param  {Node} node
	 * @return {boolean}
	 */
	function isSingleListParagraph(node) {
		return ('P' === node.nodeName)
		    && Dom.hasClass(node, 'MsoListParagraph');
	}

	/**
	 * Checks whether the given element is a paragraph the demarks last item in
	 * a list.
	 *
	 * @param  {Element} node
	 * @return {boolean}
	 */
	function isLastListParagraph(node) {
		return ('P' === node.nodeName)
		    && Dom.hasClass(node, 'MsoListParagraphCxSpLast');
	}

	/**
	 * Checks whether the given node is a list-paragraph that denotes the start
	 * of a list item (as opposed to a continuation of a list element).
	 *
	 * @param  {Node} node
	 * @return {boolean}
	 */
	function isStartOfListItem(node) {
		if (!node.firstChild) {
			return false;
		}
		return isIgnorableSpan(node.firstChild);
	}

	/**
	 * Creates an LI from the given list-paragraph.
	 *
	 * @param  {Element}  p
	 * @param  {Document} doc
	 * @return {Element}
	 */
	function createItem(p, doc) {
		var li = doc.createElement('li');
		Dom.copy(Dom.children(p).filter(Fn.complement(isIgnorableSpan)), li);
		return li;
	}

	/**
	 * Creates an a list container from the given list-paragraph.
	 *
	 * @param  {Element}  p
	 * @param  {Document} doc
	 * @return {Element}
	 */
	function createContainer(p, doc) {
		var type = isOrderedList(p) ? 'ol' : 'ul';
		var list = doc.createElement(type);
		if ('ul' === type) {
			return list;
		}
		var numbering = getNumbering(p);
		if (Misc.defined(numbering.start)) {
			Dom.setAttr(list, 'start', numbering.start);
		}
		if (Misc.defined(numbering.type)) {
			Dom.setAttr(list, 'type', numbering.type);
		}
		return list;
	}

	/**
	 * Extracts the list item level from the given list-paragraph.
	 *
	 * @param  {Element} p
	 * @return {number}
	 */
	function extractLevel(p) {
		var match = /mso-list:.*?level(\d+)/i.exec(Dom.getAttr(p, 'style'));
		return (match && match[1]) ? parseInt(match[1], 10) : 1;
	}

	/**
	 * Creates a list DOM structure based on the given `list` data structure
	 * (created from createList()).
	 *
	 * @param  {Object}   list
	 * @param  {Document} doc
	 * @param  {String}   marker
	 * @return {Element}
	 */
	function constructList(list, doc, marker) {
		var container = createContainer(list.node, doc);
		var items = list.items.reduce(function (items, item) {
			var children = item.reduce(function (children, contents) {
				return children.concat(
					contents[marker] ? constructList(contents, doc, marker)
					                 : contents
				);
			}, []);
			var li = doc.createElement('li');
			Dom.copy(children, li);
			return items.concat(li);
		}, []);
		Dom.move(items, container);
		return container;
	}

	/**
	 * Takes a flat list of nodes, which consitutes a (multi-level) list in
	 * MS-Word and generates a standard HTML list DOM structure from it.
	 *
	 * This function requires that the given list of nodes must begin with a
	 * list-paragraph, and must end with a list-paragraph since this is the
	 * only valid way that lists are represented in MS-Word.
	 *
	 * @param  {Array.<Node>}              nodes
	 * @param  {Document}                  doc
	 * @param  {function(Element):Element} transform
	 * @return {?Element}
	 */
	function createList(nodes, doc, transform) {
		var i, j, l, node, list, first, last, level;
		var marker = '_aloha' + (new Date().getTime());

		for (i = 0; i < nodes.length; i++) {
			node = transform(nodes[i], doc);
			level = extractLevel(node);

			if (!list) {
				first = list = {
					parent : null,
					level  : 1,
					node   : node,
					items  : []
				};
				list[marker] = true;
			}

			if (level > list.level) {
				for (j = list.level; j < level; j++) {
					list = {
						parent : list,
						level  : j + 1,
						node   : node,
						items  : []
					};
					list[marker] = true;
					last = Arrays.last(list.parent.items);
					if (!last) {
						last = [];
						list.parent.items.push(last);
					}
					last.push(list);
				}
			}

			if (level < list.level) {
				for (j = level, l = list.level; j < l && list.parent; j++) {
					list = list.parent;
				}
			}

			if (!isListParagraph(node) || !isStartOfListItem(node)) {
				// Because `node` is line-breaking content that continues
				// inside of the previous list item
				last = Arrays.last(list.items);
				if (!last) {
					last = [];
					list.items.push(last);
				}
				last.push(node);
			} else {
				// Because `node` is a new list item
				var li = Dom.children(node).filter(Fn.complement(isIgnorableSpan));
				list.items.push(li);
			}
		}

		return first && constructList(first, doc, marker);
	}

	/**
	 * Transforms list-paragraphs in the given DOM structure to normalized HTML
	 * lists.
	 *
	 * Note that decimal-pointer counters are a styling issue and not a
	 * structural issue  This mean that the list numbering may look different,
	 * even when the normalized structure matches MS-Word's, until you apply
	 * the correct css styling.
	 * (see: https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Counters). 
	 *
	 * @param  {Element}  element
	 * @param  {Document} doc
	 * @return {Element} A normalized copy of `element`
	 */
	function transform(element, doc) {
		var children = Dom.children(element);
		var processed = [];
		var i;
		var l = children.length;
		var list;
		var last;
		var node;
		var nodes;
		for (i = 0; i < l; i++) {
			node = children[i];
			if (isSingleListParagraph(node)) {
				processed.push(createList([node], doc, transform));
			} else if (!isFirstListParagraph(node)) {
				processed.push(transform(node, doc));
			} else {
				nodes =  Dom.nextSiblings(node, isLastListParagraph);
				// Becuase Dom.nextSibling() excludes the predicative node
				last = Arrays.last(nodes).nextSibling;
				if (last) {
					nodes.push(last);
				}
				list = createList(nodes, doc, transform);
				if (list) {
					processed.push(list);
					i += nodes.length - 1;
				}
			}
		}
		var clone = Dom.clone(element, false);
		Dom.move(processed, clone);
		return clone;
	}

	return {
		transform: transform
	};
});
