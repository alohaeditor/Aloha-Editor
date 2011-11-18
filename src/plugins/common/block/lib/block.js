/*!
 * Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH
 * aloha-sales@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

/**
 * @name block.block
 * @namespace Block models
 */
define(['aloha', 'aloha/jquery', 'block/blockmanager', 'aloha/observable', 'aloha/floatingmenu'],
function(Aloha, jQuery, BlockManager, Observable, FloatingMenu) {
	"use strict";

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
		 * @name block.block.AbstractBlock#change
		 * @event
		 */

		/**
		 * Title for the block, used to display the name in the sidebar.
		 * @type String
		 * @api
		 */
		title: null,

		/**
		 * Id of the assigned element, used to identify a block
		 * @type String
		 */
		id: null,

		/**
		 * The wrapping element of the block.
		 * @type jQuery
		 */
		$element: null,

		/**
		 * if TRUE, the rendering is currently taking place. Used to prevent recursion
		 * errors.
		 * @type Boolean
		 */
		_currentlyRendering: false,

		/**
		 * set to TRUE once the block is fully initialized and should be rendered.
		 *
		 * @type Boolean
		 */
		_initialized: false,

		/**************************
		 * SECTION: Initialization and Lifecycle
		 **************************/

		/**
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
				this.$element.attr('id', this.id);
			}

			this.$element.contentEditable(false);

			this.$element.addClass('aloha-block');

			if (this.isDraggable()) {
				// Remove default drag/drop behavior of the browser
				this.$element.find('img').attr('draggable', 'false');
				this.$element.find('a').attr('draggable', 'false');
			}

			// Register event handlers for activating an Aloha Block
			this.$element.bind('click', function(event) {
				that.activate(event.target);
				event.stopPropagation();
			});

			// TODO: where is this executed?
			//Aloha.bind('aloha-block-selected', function(event,obj) {
			//	if (that.$element.get(0) === obj) {
			//		that.activate();
			//	}
			//});

			// We need to tell Aloha that we handle the event already;
			// else a selection of block contents will *not* select
			// the block.
			this.$element.bind('mousedown', function() {
				Aloha.Selection.preventSelectionChanged();
			}).bind('focus', function() {
				Aloha.Selection.preventSelectionChanged();
			}).bind('dblclick', function() {
				Aloha.Selection.preventSelectionChanged();
			});

			this.init(this.$element);

			this._postProcessElementIfNeeded();

			this._registerAsBlockified();
		},

		/**
		 * Template method to initialize the block. Can be used to set attributes
		 * on the block, depending on the block contents. You will most probably
		 * use this.$element and this.attr() inside this function.
		 * @api
		 */
		init: function() {},

		_registerAsBlockified: function() {
			this._initialized = true;
			this.$element.trigger('block-initialized');
		},

		/**
		 * Destroy this block instance completely. Removes the element from the DOM,
		 * unregisters it, and triggers a delete event on the BlockManager.
		 *
		 * @return
		 * @api
		 */
		destroy: function() {
			var that = this;
			BlockManager.trigger('block-delete', this);
			BlockManager._unregisterBlock(this);

			this.unbindAll();

			this.$element.fadeOut('fast', function() {
				that.$element.remove();
				BlockManager.trigger('block-selection-change', []);
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

		serialize: function() {
			// TODO: use ALL attributes, not just data-....
			return {
				tag: this.$element[0].tagName,
				attributes: this._getAttributes() // contains data-properties
			}
		},

		/**
		 * Get a schema of attributes with
		 *
		 * TODO Document schema format
		 *
		 * @api
		 * @returns {Object}
		 */
		getSchema: function() {
			return null;
		},

		/**
		 * Template Method which should return the block title. Needed for the sidebar.
		 */
		getTitle: function() {
			return this.title;
		},

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
		activate: function() {
			var previouslyHighlightedBlocks = BlockManager._getHighlightedBlocks(),
				highlightedBlocks = [];

			delete previouslyHighlightedBlocks[this.id];

			FloatingMenu.setScope('Aloha.Block.' + this.attr('aloha-block-type'));

			this._highlight();
			highlightedBlocks.push(this);

			this.$element.parents('.aloha-block').each(function() {
				var block = BlockManager.getBlock(this);
				delete previouslyHighlightedBlocks[block.id];

				block._highlight();
				highlightedBlocks.push(block);
			});
			jQuery.each(previouslyHighlightedBlocks, function() {
				this.deactivate();
			});

			this.$element.addClass('aloha-block-active');

			BlockManager.trigger('block-selection-change', highlightedBlocks);
			//GENTICS.Utils.Dom.selectDomNode(this.$element[0]);

			return false;
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

		_highlight: function() {
			this.$element.addClass('aloha-block-highlighted');
			BlockManager._setHighlighted(this);
		},

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
		update: function($element, postProcessFn) {},


		/**
		 * Post processor, being called to augument the Block Element's DOM by drag handles etc.
		 *
		 * This method must be idempotent. I.e. it must produce the same results
		 * when called once or twice.
		 */
		_postProcessElementIfNeeded: function() {
			var that = this;
			this.createEditablesIfNeeded();
			this.renderDragHandlesIfNeeded();
			if (this.isDraggable()) {
				//this.$element.attr('draggable', 'true');

				var insertSpans = function(el) {
					// Use ECMA-262 Edition 3 String and RegExp features
					if (!/[^\t\n\r ]/.test(el.textContent)) {
						return;
					}
					var newNodes = document.createDocumentFragment();
					for (var i=0; i<el.textContent.length; i++) {
						var x = document.createElement('span');
						x.setAttribute('data-i', i);
						x.innerHTML = el.textContent.substr(i, 1);
						newNodes.appendChild(x);
					}
					el.parentNode.replaceChild(newNodes, el);
				}
				var removeSpans = function($el) {
					var content = [];
					content.push($el[0].innerHTML);

					var $nextElements = $el.nextUntil(':not(span[data-i])');
					$nextElements.each(function() {
						content.push(this.innerHTML);
					});
					$nextElements.remove();

					var textNode = document.createTextNode(content.join(''));
					var el = $el[0];
					el.parentNode.replaceChild(textNode, el);
				}
				var convert, collectSpansToBeRemoved;
				convert = function($el) {
					jQuery.each($el.contents(), function() {
						switch(this.nodeType) {
							case 1:
								if (jQuery(this).is('.aloha-block')) return;
								if (jQuery(this).is('[data-i]')) return;
								convert(jQuery(this));
								break;
							case 3:
								insertSpans(this);
						}
					});
				};

				var spansToBeRemoved = [];
				collectSpansToBeRemoved = function($el) {
					jQuery.each($el.children(), function() {
						if (jQuery(this).attr('data-i') === '0') {
							spansToBeRemoved.push(jQuery(this));
							return;
						}
						if (jQuery(this).is('.aloha-block')) return;
						collectSpansToBeRemoved(jQuery(this));
					});
				};


				this.$element.draggable({
					handle: '.aloha-block-draghandle',
					start: function() {
						convert(that.$element.parents('.aloha-editable').first());
						jQuery('[data-i]').droppable({
							hoverClass: 'aloha-block-droppable',
							tolerance: 'pointer',
							addClasses: false, // performance optimization
							drop: function(evt, ui) {
								var offset = jQuery(this).attr('data-i');
								var parent = jQuery(this).parent();
								spansToBeRemoved = [];
								collectSpansToBeRemoved(that.$element.parents('.aloha-editable').first());
								jQuery.each(spansToBeRemoved, function(index, $el) {
									removeSpans($el);
								});

								var range = new GENTICS.Utils.RangeObject({
									startContainer: parent[0],
									startOffset: offset,
									endContainer: parent[0],
									endOffset: offset
								});
								range.update();
								console.log("drop", range.isCollapsed(), offset, parent[0], ui.draggable);
								GENTICS.Utils.Dom.insertIntoDOM(jQuery('<b>Test</b>'), range);

							}
						});
						console.log("start");
					},
					/*stop: function(event, ui) {
						console.log("stop", event.srcElement, ui);
						//ui.helper.css('display', 'none');
						//console.log(document.elementFromPoint(ui.offset.left, ui.offset.top));

					},*/
					containment: this.$element.parents('.aloha-editable').first()
				});
			}
		},

		/**
		 * Create editables from the inner content that was
		 * rendered for this block.
		 *
		 * TODO: this method should be idempotent
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
		 */
		renderDragHandlesIfNeeded: function() {
			var that = this;
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
			return this;
		},

		_setAttribute: function(name, value) {
			this.$element.attr('data-' + name.toLowerCase(), value);
		},

		_getAttribute: function(name) {
			return this._getAttributes()[name.toLowerCase()];
		},

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
		init: function() {
		},
		update: function() {
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
		init: function() {
			this.update();
		},
		update: function() {
			this.$element.css({display: 'block'});
			var renderedAttributes = '<table class="debug-block">';
			jQuery.each(this.attr(), function(k, v) {
				renderedAttributes += '<tr><th>' + k + '</th><td>' + v + '</td></tr>';
			});

			renderedAttributes += '</table>';

			return renderedAttributes;
		}
	});

	return {
		AbstractBlock: AbstractBlock,
		DefaultBlock: DefaultBlock,
		DebugBlock: DebugBlock
	};
});
