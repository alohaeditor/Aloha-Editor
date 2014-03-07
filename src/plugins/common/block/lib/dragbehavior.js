/*global window:true, define:true, document:true */
/* dragbehavior.js is part of Aloha Editor project http://aloha-editor.org
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
	'aloha/jquery',
	'aloha',
	'PubSub',
	'aloha/copypaste'
], function (
	$,
	Aloha,
	PubSub,
	CopyPaste
) {
	'use strict';

	/**
	 * Tags that is not allowed to wrap BlockElements. For this elements the
	 * mouseover event is not listened
	 * @type {Array.<String>}
	 */
	var notAllowedOverTags = ['TABLE', 'TR',
		'HR', 'TBODY', 'UL', 'OL', 'DL', 'B', 'STRONG', 'A', 'EM', 'I', 'PRE',
		'CODE', 'SUP', 'SUB'],
	/**
	 * This element are suitable to listen the mouseover event, but can´t wrap
	 * a BlockElement
	 * @type {Array.<String>}
	 */
		notAllowedDropSelector = ['.aloha-block', '.aloha-block-handle',
			'.aloha-table-selectrow', 'p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5',
			'h6', 'br'],
	/**
	 * Parents of element that can´t wrap BlockElements
	 * @type {Array.<String>}
	 */
		notAllowedDropParentsSelector = [
			'.aloha-table-selectcolumn',
			'.aloha-ui',
			'.ui-draggable-dragging'
		];

	/**
	 * Checks whether or not the element over which we are hovering should allow
	 * drop a region, in or around it?
	 *
	 * @param {jQuery.<HTMLElement> $hovering
	 * @param {jQuery.<HTMLElement> $dragging
	 * @return {boolean}
	 */
	function allowDropRegions($hovering, $dragging) {
		return !$hovering || !(
			$hovering.is('.ui-draggable-dragging') ||
			$hovering.closest($dragging).length > 0
		);
	}

	/**
	 * @private
	 * @class Aloha.plugins.extra.DragBehavior
	 * @param {block.block.AbstractBlock} blockObject An AbstractBlock child
	 *                                    instance
	 */
	function DragBehavior(blockObject) {
		this.blockObject = blockObject;
		this.$element = blockObject.$element;
		this.insertBeforeOrAfterMode = false;
		this.setDraggable();
	}

	PubSub.sub('aloha.block.initialized', function (data) {
		DragBehavior.follow(data.block);
	});

	/**
	 * Because the Dom.isEditable don't work well I need to rewrite it.
	 * checks if a HTMLElement is editable, if the element have inherited
	 * behavior check the parents behaivor until get a true or false behavior.
	 *
	 * @param {HTMLElement} domElm
	 * @return {Boolean}
	 */
	function isEditable(domElm) {
		if (domElm.nodeType === 1) {
			if (domElm.contentEditable === 'inherit') {
				while (domElm.contentEditable === 'inherit') {
					domElm = domElm.parentNode;
				}
			}

			return (domElm.contentEditable === 'true');
		}
		return false;
	}

	/**
	 * Creates an instance of DragBehavior following a BlockElement
	 * only if the BlockElement given is suitable to be draggable.
	 *
	 * @static
	 * @param {block.block.AbstractBlock} blockObject An AbstractBlock child
	 *                                    instance
	 */
	DragBehavior.follow = function (blockObject) {
		if ($('>.aloha-block-draghandle', blockObject.$element).length > 0) {
			var jsLintMustBeHappyNotMe = new DragBehavior(blockObject);
		}
	};

	/**
	 * Internet Explorer loses the selection and scroll position between
	 * dragging and dropping.
	 *
	 * So we need to save the selection and scroll position before, and restore
	 * it after each drag and drop cycle.
	 */
	var IESelectionState = (function () {
		var range = null;
		var x = 0;
		var y = 0;
		return $.browser.msie ? {

				/**
				 * Remember the selection state.
				 */
				save: function saveSelection() {
					x = window.scrollX || document.documentElement.scrollLeft;
					y = window.scrollY || document.documentElement.scrollTop;
					range = CopyPaste.getRange();
				},

				/**
				 * Set the selection to the given range and focus on the editable
				 * inwhich the selection is in (if any).
				 *
				 * This function is used to restore the selection to what it was
				 * before dragging is started.
				 */
				restore: function restoreSelection() {
					var editable = CopyPaste.getEditableAt(range);
					if (editable) {
						editable.obj.focus();
					}
					CopyPaste.setSelectionAt(range);
					window.scrollTo(x, y);
				}
			}
			: {
				save: function () {},
				restore: function () {}
			};
	}());

	/**
	 * Setup the draggable behavior to the BlockElement
	 */
	DragBehavior.prototype.setDraggable = function () {
		var dragBehavior = this;
		var $handle = $('>.aloha-block-draghandle', this.$element);
		var element = this.$element.get(0);

		element.onselectstart = function () {
			window.event.cancelBubble = true;
		};

		// Prevent the prevention of drag inside a cell
		element.ondragstart = function (e) {
			e.stopPropagation();
		};

		$handle
			.on('mousedown', function () {
				IESelectionState.save();
			})
			.on('mouseup', function () {
				dragBehavior._getHiglightElement().hide();
				dragBehavior.stopListenMouseOver();
			});

		this.$element.draggable({
			handle: '>.aloha-block-draghandle',
			helper: 'clone',
			cursorAt: {
				left: -10,
				top: -10
			},
			start: function (event, ui) {
				ui.helper.css('zIndex', 100000);
				dragBehavior.listenMouseOver();
				event.stopImmediatePropagation();
			},
			drag: function (event) {
				event.stopImmediatePropagation();
			},
			stop: function (event, ui) {
				dragBehavior._getHiglightElement().hide();
				dragBehavior.stopListenMouseOver();
				dragBehavior.onDragStop();
				ui.helper.remove();
				IESelectionState.restore();
				return true;
			}
		});
	};

	/**
	 * Returns all the childs in all editables registered in Aloha
	 *
	 * @return jQuery.<HTMLElement>
	 */
	DragBehavior.prototype._getEditableChilds = function () {
		var i, editable, elms = [];
		for (i = 0; i < Aloha.editables.length; i++) {
			editable = Aloha.editables[i];
			elms = elms.concat(
				$('*:not(' + notAllowedOverTags.join(',') + ')', editable.obj).toArray()
			);
		}
		return $(elms);
	};


	/**
	 * Listen the mouseOver events over all elements in the editables, since the
	 * drag action start until the drag action stop, to know in which element
	 * the user may drop the block element
	 */
	DragBehavior.prototype.listenMouseOver = function () {
		var dragBehavior = this,
			$elms = this._getEditableChilds();
		// @todo use the DOM Events for this, jQuery is very slow

		$elms.bind('mouseover.blockbehavior', function (e) {
			return dragBehavior.onMouseover(this, e);
		});
	};

	/**
	 * Stop listen the mouseover event, this method is called when the drag
	 * operation is ended (droped)
	 */
	DragBehavior.prototype.stopListenMouseOver = function () {
		var $elms = this._getEditableChilds();
		$elms.unbind('.blockbehavior');
	};

	/**
	 * Checks the element that is below of the draggable element in a drag
	 * operation, if is a valid element, this method call to highlight methods
	 *
	 * @param {HTMLElement} elm
	 * @param {jqEvent} event
	 *
	 * @return {Boolean}
	 */
	DragBehavior.prototype.onMouseover = function (elm, event) {
		this.disableInsertBeforeOrAfter(this.$overElement);
		this.$overElement = $(elm);
		if (!this._isAllowedOverElement(elm)) {
			this.enableInsertBeforeOrAfter(elm);

			return true; // to continue bubbling to find a element where can insert the block
		} else {
			this.highlightElement(elm);
			event.stopImmediatePropagation();
			return false;
		}

	};

	/**
	 * Highlight an entirely element to be a container of the BlockElement
	 *
	 * @param {HTMLElement} elm
	 */
	DragBehavior.prototype.highlightElement = function (elm) {

		if (elm.nodeName === 'DIV' &&
				elm.parentNode.nodeName === 'TD' &&
				elm.parentNode.firstChild === elm &&
				elm.parentNode.lastChild === elm) {

			elm = elm.parentNode;
		}

		var $elm = $(elm),
			$hElm = this._getHiglightElement().show();


		$hElm
			.css('zIndex', parseInt($elm.zIndex(), 10) + 1)
			.offset($elm.offset())
			.width($elm.outerWidth())
			.height($elm.outerHeight());

	};

	/**
	 * Activate the functionality to highlight the top or bottom border of an
	 * element to inform to the user that the block must be inserted before or
	 * after
	 *
	 * @param {HTMLElement} elm
	 */
	DragBehavior.prototype.enableInsertBeforeOrAfter = function (elm) {
		var $elm = $(elm),
			dragBehavior = this,
			elmTop = $elm.offset().top,
			halfHeight = $elm.outerHeight() / 2;

		if (!allowDropRegions($elm, this.$element)) {
			return;
		}

		$elm.bind('mousemove.brIBOA', function (event) {
			var top = event.pageY - elmTop;
			if (top >= halfHeight) {
				dragBehavior.insertBeforeOrAfterMode = 'AFTER';
			} else {
				dragBehavior.insertBeforeOrAfterMode = 'BEFORE';
			}
			dragBehavior.highlightEdge(this);
		});

	};

	/**
	 * Disables the InsertBeforeOrAfter functionality.
	 *
	 * @param {jQuery.<HTMLElement>} $elm
	 */
	DragBehavior.prototype.disableInsertBeforeOrAfter = function ($elm) {
		this.insertBeforeOrAfterMode = false;
		if ($elm) {
			$elm.unbind('.brIBOA');
		}
	};

	/**
	 * Highlites only a edge of the element recived, depending the value of
	 * this.insertBeforeOrAfterMode
	 *
	 * @param {HTMLElement} elm
	 */
	DragBehavior.prototype.highlightEdge = function (elm) {
		var $elm = $(elm),
			$hElm = this._getHiglightElement().show(),
			offset;

		if (this.insertBeforeOrAfterMode === 'BEFORE') {
			$hElm
				.css('zIndex', parseInt($elm.zIndex(), 10) + 1)
				.offset($elm.offset())
				.width($elm.outerWidth())
				.height(10);
		} else {
			offset = $elm.offset();
			offset.top = (offset.top + $elm.outerHeight()) - 10;
			$hElm
				.css('zIndex', parseInt($elm.zIndex(), 10) + 1)
				.offset(offset)
				.width($elm.outerWidth())
				.height(10);
		}
	};

	/**
	 * Returns true or false depending if the element given is allowed to
	 * contain BlockElements
	 *
	 * @param {HTMLElement} elm
	 * 
	 * @return {Boolean}
	 */
	DragBehavior.prototype._isAllowedOverElement = function (elm) {
		if ($.inArray(elm.nodeName, notAllowedOverTags) < 0) {
			if (!isEditable(elm)) {
				return false;
			}

			var $elm = $(elm);
			if ($elm.parents(notAllowedDropParentsSelector.join(',')).length > 0) {
				return false;
			}

			if ($elm.is(notAllowedDropSelector.join(','))) {
				return false;
			}

			return true;
		} else {
			return false;
		}
	};

	/**
	 * Check if the element in the user want to drop the block elements is
	 * suitable to contain the BlockElement or is suitable to insert the
	 * element before or after this
	 */
	DragBehavior.prototype.onDragStop = function () {
		// @todo check if the $overElement is a Valid element to drop the block
		if (allowDropRegions(this.$overElement, this.$element)) {
			if (this.$overElement &&
				!this._isAllowedOverElement(this.$overElement[0])) {
				this.enableInsertBeforeOrAfter(this.$overElement[0]);
			}

			if (this.insertBeforeOrAfterMode !== false) {
				if (this.insertBeforeOrAfterMode === 'BEFORE') {
					this.$overElement.before(this.$element);
				} else {
					this.$overElement.after(this.$element);
				}
			} else {
				this.$element.appendTo(this.$overElement);
			}
		}

		this.disableInsertBeforeOrAfter(this.$overElement);
	};

	/**
	 * Returns a reference to the element used to highlight over elements,
	 * if not exist is created, this element is shared for all instances of
	 * DragBehavior
	 * 
	 * @return {jQuery.<HTMLElement>}
	 */
	DragBehavior.prototype._getHiglightElement = function () {
		if (undefined === this.$hElm) {
			if ($('#aloha-highlight-element').length === 0) {

				this.$hElm = $('<div>')
					.attr('id', 'aloha-highlight-element')
					.appendTo('body')
					.css({
						position: 'absolute',
						opacity: 0.5,
						background: 'blue'
					})
					.hide();
			} else {
				this.$hElm = $('#aloha-highlight-element');
			}
		}

		return this.$hElm;
	};

});
