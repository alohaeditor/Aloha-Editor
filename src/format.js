/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
/**
 * register the plugin with unique name
 */
GENTICS.Aloha.Format = new GENTICS.Aloha.Plugin('format');

/**
 * Configure the available languages
 */
GENTICS.Aloha.Format.languages = ['en', 'de', 'fr', 'eo', 'fi', 'ru', 'it', 'pl'];

/**
 * default button configuration
 */
GENTICS.Aloha.Format.config = [ 'b', 'i','del','sub','sup', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'removeFormat'];

/**
 * Initialize the plugin and set initialize flag on true
 */
GENTICS.Aloha.Format.init = function () {

	this.initButtons();

	var that = this;

	// apply specific configuration if an editable has been activated
	GENTICS.Aloha.EventRegistry.subscribe(GENTICS.Aloha, 'editableActivated', function (e, params) {
		that.applyButtonConfig(params.editable.obj);
	});

};

/**
 * applys a configuration specific for an editable
 * buttons not available in this configuration are hidden
 * @param {Object} id of the activated editable
 * @return void
 */
GENTICS.Aloha.Format.applyButtonConfig = function (obj) {

	var config = this.getEditableConfig(obj);

	// now iterate all buttons and show/hide them according to the config
	for (var button in this.buttons) {
		if (jQuery.inArray(button, config) != -1) {
			this.buttons[button].button.show();
		} else {
			this.buttons[button].button.hide();
		}
	}

	// and the same for multisplit items
	for (var i in this.multiSplitItems) {
		if (jQuery.inArray(this.multiSplitItems[i].name, config) != -1) {
			this.multiSplitButton.extButton.showItem(this.multiSplitItems[i].name);
		} else {
			this.multiSplitButton.extButton.hideItem(this.multiSplitItems[i].name);
		}
	}
};

/**
 * initialize the buttons and register them on floating menu
 * @param event event object
 * @param editable current editable object
 */
GENTICS.Aloha.Format.initButtons = function () {

	var scope = 'GENTICS.Aloha.continuoustext';
	this.buttons = {};
	var that = this;

	// collect the multisplit items here
	this.multiSplitItems = new Array();
	this.multiSplitButton;

	//iterate configuration array an push buttons to buttons array
	jQuery.each(GENTICS.Aloha.Format.config, function(j, button) {
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
				that.buttons[button] = {'button' : new GENTICS.Aloha.ui.Button({
					'iconClass' : 'GENTICS_button GENTICS_button_' + button,
					'size' : 'small',
					'onclick' : function () {
						// now focus back to the active element
						if (GENTICS.Aloha.activeEditable) {
							GENTICS.Aloha.activeEditable.obj[0].focus();
						}
						var markup = jQuery('<'+button+'></'+button+'>');
						var rangeObject = GENTICS.Aloha.Selection.rangeObject;

						// check whether the markup is found in the range (at the start of the range)
						var foundMarkup = rangeObject.findMarkup(function() {
							return this.nodeName.toLowerCase() == markup.get(0).nodeName.toLowerCase();
						}, GENTICS.Aloha.activeEditable.obj);

						if (foundMarkup) {
							// remove the markup
							if (rangeObject.isCollapsed()) {
								// when the range is collapsed, we remove exactly the one DOM element
								GENTICS.Utils.Dom.removeFromDOM(foundMarkup, rangeObject, true);
							} else {
								// the range is not collapsed, so we remove the markup from the range
								GENTICS.Utils.Dom.removeMarkup(rangeObject, markup, GENTICS.Aloha.activeEditable.obj);
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
				GENTICS.Aloha.FloatingMenu.addButton(
					scope,
					that.buttons[button].button,
					GENTICS.Aloha.i18n(GENTICS.Aloha, 'floatingmenu.tab.format'),
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
	           	    'iconClass' : 'GENTICS_button ' + that.i18n('GENTICS_button_' + button),
	           	    'markup' : jQuery('<'+button+'></'+button+'>'),
	           	    'click' : function() {
						// now focus back to the active element
						if (GENTICS.Aloha.activeEditable) {
							GENTICS.Aloha.activeEditable.obj[0].focus();
						}
						GENTICS.Aloha.Selection.changeMarkupOnSelection(jQuery('<' + button + '></' + button + '>'));
					}
				});
				break;

//			case 'title':
//				that.multiSplitItems.push({
//					'name' : button,
//	       	    	'tooltip' : that.i18n('button.' + button + '.tooltip'),
//	           	    'iconClass' : 'GENTICS_button ' + that.i18n('GENTICS_button_' + button),
//	           	    'markup' : jQuery('<h1 property="dc:title"></h1>'),
//	           	    'click' : function() {
//						GENTICS.Aloha.Selection.changeMarkupOnSelection(jQuery('<h1 property="dc:title"></h1>'));
//						// now focus back to the active element
//						if (GENTICS.Aloha.activeEditable) {
//							GENTICS.Aloha.activeEditable.obj[0].focus();
//						}
//					}
//				});
//				break;

			// wide multisplit buttons
			case 'removeFormat':
				that.multiSplitItems.push({
					'name' : button,
					'text' : that.i18n('button.' + button + '.text'),
	       	    	'tooltip' : that.i18n('button.' + button + '.tooltip'),
	           	    'iconClass' : 'GENTICS_button GENTICS_button_' + button,
	           	    'wide' : true,
	           	    'click' : function() {
						GENTICS.Aloha.Format.removeFormat();
					}
				});
				break;
			//no button defined
			default:
				GENTICS.Aloha.log('warn', this, 'Button "' + button + '" is not defined');
				break;
		}
	});

	if (this.multiSplitItems.length > 0) {
		this.multiSplitButton = new GENTICS.Aloha.ui.MultiSplitButton({
			'items' : this.multiSplitItems
		});
		GENTICS.Aloha.FloatingMenu.addButton(
			scope,
			this.multiSplitButton,
			GENTICS.Aloha.i18n(GENTICS.Aloha, 'floatingmenu.tab.format'),
			3
		);
	}

	// add the event handler for selection change
	GENTICS.Aloha.EventRegistry.subscribe(GENTICS.Aloha, 'selectionChanged', function(event, rangeObject) {
		// iterate over all buttons
		jQuery.each(that.buttons, function(index, button) {
			for (var i = 0; i < rangeObject.markupEffectiveAtStart.length; i++) {
				var effectiveMarkup = rangeObject.markupEffectiveAtStart[ i ];
				if (GENTICS.Aloha.Selection.standardTextLevelSemanticsComparator(effectiveMarkup, button.markup)) {
					button.button.setPressed(true);
					var statusWasSet = true;
				}
			}
			if (!statusWasSet) {
				button.button.setPressed(false);
			}
		});

		if (that.multiSplitItems.length > 0) {
			var foundMultiSplit = false;

			// iterate over the markup elements
			for (var i = 0; i < rangeObject.markupEffectiveAtStart.length && !foundMultiSplit; i++) {
				var effectiveMarkup = rangeObject.markupEffectiveAtStart[ i ];

				for (var j = 0; j < that.multiSplitItems.length && !foundMultiSplit; j++) {
					var multiSplitItem = that.multiSplitItems[j];

					if (!multiSplitItem.markup) {
						continue;
					}

					// now check whether one of the multiSplitItems fits to the effective markup
					if (GENTICS.Aloha.Selection.standardTextLevelSemanticsComparator(effectiveMarkup, multiSplitItem.markup)) {
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
};

/**
 * Removes all formatting from the current selection.
 */
GENTICS.Aloha.Format.removeFormat = function() {
	// FIXME: Very ugly, quick implementation must be changed after selection.js is consolidated
	GENTICS.Aloha.Selection.changeMarkupOnSelection(jQuery('<p></p>'));

	var formats = ['b', 'i', 'cite', 'q', 'code', 'abbr', 'del', 'sub', 'sup'];

	var rangeObject = GENTICS.Aloha.Selection.rangeObject;
	var startObj = jQuery(rangeObject.startContainer);
	var limitObj = jQuery(rangeObject.limitObject);

	if (rangeObject.isCollapsed() || startObj === limitObj) {
		return;
	}

	// Iterate up from the start container to the limit object and apply all markups found once (remove them)
	var parent = startObj.parent();
	while (parent.get(0) !== limitObj.get(0)) {
		var index = formats.indexOf(parent.get(0).nodeName.toLowerCase());
		parent = parent.parent();
		if (index != -1) {
			GENTICS.Aloha.Selection.changeMarkupOnSelection(jQuery('<'+formats[index]+'></'+formats[index]+'>'));
			formats.splice(index, 1);
		}
	}

	// Iterate over the rest of the available markups and apply them twice
	for (var i in formats) {
		GENTICS.Aloha.Selection.changeMarkupOnSelection(jQuery('<'+formats[i]+'></'+formats[i]+'>'));
		GENTICS.Aloha.Selection.changeMarkupOnSelection(jQuery('<'+formats[i]+'></'+formats[i]+'>'));
	}

	// TODO: trigger event - removed Format

};

/**
* toString method
* @return string
*/
GENTICS.Aloha.Format.toString = function () {
	return 'format';
};
