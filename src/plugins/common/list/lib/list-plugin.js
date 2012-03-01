/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define(
['aloha', 'aloha/jquery', 'aloha/plugin', 'aloha/floatingmenu', 'i18n!list/nls/i18n', 'i18n!aloha/nls/i18n', 'aloha/engine'],
function(Aloha, jQuery, Plugin, FloatingMenu, i18n, i18nCore, Engine) {
	"use strict";

	var
		GENTICS = window.GENTICS;

	/**
	 * Register the ListPlugin as Aloha.Plugin
	 */
	var ListPlugin = Plugin.create('list', {
		/**
		 * Configure the available languages
		 */
		languages: ['en', 'de', 'fr', 'eo', 'fi', 'ru', 'it'],

		/**
		 * default button configuration
		 */
		config: [ 'ul', 'ol' ],

		/**
		 * List of transformable elements
		 */
		transformableElements: {'p' : true, 'h1' : true, 'h2' : true, 'h3' : true, 'h4' : true, 'h5' : true, 'h6' : true, 'ul' : true, 'ol' : true},

		/**
		 * Initialize the plugin, register the buttons
		 */
		init: function() {

			var that = this;

//			//register the workaround-handler keypress handler on every editable
//			Aloha.bind('aloha-editable-created', function(event, editable) {
//				editable.obj.keyup(function(event){
//					deleteWorkaroundHandler(event);
//					return true;
//				});
//			});

			// the 'create unordered list' button
			this.createUnorderedListButton = new Aloha.ui.Button({
				'name' : 'ul',
				'iconClass' : 'aloha-button aloha-button-ul',
				'size' : 'small',
				'tooltip' : i18n.t('button.createulist.tooltip'),
				'toggle' : true,
				'onclick' : function (element, event) {
					that.transformList(false);
				}
			});
			// add to floating menu
			FloatingMenu.addButton(
				'Aloha.continuoustext',
				this.createUnorderedListButton,
				i18nCore.t('floatingmenu.tab.format'),
				1
			);

			// the 'create ordered list' button
			this.createOrderedListButton = new Aloha.ui.Button({
				'name' : 'ol',
				'iconClass' : 'aloha-button aloha-button-ol',
				'size' : 'small',
				'tooltip' : i18n.t('button.createolist.tooltip'),
				'toggle' : true,
				'onclick' : function (element, event) {
					that.transformList(true);
				}
			});
			// add to floating menu
			FloatingMenu.addButton(
				'Aloha.continuoustext',
				this.createOrderedListButton,
				i18nCore.t('floatingmenu.tab.format'),
				1
			);


			FloatingMenu.createScope('Aloha.List', 'Aloha.continuoustext');
			// the 'indent list' button
			this.indentListButton = new Aloha.ui.Button({
				'name' : 'indent-list',
				'iconClass' : 'aloha-button aloha-button-indent-list',
				'size' : 'small',
				'tooltip' : i18n.t('button.indentlist.tooltip'),
				'toggle' : false,
				'onclick' : function (element, event) {
					that.indentList();
				}
			});
			// add to floating menu
			FloatingMenu.addButton(
				'Aloha.continuoustext',
				this.indentListButton,
				i18n.t('floatingmenu.tab.list'),
				1
			);

			// the 'outdent list' button
			this.outdentListButton = new Aloha.ui.Button({
				'name' : 'outdent-list',
				'iconClass' : 'aloha-button aloha-button-outdent-list',
				'size' : 'small',
				'tooltip' : i18n.t('button.outdentlist.tooltip'),
				'toggle' : false,
				'onclick' : function (element, event) {
					that.outdentList();
				}
			});
			// add to floating menu
			FloatingMenu.addButton(
				'Aloha.continuoustext',
				this.outdentListButton,
				i18n.t('floatingmenu.tab.list'),
				1
			);

			// add the event handler for selection change
			Aloha.bind('aloha-selection-changed', function ( event, rangeObject ) {
				var i, effectiveMarkup;
				
				// Hide all buttons in the list tab will make the list tab disappear
				that.outdentListButton.hide();
				that.indentListButton.hide();
				that.createUnorderedListButton.setPressed(false);
				that.createOrderedListButton.setPressed(false);
				
        if(Aloha.queryCommandState("insertunorderedlist")){
          that.createUnorderedListButton.setPressed(true);
          // Show all buttons in the list tab
          that.outdentListButton.show();
          that.indentListButton.show();
        }

        if(Aloha.queryCommandState("insertorderedlist")){
          that.createOrderedListButton.setPressed(true);
          // Show all buttons in the list tab
          that.outdentListButton.show();
          that.indentListButton.show();
        }

				if (Aloha.activeEditable) {
					that.applyButtonConfig(Aloha.activeEditable.obj);
				}

				// TODO this should not be necessary here!
				FloatingMenu.doLayout();
			});

			// add the key handler for Tab
			Aloha.Markup.addKeyHandler(9, function(event) {
				return that.processTab(event);
			});
		},

		/**
		 * Applys a configuration specific for an editable
		 * buttons not available in this configuration are hidden
		 * @param {jQuery} obj jQuery object of the activated editable
		 */
		applyButtonConfig: function (obj) {
			var config = this.getEditableConfig(obj);

			if (Aloha.Selection.rangeObject.unmodifiableMarkupAtStart[0]) {
				// show/hide them according to the config
				if (jQuery.inArray('ul', config) != -1 && Aloha.Selection.canTag1WrapTag2(Aloha.Selection.rangeObject.unmodifiableMarkupAtStart[0].nodeName, "ul") != -1) {
					this.createUnorderedListButton.show();
				} else {
					this.createUnorderedListButton.hide();
				}

				if (jQuery.inArray('ol', config) != -1 && Aloha.Selection.canTag1WrapTag2(Aloha.Selection.rangeObject.unmodifiableMarkupAtStart[0].nodeName, "ol") != -1) {
					this.createOrderedListButton.show();
				} else {
					this.createOrderedListButton.hide();
				}

			}
		},

		/**
		 * Process Tab and Shift-Tab pressed in lists
		 */
		processTab: function (event) {
			if (event.keyCode === 9/*tab*/ ) {
				if (event.shiftKey) {
					return this.outdentList();
				} else {
					return this.indentList();
				}
			}
			return true;
		},

		/**
		 * For the current selection, get the DOM object, which will be transformed to/from the list
		 * @return dom object or false
		 */
		getStartingDomObjectToTransform: function () {
			var rangeObject = Aloha.Selection.rangeObject,
				i, effectiveMarkup;

			for ( i = 0; i < rangeObject.markupEffectiveAtStart.length; i++) {
				effectiveMarkup = rangeObject.markupEffectiveAtStart[ i ];
				if (this.transformableElements[effectiveMarkup.nodeName.toLowerCase()]) {
					return effectiveMarkup;
				}
			}

			return false;
		},

		/**
		 * For the current selection, get the nearest list item as dom object
		 * @return dom object or false
		 */
		getNearestSelectedListItem: function () {
			var rangeObject = Aloha.Selection.rangeObject,
				i, effectiveMarkup;

			for ( i = 0; i < rangeObject.markupEffectiveAtStart.length; i++) {
				effectiveMarkup = rangeObject.markupEffectiveAtStart[ i ];
				if (GENTICS.Utils.Dom.isListElement(effectiveMarkup)) {
					return effectiveMarkup;
				}
			}

			return false;
		},

		/**
		 * Transform the current selection to/from a list
		 * @param ordered true when transforming to/from an ordered list, false for unordered lists
		 */
    transformList: function(ordered){
			// IE doesn't work correctly with the collapsed selections.
      // This function call fixes it.
      this.fixCollapsedSelections();

      // visible is set to true, but the button is not visible
			this.outdentListButton.show();
			this.indentListButton.show();


      if(ordered){
        Aloha.execCommand("insertorderedlist", false);
      }
      else {
        Aloha.execCommand("insertunorderedlist", false);
      }
           
    },

		/**
		 * Indent the selected list items by moving them into a new created, nested list
		 */
		indentList: function () {
      // IE doesn't work correctly with the collapsed selections.
      // This function call fixes it.
      this.fixCollapsedSelections();

      Aloha.execCommand("indent", false)
    },

		/**
		 * Outdent nested list items by moving them into the outer list
		 */
    outdentList: function(){
      // IE doesn't work correctly with the collapsed selections.
      // This function call fixes it.
      this.fixCollapsedSelections();

      Aloha.execCommand("outdent", false)                
    },

    /** 
     * Fixes the collpased selections
     * to get a uniform behaviour
     */
    fixCollapsedSelections: function(){
     var range = Aloha.Selection.getRangeObject();
     range.correctRange();
     range.select();
    },

		/**
		 * Refresh the current selection and set to focus to the current editable again
		 */
		refreshSelection: function () {
			Aloha.Selection.rangeObject.update();
			Aloha.Selection.rangeObject.select();
			Aloha.Selection.updateSelection();
		},

		/**
		 * Merge adjacent lists (of same type) into the first list
		 * @param jqList jQuery object of a list
		 * @param allTypes true if all types of lists may be merged, false if only same types may be merged
		 */
		mergeAdjacentLists: function (jqList, allTypes) {
			// first get the first previous sibling of same type
			var firstList = jqList.get(0), jqNextList;

			while (
				firstList.previousSibling
				&& firstList.previousSibling.nodeType === 1
				&& this.isMergable(firstList.previousSibling, firstList, allTypes)
			) {
				firstList = firstList.previousSibling;
			}

			jqList = jQuery(firstList);
			// now merge all adjacent lists into this one
			while (
				firstList.nextSibling
				&& (
					(
						firstList.nextSibling.nodeType === 1
						&& this.isMergable(firstList.nextSibling, firstList, allTypes)
					) || (
						firstList.nextSibling.nodeType === 3
						&& jQuery.trim(firstList.nextSibling.data).length === 0
					)
				)
			) {
				jqNextList = jQuery(firstList.nextSibling);
				if (firstList.nextSibling.nodeType == 1) {
					jqNextList.contents().appendTo(jqList);
				}
				jqNextList.remove();
			}
		},

		/**
		 * Check whether the given DOM element toCheck is mergeable into the DOM element mergeInto
		 * @param toCheck DOM element to check
		 * @param mergeInto DOM element into which toCheck shall be merged
		 * @param allTypes true if all types of lists may be merged, false if only same types may be merged
		 */
		isMergable: function (toCheck, mergeInto, allTypes) {
			if (allTypes) {
				return toCheck.nodeName.toLowerCase() == 'ul' || toCheck.nodeName.toLowerCase() == 'ol';
			} else {
				return toCheck.nodeName == mergeInto.nodeName;
			}
		}
	});

	/**
	 * A key handler that should be run as a keyup handler for the
	 * backspace and del keys. keyup fires after the browser has already
	 * performed the delete - this handler will perform a cleanup if
	 * necessary.
	 *
	 * Will work around an IE bug which breaks nested lists in the
	 * following situation, where [] is the selection, if backspace is
	 * pressed (same goes for the del key if the selection is at the end
	 * of the li that occurs before the selection):
	 *
	 * <ul>
	 *  <li>one</li>
	 *  <li><ul><li>two</li></ul></li>
	 * </ul>
	 * <p>[]</p>
	 *
	 * The browser behaviour, if one would presses backspace, results in
	 * the following:
	 *
	 * <ul>
	 *  <li>one</li>
	 *  <ul><li>two</li></ul>
	 * </ul>
	 *
	 * which is invalid HTML since the <ul>s are nested directly inside
	 * each other.
	 *
	 * Also, the following situation will cause the kind of invalid HTML
	 * as above.
	 * <ul>
	 *   <li>one</li>
	 *   <li><ul><li>two</li></ul></li>
	 *   <li>[]three</li>
	 * </ul>
	 *
	 * Also, the following situtation:
	 * <ul>
	 *   <li>one</li>
	 *   <li><ul><li>two</li></ul>
	 *       <p>[]three</p>
	 *       <li>four</li>
	 *   </li>
	 * </ul>
	 *
	 * And similar situations, some of which are not so easy to reproduce.
	 * 
	 * @param event a jQuery key event
	 * @return false if no action needed to be taken, true if cleanup has been performed
	 */
	function deleteWorkaroundHandler(event) {
		if (8/*backspace*/ != event.keyCode && 46/*del*/ != event.keyCode) {
			return false;
		}

		var rangeObj = Aloha.getSelection().getRangeAt(0);
		var startContainer = rangeObj.startContainer;

		//the hack is only relevant if after the deletion has been
		//performed we are inside a li of a nested list
		var $nestedList = jQuery(startContainer).closest('ul, ol');
		if ( ! $nestedList.length ) {
			return false;
		}
		var $parentList = $nestedList.parent().closest('ul, ol');
		if ( ! $parentList.length ) {
			return false;
		}

		var ranges = Aloha.getSelection().getAllRanges();

		var actionPerformed = false;
		$parentList.each(function(){
			actionPerformed = actionPerformed || fixListNesting(jQuery(this));
		});

		if (actionPerformed) {
			Aloha.getSelection().setRanges(ranges);
			for (var i = 0; i < ranges.length; i++) {
				ranges[i].detach();
			}
		}

		return actionPerformed;
	}

	/**
	 * If uls or ols are nested directly inside the given list (invalid
	 * HTML), they will be cleaned up by being appended to the preceding
	 * li.
	 */
	function fixListNesting($list) {
		var actionPerformed = false;
		$list.children('ul, ol').each(function(){
			Aloha.Log.debug("performing list-nesting cleanup");
			if ( ! jQuery(this).prev('li').append(this).length ) {
				//if there is no preceding li, create a new one and append to that
				jQuery(this).parent().prepend(document.createElement('li')).append(this);
			}
			actionPerformed = true;
		});
		return actionPerformed;
	}

	return ListPlugin;
});
