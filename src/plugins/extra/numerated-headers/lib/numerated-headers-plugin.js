/* numerated-headers-plugin.js is part of Aloha Editor project http://aloha-editor.org
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
	'aloha/ephemera',
	'jquery',
	'aloha/plugin',
	'ui/ui',
	'ui/icons',
	'ui/toggleButton',
	'util/browser',
	'i18n!numerated-headers/nls/i18n',
	'i18n!aloha/nls/i18n'
], function (
	Aloha,
	Ephemera,
	$,
	Plugin,
	Ui,
	Icons,
	ToggleButton,
	Browser,
	i18n,
	i18nCore
) {
	'use strict';

	var plugin = {
		config: {
			numeratedactive: true,
			headingselector: 'h1, h2, h3, h4, h5, h6',
			trailingdot: false
		},

		/**
		 * Initialize the plugin.
		 */
		init: function () {
			plugin._formatNumeratedHeadersButton = Ui.adopt('formatNumeratedHeaders', ToggleButton, {
				tooltip: i18n.t('button.numeratedHeaders.tooltip'),
				icon: Icons.NUMERATED_HEADERS,
				pure: true,
				onToggle: function (active) {
					if (!active) {
						plugin.removeNumerations();
					} else if (plugin.createNumeratedHeaders()) {
						plugin._formatNumeratedHeadersButton.activate();
					}
				}
			});

			Aloha.bind('aloha-editable-created', function (event, editable) {
				if (plugin.isNumeratingOn(editable)) {
					plugin.initForEditable(editable, true);
				}
			});

			// We need to bind to smart-content-changed event to recognize
			// backspace and delete interactions.
			Aloha.bind('aloha-smart-content-changed', function (event) {
				plugin.cleanNumerations();
				if (plugin.showNumbers()) {
					plugin.createNumeratedHeaders();
				}
			});
			
			// We need to listen to that event, when a block is formatted to
			// header format. smart-content-changed would be not fired in 
			// that case
			Aloha.bind('aloha-format-block', function () {
				plugin.cleanNumerations();
				if (plugin.showNumbers()) {
					plugin.createNumeratedHeaders();
				}
			});

			Aloha.bind('aloha-editable-activated', function (event) {
				if (plugin.isNumeratingOn()) {
					plugin._formatNumeratedHeadersButton.show();
					plugin.initForEditable(Aloha.activeEditable);
				} else {
					plugin._formatNumeratedHeadersButton.hide();
				}
			});

			Aloha.bind('aloha-editable-deactivated', function(event, params) {
				if (params.newEditable == null || !plugin.isNumeratingOn(params.newEditable)) {
					plugin._formatNumeratedHeadersButton.deactivate();
				}
			});
		},

		/**
		 * Init the toggle button (and numerating) for the current editable,
		 * if not yet done.
		 * If numerating shall be on by default and was not turned on, numbers
		 * will be created.
		 */
		initForEditable: function (editable, skipButtonState) {
			var flag = editable != null
				&& editable.obj != null
				&& editable.obj.attr('aloha-numerated-headers');
			if (flag !== 'true' && flag !== 'false') {
				flag = (true === plugin.getNumeratedEditableConfig(editable).numeratedactive);
				editable.obj.attr('aloha-numerated-headers', flag + '');
			} else {
				flag = flag === 'true';
			}

			if (flag) {
				plugin.createNumeratedHeaders(editable);
			}
			if (!skipButtonState) {
				plugin._formatNumeratedHeadersButton.setActive(flag);
			}
		},

		/**
		 * Get the config for the current editable
		 */
		getCurrentConfig: function () {
			if (!Aloha.activeEditable) {
				return null;
			}

			return plugin.getNumeratedEditableConfig(Aloha.activeEditable)
		},

		/**
		 * Get the config for the given editable
		 */
		getNumeratedEditableConfig: function (editable) {
			var config = plugin.getEditableConfig(editable.obj);

			// normalize config (set default values)
			if (config.numeratedactive === true || config.numeratedactive === 'true' || config.numeratedactive === '1') {
				config.numeratedactive = true;
			} else {
				config.numeratedactive = false;
			}

			if (typeof config.headingselector !== 'string') {
				config.headingselector = 'h1, h2, h3, h4, h5, h6';
			}
			config.headingselector = $.trim(config.headingselector);

			if (config.trailingdot === true || config.trailingdot === 'true' || config.trailingdot === '1') {
				config.trailingdot = true;
			} else {
				config.trailingdot = false;
			}

			return config;
		},

		/**
		 * Check whether numerating shall be possible in the current editable
		 */
		isNumeratingOn: function (editableParam) {
			var editable = editableParam;
			if (typeof editable === 'undefined' || !editable) {
				editable = Aloha.activeEditable;
			}

			return plugin.getNumeratedEditableConfig(editable).headingselector !== '';
		},

		/**
		 * Check whether numbers shall currently be shown in the current
		 * editable.
		 */
		showNumbers: function () {
			return (
				Aloha.activeEditable &&
				plugin.isNumeratingOn() &&
				(Aloha.activeEditable.obj.attr('aloha-numerated-headers') === 'true')
			);
		},
		
		/**
		 * Remove all annotations in the current editable.
		 */
		cleanNumerations: function () {
			var active_editable_obj = plugin.getBaseElement();
			if (!active_editable_obj) {
				return;
			}
			$('div.aloha-numerated-headers-annotation-wrapper>span[role=annotation]').unwrap();
			plugin._safeRemoveAnnotations($(active_editable_obj).find('span[role=annotation]'));
		},
		
		/**
		 * Safely removes a jQuery collection of annotations.
		 * @param annotationcollection the collection of annotations.
		 */
		_safeRemoveAnnotations: function (annotationcollection) {
			var range = Aloha.Selection.getRangeObject();
			var rangemod = false;
			annotationcollection.each(function () {
				if (range.startContainer === this || $.inArray(this, $(range.startContainer).parents()) > -1) {
			        range.startContainer = plugin._prevNode(this);
			        range.startOffset = 0;
			        rangemod = true;
				}
				if (range.startContainer === this.parentNode && range.startOffset >= $(this).index() && range.startOffset > 0) {
					range.startOffset --;
					rangemod = true;
				}
				//Check if the selection ends inside the annotation
				if (range.endContainer === this || $.inArray(this, $(range.endContainer).parents()) > -1) {
					range.endContainer = plugin._prevNode(this);
					range.endOffset = 0;
					rangemod = true;
				}
				if (range.endContainer === this.parentNode && range.endOffset >= $(this).index() && range.endOffset > 0) {
					range.endOffset --;
					rangemod = true;
				}
				$(this).remove();
			});
			if (rangemod === true) {
				range.update();
				range.select();
			}
		},
		
		/**
		 * Prepends the annotation to the given prependElement.
		 */
		_prependAnnotation: function (annotationcontent, prependElem) {
			var range = Aloha.Selection.getRangeObject();
			var rangemod = false;
			if (range.startContainer === prependElem) {
				range.startOffset ++;
				rangemod = true;
			}
			if (range.endContainer === prependElem) {
				range.endOffset ++;
				rangemod = true;
			}
			var annotation = $('<span role="annotation">' +
					annotationcontent + '</span>');
			var displayStyle = Browser.ie7 ? 'inline' : 'inline-block';
			var wrappedannotation=$('<div class="aloha-numerated-headers-annotation-wrapper" style="display: '+ displayStyle +';" contenteditable="false"></div>').append(annotation);
			Ephemera.markWrapper(wrappedannotation)
			$(prependElem).prepend(wrappedannotation);
			if (rangemod === true) {
				range.update();
				range.select();
			}
		},
		
		/**
		 * Navigates to the previous node.
		 */
		_prevNode: function (node) {
			var prev = node.previousSibling;
			if (!prev) {
				return node.parentNode;
			}
			while (prev.lastChild) {
				prev = prev.lastChild;
			}
			return prev;
		},
		

		/**
		 * Removed and disables numeration for the current editable.
		 */
		removeNumerations : function () {
			if (Aloha.activeEditable == null || Aloha.activeEditable.obj == null) {
				return;
			}
			$(Aloha.activeEditable.obj).attr('aloha-numerated-headers', 'false');
			plugin.cleanNumerations();
			plugin._formatNumeratedHeadersButton.deactivate();
		},

		getBaseElement: function (editableParam) {
			if (typeof plugin.baseobjectSelector !== 'undefined') {
				return ($(plugin.baseobjectSelector).length > 0) ?
						$(plugin.baseobjectSelector) : null;
			}

			var editable = editableParam;
			if (typeof editable === 'undefined' || !editable) {
				editable = Aloha.activeEditable;
			}

			return editable ? editable.obj : null;
		},

		/*
		* checks if the given Object contains a note Tag that looks like this:
		* <span annotation=''>
		*
		* @param {HTMLElement} obj The DOM object to check.
		*/
		hasNote: function (obj) {
			if (!obj || $(obj).length <= 0) {
				return false;
			}
			return $(obj).find('span[role=annotation]').length > 0;
		},

		/*
		* checks if the given Object has textual content.
		* A possible "<span annotation=''>" tag will be ignored
		*
		* @param {HTMLElement} obj The DOM object to check
		*/
		hasContent: function (obj) {
			if (!obj || 0 === $(obj).length) {
				return false;
			}
			// we have to check the content of this object without the annotation span
			var $objCleaned = $(obj).clone()
			                        .find('span[role=annotation]')
			                        .remove()
			                        .end();
			// check for text, also in other possible sub tags
			return $.trim($objCleaned.text()).length > 0;
		},

		createNumeratedHeaders: function (editable) {
			var active_editable_obj = plugin.getBaseElement(editable);
			if (!active_editable_obj) {
				return false;
			}

			var currentEditable = editable;
			if (typeof currentEditable === 'undefined' || !currentEditable) {
				currentEditable = Aloha.activeEditable;
			}

			var config = plugin.getNumeratedEditableConfig(currentEditable);
			var headingselector = config.headingselector;
			var headers = active_editable_obj.find(headingselector);

			currentEditable.obj.attr('aloha-numerated-headers', 'true');

			if (typeof headers === 'undefined' || headers.length === 0) {
				return false;
			}

			// base rank is the lowest rank of all selected headers
			var base_rank = 7;
			headers.each(function () {
				if (plugin.hasContent(this)) {
					var current_rank = parseInt(this.nodeName.substr(1), 10);
					if (current_rank < base_rank) {
						base_rank = current_rank;
					}
				}
			});

			if (base_rank > 6) {
				return false;
			}

			var prev_rank = null,
				current_annotation = [],
				annotation_pos = 0,
				i;

			// initialize the base annotations
			for (i = 0; i < (6 - base_rank) + 1; i++) {
				current_annotation[i] = 0;
			}

			headers.each(function () {
				// build and count annotation only if there is content in this header
				if (plugin.hasContent(this)) {

					var current_rank = parseInt(this.nodeName.substr(1), 10);
					if (prev_rank === null && current_rank !== base_rank) {
						// when the first found header has a rank
						// different from the base rank, we omit it
						plugin._safeRemoveAnnotations($(this).find('div.aloha-numerated-headers-annotation-wrapper>span[role=annotation]').parent());
						plugin._safeRemoveAnnotations($(this).find('span[role=annotation]'));
						return;
					} else if (prev_rank === null) {
						// increment the main annotation
						current_annotation[annotation_pos]++;
					} else if (current_rank > prev_rank) {
						// starts a sub title
						current_annotation[++annotation_pos]++;
					} else if (current_rank === prev_rank) {
						// continues subtitles
						current_annotation[annotation_pos]++;
					} else if (current_rank < prev_rank) {
						//goes back to a main title
						var current_pos = current_rank - base_rank;
						var j;
						for (j = annotation_pos; j > (current_pos); j--) {
							current_annotation[j] = 0; //reset current sub-annotation
						}
						annotation_pos = current_pos;
						current_annotation[annotation_pos]++;
					}

					prev_rank = current_rank;

					var annotation_result = '', i;
					if (config.trailingdot === true) {
						annotation_result = '';
						for (i = 0; i < current_annotation.length; i++) {
							if (current_annotation[i] !== 0) {
								annotation_result += (current_annotation[i] + '.');
							}
						}
					} else {
						annotation_result = current_annotation[0];
						for (i = 1; i < current_annotation.length; i++) {
							if (current_annotation[i] !== 0) {
								annotation_result += ('.' + current_annotation[i]);
							}
						}
					}
					//We add a trailing non-breakable space to the annotation_result
					//to separate the annotation from the heading's text.
					annotation_result += '&nbsp;';
					if (plugin.hasNote(this)) {
						plugin._safeRemoveAnnotations($(this).find('div.aloha-numerated-headers-annotation-wrapper>span[role=annotation]').parent());
						plugin._safeRemoveAnnotations($(this).find('span[role=annotation]'));
					}
					plugin._prependAnnotation(annotation_result, this);
				} else {
					// no Content, so remove the Note, if there is one
					if (plugin.hasNote(this)) {
						plugin._safeRemoveAnnotations($(this).find('div.aloha-numerated-headers-annotation-wrapper>span[role=annotation]').parent());
						plugin._safeRemoveAnnotations($(this).find('span[role=annotation]'));
					}
				}
			});

			return true;
		}
	};

	plugin = Plugin.create('numerated-headers', plugin);

	return plugin;
});
