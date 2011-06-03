/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

// Start Closure
(function(window, undefined) {
	"use strict";
	var
		jQuery = window.alohaQuery, $ = jQuery,
		GENTICS = window.GENTICS,
		Aloha = window.Aloha;

	/**
	 * register the plugin with unique name
	 */
	Aloha.Format = new (Aloha.Plugin.extend({
		_constructor: function(){
			this._super('format');
		},
	
		/**
		 * Configure the available languages
		 */
		languages: ['en', 'de', 'fr', 'eo', 'fi', 'ru', 'it', 'pl'],
	
		/**
		 * default button configuration
		 */
		config: [ 'b', 'i','del','sub','sup', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'removeFormat'],
	
		/**
		 * Initialize the plugin and set initialize flag on true
		 */
		init: function () {
			// Prepare
			var me = this;
	
			this.initButtons();
	
			// apply specific configuration if an editable has been activated
			Aloha.bind('aloha-editable-activated',function (e, params) {
				//debugger;
				me.applyButtonConfig(params.editable.obj);
			});
	
		},
	
		/**
		 * applys a configuration specific for an editable
		 * buttons not available in this configuration are hidden
		 * @param {Object} id of the activated editable
		 * @return void
		 */
		applyButtonConfig: function (obj) {
	
			var config = this.getEditableConfig(obj),
				button, i;
	
			// now iterate all buttons and show/hide them according to the config
			for ( button in this.buttons) {
				if (jQuery.inArray(button, config) != -1) {
					this.buttons[button].button.show();
				} else {
					this.buttons[button].button.hide();
				}
			}
	
			// and the same for multisplit items
			for ( i in this.multiSplitItems) {
				if (jQuery.inArray(this.multiSplitItems[i].name, config) != -1) {
					this.multiSplitButton.showItem(this.multiSplitItems[i].name);
				} else {
					this.multiSplitButton.hideItem(this.multiSplitItems[i].name);
				}
			}
		},
	
		/**
		 * initialize the buttons and register them on floating menu
		 * @param event event object
		 * @param editable current editable object
		 */
		initButtons: function () {
			var
				scope = 'Aloha.continuoustext',
				that = this;
			
			// reset
			this.buttons = {};
	
			// collect the multisplit items here
			this.multiSplitItems = [];
			//this.multiSplitButton;
	
			//iterate configuration array an push buttons to buttons array
			jQuery.each(Aloha.Format.config, function(j, button) {
				switch( button ) {
					// text level semantics:
					case 'b':
					case 'i':
					case 'cite':
					case 'q':
					case 'code':
					case 'abbr':
					case 'del':
					case 'sub':
					case 'sup':
						that.buttons[button] = {'button' : new Aloha.ui.Button({
							'iconClass' : 'aloha-button aloha-button-' + button,
							'size' : 'small',
							'onclick' : function () {
								var
									markup = jQuery('<'+button+'></'+button+'>'),
									rangeObject = Aloha.Selection.rangeObject,
									foundMarkup;
	

								// now focus back to the active element
								if (Aloha.activeEditable) {
									Aloha.activeEditable.obj[0].focus();
								}

								// check whether the markup is found in the range (at the start of the range)
								foundMarkup = rangeObject.findMarkup(function() {
									return this.nodeName.toLowerCase() == markup.get(0).nodeName.toLowerCase();
								}, Aloha.activeEditable.obj);
	
								if (foundMarkup) {
									// remove the markup
									if (rangeObject.isCollapsed()) {
										// when the range is collapsed, we remove exactly the one DOM element
										GENTICS.Utils.Dom.removeFromDOM(foundMarkup, rangeObject, true);
									} else {
										// the range is not collapsed, so we remove the markup from the range
										GENTICS.Utils.Dom.removeMarkup(rangeObject, markup, Aloha.activeEditable.obj);
									}
								} else {
									// when the range is collapsed, extend it to a word
									if (rangeObject.isCollapsed()) {
										GENTICS.Utils.Dom.extendToWord(rangeObject);
									}
	
									// add the markup
									GENTICS.Utils.Dom.addMarkup(rangeObject, markup);
								}
								// select the modified range
								rangeObject.select();
								return false;
							},
							'tooltip' : that.i18n('button.' + button + '.tooltip'),
							'toggle' : true
						}), 'markup' : jQuery('<'+button+'></'+button+'>')};
						Aloha.FloatingMenu.addButton(
							scope,
							that.buttons[button].button,
							Aloha.i18n(Aloha, 'floatingmenu.tab.format'),
							1
						);
						break;
	
					case 'p':
					case 'h1':
					case 'h2':
					case 'h3':
					case 'h4':
					case 'h5':
					case 'h6':
					case 'pre':
						that.multiSplitItems.push({
							'name' : button,
							'tooltip' : that.i18n('button.' + button + '.tooltip'),
							'iconClass' : 'aloha-button ' + that.i18n('aloha-button-' + button),
							'markup' : jQuery('<'+button+'></'+button+'>'),
							'click' : function() {
								// now focus back to the active element
								if (Aloha.activeEditable) {
									Aloha.activeEditable.obj[0].focus();
								}
								Aloha.Selection.changeMarkupOnSelection(jQuery('<' + button + '></' + button + '>'));
							}
						});
						break;
	
					// wide multisplit buttons
					case 'removeFormat':
						that.multiSplitItems.push({
							'name' : button,
							'text' : that.i18n('button.' + button + '.text'),
							'tooltip' : that.i18n('button.' + button + '.tooltip'),
							'iconClass' : 'aloha-button aloha-button-' + button,
							'wide' : true,
							'click' : function() {
								Aloha.Format.removeFormat();
							}
						});
						break;
					//no button defined
					default:
						Aloha.log('warn', this, 'Button "' + button + '" is not defined');
						break;
				}
			});
	
			if (this.multiSplitItems.length > 0) {
				this.multiSplitButton = new Aloha.ui.MultiSplitButton({
					'items' : this.multiSplitItems
				});
				Aloha.FloatingMenu.addButton(
					scope,
					this.multiSplitButton,
					Aloha.i18n(Aloha, 'floatingmenu.tab.format'),
					3
				);
			}
	
			// add the event handler for selection change
			Aloha.bind('aloha-selection-changed',function(event,rangeObject){
				// iterate over all buttons
				var
					statusWasSet = false, effectiveMarkup,
					foundMultiSplit, i, j, multiSplitItem;
				
				jQuery.each(that.buttons, function(index, button) {
					for ( i = 0; i < rangeObject.markupEffectiveAtStart.length; i++) {
						effectiveMarkup = rangeObject.markupEffectiveAtStart[ i ];
						if (Aloha.Selection.standardTextLevelSemanticsComparator(effectiveMarkup, button.markup)) {
							button.button.setPressed(true);
							statusWasSet = true;
						}
					}
					if (!statusWasSet) {
						button.button.setPressed(false);
					}
				});
	
				if (that.multiSplitItems.length > 0) {
					foundMultiSplit = false;
	
					// iterate over the markup elements
					for ( i = 0; i < rangeObject.markupEffectiveAtStart.length && !foundMultiSplit; i++) {
						effectiveMarkup = rangeObject.markupEffectiveAtStart[ i ];
	
						for ( j = 0; j < that.multiSplitItems.length && !foundMultiSplit; j++) {
							multiSplitItem = that.multiSplitItems[j];
	
							if (!multiSplitItem.markup) {
								continue;
							}
	
							// now check whether one of the multiSplitItems fits to the effective markup
							if (Aloha.Selection.standardTextLevelSemanticsComparator(effectiveMarkup, multiSplitItem.markup)) {
								that.multiSplitButton.setActiveItem(multiSplitItem.name);
								foundMultiSplit = true;
							}
						}
					}
	
					if (!foundMultiSplit) {
						that.multiSplitButton.setActiveItem(null);
					}
				}
			});
	
		},
	
		/**
		 * Removes all formatting from the current selection.
		 */
		removeFormat: function() {
			// FIXME: Very ugly, quick implementation must be changed after selection.js is consolidated
			Aloha.Selection.changeMarkupOnSelection(jQuery('<p></p>'));
	
			var formats = ['b', 'i', 'cite', 'q', 'code', 'abbr', 'del', 'sub', 'sup'],
				rangeObject = Aloha.Selection.rangeObject,
				startObj = jQuery(rangeObject.startContainer),
				limitObj = jQuery(rangeObject.limitObject),
				parent, index, i;
	
			if (rangeObject.isCollapsed() || startObj === limitObj) {
				return;
			}
	
			// Iterate up from the start container to the limit object and apply all markups found once (remove them)
			parent = startObj.parent();
			while (parent.get(0) !== limitObj.get(0)) {
				index = $.inArray(parent.get(0).nodeName.toLowerCase(),formats);
				parent = parent.parent();
				if (index != -1) {
					Aloha.Selection.changeMarkupOnSelection(jQuery('<'+formats[index]+'></'+formats[index]+'>'));
					formats.splice(index, 1);
				}
			}
	
			// Iterate over the rest of the available markups and apply them twice
			for ( i in formats) {
				if ( formats.hasOwnProperty(i) ) {
					Aloha.Selection.changeMarkupOnSelection(jQuery('<'+formats[i]+'></'+formats[i]+'>'));
					Aloha.Selection.changeMarkupOnSelection(jQuery('<'+formats[i]+'></'+formats[i]+'>'));
				}
			}
	
			// TODO: trigger event - removed Format
	
		},
	
		/**
		* toString method
		* @return string
		*/
		toString: function () {
			return 'format';
		}
	
	}))();
})(window);
