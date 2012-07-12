/*global define: true, window: true */
/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
define([
	'aloha/core',
	'jquery',
	'aloha/plugin',
	'ui/ui',
	'ui/toggleButton',
	'i18n!numerated-headers/nls/i18n',
	'i18n!aloha/nls/i18n',
	'css!numerated-headers/css/numerated-headers.css'
], function (
	Aloha,
	jQuery,
	Plugin,
	Ui,
	ToggleButton,
	i18n,
	i18nCore
) {
	'use strict';

	var $ = jQuery;
	var editableConfigurations = {};

	Aloha.bind('aloha-editable-destroyed', function (event, editable) {
		delete editableConfigurations[editable.getId()];
	});

	/**
	 * Get the config for the current active editable.
	 * @private
	 * @param {Plugin} plugin The plugin instance to get an editables
	 *                        configuration via `getEditableConfig()'.
	 * @return {object} Configuration hashmap for the current active editable,
	 *                  If there is not active editable then the defualt
	 *                  configuration will be returned.
	 */
	function getCurrentConfig (plugin) {
		var config;

		if (Aloha.activeEditable) {
			config = editableConfigurations[Aloha.activeEditable.getId()];
			if (config) {
				return config;
			}
			config = editableConfigurations[Aloha.activeEditable.getId()]
			       = plugin.getEditableConfig(Aloha.activeEditable.obj);
		} else {
			config = {};
		}

		// normalize config (set default values)

		config.numeratedactive = (
			config.numeratedactive === true   ||
			config.numeratedactive === 'true' ||
			config.numeratedactive === '1'
		);

		config.trailingdot = (
			config.trailingdot === true   ||
			config.trailingdot === 'true' ||
			config.trailingdot === '1'
		);

		config.headingselector = (typeof config.headingselector !== 'string')
		                       ? 'h1, h2, h3, h4, h5, h6'
		                       : $.trim(config.headingselector);

		return config;
	}

	return Plugin.create('numerated-headers', {
		config: {
			numeratedactive: true,
			headingselector: 'h1, h2, h3, h4, h5, h6',
			trailingdot: false
		},

		/**
		 * Initialize the plugin
		 */
		init: function () {
			var that = this;

			this._formatNumeratedHeadersButton = Ui.adopt("formatNumeratedHeaders", ToggleButton, {
				tooltip: i18n.t('button.numeratedHeaders.tooltip'),
				icon: 'aloha-icon aloha-icon-numerated-headers',
				scope: 'Aloha.continuoustext',
				click: function () {
					if (that._formatNumeratedHeadersButton.getState()) {
						that.removeNumerations();
					} else {
						that.createNumeratedHeaders();
					}
				}
			});


			// We need to bind to selection-changed event to recognize backspace and delete interactions
			Aloha.bind( 'aloha-selection-changed', function (event) {
				if (that.showNumbers()) {
					that.createNumeratedHeaders();
				}
			});

			Aloha.bind('aloha-editable-activated', function (event) {
				if (that.isNumeratingOn()) {
					that._formatNumeratedHeadersButton.show(true);
					that.initForEditable(Aloha.activeEditable.obj);
				} else {
					that._formatNumeratedHeadersButton.show(false);
				}
			});
		},

		/**
		 * Init the toggle button (and numerating) for the current editable,
		 * if not yet done.
		 * If numerating shall be on by default and was not turned on, numbers will be created.
		 */
		initForEditable: function ($editable) {
			var flag = $editable.attr('aloha-numerated-headers');

			if (flag !== 'true' && flag !== 'false') {
				flag = (true === getCurrentConfig(this).numeratedactive)
				     ? 'true'
				     : 'false';
				$editable.attr('aloha-numerated-headers', flag);
			}

			if (flag === 'true') {
				this.createNumeratedHeaders();
				this._formatNumeratedHeadersButton.setState(true);
			} else {
				this._formatNumeratedHeadersButton.setState(false);
			}
		},

		/**
		 * Check whether numerating shall be possible in the current editable
		 */
		isNumeratingOn: function () {
			return getCurrentConfig(this).headingselector !== '';
		},

		/**
		 * Check whether numbers shall currently be shown in the current editable
		 */
		showNumbers: function () {
			// don't show numbers if numerating is off
			if (!this.isNumeratingOn()) {
				return false;
			}
			return jQuery(Aloha.activeEditable.obj).attr('aloha-numerated-headers') === 'true';
		},

		removeNumerations : function () {
			var active_editable_obj = this.getBaseElement();

			if (!active_editable_obj) {
				return;
			}

			jQuery(Aloha.activeEditable.obj).attr('aloha-numerated-headers', 'false');
			var headingselector = getCurrentConfig(this).headingselector;
			var headers = active_editable_obj.find(headingselector);
			headers.each(function () {
				jQuery(this).find('span[role=annotation]').each(function () {
					jQuery(this).remove();
				});
			});
		},

		getBaseElement: function () {
			if (typeof this.baseobjectSelector !== 'undefined') {
				return (jQuery(this.baseobjectSelector).length > 0) ?
						jQuery(this.baseobjectSelector) : null;
			}
			return Aloha.activeEditable ? null : Aloha.activeEditable.obj;
		},

		/*
		* checks if the given Object contains a note Tag that looks like this:
		* <span annotation=''>
		*
		* @param {Object} obj - The Object to check
		*/
		hasNote: function (obj) {
			if (!obj || !jQuery(obj).length > 0) {
				return false;
			}
			obj = jQuery(obj);

			if (obj.find('span[role=annotation]').length > 0) {
				return true;
			}

			return false;
		},

		/*
		* checks if the given Object has textual content.
		* A possible "<span annotation=''>" tag will be ignored
		*
		* @param {Object} obj - The Object to check
		*/
		hasContent: function (obj) {
			if (!obj || !jQuery(obj).length > 0) {
				return false;
			}
			obj = jQuery(obj);

			// we have to check the content of this object without the annotation span
			var objCleaned = obj.clone().find('span[role=annotation]').remove().end();

			// check for text, also in other possible sub tags
			if ( jQuery.trim(objCleaned.text()).length > 0 ) {
				return true;
			}

			return false;
		},

		createNumeratedHeaders: function () {
			var config = getCurrentConfig(this);
			var headingselector = config.headingselector;
			var active_editable_obj = this.getBaseElement(),
				that = this,
				headers = active_editable_obj.find(headingselector);

			if (!active_editable_obj) {
				return;
			}

			jQuery(Aloha.activeEditable.obj).attr('aloha-numerated-headers', 'true');

			if (typeof headers === "undefined" || headers.length === 0) {
				return;
			}

			// base rank is the lowest rank of all selected headers
			var base_rank = 7;
			headers.each(function () {
				if (that.hasContent(this)) {
					var current_rank = parseInt(this.nodeName.substr(1), 10);
					if (current_rank < base_rank) {
						base_rank = current_rank;
					}
				}
			});
			if (base_rank > 6) {
				return;
			}
			var prev_rank = null,
				current_annotation = [],
				annotation_pos = 0;

			// initialize the base annotations
			for (var i = 0; i < (6 - base_rank) + 1; i++) {
				current_annotation[i] = 0;
			}

			headers.each(function () {
				// build and count annotation only if there is content in this header
				if (that.hasContent(this)) {

					var current_rank = parseInt(this.nodeName.substr(1), 10);
					if (prev_rank === null && current_rank !== base_rank) {
						// when the first found header has a rank
						// different from the base rank, we omit it
						jQuery(this).find('span[role=annotation]').remove();
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
						for (var j = annotation_pos; j > (current_pos); j--) {
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
								annotation_result += (current_annotation[i] + ".");
							}
						}
					} else {
						annotation_result = current_annotation[0];
						for (i = 1; i < current_annotation.length; i++) {
							if (current_annotation[i] !== 0) {
								annotation_result += ("." + current_annotation[i]);
							}
						}
					}

					if (that.hasNote(this)) {
						jQuery(this).find('span[role=annotation]').html(annotation_result);
					} else {
						jQuery(this).prepend("<span role='annotation'>" + annotation_result + "</span> ");
					}
				} else {
					// no Content, so remove the Note, if there is one
					if (that.hasNote(this)) {
						jQuery(this).find('span[role=annotation]').remove();
					}
				}
			});
		}
	});
});
