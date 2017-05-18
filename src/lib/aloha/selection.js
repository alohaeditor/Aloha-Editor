/* selection.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2012 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * Aloha Editor is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or any later version.
 *
 * Aloha Editor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 *
 * As an additional permission to the GNU GPL version 2, you may distribute
 * non-source (e.g., minimized or compacted) forms of the Aloha-Editor
 * source code without the copy of the GNU GPL normally required,
 * provided you include this license notice and a URL through which
 * recipients can access the Corresponding Source.
 */
define([
	'aloha/core',
	'jquery',
	'util/class',
	'util/range',
	'util/arrays',
	'util/strings',
	'util/dom',
	'util/dom2',
	'util/browser',
	'util/html',
	'aloha/console',
	'PubSub',
	'aloha/engine',
	'aloha/ecma5shims',
	'aloha/rangy-core'
], function (
	Aloha,
	jQuery,
	Class,
	Range,
	Arrays,
	Strings,
	Dom,
	Dom2,
	Browser,
	Html,
	console,
	PubSub,
	Engine,
	e5s
) {
	"use strict";

	var GENTICS = window.GENTICS;

	function isCollapsedAndEmptyOrEndBr(rangeObject) {
		var firstChild;
		if (rangeObject.startContainer !== rangeObject.endContainer) {
			return false;
		}
		// check whether the container starts in an element node
		if (rangeObject.startContainer.nodeType != 1) {
			return false;
		}
		firstChild = rangeObject.startContainer.firstChild;
		return (!firstChild || (!firstChild.nextSibling && firstChild.nodeName == 'BR'));
	}

	function isCollapsedAndEndBr(rangeObject) {
		if (rangeObject.startContainer !== rangeObject.endContainer) {
			return false;
		}
		if (rangeObject.startContainer.nodeType != 1) {
			return false;
		}
		return Engine.isEndBreak(rangeObject.startContainer);
	}

	var prevStartContext = null;
	var prevEndContext = null;

	function makeContextHtml(node, parents) {
		var result = [],
			parent,
			len,
			i;
		if (1 === node.nodeType && node.nodeName !== 'BODY' && node.nodeName !== 'HTML') {
			result.push(node.cloneNode(false).outerHTML);
		} else {
			result.push('#' + node.nodeType);
		}
		for (i = 0, len = parents.length; i < len; i++) {
			parent = parents[i];
			if (parent.nodeName === 'BODY' || parent.nodeName === 'HTML') {
				// Although we limit the ancestors in most cases to the
				// active editable, in some cases (copy&paste) the
				// parent may be outside.
				// On IE7 this means the following code may clone the
				// HTML node too, which causes the browser to crash.
				// On other browsers, this is just an optimization
				// because the body and html elements should probably
				// not be considered part of the context of an edit
				// operation.
				break;
			}
			result.push(parent.cloneNode(false).outerHTML);
		}
		return result.join('');
	}

	function getChangedContext(node, context) {
		var until = Aloha.activeEditable ? Aloha.activeEditable.obj.parent()[0] : null;
		var parents = jQuery(node).parentsUntil(until).get();
		var html = makeContextHtml(node, parents);
		var equal = (context && node === context.node && Arrays.equal(context.parents, parents) && html === context.html);
		return equal ? null : {
			node: node,
			parents: parents,
			html: html
		};
	}

	function triggerSelectionContextChanged(rangeObject, event) {
		var startContainer = rangeObject.startContainer;
		var endContainer = rangeObject.endContainer;
		if (!startContainer || !endContainer) {
			console.warn("aloha/selection", "encountered range object without start or end container");
			return;
		}
		var startContext = getChangedContext(startContainer, prevStartContext);
		var endContext = getChangedContext(endContainer, prevEndContext);
		if (!startContext && !endContext) {
			return;
		}
		prevStartContext = startContext;
		prevEndContext = endContext;

		/**
		 * @api documented in the guides
		 */
		PubSub.pub('aloha.selection.context-change', {
			range: rangeObject,
			event: event
		});
	}

	/**
	 * Checks if `range` is contained inside an Aloha-Block
	 * @param {Range} range
	 * @return {*}
	 */
	function rangeStartInBlock(range) {
		return jQuery(range.startContainer).closest('.aloha-editable,.aloha-block,.aloha-table-cell-editable,.aloha-table-cell_active')
		                   .first()
			               .hasClass('aloha-block');
	}

	/**
	 * Gets parent block element
	 *
	 * @param {Element} element
	 * @return {*}
	 */
	function getBlockElement(element) {
		while (element && !Html.isBlock(element)) {
			element = element.parentNode;
		}
		return element;
	}

	/**
	 * Checks if `rangeObject` ends at the beginning of a text Node.
	 *
	 * @param {RangeObject} rangeObject
	 * @return {boolean}
	 */
	function isEndContainerAtBeginTexNode(rangeObject) {
		var endContainer = rangeObject.endContainer;
		var endOffset = rangeObject.endOffset;
		var i;

		if (!Dom2.isTextNode(endContainer)) {
			return false;
		}

		for (i = endOffset - 1; i >= 0; i--) {
			if (jQuery.trim(endContainer.textContent[i]).length !== 0) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Checks if ranges ends in the beginning of a block element.
	 *
	 * @param {RangeObejct} rangeObejct
	 * @return {boolean}
	 */
	function rangeEndsInBeginningBlockElement(rangeObejct) {
		var endContainer = rangeObejct.endContainer;
		var node = endContainer;

		var blockElement = getBlockElement(rangeObejct.endContainer);

		if (!isEndContainerAtBeginTexNode(rangeObejct)) {
			return false;
		}

		node = node.previousSibling || node.parentNode;

		while (node !== blockElement) {
			if (node.previousSibling) {
				node = node.previousSibling;
				if (Html.isRenderedNode(node)) {
					return false;
				}
			} else {
				node = node.parentNode;
			}
		}

		return node === blockElement;
	}

	/**
	 * Sets the end of `range` before `element`.
	 * @param {Range} range
	 * @param {Element} element
	 */
	function setEndRangeBeforeElement(range, element) {
		range.setEndBefore(element);

		Aloha.getSelection().removeAllRanges();
		Aloha.getSelection().addRange(range);
	}

	/**
	 * Corrects the range if the range is expanded and it ends in the beginning of a
	 * block element.
	 *
	 * @param {RangeObject} rangeObject
	 */
	function correctFirefoxRangeIssue(rangeObject) {
		if (!rangeObject.isCollapsed() && rangeEndsInBeginningBlockElement(rangeObject)) {
			var blockElement = getBlockElement(rangeObject.endContainer);
			var range = Aloha.getSelection().getRangeAt(0);

			setEndRangeBeforeElement(range, blockElement);
		}
	}

	/**
	 * @namespace Aloha
	 * @class Selection
	 * This singleton class always represents the current user selection
	 * @singleton
	 */
	var Selection = Class.extend({
		_constructor: function () {
			// Pseudo Range Clone being cleaned up for better HTML wrapping support
			this.rangeObject = {};

			this.preventSelectionChangedFlag = false; // will remember if someone urged us to skip the next aloha-selection-changed event

			this.correctSelectionFlag = false; // this is true, when the current selection is corrected (to prevent endless loops)

			// define basics first
			this.tagHierarchy = {
				'textNode': {},
				'abbr': {
					'textNode': true
				},
				'b': {
					'textNode': true,
					'b': true,
					'i': true,
					'em': true,
					'sup': true,
					'sub': true,
					'br': true,
					'span': true,
					'img': true,
					'a': true,
					'del': true,
					'ins': true,
					'u': true,
					'cite': true,
					'q': true,
					'code': true,
					'abbr': true,
					'strong': true
				},
				'pre': {
					'textNode': true,
					'b': true,
					'i': true,
					'em': true,
					'sup': true,
					'sub': true,
					'br': true,
					'span': true,
					'img': true,
					'a': true,
					'del': true,
					'ins': true,
					'u': true,
					'cite': true,
					'q': true,
					'code': true,
					'abbr': true
				},
				'blockquote': {
					'textNode': true,
					'b': true,
					'i': true,
					'em': true,
					'sup': true,
					'sub': true,
					'br': true,
					'span': true,
					'img': true,
					'a': true,
					'del': true,
					'ins': true,
					'u': true,
					'cite': true,
					'q': true,
					'code': true,
					'abbr': true,
					'p': true,
					'h1': true,
					'h2': true,
					'h3': true,
					'h4': true,
					'h5': true,
					'h6': true
				},
				'ins': {
					'textNode': true,
					'b': true,
					'i': true,
					'em': true,
					'sup': true,
					'sub': true,
					'br': true,
					'span': true,
					'img': true,
					'a': true,
					'u': true,
					'p': true,
					'h1': true,
					'h2': true,
					'h3': true,
					'h4': true,
					'h5': true,
					'h6': true
				},
				'ul': {
					'li': true
				},
				'ol': {
					'li': true
				},
				'dl': {
					'dt': true,
					'dd': true
				},
				'dt': {
					'textNode': true
				},
				'dd': {
					'textNode': true,
					'b': true,
					'i': true,
					'em': true,
					'sup': true,
					'sub': true,
					'br': true,
					'span': true,
					'img': true,
					'ul': true,
					'ol': true,
					'dt': true,
					'table': true,
					'h1': true,
					'h2': true,
					'h3': true,
					'h4': true,
					'h5': true,
					'h6': true,
					'del': true,
					'ins': true,
					'u': true,
					'p': true,
					'div': true,
					'pre': true,
					'blockquote': true,
					'a': true
				},
				'li': {
					'textNode': true,
					'b': true,
					'i': true,
					'em': true,
					'sup': true,
					'sub': true,
					'br': true,
					'span': true,
					'img': true,
					'ul': true,
					'ol': true,
					'h1': true,
					'h2': true,
					'h3': true,
					'h4': true,
					'h5': true,
					'h6': true,
					'p': true,
					'del': true,
					'ins': true,
					'u': true,
					'a': true
				},
				'tr': {
					'td': true,
					'th': true
				},
				'table': {
					'tr': true
				},
				'div': {
					'textNode': true,
					'b': true,
					'i': true,
					'em': true,
					'sup': true,
					'sub': true,
					'br': true,
					'span': true,
					'img': true,
					'ul': true,
					'ol': true,
					'dt': true,
					'table': true,
					'h1': true,
					'h2': true,
					'h3': true,
					'h4': true,
					'h5': true,
					'h6': true,
					'del': true,
					'ins': true,
					'u': true,
					'p': true,
					'div': true,
					'pre': true,
					'blockquote': true,
					'a': true
				},
				'h1': {
					'textNode': true,
					'b': true,
					'i': true,
					'em': true,
					'sup': true,
					'sub': true,
					'br': true,
					'span': true,
					'img': true,
					'a': true,
					'del': true,
					'ins': true,
					'u': true
				}
			};

			// now reference the basics for all other equal tags (important: don't forget to include
			// the basics itself as reference: 'b' : this.tagHierarchy.b
			this.tagHierarchy = {
				'textNode': this.tagHierarchy.textNode,
				'abbr': this.tagHierarchy.abbr,
				'br': this.tagHierarchy.textNode,
				'img': this.tagHierarchy.textNode,
				'b': this.tagHierarchy.b,
				'strong': this.tagHierarchy.b,
				'code': this.tagHierarchy.b,
				'q': this.tagHierarchy.b,
				'blockquote': this.tagHierarchy.blockquote,
				'cite': this.tagHierarchy.b,
				'i': this.tagHierarchy.b,
				'em': this.tagHierarchy.b,
				'sup': this.tagHierarchy.b,
				'sub': this.tagHierarchy.b,
				'span': this.tagHierarchy.b,
				'del': this.tagHierarchy.del,
				'ins': this.tagHierarchy.ins,
				'u': this.tagHierarchy.b,
				'p': this.tagHierarchy.b,
				'pre': this.tagHierarchy.pre,
				'a': this.tagHierarchy.b,
				'ul': this.tagHierarchy.ul,
				'ol': this.tagHierarchy.ol,
				'dl': this.tagHierarchy.dl,
				'li': this.tagHierarchy.li,
				'div': this.tagHierarchy.div,
				'h1': this.tagHierarchy.h1,
				'h2': this.tagHierarchy.h1,
				'h3': this.tagHierarchy.h1,
				'h4': this.tagHierarchy.h1,
				'h5': this.tagHierarchy.h1,
				'h6': this.tagHierarchy.h1,
				// for tables (and all related tags) we set the hierarchy to div
				// this enables to add anything into tables. We also need to set this
				// for tr, td and th, because the check in canTag1WrapTag2 does not check
				// transitively
				'table': this.tagHierarchy.div,
				'tr': this.tagHierarchy.div,
				'th': this.tagHierarchy.div,
				'td': this.tagHierarchy.div
			};

			// When applying this elements to selection they will replace the assigned elements
			this.replacingElements = {
				'h1': {
					'p': true,
					'h1': true,
					'h2': true,
					'h3': true,
					'h4': true,
					'h5': true,
					'h6': true,
					'pre': true,
					'blockquote': true
				}
			};
			this.replacingElements = {
				'h1': this.replacingElements.h1,
				'h2': this.replacingElements.h1,
				'h3': this.replacingElements.h1,
				'h4': this.replacingElements.h1,
				'h5': this.replacingElements.h1,
				'h6': this.replacingElements.h1,
				'pre': this.replacingElements.h1,
				'p': this.replacingElements.h1,
				'blockquote': this.replacingElements.h1
			};
			this.allowedToStealElements = {
				'h1': {
					'textNode': true
				}
			};
			this.allowedToStealElements = {
				'h1': this.allowedToStealElements.h1,
				'h2': this.allowedToStealElements.h1,
				'h3': this.allowedToStealElements.h1,
				'h4': this.allowedToStealElements.h1,
				'h5': this.allowedToStealElements.h1,
				'h6': this.allowedToStealElements.h1,
				'p': this.tagHierarchy.b
			};
		},

		/**
		 * Class definition of a SelectionTree (relevant for all formatting / markup changes)
		 * TODO: remove this (was moved to range.js)
		 * Structure:
		 * +
		 * |-domobj: <reference to the DOM Object> (NOT jQuery)
		 * |-selection: defines if this node is marked by user [none|partial|full]
		 * |-children: recursive structure like this
		 * @hide
		 */
		SelectionTree: function () {
			this.domobj = {};
			this.selection = undefined;
			this.children = [];
		},

		/**
		 * INFO: Method is used for integration with Gentics Aloha, has no use otherwise
		 * Updates the rangeObject according to the current user selection
		 * Method is always called on selection change
		 * @param objectClicked Object that triggered the selectionChange event
		 * @return true when rangeObject was modified, false otherwise
		 * @hide
		 */
		onChange: function (objectClicked, event, timeout, editableChanged) {
			if (this.updateSelectionTimeout) {
				window.clearTimeout(this.updateSelectionTimeout);
			}

			// We get no valid selection from IE it the event target was
			// a text input element, so the following setTimeout() approach
			// would never terminate. We let the browser handle all events
			// in such elements, but we still have to make sure the
			// editable containing the event target is active.
			if (event && (event.target.nodeName === 'INPUT' || event.target.nodeName === 'TEXTAREA')) {
				var editable = Aloha.getEditableHost(objectClicked);

				if (editable && Aloha.activeEditable !== editable) {
					editable.activate();
				}

				return;
			}

			// We have to update the selection in a timeout due to an IE
			// bug that is is caused by selecting some text and then
			// clicking once inside the selection (which collapses the
			// selection inside the previous selection).
			var selection = this;
			this.updateSelectionTimeout = window.setTimeout(function () {
				var range = new Aloha.Selection.SelectionRange(true);
				// We have to work around an IE bug that causes the user
				// selection to be incorrectly set on the body element
				// when the updateSelectionTimeout triggers. The
				// selection corrects itself after waiting a while.
				if (!range.startContainer || 'HTML' === range.startContainer.nodeName || 'BODY' === range.startContainer.nodeName) {
					if (!this.updateSelectionTimeout) {
						// First wait 5 millis, then 20 millis, 50 millis, 110 millis etc.
						selection.onChange(objectClicked, event, 10 + (timeout || 5) * 2);
					}
					return;
				} else {
					// activate the editable host of the selection
					var editable = Aloha.getEditableHost(jQuery(range.startContainer));
					if (editable) {
						editable.activate();
					}

					// And yet another IE workaround. Somehow the caret is not
					// positioned inside the clicked editable. This occures only
					// when switching editables in IE. In those cases the caret is
					// invisible. I tried to trace the origin of the issue but i
					// could not find the place where the caret is mispositioned.
					// I noticed that IE is sometimes adding drag handles to
					// editables. Aloha is removing those handles.
					// If those handles are visible it apears that two clicks are needed
					// to activate the editable. The first click is to select the
					// editable and the second to enable it and activeate it. I added a
					// range select call that will cirumvent this issue by resetting
					// the selection. I also checked the range object. In all cases
					// i found the range object contained correct properties. The
					// workaround will only be applied for IE.
					if (Aloha.browser.msie && editableChanged) {
						range.select();
					}
				}
				Aloha.Selection._updateSelection(event, range);
			}, timeout || 5);
		},

		/**
		 * prevents the next aloha-selection-changed event from being triggered
		 */
		preventSelectionChanged: function () {
			this.preventSelectionChangedFlag = true;
		},

		/**
		 * will return wheter selection change event was prevented or not, and reset the preventSelectionChangedFlag
		 * @return {Boolean} true if aloha-selection-change event was prevented
		 */
		isSelectionChangedPrevented: function () {
			var prevented = this.preventSelectionChangedFlag;
			this.preventSelectionChangedFlag = false;
			return prevented;
		},

		/**
		 * Checks if the current rangeObject common ancector container is edtiable
		 * @return {Boolean} true if current common ancestor is editable
		 */
		isSelectionEditable: function () {
			return (this.rangeObject.commonAncestorContainer && jQuery(this.rangeObject.commonAncestorContainer).contentEditable());
		},

		/**
		 * This method checks, if the current rangeObject common ancestor container has a 'data-aloha-floatingmenu-visible' Attribute.
		 * Needed in Floating Menu for exceptional display of floatingmenu.
		 */
		isFloatingMenuVisible: function () {
			var visible = jQuery(Aloha.Selection.rangeObject.commonAncestorContainer).attr('data-aloha-floatingmenu-visible');
			if (visible !== 'undefined') {
				if (visible === 'true') {
					return true;
				}
				return false;
			}
			return false;
		},

		/**
		 * INFO: Method is used for integration with Gentics Aloha, has no use otherwise
		 * Updates the rangeObject according to the current user selection
		 * Method is always called on selection change
		 * @param event jQuery browser event object
		 * @return true when rangeObject was modified, false otherwise
		 * @hide
		 */
		updateSelection: function (event) {
			return this._updateSelection(event, null);
		},

		/**
		 * Internal version of updateSelection that adds the range parameter to be
		 * able to work around an IE bug that caused the current user selection
		 * sometimes to be on the body element.
		 * @param {Object} event
		 * @param {Object} range a substitute for the current user selection. if not provided,
		 *   the current user selection will be used.
		 * @hide
		 */
		_updateSelection: function (event, range) {
			if (event) {
				if (event.target.nodeName === 'INPUT' || event.target.nodeName === 'TEXTAREA'
						|| (event.originalEvent && true === event.originalEvent.stopSelectionUpdate)) {
					return false;
				}
			}

			if (typeof range === 'undefined') {
				return false;
			}

			this.rangeObject = range =
					range || new Aloha.Selection.SelectionRange(true);

			// workaround for FF selection bug, where it is possible to move the selection INTO a hr
			if (range && range.startContainer
					&& 'HR' === range.startContainer.nodeName
					&& range.endContainer
					&& 'HR' === range.endContainer.nodeName) {
				Aloha.getSelection().removeAllRanges();
				return true;
			}

			// Determine the common ancestor container and update the selection
			// tree.
			range.update();

			// Workaround for nasty IE bug that allows the user to select
			// text nodes inside areas with contenteditable "false"
			if (range && range.startContainer && range.endContainer && !this.correctSelectionFlag) {
				var inEditable =
						jQuery(range.commonAncestorContainer)
							.closest('.aloha-editable').length > 0;

				// we only will move the selection out of the non-editable area (in an editable)
				// if the range is collapsed (blinking cursor)
				if (inEditable && range.isCollapsed()) {
					var validStartPosition = this._validEditablePosition(range.startContainer);
					var validEndPosition = this._validEditablePosition(range.endContainer);
					var newPos;
					// when we are moving down (with the cursor down key), we want to position the
					// cursor AFTER the non-editable area
					// otherwise BEFORE the non-editable area
					var movingDown = event && (event.keyCode === 40 || event.keyCode === 39);

					if (!validStartPosition) {
						newPos = this._getNearestEditablePosition(range.startContainer, movingDown);
						if (newPos) {
							range.startContainer = newPos.container;
							range.startOffset = newPos.offset;
						}
					}
					if (!validEndPosition) {
						newPos = this._getNearestEditablePosition(range.endContainer, movingDown);
						if (newPos) {
							range.endContainer = newPos.container;
							range.endOffset = newPos.offset;
						}
					}
					if (!validStartPosition || !validEndPosition) {
						this.correctSelectionFlag = true;
						range.correctRange();
						range.select();
					}
				}
			}
			this.correctSelectionFlag = false;

			// check if aloha-selection-changed event has been prevented
			if (this.isSelectionChangedPrevented()) {
				return true;
			}

			Aloha.trigger('aloha-selection-changed-before', [this.rangeObject, event]);

			// throw the event that the selection has changed. Plugins now have the
			// chance to react on the currentElements[childCount].children.lengthged selection
			Aloha.trigger('aloha-selection-changed', [this.rangeObject, event]);

			triggerSelectionContextChanged(this.rangeObject, event);

			Aloha.trigger('aloha-selection-changed-after', [this.rangeObject, event]);

			// At least Mozilla still has the focus on the href input field.
			var editable = jQuery(this.rangeObject.startContainer).closest('.aloha-editable,.aloha-table-cell-editable');

			if (editable.length > 0 && Aloha.browser.mozilla && document.activeElement !== editable[0]) {
				editable.focus();
			}

			return true;
		},

		/**
		 * Check whether a position with the given node as container is a valid editable position
		 * @param {DOMObject} node DOM node
		 * @return true if the position is editable, false if not
		 */
		_validEditablePosition: function (node) {
			if (!node) {
				return false;
			}
			switch (node.nodeType) {
			case 1:
				return jQuery(node).contentEditable();
			case 3:
				return jQuery(node.parentNode).contentEditable();
			default:
				return false;
			}
		},

		/**
		 * Starting with the given node (which is supposed to be not editable)
		 * find the nearest editable position
		 * 
		 * @param {DOMObject} node DOM node
		 * @param {Boolean} forward true for searching forward, false for searching backward
		 */
		_getNearestEditablePosition: function (node, forward) {
			var current = node;
			var parent = current.parentNode;
			while (parent !== null && !jQuery(parent).contentEditable()) {
				current = parent;
				parent = parent.parentNode;
			}
			if (current === null) {
				return false;
			}
			if (forward) {
				// check whether the element after the non editable element is editable and a blocklevel element
				if (Dom.isBlockLevelElement(current.nextSibling) && jQuery(current.nextSibling).contentEditable()) {
					return {
						container: current.nextSibling,
						offset: 0
					};
				} else {
					return {
						container: parent,
						offset: Dom.getIndexInParent(current) + 1
					};
				}
			} else {
				// check whether the element before the non editable element is editable and a blocklevel element
				if (Dom.isBlockLevelElement(current.previousSibling) && jQuery(current.previousSibling).contentEditable()) {
					return {
						container: current.previousSibling,
						offset: current.previousSibling.childNodes.length
					};
				} else {
					return {
						container: parent,
						offset: Dom.getIndexInParent(current)
					};
				}
			}
		},

		/**
		 * creates an object with x items containing all relevant dom objects.
		 * Structure:
		 * +
		 * |-domobj: <reference to the DOM Object> (NOT jQuery)
		 * |-selection: defines if this node is marked by user [none|partial|full]
		 * |-children: recursive structure like this ("x.." because it's then shown last in DOM Browsers...)
		 * TODO: remove this (was moved to range.js)
		 *
		 * @param rangeObject "Aloha clean" range object including a commonAncestorContainer
		 * @return obj selection
		 * @hide
		 */
		getSelectionTree: function (rangeObject) {
			if (!rangeObject) { // if called without any parameters, the method acts as getter for this.selectionTree
				return this.rangeObject.getSelectionTree();
			}
			if (!rangeObject.commonAncestorContainer) {
				Aloha.Log.error(this, 'the rangeObject is missing the commonAncestorContainer');
				return false;
			}

			this.inselection = false;

			// before getting the selection tree, we do a cleanup
			if (GENTICS.Utils.Dom.doCleanup({ 'merge': true }, rangeObject)) {
				rangeObject.update();
				rangeObject.select();
			}

			return this.recursiveGetSelectionTree(rangeObject, rangeObject.commonAncestorContainer);
		},

		/**
		 * Recursive inner function for generating the selection tree.
		 * TODO: remove this (was moved to range.js)
		 * @param rangeObject range object
		 * @param currentObject current DOM object for which the selection tree shall be generated
		 * @return array of SelectionTree objects for the children of the current DOM object
		 * @hide
		 */
		recursiveGetSelectionTree: function (rangeObject, currentObject) {
			// get all direct children of the given object
			var jQueryCurrentObject = jQuery(currentObject),
				childCount = 0,
				that = this,
				currentElements = [];

			jQueryCurrentObject.contents().each(function (index) {
				var selectionType = 'none',
					startOffset = false,
					endOffset = false,
					collapsedFound = false,
					i,
				    elementsLength,
					noneFound = false,
					partialFound = false,
					fullFound = false;

				// check for collapsed selections between nodes
				if (rangeObject.isCollapsed() && currentObject === rangeObject.startContainer && rangeObject.startOffset == index) {
					// insert an extra selectiontree object for the collapsed selection here
					currentElements[childCount] = new Aloha.Selection.SelectionTree();
					currentElements[childCount].selection = 'collapsed';
					currentElements[childCount].domobj = undefined;
					that.inselection = false;
					collapsedFound = true;
					childCount++;
				}

				if (!that.inselection && !collapsedFound) {
					// the start of the selection was not yet found, so look for it now
					// check whether the start of the selection is found here

					// Try to read the nodeType property and return if we do not have permission
					// ie.: frame document to an external URL
					var nodeType;
					try {
						nodeType = this.nodeType;
					} catch (e) {
						return;
					}

					// stop on iframes
					if (this.nodeName === 'IFRAME') {
						return;
					}

					// check is dependent on the node type
					switch (nodeType) {
					case 3:
						// text node
						if (this === rangeObject.startContainer) {
							// the selection starts here
							that.inselection = true;

							// when the startoffset is > 0, the selection type is only partial
							selectionType = rangeObject.startOffset > 0 ? 'partial' : 'full';
							startOffset = rangeObject.startOffset;
							endOffset = this.length;
						}
						break;
					case 1:
						// element node
						if (this === rangeObject.startContainer && rangeObject.startOffset === 0) {
							// the selection starts here
							that.inselection = true;
							selectionType = 'full';
						}
						if (currentObject === rangeObject.startContainer && rangeObject.startOffset === index) {
							// the selection starts here
							that.inselection = true;
							selectionType = 'full';
						}
						break;
					}
				}

				if (that.inselection && !collapsedFound) {
					if (selectionType == 'none') {
						selectionType = 'full';
					}
					// we already found the start of the selection, so look for the end of the selection now
					// check whether the end of the selection is found here

					switch (this.nodeType) {
					case 3:
						// text node
						if (this === rangeObject.endContainer) {
							// the selection ends here
							that.inselection = false;

							// check for partial selection here
							if (rangeObject.endOffset < this.length) {
								selectionType = 'partial';
							}
							if (startOffset === false) {
								startOffset = 0;
							}
							endOffset = rangeObject.endOffset;
						}
						break;
					case 1:
						// element node
						if (this === rangeObject.endContainer && rangeObject.endOffset === 0) {
							that.inselection = false;
						}
						break;
					}
					if (currentObject === rangeObject.endContainer && rangeObject.endOffset <= index) {
						that.inselection = false;
						selectionType = 'none';
					}
				}

				// create the current selection tree entry
				currentElements[childCount] = new Aloha.Selection.SelectionTree();
				currentElements[childCount].domobj = this;
				currentElements[childCount].selection = selectionType;
				if (selectionType == 'partial') {
					currentElements[childCount].startOffset = startOffset;
					currentElements[childCount].endOffset = endOffset;
				}

				// now do the recursion step into the current object
				currentElements[childCount].children = that.recursiveGetSelectionTree(rangeObject, this);
				elementsLength = currentElements[childCount].children.length;

				// check whether a selection was found within the children
				if (elementsLength > 0) {
					for (i = 0; i < elementsLength; ++i) {
						switch (currentElements[childCount].children[i].selection) {
						case 'none':
							noneFound = true;
							break;
						case 'full':
							fullFound = true;
							break;
						case 'partial':
							partialFound = true;
							break;
						}
					}

					if (partialFound || (fullFound && noneFound)) {
						// found at least one 'partial' selection in the children, or both 'full' and 'none', so this element is also 'partial' selected
						currentElements[childCount].selection = 'partial';
					} else if (fullFound && !partialFound && !noneFound) {
						// only found 'full' selected children, so this element is also 'full' selected
						currentElements[childCount].selection = 'full';
					}
				}

				childCount++;
			});

			// extra check for collapsed selections at the end of the current element
			if (rangeObject.isCollapsed() && currentObject === rangeObject.startContainer && rangeObject.startOffset == currentObject.childNodes.length) {
				currentElements[childCount] = new Aloha.Selection.SelectionTree();
				currentElements[childCount].selection = 'collapsed';
				currentElements[childCount].domobj = undefined;
			}

			return currentElements;
		},

		/**
		 * Get the currently selected range
		 * @return {Aloha.Selection.SelectionRange} currently selected range
		 * @method
		 */
		getRangeObject: function () {
			return this.rangeObject;
		},

		/**
		 * method finds out, if a node is within a certain markup or not
		 * @param rangeObj Aloha rangeObject
		 * @param startOrEnd boolean; defines, if start or endContainer should be used: false for start, true for end
		 * @param markupObject jQuery object of the markup to look for
		 * @param tagComparator method, which is used to compare the dom object and the jQuery markup object. the method must accept 2 parameters, the first is the domobj, the second is the jquery object. if no method is specified, the method this.standardTextLevelSemanticsComparator is used
		 * @param limitObject dom object which limits the search are within the dom. normally this will be the active Editable
		 * @return true, if the markup is effective on the range objects start or end node
		 * @hide
		 */
		isRangeObjectWithinMarkup: function (rangeObject, startOrEnd, markupObject, tagComparator, limitObject) {
			var domObj = !startOrEnd ? rangeObject.startContainer : rangeObject.endContainer,
				that = this,
				parents = jQuery(domObj).parents(),
				returnVal = false,
				i = -1;

			// check if a comparison method was passed as parameter ...
			if (typeof tagComparator !== 'undefined' && typeof tagComparator !== 'function') {
				Aloha.Log.error(this, 'parameter tagComparator is not a function');
			}
			// ... if not use this as standard tag comparison method
			if (typeof tagComparator === 'undefined') {
				tagComparator = function (domobj, markupObject) {
					return that.standardTextLevelSemanticsComparator(domobj, markupObject); // TODO should actually be this.getStandardTagComparator(markupObject)
				};
			}

			if (parents.length > 0) {
				parents.each(function () {
					// the limit object was reached (normally the Editable Element)
					if (this === limitObject) {
						Aloha.Log.debug(that, 'reached limit dom obj');
						return false; // break() of jQuery .each(); THIS IS NOT THE FUNCTION RETURN VALUE
					}
					if (tagComparator(this, markupObject)) {
						if (returnVal === false) {
							returnVal = [];
						}
						Aloha.Log.debug(that, 'reached object equal to markup');
						i++;
						returnVal[i] = this;
						return true; // continue() of jQuery .each(); THIS IS NOT THE FUNCTION RETURN VALUE
					}
				});
			}
			return returnVal;
		},

		/**
		 * standard method, to compare a domobj and a jquery object for sections and grouping content (e.g. p, h1, h2, ul, ....).
		 * is always used when no other tag comparator is passed as parameter
		 * @param domobj domobject to compare with markup
		 * @param markupObject jQuery object of the markup to compare with domobj
		 * @return true if objects are equal and false if not
		 * @hide
		 */
		standardSectionsAndGroupingContentComparator: function (domobj, markupObject) {
			if (domobj.nodeType !== 1) {
				Aloha.Log.debug(this, 'only element nodes (nodeType == 1) can be compared');
				return false;
			}
			if (!markupObject[0].nodeName) {
				return false;
			}
			var elemMap = Aloha.Selection.replacingElements[domobj.nodeName.toLowerCase()];
			return elemMap && elemMap[markupObject[0].nodeName.toLowerCase()];
		},

		/**
		 * standard method, to compare a domobj and a jquery object for their tagName (aka span elements, e.g. b, i, sup, span, ...).
		 * is always used when no other tag comparator is passed as parameter
		 * @param domobj domobject to compare with markup
		 * @param markupObject jQuery object of the markup to compare with domobj
		 * @return true if objects are equal and false if not
		 * @hide
		 */
		standardTagNameComparator: function (domobj, markupObject) {
			if (domobj.nodeType === 1) {
				if (domobj.nodeName != markupObject[0].nodeName) {
					return false;
				}
				return true;
			}
			Aloha.Log.debug(this, 'only element nodes (nodeType == 1) can be compared');
			return false;
		},

		/**
		 * standard method, to compare a domobj and a jquery object for text level semantics (aka span elements, e.g. b, i, sup, span, ...).
		 * is always used when no other tag comparator is passed as parameter
		 * @param domobj domobject to compare with markup
		 * @param markupObject jQuery object of the markup to compare with domobj
		 * @return true if objects are equal and false if not
		 * @hide
		 */
		standardTextLevelSemanticsComparator: function (domobj, markupObject) {
			// only element nodes can be compared
			if (domobj.nodeType === 1) {
				if (domobj.nodeName != markupObject[0].nodeName) {
					return false;
				}
				if (!this.standardAttributesComparator(domobj, markupObject)) {
					return false;
				}
				return true;
			}
			Aloha.Log.debug(this, 'only element nodes (nodeType == 1) can be compared');
			return false;
		},


		/**
		 * standard method, to compare attributes of one dom obj and one markup obj (jQuery)
		 * @param domobj domobject to compare with markup
		 * @param markupObject jQuery object of the markup to compare with domobj
		 * @return true if objects are equal and false if not
		 * @hide
		 */
		standardAttributesComparator: function (domobj, markupObject) {
			var classesA = Strings.words((domobj && domobj.className) || '');
			var classesB = Strings.words((markupObject.length && markupObject[0].className) || '');
			Arrays.sortUnique(classesA);
			Arrays.sortUnique(classesB);
			return Arrays.equal(classesA, classesB);
		},

		/**
		 * method finds out, if a node is within a certain markup or not
		 * @param rangeObj Aloha rangeObject
		 * @param markupObject jQuery object of the markup to be applied (e.g. created with obj = jQuery('<b></b>'); )
		 * @param tagComparator method, which is used to compare the dom object and the jQuery markup object. the method must accept 2 parameters, the first is the domobj, the second is the jquery object. if no method is specified, the method this.standardTextLevelSemanticsComparator is used
		 * @return void; TODO: should return true if the markup applied successfully and false if not
		 * @hide
		 */
		changeMarkup: function (rangeObject, markupObject, tagComparator) {
			var tagName = markupObject[0].tagName.toLowerCase(),
				newCAC,
			    limitObject,
				backupRangeObject,
				relevantMarkupObjectsAtSelectionStart = this.isRangeObjectWithinMarkup(rangeObject, false, markupObject, tagComparator, limitObject),
				relevantMarkupObjectsAtSelectionEnd = this.isRangeObjectWithinMarkup(rangeObject, true, markupObject, tagComparator, limitObject),
				nextSibling,
			    relevantMarkupObjectAfterSelection,
				prevSibling,
			    relevantMarkupObjectBeforeSelection,
				extendedRangeObject;
			var parentElement;

			// if the element is a replacing element (like p/h1/h2/h3/h4/h5/h6...), which must not wrap each other
			// use a clone of rangeObject
			if (this.replacingElements[tagName]) {
				// backup rangeObject for later selection;
				backupRangeObject = rangeObject;

				// create a new range object to not modify the orginal
				rangeObject = new this.SelectionRange(rangeObject);

				// either select the active Editable as new commonAncestorContainer (CAC) or use the body
				if (Aloha.activeEditable) {
					newCAC = Aloha.activeEditable.obj.get(0);
				} else {
					newCAC = jQuery('body');
				}
				// update rangeObject by setting the newCAC and automatically recalculating the selectionTree
				rangeObject.update(newCAC);

				// store the information, that the markupObject can be replaced (not must be!!) inside the jQuery markup object
				markupObject.isReplacingElement = true;
			} else {
				// if the element is NOT a replacing element, then something needs to be selected, otherwise it can not be wrapped
				// therefor the method can return false, if nothing is selected ( = rangeObject is collapsed)
				if (rangeObject.isCollapsed()) {
					Aloha.Log.debug(this, 'early returning from applying markup because nothing is currently selected');
					return false;
				}
			}

			// is Start/End DOM Obj inside the markup to change
			if (Aloha.activeEditable) {
				limitObject = Aloha.activeEditable.obj[0];
			} else {
				limitObject = jQuery('body');
			}

			if (!markupObject.isReplacingElement && rangeObject.startOffset === 0) { // don't care about replacers, because they never extend
				if (null != (prevSibling = this.getTextNodeSibling(false, rangeObject.commonAncestorContainer.parentNode, rangeObject.startContainer))) {
					relevantMarkupObjectBeforeSelection = this.isRangeObjectWithinMarkup({
						startContainer: prevSibling,
						startOffset: 0
					}, false, markupObject, tagComparator, limitObject);
				}
			}
			if (!markupObject.isReplacingElement && (rangeObject.endOffset === rangeObject.endContainer.length)) { // don't care about replacers, because they never extend
				if (null != (nextSibling = this.getTextNodeSibling(true, rangeObject.commonAncestorContainer.parentNode, rangeObject.endContainer))) {
					relevantMarkupObjectAfterSelection = this.isRangeObjectWithinMarkup({
						startContainer: nextSibling,
						startOffset: 0
					}, false, markupObject, tagComparator, limitObject);
				}
			}

			// decide what to do (expand or reduce markup)
			// Alternative A: from markup to no-markup: markup will be removed in selection;
			// reapplied from original markup start to selection start
			if (!markupObject.isReplacingElement && (relevantMarkupObjectsAtSelectionStart && !relevantMarkupObjectsAtSelectionEnd)) {
				Aloha.Log.info(this, 'markup 2 non-markup');
				this.prepareForRemoval(rangeObject.getSelectionTree(), markupObject, tagComparator);
				jQuery(relevantMarkupObjectsAtSelectionStart).addClass('preparedForRemoval');
				this.insertCroppedMarkups(relevantMarkupObjectsAtSelectionStart, rangeObject, false, tagComparator);
			} else if (!markupObject.isReplacingElement && relevantMarkupObjectsAtSelectionStart && relevantMarkupObjectsAtSelectionEnd) {
				// Alternative B: from markup to markup:
				// remove selected markup (=split existing markup if single, shrink if two different)
				Aloha.Log.info(this, 'markup 2 markup');
				this.prepareForRemoval(rangeObject.getSelectionTree(), markupObject, tagComparator);
				this.splitRelevantMarkupObject(relevantMarkupObjectsAtSelectionStart, relevantMarkupObjectsAtSelectionEnd, rangeObject, tagComparator);
			} else if (!markupObject.isReplacingElement && ((!relevantMarkupObjectsAtSelectionStart && relevantMarkupObjectsAtSelectionEnd) || relevantMarkupObjectAfterSelection || relevantMarkupObjectBeforeSelection)) { //
				// Alternative C: from no-markup to markup OR with next2markup:
				// new markup is wrapped from selection start to end of originalmarkup, original is remove afterwards
				Aloha.Log.info(this, 'non-markup 2 markup OR with next2markup');
				// move end of rangeObject to end of relevant markups
				if (relevantMarkupObjectBeforeSelection && relevantMarkupObjectAfterSelection) {
					extendedRangeObject = new Aloha.Selection.SelectionRange(rangeObject);
					extendedRangeObject.startContainer = jQuery(relevantMarkupObjectBeforeSelection[relevantMarkupObjectBeforeSelection.length - 1]).textNodes()[0];
					extendedRangeObject.startOffset = 0;
					extendedRangeObject.endContainer = jQuery(relevantMarkupObjectAfterSelection[relevantMarkupObjectAfterSelection.length - 1]).textNodes().last()[0];
					extendedRangeObject.endOffset = extendedRangeObject.endContainer.length;
					extendedRangeObject.update();
					this.applyMarkup(extendedRangeObject.getSelectionTree(), rangeObject, markupObject, tagComparator);
					Aloha.Log.info(this, 'double extending previous markup(previous and after selection), actually wrapping it ...');

				} else if (relevantMarkupObjectBeforeSelection && !relevantMarkupObjectAfterSelection && !relevantMarkupObjectsAtSelectionEnd) {
					this.extendExistingMarkupWithSelection(relevantMarkupObjectBeforeSelection, rangeObject, false, tagComparator);
					Aloha.Log.info(this, 'extending previous markup');

				} else if (relevantMarkupObjectBeforeSelection && !relevantMarkupObjectAfterSelection && relevantMarkupObjectsAtSelectionEnd) {
					extendedRangeObject = new Aloha.Selection.SelectionRange(rangeObject);
					extendedRangeObject.startContainer = jQuery(relevantMarkupObjectBeforeSelection[relevantMarkupObjectBeforeSelection.length - 1]).textNodes()[0];
					extendedRangeObject.startOffset = 0;
					extendedRangeObject.endContainer = jQuery(relevantMarkupObjectsAtSelectionEnd[relevantMarkupObjectsAtSelectionEnd.length - 1]).textNodes().last()[0];
					extendedRangeObject.endOffset = extendedRangeObject.endContainer.length;
					extendedRangeObject.update();
					this.applyMarkup(extendedRangeObject.getSelectionTree(), rangeObject, markupObject, tagComparator);
					Aloha.Log.info(this, 'double extending previous markup(previous and relevant at the end), actually wrapping it ...');

				} else if (!relevantMarkupObjectBeforeSelection && relevantMarkupObjectAfterSelection) {
					this.extendExistingMarkupWithSelection(relevantMarkupObjectAfterSelection, rangeObject, true, tagComparator);
					Aloha.Log.info(this, 'extending following markup backwards');

				} else {
					this.extendExistingMarkupWithSelection(relevantMarkupObjectsAtSelectionEnd, rangeObject, true, tagComparator);
				}
			} else if (markupObject.isReplacingElement || (!relevantMarkupObjectsAtSelectionStart && !relevantMarkupObjectsAtSelectionEnd && !relevantMarkupObjectBeforeSelection && !relevantMarkupObjectAfterSelection)) {
				// Alternative D: no-markup to no-markup: easy
				Aloha.Log.info(this, 'non-markup 2 non-markup');

				// workaround to keep the caret at the right position if it's an empty element
				// applyMarkup was not working correctly and has a lot of overhead we don't need in that case
				if (isCollapsedAndEmptyOrEndBr(rangeObject)) {
					var newMarkup = markupObject.clone();

					if (isCollapsedAndEndBr(rangeObject)) {
						newMarkup[0].appendChild(Engine.createEndBreak());
					}

					// setting the focus is needed for mozilla and IE 7 to have a working rangeObject.select()
					if (Aloha.activeEditable && Aloha.browser.mozilla && document.activeElement !== Aloha.activeEditable.obj[0]) {
						Aloha.activeEditable.obj.focus();
					}

					if (Engine.isEditable(rangeObject.startContainer)) {
						Engine.copyAttributes(rangeObject.startContainer, newMarkup[0]);
						jQuery(rangeObject.startContainer).after(newMarkup[0]).remove();
						Engine.ensureContainerEditable(newMarkup[0]);
					} else if (Engine.isEditingHost(rangeObject.startContainer)) {
						jQuery(rangeObject.startContainer).append(newMarkup[0]);
						Engine.ensureContainerEditable(newMarkup[0]);
					}

					backupRangeObject.startContainer = newMarkup[0];
					backupRangeObject.endContainer = newMarkup[0];
					backupRangeObject.startOffset = 0;
					backupRangeObject.endOffset = 0;
					return;
				}
				this.applyMarkup(rangeObject.getSelectionTree(), rangeObject, markupObject, tagComparator, {
					setRangeObject2NewMarkup: true
				});
				backupRangeObject.startContainer = rangeObject.startContainer;
				backupRangeObject.endContainer = rangeObject.endContainer;
				backupRangeObject.startOffset = rangeObject.startOffset;
				backupRangeObject.endOffset = rangeObject.endOffset;
			}

			if (markupObject.isReplacingElement) {
				//Check if the startContainer is one of the zapped elements
				if (backupRangeObject && backupRangeObject.startContainer.className && backupRangeObject.startContainer.className.indexOf('preparedForRemoval') > -1) {
					//var parentElement = jQuery(backupRangeObject.startContainer).closest(markupObject[0].tagName).get(0);
					parentElement = jQuery(backupRangeObject.startContainer).parents(markupObject[0].tagName).get(0);
					backupRangeObject.startContainer = parentElement;
					rangeObject.startContainer = parentElement;
				}
				//check if the endContainer is one of the zapped elements
				if (backupRangeObject && backupRangeObject.endContainer.className && backupRangeObject.endContainer.className.indexOf('preparedForRemoval') > -1) {
					//var parentElement = jQuery(backupRangeObject.endContainer).closest(markupObject[0].tagName).get(0);
					parentElement = jQuery(backupRangeObject.endContainer).parents(markupObject[0].tagName).get(0);
					backupRangeObject.endContainer = parentElement;
					rangeObject.endContainer = parentElement;
				}
			}
			// remove all marked items
			jQuery('.preparedForRemoval').zap();

			// recalculate cac and selectionTree

			// update selection
			if (markupObject.isReplacingElement) {
				//After the zapping we have to check for wrong offsets
				if (e5s.Node.ELEMENT_NODE === backupRangeObject.startContainer.nodeType && backupRangeObject.startContainer.childNodes && backupRangeObject.startContainer.childNodes.length < backupRangeObject.startOffset) {
					backupRangeObject.startOffset = backupRangeObject.startContainer.childNodes.length;
					rangeObject.startOffset = backupRangeObject.startContainer.childNodes.length;
				}
				if (e5s.Node.ELEMENT_NODE === backupRangeObject.endContainer.nodeType && backupRangeObject.endContainer.childNodes && backupRangeObject.endContainer.childNodes.length < backupRangeObject.endOffset) {
					backupRangeObject.endOffset = backupRangeObject.endContainer.childNodes.length;
					rangeObject.endOffset = backupRangeObject.endContainer.childNodes.length;
				}
				rangeObject.endContainer = backupRangeObject.endContainer;
				rangeObject.endOffset = backupRangeObject.endOffset;
				rangeObject.startContainer = backupRangeObject.startContainer;
				rangeObject.startOffset = backupRangeObject.startOffset;
				backupRangeObject.update();
				backupRangeObject.select();
			} else {
				rangeObject.update();
				rangeObject.select();
			}
		},

		/**
		 * method compares a JS array of domobjects with a range object and decides, if the rangeObject spans the whole markup objects. method is used to decide if a markup2markup selection can be completely remove or if it must be splitted into 2 separate markups
		 * @param relevantMarkupObjectsAtSelectionStart JS Array of dom objects, which are parents to the rangeObject.startContainer
		 * @param relevantMarkupObjectsAtSelectionEnd JS Array of dom objects, which are parents to the rangeObject.endContainer
		 * @param rangeObj Aloha rangeObject
		 * @return true, if rangeObjects and markup objects are identical, false otherwise
		 * @hide
		 */
		areMarkupObjectsAsLongAsRangeObject: function (relevantMarkupObjectsAtSelectionStart, relevantMarkupObjectsAtSelectionEnd, rangeObject) {
			var i, el, textNode, relMarkupEnd, relMarkupStart;

			if (rangeObject.startOffset !== 0) {
				return false;
			}

			for (i = 0, relMarkupStart = relevantMarkupObjectsAtSelectionStart.length; i < relMarkupStart; i++) {
				el = jQuery(relevantMarkupObjectsAtSelectionStart[i]);
				if (el.textNodes().first()[0] !== rangeObject.startContainer) {
					return false;
				}
			}

			for (i = 0, relMarkupEnd = relevantMarkupObjectsAtSelectionEnd.length; i < relMarkupEnd; i++) {
				el = jQuery(relevantMarkupObjectsAtSelectionEnd[i]);
				textNode = el.textNodes().last()[0];
				if (textNode !== rangeObject.endContainer || textNode.length != rangeObject.endOffset) {
					return false;
				}
			}

			return true;
		},

		/**
		 * method used to remove/split markup from a "markup2markup" selection
		 * @param relevantMarkupObjectsAtSelectionStart JS Array of dom objects, which are parents to the rangeObject.startContainer
		 * @param relevantMarkupObjectsAtSelectionEnd JS Array of dom objects, which are parents to the rangeObject.endContainer
		 * @param rangeObj Aloha rangeObject
		 * @param tagComparator method, which is used to compare the dom object and the jQuery markup object. the method must accept 2 parameters, the first is the domobj, the second is the jquery object. if no method is specified, the method this.standardTextLevelSemanticsComparator is used
		 * @return true (always, since no "false" case is currently known...but might be added)
		 * @hide
		 */
		splitRelevantMarkupObject: function (relevantMarkupObjectsAtSelectionStart, relevantMarkupObjectsAtSelectionEnd, rangeObject, tagComparator) {
			// mark them to be deleted
			jQuery(relevantMarkupObjectsAtSelectionStart).addClass('preparedForRemoval');
			jQuery(relevantMarkupObjectsAtSelectionEnd).addClass('preparedForRemoval');

			// check if the rangeObject is identical with the relevantMarkupObjects (in this case the markup can simply be removed)
			if (this.areMarkupObjectsAsLongAsRangeObject(relevantMarkupObjectsAtSelectionStart, relevantMarkupObjectsAtSelectionEnd, rangeObject)) {
				return true;
			}

			// find intersection (this can always only be one dom element (namely the highest) because all others will be removed
			var relevantMarkupObjectAtSelectionStartAndEnd = this.intersectRelevantMarkupObjects(relevantMarkupObjectsAtSelectionStart, relevantMarkupObjectsAtSelectionEnd);

			if (relevantMarkupObjectAtSelectionStartAndEnd) {
				this.insertCroppedMarkups([relevantMarkupObjectAtSelectionStartAndEnd], rangeObject, false, tagComparator);
				this.insertCroppedMarkups([relevantMarkupObjectAtSelectionStartAndEnd], rangeObject, true, tagComparator);
			} else {
				this.insertCroppedMarkups(relevantMarkupObjectsAtSelectionStart, rangeObject, false, tagComparator);
				this.insertCroppedMarkups(relevantMarkupObjectsAtSelectionEnd, rangeObject, true, tagComparator);
			}
			return true;
		},

		/**
		 * method takes two arrays of bottom up dom objects, compares them and returns either the object closest to the root or false
		 * @param relevantMarkupObjectsAtSelectionStart JS Array of dom objects
		 * @param relevantMarkupObjectsAtSelectionEnd JS Array of dom objects
		 * @return dom object closest to the root or false
		 * @hide
		 */
		intersectRelevantMarkupObjects: function (relevantMarkupObjectsAtSelectionStart, relevantMarkupObjectsAtSelectionEnd) {
			var intersection = false, i, elStart, j, elEnd, relMarkupStart, relMarkupEnd;
			if (!relevantMarkupObjectsAtSelectionStart || !relevantMarkupObjectsAtSelectionEnd) {
				return intersection; // we can only intersect, if we have to arrays!
			}
			relMarkupStart = relevantMarkupObjectsAtSelectionStart.length;
			relMarkupEnd = relevantMarkupObjectsAtSelectionEnd.length;
			for (i = 0; i < relMarkupStart; i++) {
				elStart = relevantMarkupObjectsAtSelectionStart[i];
				for (j = 0; j < relMarkupEnd; j++) {
					elEnd = relevantMarkupObjectsAtSelectionEnd[j];
					if (elStart === elEnd) {
						intersection = elStart;
					}
				}
			}
			return intersection;
		},

		/**
		 * method used to add markup to a nonmarkup2markup selection
		 * @param relevantMarkupObjects JS Array of dom objects effecting either the start or endContainer of a selection (which should be extended)
		 * @param rangeObject Aloha rangeObject the markups should be extended to
		 * @param startOrEnd boolean; defines, if the existing markups should be extended forwards or backwards (is propably redundant and could be found out by comparing start or end container with the markup array dom objects)
		 * @param tagComparator method, which is used to compare the dom object and the jQuery markup object. the method must accept 2 parameters, the first is the domobj, the second is the jquery object. if no method is specified, the method this.standardTextLevelSemanticsComparator is used
		 * @return true
		 * @hide
		 */
		extendExistingMarkupWithSelection: function (relevantMarkupObjects, rangeObject, startOrEnd, tagComparator) {
			var extendMarkupsAtStart, extendMarkupsAtEnd, objects, i, relMarkupLength, el, textnodes, nodeNr;
			if (!startOrEnd) { // = Start
				// start part of rangeObject should be used, therefor existing markups are cropped at the end
				extendMarkupsAtStart = true;
			}
			if (startOrEnd) { // = End
				// end part of rangeObject should be used, therefor existing markups are cropped at start (beginning)
				extendMarkupsAtEnd = true;
			}
			objects = [];
			for (i = 0, relMarkupLength = relevantMarkupObjects.length; i < relMarkupLength; i++) {
				objects[i] = new this.SelectionRange();
				el = relevantMarkupObjects[i];
				if (extendMarkupsAtEnd && !extendMarkupsAtStart) {
					objects[i].startContainer = rangeObject.startContainer; // jQuery(el).contents()[0];
					objects[i].startOffset = rangeObject.startOffset;
					textnodes = jQuery(el).textNodes(true);

					nodeNr = textnodes.length - 1;
					objects[i].endContainer = textnodes[nodeNr];
					objects[i].endOffset = textnodes[nodeNr].length;
					objects[i].update();
					this.applyMarkup(objects[i].getSelectionTree(), rangeObject, this.getClonedMarkup4Wrapping(el), tagComparator, {
						setRangeObject2NewMarkup: true
					});
				}
				if (!extendMarkupsAtEnd && extendMarkupsAtStart) {
					textnodes = jQuery(el).textNodes(true);
					objects[i].startContainer = textnodes[0]; // jQuery(el).contents()[0];
					objects[i].startOffset = 0;
					objects[i].endContainer = rangeObject.endContainer;
					objects[i].endOffset = rangeObject.endOffset;
					objects[i].update();
					this.applyMarkup(objects[i].getSelectionTree(), rangeObject, this.getClonedMarkup4Wrapping(el), tagComparator, {
						setRangeObject2NewMarkup: true
					});
				}
			}
			return true;
		},

		/**
		 * method creates an empty markup jQuery object from a dom object passed as paramter
		 * @param domobj domobject to be cloned, cleaned and emptied
		 * @param tagComparator method, which is used to compare the dom object and the jQuery markup object. the method must accept 2 parameters, the first is the domobj, the second is the jquery object. if no method is specified, the method this.standardTextLevelSemanticsComparator is used
		 * @return jQuery wrapper object to be passed to e.g. this.applyMarkup(...)
		 * @hide
		 */
		getClonedMarkup4Wrapping: function (domobj) {
			var wrapper = jQuery(domobj.outerHTML).removeClass('preparedForRemoval').empty();
			if (wrapper.attr('class').length === 0) {
				wrapper.removeAttr('class');
			}
			return wrapper;
		},

		/**
		 * method used to subtract the range object from existing markup. in other words: certain markup is removed from the selections defined by the rangeObject
		 * @param relevantMarkupObjects JS Array of dom objects effecting either the start or endContainer of a selection (which should be extended)
		 * @param rangeObject Aloha rangeObject the markups should be removed from
		 * @param startOrEnd boolean; defines, if the existing markups should be reduced at the beginning of the tag or at the end (is propably redundant and could be found out by comparing start or end container with the markup array dom objects)
		 * @param tagComparator method, which is used to compare the dom object and the jQuery markup object. the method must accept 2 parameters, the first is the domobj, the second is the jquery object. if no method is specified, the method this.standardTextLevelSemanticsComparator is used
		 * @return true
		 * @hide
		 */
		insertCroppedMarkups: function (relevantMarkupObjects, rangeObject, startOrEnd, tagComparator) {
			var cropMarkupsAtEnd, cropMarkupsAtStart, textnodes, objects, i, el, textNodes;
			if (!startOrEnd) { // = Start
				// start part of rangeObject should be used, therefor existing markups are cropped at the end
				cropMarkupsAtEnd = true;
			} else { // = End
				// end part of rangeObject should be used, therefor existing markups are cropped at start (beginning)
				cropMarkupsAtStart = true;
			}
			objects = [];
			for (i = 0; i < relevantMarkupObjects.length; i++) {
				objects[i] = new this.SelectionRange();
				el = relevantMarkupObjects[i];
				if (cropMarkupsAtEnd && !cropMarkupsAtStart) {
					textNodes = jQuery(el).textNodes(true);
					objects[i].startContainer = textNodes[0];
					objects[i].startOffset = 0;
					// if the existing markup startContainer & startOffset are equal to the rangeObject startContainer and startOffset,
					// then markupobject does not have to be added again, because it would have no content (zero-length)
					if (objects[i].startContainer === rangeObject.startContainer && objects[i].startOffset === rangeObject.startOffset) {
						continue;
					}
					if (rangeObject.startOffset === 0) {
						objects[i].endContainer = this.getTextNodeSibling(false, el, rangeObject.startContainer);
						objects[i].endOffset = objects[i].endContainer.length;
					} else {
						objects[i].endContainer = rangeObject.startContainer;
						objects[i].endOffset = rangeObject.startOffset;
					}

					objects[i].update();

					this.applyMarkup(objects[i].getSelectionTree(), rangeObject, this.getClonedMarkup4Wrapping(el), tagComparator, {
						setRangeObject2NextSibling: true
					});
				}

				if (!cropMarkupsAtEnd && cropMarkupsAtStart) {
					objects[i].startContainer = rangeObject.endContainer; // jQuery(el).contents()[0];
					objects[i].startOffset = rangeObject.endOffset;
					textnodes = jQuery(el).textNodes(true);
					objects[i].endContainer = textnodes[textnodes.length - 1];
					objects[i].endOffset = textnodes[textnodes.length - 1].length;
					objects[i].update();
					this.applyMarkup(objects[i].getSelectionTree(), rangeObject, this.getClonedMarkup4Wrapping(el), tagComparator, {
						setRangeObject2PreviousSibling: true
					});
				}
			}
			return true;
		},

		/**
		 * Checks for Firefox incorrect range. When selecting a paragraph with the
		 * command 'shift+keydown', the selection ends in the start of the next paragraph
		 * instead of at the end of the selected paragraph. This produces an unexpected
		 * behaviour when formatting the selected text to a heading or a list, because the
		 * result included one extra paragraph.
		 */
		checkForFirefoxIncorrectRange: function () {
			if (Browser.mozilla && Aloha.getSelection().getRangeCount() !== 0) {
				correctFirefoxRangeIssue(this.getRangeObject());
			}
		},

		/**
		 * apply a certain markup to the current selection
		 * @param markupObject jQuery object of the markup to be applied (e.g. created with obj = jQuery('<b></b>'); )
		 * @return void
		 * @hide
		 */
		changeMarkupOnSelection: function (markupObject) {
			this.checkForFirefoxIncorrectRange();
			var rangeObject = this.getRangeObject();

			// change the markup
			this.changeMarkup(rangeObject, markupObject, this.getStandardTagComparator(markupObject));

			// merge text nodes
			GENTICS.Utils.Dom.doCleanup({
				'merge': true
			}, rangeObject);

			// update the range and select it
			rangeObject.update();
			rangeObject.select();
			this.rangeObject = rangeObject;
		},

		/**
		 * apply a certain markup to the selection Tree
		 * @param selectionTree SelectionTree Object markup should be applied to
		 * @param rangeObject Aloha rangeObject which will be modified to reflect the dom changes, after the markup was applied (only if activated via options)
		 * @param markupObject jQuery object of the markup to be applied (e.g. created with obj = jQuery('<b></b>'); )
		 * @param tagComparator method, which is used to compare the dom object and the jQuery markup object. the method must accept 2 parameters, the first is the domobj, the second is the jquery object. if no method is specified, the method this.standardTextLevelSemanticsComparator is used
		 * @param options JS object, with the following boolean properties: setRangeObject2NewMarkup, setRangeObject2NextSibling, setRangeObject2PreviousSibling
		 * @return void
		 * @hide
		 */
		applyMarkup: function (selectionTree, rangeObject, markupObject, tagComparator, options) {
			var optimizedSelectionTree, i, el, breakpoint;
			options = options || {};
			// first same tags from within fully selected nodes for removal
			this.prepareForRemoval(selectionTree, markupObject, tagComparator);

			// first let's optimize the selection Tree in useful groups which can be wrapped together
			optimizedSelectionTree = this.optimizeSelectionTree4Markup(selectionTree, markupObject, tagComparator);
			breakpoint = true;

			// now iterate over grouped elements and either recursively dive into object or wrap it as a whole
			for (i = 0; i < optimizedSelectionTree.length; i++) {
				el = optimizedSelectionTree[i];
				if (el.wrappable) {
					this.wrapMarkupAroundSelectionTree(el.elements, rangeObject, markupObject, tagComparator, options);
				} else {
					Aloha.Log.debug(this, 'dive further into non-wrappable object');
					this.applyMarkup(el.element.children, rangeObject, markupObject, tagComparator, options);
				}
			}
		},

		/**
		 * returns the type of the given markup (trying to match HTML5)
		 * @param markupObject jQuery object of the markup to be applied (e.g. created with obj = jQuery('<b></b>'); )
		 * @return string name of the markup type
		 * @hide
		 */
		getMarkupType: function (markupObject) {
			var nn = jQuery(markupObject)[0].nodeName.toLowerCase();
			if (markupObject.outerHtml) {
				Aloha.Log.debug(this, 'Node name detected: ' + nn + ' for: ' + markupObject.outerHtml());
			}
			if (nn == '#text') {
				return 'textNode';
			}
			if (this.replacingElements[nn]) {
				return 'sectionOrGroupingContent';
			}
			if (this.tagHierarchy[nn]) {
				return 'textLevelSemantics';
			}
			Aloha.Log.warn(this, 'unknown markup passed to this.getMarkupType(...): ' + markupObject.outerHtml());
		},

		/**
		 * returns the standard tag comparator for the given markup object
		 * @param markupObject jQuery object of the markup to be applied (e.g. created with obj = jQuery('<b></b>'); )
		 * @return function tagComparator method, which is used to compare the dom object and the jQuery markup object. the method must accept 2 parameters, the first is the domobj, the second is the jquery object. if no method is specified, the method this.standardTextLevelSemanticsComparator is used
		 * @hide
		 */
		getStandardTagComparator: function (markupObject) {
			var that = this,
				result;
			switch (this.getMarkupType(markupObject)) {
			case 'textNode':
				result = function (p1, p2) {
					return false;
				};
				break;

			case 'sectionOrGroupingContent':
				result = function (domobj, markupObject) {
					return that.standardSectionsAndGroupingContentComparator(domobj, markupObject);
				};
				break;

			//case 'textLevelSemantics' covered by default
			default:
				result = function (domobj, markupObject) {
					return that.standardTextLevelSemanticsComparator(domobj, markupObject);
				};
				break;
			}
			return result;
		},

		/**
		 * searches for fully selected equal markup tags
		 * @param selectionTree SelectionTree Object markup should be applied to
		 * @param markupObject jQuery object of the markup to be applied (e.g. created with obj = jQuery('<b></b>'); )
		 * @param tagComparator method, which is used to compare the dom object and the jQuery markup object. the method must accept 2 parameters, the first is the domobj, the second is the jquery object. if no method is specified, the method this.standardTextLevelSemanticsComparator is used
		 * @return void
		 * @hide
		 */
		prepareForRemoval: function (selectionTree, markupObject, tagComparator) {
			var that = this, i, el;

			// check if a comparison method was passed as parameter ...
			if (typeof tagComparator !== 'undefined' && typeof tagComparator !== 'function') {
				Aloha.Log.error(this, 'parameter tagComparator is not a function');
			}
			// ... if not use this as standard tag comparison method
			if (typeof tagComparator === 'undefined') {
				tagComparator = this.getStandardTagComparator(markupObject);
			}
			for (i = 0; i < selectionTree.length; i++) {
				el = selectionTree[i];
				if (el.domobj && (el.selection == 'full' || (el.selection == 'partial' && markupObject.isReplacingElement))) {
					// mark for removal
					if (el.domobj.nodeType === 1 && tagComparator(el.domobj, markupObject)) {
						Aloha.Log.debug(this, 'Marking for removal: ' + el.domobj.nodeName);
						jQuery(el.domobj).addClass('preparedForRemoval');
					}
				}
				if (el.selection != 'none' && el.children.length > 0) {
					this.prepareForRemoval(el.children, markupObject, tagComparator);
				}

			}
		},

		/**
		 * searches for fully selected equal markup tags
		 * @param selectionTree SelectionTree Object markup should be applied to
		 * @param rangeObject Aloha rangeObject the markup will be applied to
		 * @param markupObject jQuery object of the markup to be applied (e.g. created with obj = jQuery('<b></b>'); )
		 * @param tagComparator method, which is used to compare the dom object and the jQuery markup object. the method must accept 2 parameters, the first is the domobj, the second is the jquery object. if no method is specified, the method this.standardTextLevelSemanticsComparator is used
		 * @param options JS object, with the following boolean properties: setRangeObject2NewMarkup, setRangeObject2NextSibling, setRangeObject2PreviousSibling
		 * @return void
		 * @hide
		 */
		wrapMarkupAroundSelectionTree: function (selectionTree, rangeObject, markupObject, tagComparator, options) {
			// first let's find out if theoretically the whole selection can be wrapped with one tag and save it for later use
			var objects2wrap = [], // // this will be used later to collect objects
				j = -1, // internal counter,
				breakpoint = true,
				preText = '',
				postText = '',
				prevOrNext,
				textNode2Start,
				textnodes,
				newMarkup,
				i,
			    el,
			    middleText;

			Aloha.Log.debug(this, 'The formatting <' + markupObject[0].tagName + '> will be wrapped around the selection');

			// now lets iterate over the elements
			for (i = 0; i < selectionTree.length; i++) {
				el = selectionTree[i];

				// check if markup is allowed inside the elements parent
				if (el.domobj && !this.canTag1WrapTag2(el.domobj.parentNode.tagName.toLowerCase(), markupObject[0].tagName.toLowerCase())) {
					Aloha.Log.info(this, 'Skipping the wrapping of <' + markupObject[0].tagName.toLowerCase() + '> because this tag is not allowed inside <' + el.domobj.parentNode.tagName.toLowerCase() + '>');
					continue;
				}

				// skip empty text nodes
				if (el.domobj && el.domobj.nodeType === 3 && jQuery.trim(el.domobj.nodeValue).length === 0) {
					continue;
				}

				// partial element, can either be a textnode and therefore be wrapped (at least partially)
				// or can be a nodeType == 1 (tag) which must be dived into
				if (el.domobj && el.selection == 'partial' && !markupObject.isReplacingElement) {
					if (el.startOffset !== undefined && el.endOffset === undefined) {
						j++;
						preText += el.domobj.data.substr(0, el.startOffset);
						el.domobj.data = el.domobj.data.substr(el.startOffset, el.domobj.data.length - el.startOffset);
						objects2wrap[j] = el.domobj;
					} else if (el.endOffset !== undefined && el.startOffset === undefined) {
						j++;
						postText += el.domobj.data.substr(el.endOffset, el.domobj.data.length - el.endOffset);
						el.domobj.data = el.domobj.data.substr(0, el.endOffset);
						objects2wrap[j] = el.domobj;
					} else if (el.endOffset !== undefined && el.startOffset !== undefined) {
						if (el.startOffset == el.endOffset) { // do not wrap empty selections
							Aloha.Log.debug(this, 'skipping empty selection');
							continue;
						}
						j++;
						preText += el.domobj.data.substr(0, el.startOffset);
						middleText = el.domobj.data.substr(el.startOffset, el.endOffset - el.startOffset);
						postText += el.domobj.data.substr(el.endOffset, el.domobj.data.length - el.endOffset);
						el.domobj.data = middleText;
						objects2wrap[j] = el.domobj;
					} else {
						// a partially selected item without selectionStart/EndOffset is a nodeType 1 Element on the way to the textnode
						Aloha.Log.debug(this, 'diving into object');
						this.applyMarkup(el.children, rangeObject, markupObject, tagComparator, options);
					}
				}
				// fully selected dom elements can be wrapped as whole element
				if (el.domobj && (el.selection == 'full' || (el.selection == 'partial' && markupObject.isReplacingElement))) {
					j++;
					objects2wrap[j] = el.domobj;
				}
			}

			if (objects2wrap.length > 0) {
				// wrap collected DOM object with markupObject
				objects2wrap = jQuery(objects2wrap);

				// make a fix for text nodes in <li>'s in ie
				jQuery.each(objects2wrap, function (index, element) {
					if (Aloha.browser.msie && element.nodeType == 3 && !element.nextSibling && !element.previousSibling && element.parentNode && element.parentNode.nodeName.toLowerCase() == 'li') {
						element.data = jQuery.trim(element.data);
					}
				});

				newMarkup = objects2wrap.wrapAll(markupObject).parent();
				newMarkup.before(preText).after(postText);

				if (options.setRangeObject2NewMarkup) { // this is used, when markup is added to normal/normal Text
					textnodes = objects2wrap.textNodes();

					if (textnodes.index(rangeObject.startContainer) != -1) {
						rangeObject.startOffset = 0;
					}
					if (textnodes.index(rangeObject.endContainer) != -1) {
						rangeObject.endOffset = rangeObject.endContainer.length;
					}
					breakpoint = true;
				}
				if (options.setRangeObject2NextSibling) {
					prevOrNext = true;
					textNode2Start = newMarkup.textNodes(true).last()[0];
					if (objects2wrap.index(rangeObject.startContainer) != -1) {
						rangeObject.startContainer = this.getTextNodeSibling(prevOrNext, newMarkup.parent(), textNode2Start);
						rangeObject.startOffset = 0;
					}
					if (objects2wrap.index(rangeObject.endContainer) != -1) {
						rangeObject.endContainer = this.getTextNodeSibling(prevOrNext, newMarkup.parent(), textNode2Start);
						rangeObject.endOffset = rangeObject.endOffset - textNode2Start.length;
					}
				}
				if (options.setRangeObject2PreviousSibling) {
					prevOrNext = false;
					textNode2Start = newMarkup.textNodes(true).first()[0];
					if (objects2wrap.index(rangeObject.startContainer) != -1) {
						rangeObject.startContainer = this.getTextNodeSibling(prevOrNext, newMarkup.parent(), textNode2Start);
						rangeObject.startOffset = 0;
					}
					if (objects2wrap.index(rangeObject.endContainer) != -1) {
						rangeObject.endContainer = this.getTextNodeSibling(prevOrNext, newMarkup.parent(), textNode2Start);
						rangeObject.endOffset = rangeObject.endContainer.length;
					}
				}
			}
		},

		/**
		 * takes a text node and return either the next recursive text node sibling or the previous
		 * @param previousOrNext boolean, false for previous, true for next sibling
		 * @param commonAncestorContainer dom object to be used as root for the sibling search
		 * @param currentTextNode dom object of the originating text node
		 * @return dom object of the sibling text node
		 * @hide
		 */
		getTextNodeSibling: function (previousOrNext, commonAncestorContainer, currentTextNode) {
			var textNodes = jQuery(commonAncestorContainer).textNodes(true), newIndex, index;

			index = textNodes.index(currentTextNode);
			if (index == -1) { // currentTextNode was not found
				return false;
			}
			newIndex = index + (!previousOrNext ? -1 : 1);
			return textNodes[newIndex] || false;
		},

		/**
		 * takes a selection tree and groups it into markup wrappable selection trees
		 * @param selectionTree rangeObject selection tree
		 * @param markupObject jQuery object of the markup to be applied (e.g. created with obj = jQuery('<b></b>'); )
		 * @return JS array of wrappable selection trees
		 * @hide
		 */
		optimizeSelectionTree4Markup: function (selectionTree, markupObject, tagComparator) {
			var groupMap = [],
				outerGroupIndex = 0,
				innerGroupIndex = 0,
				that = this,
				i,
			    j,
				endPosition,
			    startPosition;

			if (typeof tagComparator === 'undefined') {
				tagComparator = function (domobj, markupObject) {
					return that.standardTextLevelSemanticsComparator(markupObject);
				};
			}
			for (i = 0; i < selectionTree.length; i++) {
				// we are just interested in selected item, but not in non-selected items
				if (selectionTree[i].domobj && selectionTree[i].selection != 'none') {
					if (markupObject.isReplacingElement && tagComparator(markupObject[0], jQuery(selectionTree[i].domobj))) {
						if (groupMap[outerGroupIndex] !== undefined) {
							outerGroupIndex++;
						}
						groupMap[outerGroupIndex] = {};
						groupMap[outerGroupIndex].wrappable = true;
						groupMap[outerGroupIndex].elements = [];
						groupMap[outerGroupIndex].elements[innerGroupIndex] = selectionTree[i];
						outerGroupIndex++;

					} else if (this.canMarkupBeApplied2ElementAsWhole([selectionTree[i]], markupObject)) {
						// now check, if the children of our item could be wrapped all together by the markup object
						// if yes, add it to the current group
						if (groupMap[outerGroupIndex] === undefined) {
							groupMap[outerGroupIndex] = {};
							groupMap[outerGroupIndex].wrappable = true;
							groupMap[outerGroupIndex].elements = [];
						}
						if (markupObject.isReplacingElement) { //  && selectionTree[i].domobj.nodeType === 3
							/* we found the node to wrap for a replacing element. however there might
							 * be siblings which should be included as well
							 * although they are actually not selected. example:
							 * li
							 * |-textNode ( .selection = 'none')
							 * |-textNode (cursor inside, therefor .selection = 'partial')
							 * |-textNode ( .selection = 'none')
							 *
							 * in this case it would be useful to select the previous and following textNodes as well (they might result from a previous DOM manipulation)
							 * Think about other cases, where the parent is the Editable. In this case we propably only want to select from and until the next <br /> ??
							 * .... many possibilities, here I realize the two described cases
							 */

							// first find start element starting from the current element going backwards until sibling 0
							startPosition = i;
							for (j = i - 1; j >= 0; j--) {
								if (this.canMarkupBeApplied2ElementAsWhole([selectionTree[j]], markupObject) && this.isMarkupAllowedToStealSelectionTreeElement(selectionTree[j], markupObject)) {
									startPosition = j;
								} else {
									break;
								}
							}

							// now find the end element starting from the current element going forward until the last sibling
							endPosition = i;
							for (j = i + 1; j < selectionTree.length; j++) {
								if (this.canMarkupBeApplied2ElementAsWhole([selectionTree[j]], markupObject) && this.isMarkupAllowedToStealSelectionTreeElement(selectionTree[j], markupObject)) {
									endPosition = j;
								} else {
									break;
								}
							}

							// now add the elements to the groupMap
							innerGroupIndex = 0;
							for (j = startPosition; j <= endPosition; j++) {
								groupMap[outerGroupIndex].elements[innerGroupIndex] = selectionTree[j];
								groupMap[outerGroupIndex].elements[innerGroupIndex].selection = 'full';
								innerGroupIndex++;
							}
							innerGroupIndex = 0;
						} else {
							// normal text level semantics object, no siblings need to be selected
							groupMap[outerGroupIndex].elements[innerGroupIndex] = selectionTree[i];
							innerGroupIndex++;
						}
					} else {
						// if no, isolate it in its own group
						if (groupMap[outerGroupIndex] !== undefined) {
							outerGroupIndex++;
						}
						groupMap[outerGroupIndex] = {};
						groupMap[outerGroupIndex].wrappable = false;
						groupMap[outerGroupIndex].element = selectionTree[i];
						innerGroupIndex = 0;
						outerGroupIndex++;
					}
				}
			}
			return groupMap;
		},

		/**
		 * very tricky method, which decides, if a certain markup (normally a replacing markup element like p, h1, blockquote)
		 * is allowed to extend the user selection to other dom objects (represented as selectionTreeElement)
		 * to understand the purpose: if the user selection is collapsed inside e.g. some text, which is currently not
		 * wrapped by the markup to be applied, and therefor the markup does not have an equal markup to replace, then the DOM
		 * manipulator has to decide which objects to wrap. real example:
		 * <div>
		 *	<h1>headline</h1>
		 *	some text blabla bla<br>
		 *	more text HERE THE | CURSOR BLINKING and <b>even more bold text</b>
		 * </div>
		 * when the user now wants to apply e.g. a <p> tag, what will be wrapped? it could be useful if the manipulator would actually
		 * wrap everything inside the div except the <h1>. but for this purpose someone has to decide, if the markup is
		 * allowed to wrap certain dom elements in this case the question would be, if the <p> is allowed to wrap
		 * textNodes, <br> and <b> and <h1>. therefore this tricky method should answer the question for those 3 elements
		 * with true, but for for the <h1> it should return false. and since the method does not know this, there is a configuration
		 * for this
		 *
		 * @param selectionTree rangeObject selection tree element (only one, not an array of)
		 * @param markupObject lowercase string of the tag to be verified (e.g. "b")
		 * @return true if the markup is allowed to wrap the selection tree element, false otherwise
		 * @hide
		 */
		isMarkupAllowedToStealSelectionTreeElement: function (selectionTreeElement, markupObject) {
			if (!selectionTreeElement.domobj) {
				return false;
			}
			var maybeTextNodeName = selectionTreeElement.domobj.nodeName.toLowerCase(),
				nodeName = (maybeTextNodeName == '#text') ? 'textNode' : maybeTextNodeName,
				markupName = markupObject[0].nodeName.toLowerCase(),
				elemMap = this.allowedToStealElements[markupName];
			return elemMap && elemMap[nodeName];
		},

		/**
		 * checks if a selection can be completey wrapped by a certain html tags (helper method for this.optimizeSelectionTree4Markup
		 * @param selectionTree rangeObject selection tree
		 * @param markupObject lowercase string of the tag to be verified (e.g. "b")
		 * @return true if selection can be applied as whole, false otherwise
		 * @hide
		 */
		canMarkupBeApplied2ElementAsWhole: function (selectionTree, markupObject) {
			var htmlTag, i, el, returnVal;

			if (markupObject.jquery) {
				htmlTag = markupObject[0].tagName;
			}
			if (markupObject.tagName) {
				htmlTag = markupObject.tagName;
			}

			returnVal = true;
			for (i = 0; i < selectionTree.length; i++) {
				el = selectionTree[i];
				if (el.domobj && (el.selection != "none" || markupObject.isReplacingElement)) {
					// Aloha.Log.debug(this, 'Checking, if  <' + htmlTag + '> can be applied to ' + el.domobj.nodeName);
					if (!this.canTag1WrapTag2(htmlTag, el.domobj.nodeName)) {
						return false;
					}
					if (el.children.length > 0 && !this.canMarkupBeApplied2ElementAsWhole(el.children, markupObject)) {
						return false;
					}
				}
			}
			return returnVal;
		},

		/**
		 * checks if a tag 1 (first parameter) can wrap tag 2 (second parameter).
		 * IMPORTANT: the method does not verify, if there have to be other tags in between
		 * Example: this.canTag1WrapTag2("table", "td") will return true, because the method does not take into account, that there has to be a "tr" in between
		 * @param t1 string: tagname of outer tag to verify, e.g. "b"
		 * @param t2 string: tagname of inner tag to verify, e.g. "b"
		 * @return true if tag 1 can wrap tag 2, false otherwise
		 * @hide
		 */
		canTag1WrapTag2: function (t1, t2) {
			t1 = (t1 == '#text') ? 'textNode' : t1.toLowerCase();
			t2 = (t2 == '#text') ? 'textNode' : t2.toLowerCase();
			var t1Map = this.tagHierarchy[t1];
			if (!t1Map) {
				return true;
			}
			if (!this.tagHierarchy[t2]) {
				return true;
			}
			return t1Map[t2];
		},

		/**
		 * Check whether it is allowed to insert the given tag at the start of the
		 * current selection. This method will check whether the markup effective for
		 * the start and outside of the editable part (starting with the editable tag
		 * itself) may wrap the given tag.
		 * @param tagName {String} name of the tag which shall be inserted
		 * @return true when it is allowed to insert that tag, false if not
		 * @hide
		 */
		mayInsertTag: function (tagName) {
			var i;
			if (typeof this.rangeObject.unmodifiableMarkupAtStart == 'object') {
				// iterate over all DOM elements outside of the editable part
				for (i = 0; i < this.rangeObject.unmodifiableMarkupAtStart.length; ++i) {
					// check whether an element may not wrap the given
					if (!this.canTag1WrapTag2(this.rangeObject.unmodifiableMarkupAtStart[i].nodeName, tagName)) {
						// found a DOM element which forbids to insert the given tag, we are done
						return false;
					}
				}

				// all of the found DOM elements allow inserting the given tag
				return true;
			}
			Aloha.Log.warn(this, 'Unable to determine whether tag ' + tagName + ' may be inserted');
			return true;
		},

		/**
		 * Sets prevStartContext & prevEndContext to null
		 */
		resetPrevSelectionContexts: function () {
			prevStartContext = null;
			prevEndContext   = null;
		},

		/**
		 * String representation
		 * @return "Aloha.Selection"
		 * @hide
		 */
		toString: function () {
			return 'Aloha.Selection';
		},

		/**
		 * @namespace Aloha.Selection
		 * @class SelectionRange
		 * @extends GENTICS.Utils.RangeObject
		 * Constructor for a range object.
		 * Optionally you can pass in a range object that's properties will be assigned to the new range object.
		 * @param rangeObject A range object thats properties will be assigned to the new range object.
		 * @constructor
		 */
		SelectionRange: GENTICS.Utils.RangeObject.extend({
			_constructor: function (rangeObject) {
				this._super(rangeObject);
				// If a range object was passed in we apply the values to the new range object
				if (rangeObject) {
					if (rangeObject.commonAncestorContainer) {
						this.commonAncestorContainer = rangeObject.commonAncestorContainer;
					}
					if (rangeObject.selectionTree) {
						this.selectionTree = rangeObject.selectionTree;
					}
					if (rangeObject.limitObject) {
						this.limitObject = rangeObject.limitObject;
					}
					if (rangeObject.markupEffectiveAtStart) {
						this.markupEffectiveAtStart = rangeObject.markupEffectiveAtStart;
					}
					if (rangeObject.unmodifiableMarkupAtStart) {
						this.unmodifiableMarkupAtStart = rangeObject.unmodifiableMarkupAtStart;
					}
					if (rangeObject.splitObject) {
						this.splitObject = rangeObject.splitObject;
					}
				}
			},

			/**
			 * DOM object of the common ancestor from startContainer and endContainer
			 * @hide
			 */
			commonAncestorContainer: undefined,

			/**
			 * The selection tree
			 * @hide
			 */
			selectionTree: undefined,

			/**
			 * Array of DOM objects effective for the start container and inside the
			 * editable part (inside the limit object). relevant for the button status
			 * @hide
			 */
			markupEffectiveAtStart: [],

			/**
			 * Array of DOM objects effective for the start container, which lies
			 * outside of the editable portion (starting with the limit object)
			 * @hide
			 */
			unmodifiableMarkupAtStart: [],

			/**
			 * DOM object being the limit for all markup relevant activities
			 * @hide
			 */
			limitObject: undefined,

			/**
			 * DOM object being split when enter key gets hit
			 * @hide
			 */
			splitObject: undefined,

			/**
			 * Sets the visible selection in the Browser based on the range object.
			 * If the selection is collapsed, this will result in a blinking cursor,
			 * otherwise in a text selection.
			 * @method
			 */
			select: function () {
				// Call Utils' select()
				this._super();

				// update the selection
				Aloha.Selection.updateSelection();
			},

			/**
			 * Method to update a range object internally
			 * @param commonAncestorContainer (DOM Object); optional Parameter; if set, the parameter
			 * will be used instead of the automatically calculated CAC
			 * @return void
			 * @hide
			 */
			update: function (commonAncestorContainer) {
				this.updatelimitObject();
				this.updateMarkupEffectiveAtStart();
				this.updateCommonAncestorContainer(commonAncestorContainer);

				// reset the selectiontree (must be recalculated)
				this.selectionTree = undefined;
			},

			/**
			 * Get the selection tree for this range
			 * TODO: remove this (was moved to range.js)
			 * @return selection tree
			 * @hide
			 */
			getSelectionTree: function () {
				// if not yet calculated, do this now
				if (!this.selectionTree) {
					this.selectionTree = Aloha.Selection.getSelectionTree(this);
				}

				return this.selectionTree;
			},

			/**
			 * TODO: move this to range.js
			 * Get an array of domobj (in dom tree order) of siblings of the given domobj, which are contained in the selection
			 * @param domobj dom object to start with
			 * @return array of siblings of the given domobj, which are also selected
			 * @hide
			 */
			getSelectedSiblings: function (domobj) {
				var selectionTree = this.getSelectionTree();

				return this.recursionGetSelectedSiblings(domobj, selectionTree);
			},

			/**
			 * TODO: move this to range.js
			 * Recursive method to find the selected siblings of the given domobj (which should be selected as well)
			 * @param domobj dom object for which the selected siblings shall be found
			 * @param selectionTree current level of the selection tree
			 * @return array of selected siblings of dom objects or false if none found
			 * @hide
			 */
			recursionGetSelectedSiblings: function (domobj, selectionTree) {
				var selectedSiblings = false,
					foundObj = false,
					i;

				for (i = 0; i < selectionTree.length; ++i) {
					if (selectionTree[i].domobj === domobj) {
						foundObj = true;
						selectedSiblings = [];
					} else if (!foundObj && selectionTree[i].children) {
						// do the recursion
						selectedSiblings = this.recursionGetSelectedSiblings(domobj, selectionTree[i].children);
						if (selectedSiblings !== false) {
							break;
						}
					} else if (foundObj && selectionTree[i].domobj && selectionTree[i].selection != 'collapsed' && selectionTree[i].selection != 'none') {
						selectedSiblings.push(selectionTree[i].domobj);
					} else if (foundObj && selectionTree[i].selection == 'none') {
						break;
					}
				}

				return selectedSiblings;
			},

			/**
			 * TODO: move this to range.js
			 * Method updates member var markupEffectiveAtStart and splitObject, which is relevant primarily for button status and enter key behaviour
			 * @return void
			 * @hide
			 */
			updateMarkupEffectiveAtStart: function () {
				// reset the current markup
				this.markupEffectiveAtStart = [];
				this.unmodifiableMarkupAtStart = [];

				var parents = this.getStartContainerParents(),
					limitFound = false,
					splitObjectWasSet,
					i,
				    el;

				for (i = 0; i < parents.length; i++) {
					el = parents[i];
					if (!limitFound && (el !== this.limitObject)) {
						this.markupEffectiveAtStart[i] = el;
						if (!splitObjectWasSet && GENTICS.Utils.Dom.isSplitObject(el)) {
							splitObjectWasSet = true;
							this.splitObject = el;
						}
					} else {
						limitFound = true;
						this.unmodifiableMarkupAtStart.push(el);
					}
				}
				if (!splitObjectWasSet) {
					this.splitObject = false;
				}
				return;
			},

			/**
			 * TODO: remove this
			 * Method updates member var markupEffectiveAtStart, which is relevant primarily for button status
			 * @return void
			 * @hide
			 */
			updatelimitObject: function () {
				if (Aloha.editables && Aloha.editables.length > 0) {
					var parents = this.getStartContainerParents(),
						editables = Aloha.editables,
						i,
					    el,
					    j,
					    editable;
					for (i = 0; i < parents.length; i++) {
						el = parents[i];
						for (j = 0; j < editables.length; j++) {
							editable = editables[j].obj[0];
							if (el === editable) {
								this.limitObject = el;
								return true;
							}
						}
					}
				}
				this.limitObject = jQuery('body');
				return true;
			},

			/**
			 * string representation of the range object
			 * @param	verbose	set to true for verbose output
			 * @return string representation of the range object
			 * @hide
			 */
			toString: function (verbose) {
				if (!verbose) {
					return 'Aloha.Selection.SelectionRange';
				}
				return 'Aloha.Selection.SelectionRange {start [' + this.startContainer.nodeValue + '] offset ' + this.startOffset + ', end [' + this.endContainer.nodeValue + '] offset ' + this.endOffset + '}';
			}

		}) // SelectionRange

	}); // Selection


	/**
	 * This method implements an ugly workaround for a selection problem in ie:
	 * when the cursor shall be placed at the end of a text node in a li element, that is followed by a nested list,
	 * the selection would always snap into the first li of the nested list
	 * therefore, we make sure that the text node ends with a space and place the cursor right before it
	 */
	function nestedListInIEWorkaround(range) {
		var nextSibling;
		if (Aloha.browser.msie && range.startContainer === range.endContainer && range.startOffset === range.endOffset && range.startContainer.nodeType == 3 && range.startOffset == range.startContainer.data.length && range.startContainer.nextSibling) {
			nextSibling = range.startContainer.nextSibling;
			if ('OL' === nextSibling.nodeName || 'UL' === nextSibling.nodeName) {
				if (range.startContainer.data[range.startContainer.data.length - 1] == ' ') {
					range.startOffset = range.endOffset = range.startOffset - 1;
				} else {
					range.startContainer.data = range.startContainer.data + ' ';
				}
			}
		}
	}

	function correctRange(range) {
		nestedListInIEWorkaround(range);
		return range;
	}

	/**
	 * Implements Selection http://html5.org/specs/dom-range.html#selection
	 * @namespace Aloha
	 * @class Selection This singleton class always represents the
	 *        current user selection
	 * @singleton
	 */
	var AlohaSelection = Class.extend({

		_constructor: function (nativeSelection) {

			this._nativeSelection = nativeSelection;
			this.ranges = [];

			// will remember if urged to not change the selection
			this.preventChange = false;

		},

		/**
		 * Returns the element that contains the start of the selection. Returns null if there's no selection.
		 * @readonly
		 * @type Node
		 */
		anchorNode: null,

		/**
		 * Returns the offset of the start of the selection relative to the element that contains the start
		 * of the selection. Returns 0 if there's no selection.
		 * @readonly
		 * @type int
		 */
		anchorOffset: 0,

		/**
		 * Returns the element that contains the end of the selection.
		 * Returns null if there's no selection.
		 * @readonly
		 * @type Node
		 */
		focusNode: null,

		/**
		 * Returns the offset of the end of the selection relative to the element that contains the end
		 * of the selection. Returns 0 if there's no selection.
		 * @readonly
		 * @type int
		 */
		focusOffset: 0,

		/**
		 * Returns true if there's no selection or if the selection is empty. Otherwise, returns false.
		 * @readonly
		 * @type boolean
		 */
		isCollapsed: false,

		/**
		 * Returns the number of ranges in the selection.
		 * @readonly
		 * @type int
		 */
		rangeCount: 0,

		/**
		 * Replaces the selection with an empty one at the given position.
		 * @throws a WRONG_DOCUMENT_ERR exception if the given node is in a different document.
		 * @param parentNode Node of new selection
		 * @param offest offest of new Selection in parentNode
		 * @void
		 */
		collapse: function (parentNode, offset) {
			this._nativeSelection.collapse(parentNode, offset);
		},

		/**
		 * Replaces the selection with an empty one at the position of the start of the current selection.
		 * @throws an INVALID_STATE_ERR exception if there is no selection.
		 * @void
		 */
		collapseToStart: function () {
			throw "NOT_IMPLEMENTED";
		},

		/**
		 * @void
		 */
		extend: function (parentNode, offset) {

		},

		/**
		 * @param alter DOMString
		 * @param direction DOMString
		 * @param granularity DOMString
		 * @void
		 */
		modify: function (alter, direction, granularity) {

		},

		/**
		 * Replaces the selection with an empty one at the position of the end of the current selection.
		 * @throws an INVALID_STATE_ERR exception if there is no selection.
		 * @void
		 */
		collapseToEnd: function () {
			this._nativeSelection.collapseToEnd();
		},

		/**
		 * Replaces the selection with one that contains all the contents of the given element.
		 * @throws a WRONG_DOCUMENT_ERR exception if the given node is in a different document.
		 * @param parentNode Node the Node fully select
		 * @void
		 */
		selectAllChildren: function (parentNode) {
			throw "NOT_IMPLEMENTED";
		},

		/**
		 * Deletes the contents of the selection
		 */
		deleteFromDocument: function () {
			throw "NOT_IMPLEMENTED";
		},

		/**
		 * NB!
		 * We have serious problem in IE.
		 * The range that we get in IE is not the same as the range we had set,
		 * so even if we normalize it during getRangeAt, in IE, we will be
		 * correcting the range to the "correct" place, but still not the place
		 * where it was originally set.
		 *
		 * Returns the given range.
		 * The getRangeAt(index) method returns the indexth range in the list.
		 * NOTE: Aloha Editor only support 1 range! index can only be 0
		 * @throws INDEX_SIZE_ERR DOM exception if index is less than zero or
		 * greater or equal to the value returned by the rangeCount.
		 * @param index int
		 * @return Range return the selected range from index
		 */
		getRangeAt: function (index) {
			return correctRange(this._nativeSelection.getRangeAt(index));
			//if ( index < 0 || this.rangeCount ) {
			//	throw "INDEX_SIZE_ERR DOM";
			//}
			//return this._ranges[index];
		},

		/**
		 * Adds the given range to the selection.
		 * The addRange(range) method adds the given range Range object to the list of
		 * selections, at the end (so the newly added range is the new last range).
		 * NOTE: Aloha Editor only support 1 range! The added range will replace the
		 * range at index 0
		 * see http://html5.org/specs/dom-range.html#selection note about addRange
		 * @throws an INVALID_NODE_TYPE_ERR exception if the given Range has a boundary point
		 * node that's not a Text or Element node, and an INVALID_MODIFICATION_ERR exception
		 * if it has a boundary point node that doesn't descend from a Document.
		 * @param range Range adds the range to the selection
		 * @void
		 */
		addRange: function (range) {
			// set readonly attributes
			this._nativeSelection.addRange(range);
			// We will correct the range after rangy has processed the native
			// selection range, so that our correction will be the final fix on
			// the range according to the guarentee's that Aloha wants to make
			this._nativeSelection._ranges[0] = correctRange(range);

			// make sure, the old Aloha selection will be updated (until all implementations use the new AlohaSelection)
			Aloha.Selection.updateSelection();
		},

		/**
		 * Removes the given range from the selection, if the range was one of the ones in the selection.
		 * NOTE: Aloha Editor only support 1 range! The added range will replace the
		 * range at with index 0
		 * @param range Range removes the range from the selection
		 * @void
		 */
		removeRange: function (range) {
			this._nativeSelection.removeRange();
		},

		/**
		 * Removes all the ranges in the selection.
		 * @viod
		 */
		removeAllRanges: function () {
			this._nativeSelection.removeAllRanges();
		},

		/**
		 * INFO: Method is used for integration with Gentics
		 * Aloha, has no use otherwise Updates the rangeObject
		 * according to the current user selection Method is
		 * always called on selection change
		 *
		 * @param event
		 *            jQuery browser event object
		 * @return true when rangeObject was modified, false
		 *         otherwise
		 * @hide
		 */
		refresh: function (event) {

		},

		/**
		 * String representation
		 *
		 * @return "Aloha.Selection"
		 * @hide
		 */
		toString: function () {
			return 'Aloha.Selection';
		},

		getRangeCount: function () {
			return this._nativeSelection.rangeCount;
		}

	});

	/**
	 * A wrapper for the function of the same name in the rangy core-depdency.
	 * This function should be preferred as it hides the global rangy object.
	 * For more information look at the following sites:
	 * http://html5.org/specs/dom-range.html
	 * @param window optional - specifices the window to get the selection of
	 */
	Aloha.getSelection = function (target) {
		target = (target !== document || target !== window) ? window : target;
		// Aloha.Selection.refresh()
		// implement Aloha Selection
		// TODO cache
		return new AlohaSelection(window.rangy.getSelection(target));
	};

	/**
	 * A wrapper for the function of the same name in the rangy core-depdency.
	 * This function should be preferred as it hides the global rangy object.
	 * Please note: when the range object is not needed anymore,
	 *   invoke the detach method on it. It is currently unknown to me why
	 *   this is required, but that's what it says in the rangy specification.
	 * For more information look at the following sites:
	 * http://www.w3.org/TR/DOM-Level-2-Traversal-Range/ranges.html
	 * @param document optional - specifies which document to create the range for
	 */
	Aloha.createRange = function (givenWindow) {
		return window.rangy.createRange(givenWindow);
	};

	/**
	 * Method to scroll the window to move the current collapsed selection into
	 * the viewport. If the selection is not collapsed or some browser functionality
	 * for detecting the position of the current selection is not available, nothing
	 * will be done. This applies e.g. to older IE versions.
	 */
	Aloha.scrollToSelection = function () {
		var sel = Aloha.getSelection();
		// no selection, do nothing
		if (sel.getRangeCount() === 0) {
			return;
		}
		var range = sel.getRangeAt(0);
		if (!range.collapsed) {
			return;
		}

		// check for necessary browser functionality
		if (!range.nativeRange) {
			return;
		}
		if (!range.nativeRange.getClientRects) {
			return;
		}

		// determine the position of the current selection as close as possible
		var rect, top, bottom, prev, next;
		if (range.nativeRange.getClientRects().length === 0) {
			if (range.startContainer.nodeType === 3) {
				rect = range.startContainer.parentNode.getBoundingClientRect();
				top = rect.top;
				bottom = rect.bottom;
			} else {
				// the start container is not a text node, so we get the bounding rectangle of the start container itself
				rect = range.startContainer.getBoundingClientRect();
				top = rect.top;
				bottom = rect.bottom;

				// we refine the top and bottom positions by getting the bounding rectangles of the previous and next elements
				if (range.startOffset > 0) {
					prev = range.startContainer.childNodes[range.startOffset - 1];
					next = prev.nextSibling;
				} else {
					next = range.startContainer.firstChild;
				}
				if (prev && prev.nodeType === 1) {
					top = prev.getBoundingClientRect().bottom;
				}
				if (next && next.nodeType === 1) {
					bottom = next.getBoundingClientRect().top;
				}
			}
		} else {
			rect = range.nativeRange.getClientRects()[0];
			top = rect.top;
			bottom = rect.bottom;
		}

		// scroll the window if necessary
		var $win = jQuery(window);
		if (top < 0) {
			$win.scrollTop($win.scrollTop() + top);
		} else if (bottom > $win.height()) {
			$win.scrollTop($win.scrollTop() + (bottom - $win.height()));
		}

		var $scrollable = jQuery(range.startContainer).closest(':hasScroll(y)');
		if ($scrollable.length > 0 && !$scrollable.is($win) && !$scrollable.is(jQuery('html'))) {
			var scrollRect = $scrollable[0].getBoundingClientRect();
			if (top < scrollRect.top) {
				// scroll up
				$scrollable.scrollTop($scrollable.scrollTop() - (scrollRect.top - top));
			} else if (bottom > scrollRect.bottom) {
				// scroll down
				$scrollable.scrollTop($scrollable.scrollTop() + (bottom - scrollRect.bottom));
			}
		}
	};

	var selection = new Selection();
	Aloha.Selection = selection;

	return selection;
});
