/*!
 * Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH
 * aloha-sales@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

/**
 * Module which contains the base class for Blocks, and a Default/Debug block.
 *
 * @name block.block
 * @namespace block/block
 */
define(['aloha', 'aloha/jquery', 'block/blockmanager', 'aloha/observable', 'aloha/floatingmenu'],
function(Aloha, jQuery, BlockManager, Observable, FloatingMenu) {
	"use strict";

	var GENTICS = window.GENTICS;

	/**
	 * An aloha block has the following special properties, being readable through the
	 * "attr" function:
	 * - aloha-block-type -- TYPE of the AlohaBlock as registered by the BlockManager
	 *
	 * @name block.block.AbstractBlock
	 * @class An abstract block that must be used as a base class for custom blocks
	 */
	var AbstractBlock = Class.extend(Observable,
	/** @lends block.block.AbstractBlock */
	{

		/**
		 * Event which is triggered if the block attributes change.
		 *
		 * @name block.block.AbstractBlock#change
		 * @event
		 */

		/**
		 * Title of the block, used to display the name in the sidebar editor.
		 *
		 * @type String
		 * @api
		 */
		title: null,

		/**
		 * Id of the underlying $element, used to identify the block.
		 * @type String
		 */
		id: null,

		/**
		 * The wrapping element of the block.
		 * @type jQuery
		 * @api
		 */
		$element: null,

		/**
		 * if TRUE, the rendering is currently taking place. Used to prevent recursion
		 * errors.
		 * @type Boolean
		 */
		_currentlyRendering: false,

		/**
		 * set to TRUE once the block is fully initialized.
		 *
		 * @type Boolean
		 */
		_initialized: false,

		/**************************
		 * SECTION: Initialization and Lifecycle
		 **************************/

		/**
		 * Initialize the basic block. Do not call directly; instead use jQuery(...).alohaBlock() to
		 * create new blocks.
		 *
		 * This function shall only be called through the BlockManager. See BlockManager::_blockify().
		 *
		 * @param {jQuery} $element Element that declares the block
		 * @constructor
		 */
		_constructor: function($element) {
			var that = this;

			this.$element = $element;

			if ($element.attr('id')) {
				this.id = $element.attr('id');
			} else {
				this.id = GENTICS.Utils.guid();
				$element.attr('id', this.id);
			}

			$element.contentEditable(false);

			$element.addClass('aloha-block');

			if (this.isDraggable()) {
				// Remove default drag/drop behavior of the browser
				$element.find('img').attr('draggable', 'false');
				$element.find('a').attr('draggable', 'false');
			}

			// While the event handler is defined here, it is connected to the DOM element inside "_connectThisBlockToDomElement"
			this._onElementClickHandler = function(event) {
				// We only activate ourselves if we are the innermost aloha-block.
				// If we are not the innermost aloha-block, we get highlighted (but not activated) automatically
				// by the innermost block.
				if (jQuery(event.target).closest('.aloha-block').get(0) === that.$element.get(0)) {
					that._fixScrollPositionBugsInIE();
					that.activate(event.target);
				}
			};

			// Register event handlers on the block
			this._connectThisBlockToDomElement($element);


			// This is executed when a block is selected through caret handling
			//Aloha.bind('aloha-block-selected', function(event,obj) {
			//	if (that.$element.get(0) === obj) {
			//		that.activate();
			//	}
			//});


			this._initialized = true;
		},

		/**
		 * Is set inside the constructor to the event handler function
		 * which should be executed when the element is clicked.
		 *
		 * NOTE: Purely internal, "this" is not available inside this method!
		 */
		_onElementClickHandler: null,

		/**
		 * We need to tell Aloha that we handle the event already;
		 * else a selection of a nested editable will *not* select
		 * the block.
		 *
		 * This callback is bound to the mousedown, focus and dblclick events.
		 *
		 * NOTE: Purely internal, "this" is not available inside this method!
		 */
		_preventSelectionChangedEventHandler: function() {
			Aloha.Selection.preventSelectionChanged();
		},

		/**
		 * This method connects this block object to the passed DOM element.
		 * In detail, this method does the following:
		 *
		 * - if this.$element is already set, remove all block event handlers
		 * - sets this.$element = jQuery(newElement)
		 * - initialize event listeners on this.$element
		 * - call init()
		 *
		 * The method is called in two contexts: First, when a block is constructed
		 * to initialize the event listeners etc. Second, it is ALSO called when
		 * a block inside a nested block with editable in between is detected
		 * as inconsistent.
		 */
		_connectThisBlockToDomElement: function(newElement) {
			var that = this;
			var $newElement = jQuery(newElement);
			if (this.$element) {
				this.$element.unbind('click', this._onElementClickHandler);
				this.$element.unbind('mousedown', this._preventSelectionChangedEventHandler);
				this.$element.unbind('focus', this._preventSelectionChangedEventHandler);
				this.$element.unbind('dblclick', this._preventSelectionChangedEventHandler);
			}
			this.$element = $newElement;

			this.$element.bind('click', this._onElementClickHandler);
			this.$element.bind('mousedown', this._preventSelectionChangedEventHandler);
			this.$element.bind('focus', this._preventSelectionChangedEventHandler);
			this.$element.bind('dblclick', this._preventSelectionChangedEventHandler);

			this.init(this.$element, function() {
				that._postProcessElementIfNeeded();
			});
		},

		/**
		 * IE HACK: Our beloved Internet Explorer sometimes scrolls to the top
		 * of the page when activating an aloha block, and on numerous other occasions
		 * like when an <span> block is moved via drag/drop.
		 *
		 * We can detect this and scroll right back; although this will flicker
		 * a little (but still a lot better than before)
		 */
		_fixScrollPositionBugsInIE: function() {
			var scrollPositionBefore = jQuery(window).scrollTop();
			window.setTimeout(function() {
				if (jQuery(window).scrollTop() !== scrollPositionBefore) {
					jQuery(window).scrollTop(scrollPositionBefore);
				}
			}, 10);
		},
		/**
		 * Template method to initialize the block. Can be used to set attributes
		 * on the block, depending on the block contents. You will most probably
		 * use $element and this.attr() inside this function.
		 *
		 * !!! This method can be called *multiple times*, as it is called each time
		 * when $element has been disconnected from the DOM (which can happen because of various reasons)
		 * and the block needs to re-initialize. So make sure this method can be called *MULTIPLE TIMES*
		 * and always returns predictable results. This method must be idempotent, same as update().
		 *
		 * Furthermore, always when this method is finished, you need to call postProcessFn() afterwards.
		 * This function adds drag handles and other controls if necessary.
		 *
		 * @param {jQuery} $element a shortcut to the block's DOM element (this.$element) for easy processing
		 * @param {Function} postProcessFn this function MUST be called at all times the $element has been updated; as it adds drag/drop/delete/... handles if necessary
		 * @api
		 */
		init: function($element, postProcessFn) {
			postProcessFn();
		},

		/**
		 * Destroy this block instance completely. Removes the element from the DOM,
		 * unregisters it, and triggers a block-delete event on the BlockManager.
		 *
		 * @api
		 */
		destroy: function() {
			var that = this;
			var newRange = new GENTICS.Utils.RangeObject();

			newRange.startContainer = newRange.endContainer = this.$element.parent()[0];
			newRange.startOffset = newRange.endOffset = GENTICS.Utils.Dom.getIndexInParent(this.$element[0]);

			BlockManager.trigger('block-delete', this);
			BlockManager._unregisterBlock(this);

			this.unbindAll();


			var isInlineElement = this.$element[0].tagName.toLowerCase() === 'span';

			this.$element.fadeOut('fast', function() {
				that.$element.remove();
				BlockManager.trigger('block-selection-change', []);
				window.setTimeout(function() {
					if (isInlineElement) {
						newRange.select();
					}
				}, 5);
			});
		},

		/**************************
		 * SECTION: Getters and Helpers
		 **************************/

		/**
		 * Get the id of the block
		 * @returns {String}
		 */
		getId: function() {
			return this.id;
		},

		/**
		 * Get a schema of attributes which shall be rendered / edited
		 * in the sidebar.
		 *
		 * @api
		 * @returns {Object}
		 */
		getSchema: function() {
			return null;
		},

		/**
		 * Template Method which should return the block title. Needed for editing sidebar.
		 * By default, the block title is returned.
		 *
		 * @api
		 */
		getTitle: function() {
			return this.title;
		},

		/**
		 * Returns true if the block is draggable because it is inside an aloha-editable, false otherwise.
		 *
		 * @return Boolean
		 */
		isDraggable: function() {
			return this.$element.parents('.aloha-editable').length > 0;
		},

		/**************************
		 * SECTION: Activation / Deactivation
		 **************************/

		/**
		 * activates the block
		 * will select the block's contents, highlight it, update the floating menu and update the sidebar (if needed)
		 * @api
		 */
		activate: function(eventTarget) {
			var highlightedBlocks = [];

			// Deactivate currently highlighted blocks
			jQuery.each(BlockManager._getHighlightedBlocks(), function() {
				this.deactivate();
			});

			// Activate current block
			FloatingMenu.setScope('Aloha.Block.' + this.attr('aloha-block-type'));
			this.$element.addClass('aloha-block-active');
			this._highlight();
			highlightedBlocks.push(this);

			// Highlight parent blocks
			this.$element.parents('.aloha-block').each(function() {
				var block = BlockManager.getBlock(this);
				block._highlight();
				highlightedBlocks.push(block);
			});

			// Browsers do not remove the cursor, so we enforce it when an aditable is clicked.
			// However, when the user clicked inside a nested editable, we will not remove the cursor (as the user wants to start typing then)
			if (jQuery(eventTarget).closest('.aloha-editable,.aloha-block').first().hasClass('aloha-block')) {
				Aloha.getSelection().removeAllRanges();
			}
			// Trigger selection change event
			BlockManager.trigger('block-selection-change', highlightedBlocks);
		},

		/**
		 * Deactive the block
		 */
		deactivate: function() {
			var that = this;
			this._unhighlight();
			this.$element.parents('.aloha-block').each(function() {
				that._unhighlight();
			});

			this.$element.removeClass('aloha-block-active');
			BlockManager.trigger('block-selection-change', []);
		},

		/**
		 * @returns {Boolean} True if this block is active
		 */
		isActive: function() {
			return this.$element.hasClass('aloha-block-active');
		},

		/**
		 * Internal helper which sets a block as highlighted, because the block itself
		 * or a child block has been activated.
		 */
		_highlight: function() {
			this.$element.addClass('aloha-block-highlighted');
			BlockManager._setHighlighted(this);
		},

		/**
		 * Internal helper which sets a block as un-highlighted.
		 */
		_unhighlight: function() {
			this.$element.removeClass('aloha-block-highlighted');
			BlockManager._setUnhighlighted(this);
		},

		/**************************
		 * SECTION: Block Rendering
		 **************************/

		/**
		 * Internal _update method, which needs to be called internally if a property
		 * changed. This is just a wrapper around update().
		 */
		_update: function() {
			var that = this;
			if (this._currentlyRendering) return;
			if (!this._initialized) return;

			this._currentlyRendering = true;

			this.update(this.$element, function() {
				that._postProcessElementIfNeeded();
			});

			this._currentlyRendering = false;
		},

		/**
		 * Template method to render contents of the block, must be implemented by specific block type.
		 * $element can be augumented by additional DOM elements like drag/drop handles. If you do
		 * any jQuery selection, you need to ignore all results which have a "aloha-block-handle" class
		 * set.
		 *
		 * Furthermore, always when you update $element, you need to call postProcessFn() afterwards.
		 * This function adds drag handles and other controls if necessary.
		 *
		 * This method should *only* be called from the internal _update method.
		 *
		 * @param {jQuery} $element a shortcut to the block's DOM element (this.$element) for easy processing
		 * @param {Function} postProcessFn this function MUST be called at all times the $element has been updated; as it adds drag/drop/delete/... handles if necessary
		 *
		 * @api
		 */
		update: function($element, postProcessFn) {
			postProcessFn();
		},


		/**
		 * Post processor, being called to augument the Block Element's DOM by drag handles etc.
		 *
		 * This method must be idempotent. I.e. it must produce the same results
		 * when called once or twice.
		 */
		_postProcessElementIfNeeded: function() {
			this.createEditablesIfNeeded();
			this._checkThatNestedBlocksAreStillConsistent();

			this.renderBlockHandlesIfNeeded();
			if (this.isDraggable() && this.$element[0].tagName.toLowerCase() === 'span') {
				this._setupDragDropForInlineElements();
				this._disableUglyInternetExplorerDragHandles();
			} else if (this.isDraggable() && this.$element[0].tagName.toLowerCase() === 'div') {
				this._setupDragDropForBlockElements();
				this._disableUglyInternetExplorerDragHandles();
			}
		},
		_checkThatNestedBlocksAreStillConsistent: function() {
			this.$element.find('.aloha-block').each(function() {
				var block = BlockManager.getBlock(this);
				if (block && block.$element[0] !== this) {
					block._connectThisBlockToDomElement(this);
				}
			});
		},

		/**
		 * Helper which disables the ugly IE drag handles. They are still shown, but at
		 * least they do not work anymore
		 */
		_disableUglyInternetExplorerDragHandles: function() {
			this.$element.get( 0 ).onresizestart = function ( e ) { return false; };
			this.$element.get( 0 ).oncontrolselect = function ( e ) { return false; };
			// We do NOT abort the "ondragstart" event as it is required for drag/drop.
			this.$element.get( 0 ).onmovestart = function ( e ) { return false; };
			this.$element.get( 0 ).onselectstart = function ( e ) { return false; };
		},

		/**************************
		 * SECTION: Drag&Drop for INLINE elements
		 **************************/
		_setupDragDropForInlineElements: function() {
			var that = this;

			// Here, we store the character DOM element which has been hovered upon recently.
			// This is needed as somehow, the "drop" event on the character is not fired.
			// Furthermore, we use it to know whether we need to "revert" the draggable to the original state or not.
			var lastHoveredCharacter = null;

			// HACK for IE7: Internet Explorer 7 has a very weird behavior in
			// not always firing the "drop" callback of the inner droppable... However,
			// the "over" and "out" callbacks are fired correctly.
			// Because of this, we handle the "drop" inside the "stop" callback in IE7
			// instead of the "drop" callback (where it is handled in all other browsers)

			// This $currentDraggable is also needed as part of the IE 7 hack.
			// $currentDraggable contains a reference to the current draggable, but
			// only makes sense to read when lastHoveredCharacter !== NULL.
			var $currentDraggable = null;

			// This dropFn is the callback which handles the actual moving of
			// nodes. We created a separate function for it, as it is called inside the "stop" callback
			// in IE7 and inside the "drop" callback in all other browsers.
			var dropFn = function() {
				if (lastHoveredCharacter) {
					// the user recently hovered over a character
					var $dropReferenceNode = jQuery(lastHoveredCharacter);

					if ($dropReferenceNode.is('.aloha-block-droppable-right')) {
						$dropReferenceNode.html($dropReferenceNode.html() + ' ');

						// Move draggable after drop reference node
						$dropReferenceNode.after($currentDraggable);
					} else {
						// Insert space in the beginning of the drop reference node
						if ($dropReferenceNode.prev('[data-i]').length > 0) {
							// If not the last element, insert space in front of next element (i.e. after the moved block)
							$dropReferenceNode.prev('[data-i]').html($dropReferenceNode.prev('[data-i]').html() + ' ');
						}
						$dropReferenceNode.html(' ' + $dropReferenceNode.html());

						// Move draggable before drop reference node
						$dropReferenceNode.before($currentDraggable);
					}

					$currentDraggable.removeClass('ui-draggable').css({'left': 0, 'top': 0}); // Remove "draggable" options... somehow "Destroy" does not work
					that._fixScrollPositionBugsInIE();
				}
			}

			this.$element.draggable({
				handle: '.aloha-block-draghandle',
				scope: 'aloha-block-inlinedragdrop',
				revert: function() {
					return (lastHoveredCharacter === null);
				},
				revertDuration: 250,
				stop: function() {
					if (Ext.isIE7) {
						dropFn();
					}
					that._dd_traverseDomTreeAndRemoveSpans(that.$element.parents('.aloha-editable').get(0));
					$currentDraggable = null;
				},
				start: function() {
					// Make **ALL** editables on the page droppable, such that it is possible
					// to drag/drop *across* editable boundaries
					jQuery('.aloha-editable').children().droppable({
						// make block elements droppable
						tolerance: 'pointer',
						addClasses: false, // performance optimization
						scope: 'aloha-block-inlinedragdrop',

						/**
						 * When hovering over a paragraph, we make convert its contents into spans, to make
						 * them droppable.
						 */
						over: function(event, ui) {
							$currentDraggable = ui.draggable;

							that._dd_traverseDomTreeAndWrapCharactersWithSpans(this);
							jQuery('span[data-i]', this).droppable({
								tolerance: 'pointer',
								addClasses: false,
								scope: 'aloha-block-inlinedragdrop',
								over: function() {
									if (lastHoveredCharacter) {
										// Just to be sure, we remove the css class of the last hovered character.
										// This is needed such that spans are deselected which contain multiple
										// lines.
										jQuery(lastHoveredCharacter).removeClass('aloha-block-droppable');
									}
									lastHoveredCharacter = this;
									jQuery(this).addClass('aloha-block-droppable');
								},
								out: function() {
									jQuery(this).removeClass('aloha-block-droppable');
									if (lastHoveredCharacter === this) {
										lastHoveredCharacter = null;
									}
								}
							});
							// Now that we updated the droppables in the system, we need to recalculate
							// the Drag Drop offsets.
							jQuery.ui.ddmanager.prepareOffsets(ui.draggable.data('draggable'), event);
						},

						/**
						 * When dropping over a paragraph, we use the "lastHoveredCharacter"
						 * as drop target.
						 */
						drop: function() {
							if (!Ext.isIE7) {
								dropFn();
							}
						}
					});
				}
			});
		},

		/**
		 * Helper which traverses the DOM tree starting from el and wraps all non-empty texts with spans,
		 * such that they can act as drop target.
		 *
		 * @param {DomElement} el
		 */
		_dd_traverseDomTreeAndWrapCharactersWithSpans: function(el) {
			var child;
			for(var i=0, l=el.childNodes.length; i < l; i++) {
				child = el.childNodes[i];
				if (child.nodeType === 1) { // DOM Nodes
					if (!~child.className.indexOf('aloha-block') && child.attributes['data-i'] === undefined) {
						// We only recurse if child does NOT have the class "aloha-block", and is NOT data-i
						this._dd_traverseDomTreeAndWrapCharactersWithSpans(child);
					} else if (child.attributes['data-i']) {
						// data-i set -> we have converted this hierarchy level already --> early return!
						return;
					}
				} else if (child.nodeType === 3) { // Text Nodes
					var numberOfSpansInserted = this._dd_insertSpans(child);
					i += numberOfSpansInserted;
					l += numberOfSpansInserted;
				}
			}
		},

		/**
		 * Helper which splits text on word boundaries, adding whitespaces to the following element.
		 * Examples:
		 * - "Hello world" -> ["Hello", " world"]
		 * - " Hello world" -> [" Hello", " world"]
		 * --> see the unit tests for the specification
		 */
		_dd_splitText: function(text) {
			var textParts = text.split(/(?=\b)/);
			var cleanedTextParts = [];

			var isWhitespace = false;
			for (var i=0,l=textParts.length; i<l; i++) {
				if (!/[^\t\n\r ]/.test(textParts[i])) {
					// if the current text part is just whitespace, we add a flag...
					isWhitespace = true;
				} else {
					if (isWhitespace) {
						// we have a whitespace to add
						cleanedTextParts.push(' ' + textParts[i]);
						isWhitespace = false;
					} else {
						cleanedTextParts.push(textParts[i]);
					}
				}
			}
			if (isWhitespace) {
				cleanedTextParts[cleanedTextParts.length - 1] += ' ';
			}
			return cleanedTextParts;
		},

		/**
		 * This is a helper for _dd_traverseDomTreeAndWrapCharactersWithSpans,
		 * performing the actual conversion.
		 *
		 * This function returns the number of additional DOM elements inserted.
		 * This is "numberOfSpansCreated - 1" (because one text node has been initially there)
		 */
		_dd_insertSpans: function(el) {
			var text = el.nodeValue;

			// If node just contains empty strings, we do not do anything.
			// Use ECMA-262 Edition 3 String and RegExp features
			if (!/[^\t\n\r ]/.test(text)) {
				return 0;
			}
			var newNodes = document.createDocumentFragment();

			var splitText = this._dd_splitText(text);

			var l = splitText.length;
			var x, word, leftWordPartLength, t;
			var numberOfSpansInserted = 0;

			for (var i=0; i<l; i++) {
				// left half of word
				word = splitText[i];
				if (word.length === 0) continue;
				// We use "floor" here such that sentence delimiters like "!" can have a block placed afterwards
				leftWordPartLength = Math.floor(word.length/2);

				// For Internet Explorer, we only make dropping AFTER words possible to improve performance
				if (Ext.isIE7 || Ext.isIE8) {
					leftWordPartLength = 0;
				}

				if (leftWordPartLength > 0) {
					x = document.createElement('span');
					x.appendChild(document.createTextNode(word.substr(0, leftWordPartLength)));
					x.setAttribute('data-i', i);

					newNodes.appendChild(x);
					numberOfSpansInserted++;
				}

				// right half of word
				x = document.createElement('span');
				t = word.substr(leftWordPartLength);
				x.appendChild(document.createTextNode(t));
				x.setAttribute('data-i', i);
				x.setAttribute('class', 'aloha-block-droppable-right');

				newNodes.appendChild(x);
				numberOfSpansInserted++;
			}
			el.parentNode.replaceChild(newNodes, el);
			return numberOfSpansInserted-1;
		},

		/**
		 * After the Drag/Drop operation, we need to remove the SPAN elements
		 * again.
		 */
		_dd_traverseDomTreeAndRemoveSpans: function(el) {
			var nodesToDelete = [], convertBack;
			convertBack = function(el) {
				var currentlyTraversingExpandedText = false, currentText, lastNode;
				var child;
				for(var i=0, l=el.childNodes.length; i < l; i++) {
					child = el.childNodes[i];
					if (child.nodeType === 1) { // Node
						if (child.attributes['data-i'] !== undefined) {
							if (!currentlyTraversingExpandedText) {
								// We did not traverse expanded text before, and just entered an expanded text section
								// thus, we reset all variables to their initial state
								currentlyTraversingExpandedText = true;
								currentText = '';
								lastNode = undefined;
							}
							if (currentlyTraversingExpandedText) {
								// We are currently traversing the expanded text nodes, so we collect their data
								// together in the currentText variable
								currentText += child.innerHTML;

								if (lastNode) {
									nodesToDelete.push(lastNode);
								}
								lastNode = child;
							}
						} else {
							if (currentlyTraversingExpandedText) {
								currentlyTraversingExpandedText = false;
								// We just left a region with data-i elements set.
								// so, we need to store the currentText back to the region.
								// We do this by using the last visited node as anchor.
								lastNode.parentNode.replaceChild(document.createTextNode(currentText), lastNode);
							}
							// Recursion
							if (!~child.className.indexOf('aloha-block')) {
								// If child does not have the class "aloha-block", we iterate into it
								convertBack(child);
							}
						}
					}
				}
				if (currentlyTraversingExpandedText) {
					// Special case: the last child node *is* a wrapped text node and we are at the end of the collection.
					// In this case, we convert the text as well.
					lastNode.parentNode.replaceChild(document.createTextNode(currentText), lastNode);
				}
			};

			convertBack(el);

			for (var i=0, l=nodesToDelete.length; i<l; i++) {
				nodesToDelete[i].parentNode.removeChild(nodesToDelete[i]);
			}
		},

		/**************************
		 * SECTION: Drag&Drop for Block elements
		 **************************/
		_setupDragDropForBlockElements: function() {
			// Mark the drag handle with an extra CSS class, such that it is picked up by BlockManager.initializeBlockLevelDragDrop()
			this.$element.find('.aloha-block-draghandle').addClass('aloha-block-draghandle-blocklevel');
		},


		/**************************
		 * SECTION: Other Rendering Helpers
		 **************************/

		/**
		 * Create editables from the inner content that was
		 * rendered for this block.
		 *
		 * This method must be idempotent. I.e. it must produce the same results
		 * when called once or twice.
		 *
		 * Override to use a custom implementation and to pass
		 * special configuration to .aloha()
		 */
		createEditablesIfNeeded: function() {
			// TODO: only create them if they are no aloha element yet...
			// TODO: should only happen inside Aloha
			this.$element.find('.aloha-editable').aloha();
		},

		/**
		 * Render block toolbar elements
		 *
		 * This method must be idempotent. I.e. it must produce the same results
		 * when called once or twice.
		 *
		 * Template method to render custom block UI.
		 * @api
		 */
		renderBlockHandlesIfNeeded: function() {
			if (this.isDraggable()) {
				if (this.$element.find('.aloha-block-draghandle').length == 0) {
					this.$element.prepend('<span class="aloha-block-handle aloha-block-draghandle"></span>');
				}
			}
		},

		/**************************
		 * SECTION: Attribute Handling
		 **************************/

		/**
		 * Get or set one or many attribute, similar to the jQuery attr() function.
		 *
		 * The attribute keys are converted internally to lowercase,
		 * so attr('foo', 'bar') and attr('FoO', 'bar') are the same internally.
		 * The same applies to reading.
		 *
		 * It is not allowed to set internal attributes (starting with aloha-block-) through this API.
		 *
		 * @api
		 * @param {String|Object} attributeNameOrObject
		 * @param {String} attributeValue
		 * @param {Boolean} Optional. If true, we do not fire change events.
		 */
		attr: function(attributeNameOrObject, attributeValue, suppressEvents) {
			var that = this, attributeChanged = false;

			if (arguments.length >= 2) {
				if (attributeNameOrObject.substr(0, 12) === 'aloha-block-') {
					Aloha.Log.error('block/block', 'It is not allowed to set internal block attributes (starting with aloha-block-) through Block.attr() (You tried to set ' + attributeNameOrObject + ')');
					return;
				}
				if (this._getAttribute(attributeNameOrObject) !== attributeValue) {
					attributeChanged = true;
				}
				this._setAttribute(attributeNameOrObject, attributeValue);
			} else if (typeof attributeNameOrObject === 'object') {
				jQuery.each(attributeNameOrObject, function(key, value) {
					if (key.substr(0, 12) === 'aloha-block-') {
						Aloha.Log.error('block/block', 'It is not allowed to set internal block attributes (starting with aloha-block-) through Block.attr() (You tried to set ' + key + ')');
						return;
					}
					if (that._getAttribute(key) !== value) {
						attributeChanged = true;
					}
					that._setAttribute(key, value);
				});
			} else if (typeof attributeNameOrObject === 'string') {
				return this._getAttribute(attributeNameOrObject);
			} else {
				return this._getAttributes();
			}
			if (attributeChanged && !suppressEvents) {
				this._update();
				this.trigger('change');
			}
			return null;
		},

		/**
		 * Internal helper for setting  a single attribute.
		 */
		_setAttribute: function(name, value) {
			this.$element.attr('data-' + name.toLowerCase(), value);
		},

		/**
		 * Internal helper for getting an attribute
		 */
		_getAttribute: function(name) {
			return this.$element.attr('data-' + name.toLowerCase());
		},

		/**
		 * Internal helper for getting all attributes
		 */
		_getAttributes: function() {
			var attributes = {};

			// element.data() not always up-to-date, that's why we iterate over the attributes directly.
			jQuery.each(this.$element[0].attributes, function(i, attribute) {
				if (attribute.name.substr(0, 5) === 'data-') {
					attributes[attribute.name.substr(5).toLowerCase()] = attribute.value;
				}
			});

			return attributes;
		}
	});

	/**
	 * @name block.block.DefaultBlock
	 * @class A default block that renders the initial content
	 * @extends block.block.AbstractBlock
	 */
	var DefaultBlock = AbstractBlock.extend(
	/** @lends block.block.DefaultBlock */
	{
		update: function($element, postProcessFn) {
			postProcessFn();
		}
	});

	/**
	 * @name block.block.DebugBlock
	 * @class A debug block outputs its attributes in a table
	 * @extends block.block.AbstractBlock
	 */
	var DebugBlock = AbstractBlock.extend(
	/** @lends block.block.DebugBlock */
	{
		title: 'Debugging',
		init: function($element, postProcessFn) {
			this.update($element, postProcessFn);
		},
		update: function($element, postProcessFn) {
			$element.css({display: 'block'});
			var renderedAttributes = '<table class="debug-block">';
			jQuery.each(this.attr(), function(k, v) {
				renderedAttributes += '<tr><th>' + k + '</th><td>' + v + '</td></tr>';
			});

			renderedAttributes += '</table>';

			$element.html(renderedAttributes);
			postProcessFn();
		}
	});

	return {
		AbstractBlock: AbstractBlock,
		DefaultBlock: DefaultBlock,
		DebugBlock: DebugBlock
	};
});
