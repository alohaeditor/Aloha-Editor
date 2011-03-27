/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
/**
 * Register the ListPlugin as GENTICS.Aloha.Plugin
 */
GENTICS.Aloha.ListPlugin = new GENTICS.Aloha.Plugin('list');

/**
 * Configure the available languages
 */
GENTICS.Aloha.ListPlugin.languages = ['en', 'de', 'fr', 'eo', 'fi', 'ru', 'it'];

/**
 * default button configuration
 */
GENTICS.Aloha.ListPlugin.config = [ 'ul', 'ol' ];

/**
 * List of transformable elements
 */
GENTICS.Aloha.ListPlugin.transformableElements = {'p' : true, 'h1' : true, 'h2' : true, 'h3' : true, 'h4' : true, 'h5' : true, 'h6' : true, 'ul' : true, 'ol' : true};

/**
 * Initialize the plugin, register the buttons
 */
GENTICS.Aloha.ListPlugin.init = function() {

	var that = this;

	// the 'create unordered list' button
	this.createUnorderedListButton = new GENTICS.Aloha.ui.Button({
		'iconClass' : 'GENTICS_button GENTICS_button_ul',
		'size' : 'small',
		'tooltip' : this.i18n('button.createulist.tooltip'),
		'toggle' : true,
		'onclick' : function (element, event) {
			that.transformList(false);
		}
	});
	// add to floating menu
	GENTICS.Aloha.FloatingMenu.addButton(
		'GENTICS.Aloha.continuoustext',
		this.createUnorderedListButton,
		GENTICS.Aloha.i18n(GENTICS.Aloha, 'floatingmenu.tab.format'),
		1
	);

	// the 'create ordered list' button
	this.createOrderedListButton = new GENTICS.Aloha.ui.Button({
		'iconClass' : 'GENTICS_button GENTICS_button_ol',
		'size' : 'small',
		'tooltip' : this.i18n('button.createolist.tooltip'),
		'toggle' : true,
		'onclick' : function (element, event) {
			that.transformList(true);
		}
	});
	// add to floating menu
	GENTICS.Aloha.FloatingMenu.addButton(
		'GENTICS.Aloha.continuoustext',
		this.createOrderedListButton,
		GENTICS.Aloha.i18n(GENTICS.Aloha, 'floatingmenu.tab.format'),
		1
	);

	// add the event handler for selection change
	GENTICS.Aloha.EventRegistry.subscribe(GENTICS.Aloha, 'selectionChanged', function(event, rangeObject) {
		that.createUnorderedListButton.setPressed(false);
		that.createOrderedListButton.setPressed(false);
		for (var i = 0; i < rangeObject.markupEffectiveAtStart.length; i++) {
			var effectiveMarkup = rangeObject.markupEffectiveAtStart[ i ];
			if (GENTICS.Aloha.Selection.standardTextLevelSemanticsComparator(effectiveMarkup, jQuery('<ul></ul>'))) {
				that.createUnorderedListButton.setPressed(true);
				break;
			}
			if (GENTICS.Aloha.Selection.standardTextLevelSemanticsComparator(effectiveMarkup, jQuery('<ol></ol>'))) {
				that.createOrderedListButton.setPressed(true);
				break;
			}
		}
		if (GENTICS.Aloha.activeEditable) {
			that.applyButtonConfig(GENTICS.Aloha.activeEditable.obj);
		}

		// TODO this should not be necessary here!
		GENTICS.Aloha.FloatingMenu.doLayout();
	});

	// add the key handler for Tab
	GENTICS.Aloha.Markup.addKeyHandler(9, function(event) {
		return that.processTab(event);
	});
};

/**
 * Applys a configuration specific for an editable
 * buttons not available in this configuration are hidden
 * @param {jQuery} obj jQuery object of the activated editable
 */
GENTICS.Aloha.ListPlugin.applyButtonConfig = function (obj) {

	var config = this.getEditableConfig(obj);

	if (GENTICS.Aloha.Selection.rangeObject.unmodifiableMarkupAtStart[0]) {
		// show/hide them according to the config
		if (jQuery.inArray('ul', config) != -1 && GENTICS.Aloha.Selection.canTag1WrapTag2(GENTICS.Aloha.Selection.rangeObject.unmodifiableMarkupAtStart[0].nodeName, "ul") != -1) {
			this.createUnorderedListButton.show();
		} else {
			this.createUnorderedListButton.hide();
		}

		if (jQuery.inArray('ol', config) != -1 && GENTICS.Aloha.Selection.canTag1WrapTag2(GENTICS.Aloha.Selection.rangeObject.unmodifiableMarkupAtStart[0].nodeName, "ol") != -1) {
			this.createOrderedListButton.show();
		} else {
			this.createOrderedListButton.hide();
		}
	}
};


/**
 * Process Tab and Shift-Tab pressed in lists
 */
GENTICS.Aloha.ListPlugin.processTab = function (event) {
	switch(event['keyCode']) {
		case 9: // TAB
			if (event.shiftKey) {
				return this.outdentList();
			} else {
				return this.indentList();
			}
	}
	return true;
};

/**
 * For the current selection, get the DOM object, which will be transformed to/from the list
 * @return dom object or false
 */
GENTICS.Aloha.ListPlugin.getStartingDomObjectToTransform = function () {
	var rangeObject = GENTICS.Aloha.Selection.rangeObject;

	for (var i = 0; i < rangeObject.markupEffectiveAtStart.length; i++) {
		var effectiveMarkup = rangeObject.markupEffectiveAtStart[ i ];
		if (this.transformableElements[effectiveMarkup.nodeName.toLowerCase()]) {
			return effectiveMarkup;
		}
	}

	return false;
};

/**
 * For the current selection, get the nearest list item as dom object
 * @return dom object or false
 */
GENTICS.Aloha.ListPlugin.getNearestSelectedListItem = function () {
	var rangeObject = GENTICS.Aloha.Selection.rangeObject;

	for (var i = 0; i < rangeObject.markupEffectiveAtStart.length; i++) {
		var effectiveMarkup = rangeObject.markupEffectiveAtStart[ i ];
		if (GENTICS.Utils.Dom.isListElement(effectiveMarkup)) {
			return effectiveMarkup;
		}
	}

	return false;
};

/**
 * Transform the current selection to/from a list
 * @param ordered true when transforming to/from an ordered list, false for unordered lists
 */
GENTICS.Aloha.ListPlugin.transformList = function (ordered) {
	var domToTransform = this.getStartingDomObjectToTransform();

	if (!domToTransform) {
		// wrap a paragraph around the selection
		GENTICS.Aloha.Selection.changeMarkupOnSelection(jQuery('<p></p>'));
		domToTransform = this.getStartingDomObjectToTransform();

		if (!domToTransform) {
			GENTICS.Aloha.Log.error(this, 'Could not transform selection into a list');
			return;
		}
	}

	// check the dom object
	var nodeName = domToTransform.nodeName.toLowerCase();

	if (nodeName == 'ul' && !ordered) {
		// first check whether the list is nested into another list
		var jqList = jQuery(domToTransform);

		var jqParentList = jqList.parent();
		if (jqParentList.length > 0
				&& GENTICS.Utils.Dom.isListElement(jqParentList.get(0))) {
			// when the list is nested into another, our list items will be
			// added to the list items of the outer list
			jqList.children().unwrap();
		} else {
			// we are in an unordered list and shall transform it to paragraphs

			// transform all li into p
			var jqToTransform = jQuery(domToTransform);
			jQuery.each(jqToTransform.children('li'), function(index, li) {
				var newPara = GENTICS.Aloha.Markup.transformDomObject(li, 'p');
				// if any lists are in the paragraph, move the to after the paragraph
				newPara.after(newPara.children('ol,ul'));
			});

			// unwrap the li (remove the enclosing ul)
			jqToTransform.children().unwrap();
		}
	} else if (nodeName == 'ul' && ordered) {
		// we are in an unordered list and shall transform it to an ordered list

		// transform the ul into an ol
		GENTICS.Aloha.Markup.transformDomObject(domToTransform, 'ol');

		// merge adjacent lists
		this.mergeAdjacentLists(jQuery(domToTransform));
	} else if (nodeName == 'ol' && !ordered) {
		// we are in an ordered list and shall transform it to an unordered list

		// transform the ol into an ul
		GENTICS.Aloha.Markup.transformDomObject(domToTransform, 'ul');

		// merge adjacent lists
		this.mergeAdjacentLists(jQuery(domToTransform));
	} else if (nodeName == 'ol' && ordered) {
		// first check whether the list is nested into another list
		var jqList = jQuery(domToTransform);

		var jqParentList = jqList.parent();
		if (jqParentList.length > 0
				&& GENTICS.Utils.Dom.isListElement(jqParentList.get(0))) {
			// when the list is nested into another, our list items will be
			// added to the list items of the outer list
			jqList.children().unwrap();
		} else {
			// we are in an unordered list and shall transform it to paragraphs

			// transform all li into p
			var jqToTransform = jQuery(domToTransform);
			jQuery.each(jqToTransform.children('li'), function(index, li) {
				var newPara = GENTICS.Aloha.Markup.transformDomObject(li, 'p');
				// if any lists are in the paragraph, move the to after the paragraph
				newPara.after(newPara.children('ol,ul'));
			});

			// unwrap the li (remove the enclosing ul)
			jqToTransform.children().unwrap();
		}
	} else {
		// we are in something different from a list and shall transform it into a list

		// get the also selected siblings of the dom object
		var selectedSiblings = GENTICS.Aloha.Selection.rangeObject.getSelectedSiblings(domToTransform);

		// create a new list
		var jqList = ordered ? jQuery('<ol></ol>') : jQuery('<ul></ul>');
		// add a new list item
		var jqNewLi = jQuery('<li></li>');
		// add the li into the list
		jqList.append(jqNewLi);
		// append the contents of the old dom element to the li
		jQuery(domToTransform).contents().appendTo(jqNewLi);
		// replace the old dom element with the new list
		jQuery(domToTransform).replaceWith(jqList);

		// now also transform all siblings
		if (selectedSiblings) {
			var lastLi = false;
			for (var i = 0; i < selectedSiblings.length; ++i) {
				if (GENTICS.Utils.Dom.isBlockLevelElement(selectedSiblings[i])) {
					if (lastLi) {
						lastLi = false;
					}

					// transform the block level element
					jqNewLi = GENTICS.Aloha.Markup.transformDomObject(selectedSiblings[i], 'li');
					jqList.append(jqNewLi);
				} else {
					if (selectedSiblings[i].nodeType == 3
							&& jQuery.trim(selectedSiblings[i].data).length == 0) {
						continue;
					}
					if (!lastLi) {
						lastLi = jQuery('<li></li>');
						jqList.append(lastLi);
					}
					lastLi.append(selectedSiblings[i]);
				}
			}
		}

		// merge adjacent lists
		this.mergeAdjacentLists(jqList);
	}

	// refresh the selection
	this.refreshSelection();
};

/**
 * Indent the selected list items by moving them into a new created, nested list
 */
GENTICS.Aloha.ListPlugin.indentList = function () {
	var listItem = this.getNearestSelectedListItem();
	if (listItem) {
		var jqItemBefore = jQuery(listItem).prev('li');

		// when we are in the first li of a list, there is no indenting
		if (jqItemBefore.length == 0) {
			// but we handled the TAB keystroke
			return false;
		}
		var jqOldList = jQuery(listItem).parent();

		// get the also selected siblings of the dom object
		var selectedSiblings = GENTICS.Aloha.Selection.rangeObject.getSelectedSiblings(listItem);


		// create the new list element by cloning the selected list element's parent
		var jqNewList = jQuery(listItem).parent().clone(false).empty();
		jqNewList.append(listItem);

		// we found a list item before the first selected one, so append the new list to it
		jqItemBefore.append(jqNewList);

		// check for multiple selected items
		if (selectedSiblings) {
			for ( var i = 0; i < selectedSiblings.length; ++i) {
				jqNewList.append(jQuery(selectedSiblings[i]));
			}
		}

		// merge adjacent lists
		this.mergeAdjacentLists(jqNewList);

		// refresh the selection
		this.refreshSelection();

		return false;
	}

	return true;
};

/**
 * Outdent nested list items by moving them into the outer list
 */
GENTICS.Aloha.ListPlugin.outdentList = function () {
	var listItem = this.getNearestSelectedListItem();
	if (listItem) {
		// check whether the list is nested into another list
		var jqListItem = jQuery(listItem);
		var jqList = jqListItem.parent();

		// get the parent list
		var jqParentList = jqList.parents('ul,ol');

		// check whether the inner list is directly inserted into a li element
		var wrappingLi = jqList.parent('li');

		if (jqParentList.length > 0
				&& GENTICS.Utils.Dom.isListElement(jqParentList.get(0))) {
			// the list is nested into another list

			// get the also selected siblings of the dom object
			var selectedSiblings = GENTICS.Aloha.Selection.rangeObject.getSelectedSiblings(listItem);

			// check for multiple selected items
			if (selectedSiblings && selectedSiblings.length > 0) {
				var lastSelected = jQuery(selectedSiblings[selectedSiblings.length - 1]);
			} else {
				var lastSelected = jqListItem;
			}

			// check whether we found not selected li's after the selection
			if (lastSelected.nextAll('li').length > 0) {
				var jqNewPostList = jqList.clone(false).empty();
				jqNewPostList.append(lastSelected.nextAll());
			}

			// now move all selected li's into the higher list
			if (wrappingLi.length > 0) {
				if (typeof jqNewPostList !== 'undefined') {
					jqListItem.append(jqNewPostList);
				}
				wrappingLi.after(jqListItem);
			} else {
				jqList.before(jqListItem);
			}

			// check for multiple selected items
			if (selectedSiblings && selectedSiblings.length > 0) {
				for ( var i = selectedSiblings.length - 1; i >= 0; --i) {
					jqListItem.after(jQuery(selectedSiblings[i]));
				}
			}

			// finally check whether there are elements left in the list
			if (jqList.contents('li').length == 0) {
				// list is completely empty, so remove it
				jqList.remove();
			}

			// check whether the wrapping li is empty now
			if (wrappingLi.length > 0 && wrappingLi.contents().length == 0) {
				wrappingLi.remove();
			}

			// refresh the selection
			this.refreshSelection();
		}

		return false;
	}

	return true;
};

/**
 * Refresh the current selection and set to focus to the current editable again
 */
GENTICS.Aloha.ListPlugin.refreshSelection = function () {
	if (GENTICS.Aloha.activeEditable) {
		GENTICS.Aloha.activeEditable.obj[0].focus();
	}
	GENTICS.Aloha.Selection.rangeObject.update();
	GENTICS.Aloha.Selection.rangeObject.select();
	GENTICS.Aloha.Selection.updateSelection();
};

/**
 * Merge adjacent lists (of same type) into the first list
 * @param jqList jQuery object of a list
 */
GENTICS.Aloha.ListPlugin.mergeAdjacentLists = function (jqList) {
	// first get the first previous sibling of same type
	var firstList = jqList.get(0);
	while (firstList.previousSibling && firstList.previousSibling.nodeType == 1
			&& firstList.previousSibling.nodeName == firstList.nodeName) {
		firstList = firstList.previousSibling;
	}

	jqList = jQuery(firstList);
	// now merge all adjacent lists into this one
	while (firstList.nextSibling
			&& ((firstList.nextSibling.nodeType == 1 && firstList.nextSibling.nodeName == firstList.nodeName) ||
				(firstList.nextSibling.nodeType == 3 && jQuery.trim(firstList.nextSibling.data).length == 0))) {
		var jqNextList = jQuery(firstList.nextSibling);
		if (firstList.nextSibling.nodeType == 1) {
			jqNextList.contents().appendTo(jqList);
		}
		jqNextList.remove();
	}
};
