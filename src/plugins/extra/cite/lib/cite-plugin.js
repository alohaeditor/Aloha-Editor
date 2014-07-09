/*global window: true define: true */
/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define([
    'aloha',
	'jquery',
	'aloha/plugin',
	'ui/ui',
	'ui/toggleButton',
	'ui/scopes',
	'ui/port-helper-attribute-field',
	'format/format-plugin',
	'util/dom',
	'PubSub',
	'i18n!cite/nls/i18n',
	'i18n!aloha/nls/i18n'
], function (
	Aloha,
	jQuery,
	Plugin,
	Ui,
	ToggleButton,
	Scopes,
	AttributeField,
	Format,
	domUtils,
	PubSub,
    i18n,
	i18nCore
) {
	'use strict';

	var $ = jQuery,
		ns  = 'aloha-cite',
		uid = (new Date()).getTime();

	// namespaced classnames
	var nsClasses = {
		quote         : nsClass('quote'),
		blockquote    : nsClass('blockquote'),
		'panel-label' : nsClass('panel-label'),
		'panel-field' : nsClass('panel-field'),
		'panel-btns'  : nsClass('panel-btns'),
		'link-field'  : nsClass('link-field'),
		'note-field'  : nsClass('note-field'),
		references    : nsClass('references')
	};

	/**
	 * Simple templating
	 *
	 * @param {String} str - The string containing placeholder keys in curly
	 *                       brackets
	 * @param {Object} obj - Associative array of replacing placeholder keys
	 *                       with corresponding values
	 */
	function supplant(str, obj) {
		return str.replace(/\{([a-z0-9\-\_]+)\}/ig,
			function (str, p1, offset, s) {
				var replacement = obj[p1] || str;
				return (typeof replacement === 'function') ?
					replacement() :
					replacement;
			});
	}

	/**
	 * Wrapper to call the supplant method on a given string, taking the
	 * nsClasses object as the associative array containing the replacement
	 * pairs
	 *
	 * @param {String} str
	 * @return {String}
	 */
	function renderTemplate(str) {
		return (typeof str === 'string') ? supplant(str, nsClasses) : str;
	}

	/**
	 * Generates a selector string with this plugins's namespace prefixed the
	 * each classname.
	 *
	 * Usage:
	 *    nsSel('header,', 'main,', 'foooter ul')
	 *    will return
	 *    ".aloha-myplugin-header, .aloha-myplugin-main, .aloha-mypluzgin-footer ul"
	 *
	 * @return {string}
	 */
	function nsSel() {
		var strBldr = [], prx = ns;
		jQuery.each(arguments, function () {
			strBldr.push('.' + ('' === this ? prx : prx + '-' + this));
		});
		return jQuery.trim(strBldr.join(' '));
	}

	/**
	 * Generates a string with this plugins's namespace prefixed the each
	 * classname.
	 *
	 * Usage:
	 *		nsClass('header', 'innerheaderdiv')
	 *		will return
	 *		"aloha-myplugin-header aloha-myplugin-innerheaderdiv"
	 *
	 * @return {string}
	 */
	function nsClass() {
		var strBldr = [], prx = ns;
		jQuery.each(arguments, function () {
			strBldr.push('' === this ? prx : prx + '-' + this);
		});
		return jQuery.trim(strBldr.join(' '));
	}

	/**
	 * Coverts hexidecimal string #00ffcc into rgb array [0, 255, 127]
	 *
	 * @param {string} hex Hexidecimal string representing color. In the form
	 *					   #ff3344 or #f34 or f34.
	 * @return {Array.<number>} RGB representation of hexidecimal color.
	 */
	function hex2rgb(hex) {
		hex = hex.replace('#', '').split('');
		if (3 === hex.length) {
			hex[5] = hex[4] = hex[2];
			hex[3] = hex[2] = hex[1];
			hex[1] = hex[0];
		}
		var rgb = [];
		var i;
		for (i = 0; i < 3; ++i) {
			rgb[i] = parseInt('0x' + hex[i * 2] + hex[i * 2 + 1], 16);
		}
		return rgb;
	}



	/**
	 * Sets cites inputs
	 * @param citePlugin
	 */
	function updateCiteInputs(citePlugin) {
		var citeAnchorValue = citePlugin.effective.attr('cite');

		if (citeAnchorValue) {
			citePlugin.citeHrefField.setValue(citeAnchorValue);
		} else {
			citePlugin.citeHrefField.setPlaceholder();
		}

		var index = citePlugin.getIndexOfCitation(citePlugin.effective.attr('data-cite-id'));
		var note = citePlugin.citations[index].note;

		if (note) {
			citePlugin.citeNoteField.setValue(note);
		} else {
			citePlugin.citeNoteField.setPlaceholder();
		}
	}

	/**
	 * Updates de inputs text of the sidebar and also the cite details.
	 * @param citePlugin
	 */
	var saveCiteDetails = function (citePlugin) {
		var citeHrefFieldValue = citePlugin.citeHrefField.getValue();
		var citeNoteValue = null;

		if (citePlugin.referenceContainer) {
			citeNoteValue = citePlugin.citeNoteField.getValue();
		}

		if (typeof citePlugin.sideBarPanel !== 'undefined') {
			citePlugin.sideBarPanel.content.find(nsSel('link-field input')).val(citeHrefFieldValue);
			citePlugin.sideBarPanel.content.find(nsSel('note-field textarea')).val(citeNoteValue);
		}

		citePlugin.effective.attr('cite', citeHrefFieldValue);

		citePlugin.addCiteDetails(
			citePlugin.effective.attr('data-cite-id'),
			citeHrefFieldValue,
			citeNoteValue
		);
	};

	/**
	 * Initialization to show the required inputs in the Aloha toolbar.
	 * @param citePlugin
	 */
	function initShowOnToolbar(citePlugin) {
		citePlugin.removeCiteButton = Ui.adopt("removeCite", ToggleButton, {
			tooltip: i18n.t("button.removeCite.tooltip"),
			icon: "aloha-icon aloha-icon-unlink",
			scope: 'Aloha.continuoustext',
			click: function () {
				citePlugin.removeQuote();
			}
		});

		citePlugin.citeHrefField = AttributeField({
			name: 'editCite',
			width: 320,
			placeholder: 'Link',
			cls: 'aloha-cite-href-field',
			scope: 'Aloha.continuoustext',
			noTargetHighlight: false,
			targetHighlightClass: 'aloha-focus'
		});

		citePlugin.citeNoteField = AttributeField({
			name: 'editNote',
			width: 320,
			placeholder: 'Note',
			cls: 'aloha-cite-note-href-field',
			scope: 'Aloha.continuoustext',
			noTargetHighlight: false,
			targetHighlightClass: 'aloha-focus'
		});

		if (!citePlugin.referenceContainer) {
			citePlugin.citeNoteField.setValue('');
			citePlugin.citeNoteField.hide();
		}

		var onSaveInputs = function () {
			saveCiteDetails(citePlugin);
		}

		citePlugin.citeHrefField.getInputJQuery().bind('keyup change', onSaveInputs);
		citePlugin.citeNoteField.getInputJQuery().bind('keyup change', onSaveInputs);
	}

	return Plugin.create('cite', {

		citations: [],
		referenceContainer: null,
		showOnToolbar: false,
		settings: null,
		sidebar: null,
		config: ['quote', 'blockquote'],

		init: function () {
			var that = this;

			// Harverst configuration options that may be defined outside of
			// the plugin.
			if (Aloha.settings && Aloha.settings.plugins && Aloha.settings.plugins.cite) {

				var referenceContainer = jQuery(Aloha.settings.plugins.cite.referenceContainer);

				that.showOnToolbar = !!Aloha.settings.plugins.cite.showOnToolbar;

				if (referenceContainer.length) {
					that.referenceContainer = referenceContainer;
				}

				if (typeof Aloha.settings.plugins.cite !== 'undefined') {
					that.settings = Aloha.settings.plugins.cite;
				}

				if (typeof that.settings.sidebar === 'undefined') {
					that.settings.sidebar = {};
				}

				if (typeof that.settings.sidebar.open === 'undefined') {
					that.settings.sidebar.open = true;
				}

				// be tolerant about the setting: 'false' and '0' (as strings) will be interpreted as false (boolean)
				if (typeof that.settings.sidebar.open === 'string') {
					that.settings.sidebar.open = that.settings.sidebar.open.toLowerCase();
					if (that.settings.sidebar.open === 'false' || that.settings.sidebar.open === '0') {
						// disable button only if 'false' or '0' is specified
						that.settings.sidebar.open = false;
					} else {
						// otherwise the button will always be shown
						that.settings.sidebar.open = true;
					}
				}
			}

			this._quoteButton = Ui.adopt('quote', ToggleButton, {
				tooltip: i18n.t('cite.button.add.quote'),
				icon: nsClass('button', 'inline-button'),
				scope: 'Aloha.continuoustext',
				click: function () {
					if (!citePlugin.removeQuote()) {
						citePlugin.addInlineQuote();
					}
				}
			});

			// We brute-forcishly push our button settings into the
			// multiSplitButton. The multiSplitButton will pick it up
			// and render it.
			Format.multiSplitButton.pushItem({
				name: 'blockquote',
				tooltip: i18n.t('cite.button.add.blockquote'),
				icon: nsClass('button', 'block-button'),
				click: function () {
					if (!citePlugin.removeQuote()) {
						that.addBlockQuote();
					}
				}
			});

			var citePlugin = this;

			// Note that if the sidebar is not loaded,
			// aloha-sidebar-initialized will not fire and this listener will
			// not be called, which is what we would want if there are no
			// sidebars
			Aloha.ready(function (ev) {
				citePlugin.sidebar = Aloha.Sidebar.right.show();
				// citePlugin.sidebar.settings.overlayPage = false;
				citePlugin.sidebar.addPanel({
					id       : nsClass('sidebar-panel'),
					title    : 'Citation',
					content  : '',
					expanded : true,
					activeOn : 'q, blockquote',

					// Executed once, when this panel object is instantialized
					onInit   : function () {
						var that = this;
						var additionalReferenceContainer = '';
						
						if (citePlugin.referenceContainer) {
							additionalReferenceContainer = '<label class="{panel-label}" for="{note-field}-textarea">Note</label> ' +
															'<div class="{panel-field} {note-field}" ' +
															'style="margin: 5px;">' +
															'<textarea id="{note-field}-textarea"></textarea></div>';
						}
						
						var content = this.setContent(renderTemplate(
								'<label class="{panel-label}" for="{link-field}-input">Link</label>' +
								'<div class="{panel-field} {link-field}" ' + 
								'style="margin: 5px;"><input type="text" id="{link-field}-input" /></div>' +
								additionalReferenceContainer
							)).content;

						content.find('input, textarea')
							.bind('keyup change', function () {
								var noteValue = that.content.find(nsSel('note-field textarea')).val();
								var linkValue = that.content.find(nsSel('link-field input')).val();

								if (citePlugin.showOnToolbar) {
									citePlugin.citeNoteField.setValue(noteValue);
									citePlugin.citeHrefField.setValue(linkValue);
								}

								citePlugin.addCiteDetails(
									that.content.attr('data-cite-id'),
									linkValue,
									noteValue
								);
							});
					},

					/**
					 * Invoked during aloha-selection-changed, if activeOn
					 * function returns true for the current selection.  Will
					 * populate panel fields with the details of the selected
					 * citation if they are already available.  If no citation
					 * exists for the selected quotation, then one will be
					 * created for it first.
					 */
					onActivate: function (effective) {
						var activeUid = effective.attr('data-cite-id');
						if (!activeUid) {
							activeUid = ++uid;
							var classes = [nsClass('wrapper')].join(' ');
							effective.addClass(classes);
							effective.attr('data-cite-id', activeUid);
						}
						var index = that.getIndexOfCitation(activeUid);

						this.content.attr('data-cite-id', activeUid);
						this.content.find(nsSel('link-field input'))
						    .val(effective.attr('cite'));
						this.content.find(nsSel('note-field textarea'))
						    .val(that.citations[index].note);
					}

				});
				citePlugin.sideBarPanel = citePlugin.sidebar.getPanelById(nsClass('sidebar-panel'));
			});

			Aloha.bind('aloha-editable-activated', function (event, params) {
				var config = that.getEditableConfig(params.editable.obj);

				if (!config) {
					return;
				}
				
				if ( jQuery.inArray('quote', config ) !== -1 ) {
					that._quoteButton.show(true);
				} else {
					that._quoteButton.show(false);
				}
				
				if ( jQuery.inArray( 'blockquote', config ) !== -1 ) {
					Format.multiSplitButton.showItem('blockquote');
				} else {
					Format.multiSplitButton.hideItem('blockquote');
				}
				
			});

			if (citePlugin.showOnToolbar) {
				initShowOnToolbar(citePlugin);
			}

			PubSub.sub('aloha.selection.context-change', function (message) {
				var rangeObject = message.range;

				// Set to false to prevent multiple buttons being active
				// when they should not.
				var quoteFound = false, blockquoteFound = false;
				var nodeName;
				var effective = rangeObject.markupEffectiveAtStart;
				var i = effective.length;
				citePlugin.effective = $();

				// Check whether any of the effective items are citation
				// tags.
				while (i) {
					nodeName = effective[--i].nodeName;
					if (nodeName === 'Q') {
						quoteFound = true;
						$.merge(citePlugin.effective, $(effective[i]));
					} else if (nodeName === 'BLOCKQUOTE') {
						blockquoteFound = true;
						$.merge(citePlugin.effective, $(effective[i]));
					}
				}

				if (citePlugin.showOnToolbar) {
					if (quoteFound || blockquoteFound) {
						citePlugin.citeHrefField.show();
						citePlugin.removeCiteButton.show();

						updateCiteInputs(citePlugin);
						Scopes.enterScope(citePlugin.name, 'cite');

						citePlugin.citeHrefField.foreground();
					} else {
						citePlugin.citeHrefField.hide();
						citePlugin.removeCiteButton.hide();
						citePlugin.removeCiteButton.setState(false);

						Scopes.leaveScope(citePlugin.name, 'cite', true);
					}
				}

				// set the toggle status for the quote button
				that._quoteButton.setState(quoteFound);

				// activate the blockquote multisplit item
				if (blockquoteFound) {
					Format.multiSplitButton.setActiveItem('blockquote');
				}
				
				// switch item visibility according to config
				var config = [];
				if (Aloha.activeEditable) {
					config = that.getEditableConfig(Aloha.activeEditable.obj);
				}

				// quote
				if (jQuery.inArray('quote', config) !== -1) {
					that._quoteButton.show(true);
				} else {
					that._quoteButton.show(false);
				}

				// blockquote
				if (jQuery.inArray('blockquote', config) !== -1) {
					Format.multiSplitButton.showItem('blockquote');
				} else {
					Format.multiSplitButton.hideItem('blockquote');
				}
			});
		},

		/**
		 * Do a binary search through all citations for a given uid.  The bit
		 * shifting may be a *bit* of an overkill, but with big lists it proves
		 * to be significantly more performant.
		 *
		 * @param {string} uid Th uid of the citation to retreive.
		 * @return {number} The 0-based index of the first citation found that
		 *                  matches the given uid. -1 of no citation is found
		 *                  for the given uid,
		 */
		getIndexOfCitation: function (uid) {
			var c = this.citations;
			var max = c.length;
			var min = 0;
			var mid;
			var cuid;

			// Infinite loop guard for debugging...  So your tab/browser
			// doesn't freeze up like a Christmas turkey ;-)
			// var __guard = 1000;

			while (min < max /* && --__guard */ ) {
				mid = (min + max) >> 1; // Math.floor(i) / 2 == i >> 1 == ~~(i / 2)
				cuid = c[mid].uid;

				// Don't do strict comparison here or you'll get an endless loop
				if (cuid == uid) {
					return mid;
				}
				
				if (cuid > uid) {
					max = mid;
				} else if (cuid < uid) {
					min = mid + 1;
				}
			}

			return this.citations.push({
				uid   : uid,
				link  : null,
				notes : null
			}) - 1;
		},

		addBlockQuote: function () {
			var classes = [nsClass('wrapper'), nsClass(++uid)].join(' ');

			var markup = jQuery(supplant(
					'<blockquote class="{classes}" data-cite-id="{uid}"></blockquote>',
					{uid: uid, classes: classes}
			));

			// Now re-enable the editable...
			if (Aloha.activeEditable) {
				jQuery(Aloha.activeEditable.obj[0]).click();
			}

			Aloha.Selection.changeMarkupOnSelection(markup);

			if (this.referenceContainer) {
				this.addCiteToReferences(uid);
			}

			if (this.sidebar && this.settings && this.settings.sidebar &&
			     this.settings.sidebar.open) {
				this.sidebar.open();
			}
			//	.activatePanel(nsClass('sidebar-panel'), markup);
		},

		/**
		 * Removes quote. Returns true if a quote was found and removed.
		 * @param {Range} rangeObject
		 * @param {jQueryElement} $markup
		 * @return {boolean}
		 */
		removeQuote: function () {
			var foundMarkup;
			var rangeObject = Aloha.Selection.rangeObject;

			if (Aloha.activeEditable) {
				jQuery(Aloha.activeEditable.obj[0]).click();
			}

			// Check whether the markup is found in the range (at the start of
			// the range).
			foundMarkup = rangeObject.findMarkup(function () {
				if (this.nodeName &&
					(typeof this.nodeName === 'string')) {

					return this.nodeName === 'Q'
						|| this.nodeName === 'BLOCKQUOTE';
				}

				return false;
			}, Aloha.activeEditable.obj);

			// If the we click the quote button on a range that contains quote
			// markup, then we will remove the quote markup, otherwise we will
			// wrap the selection in a quote.
			if (foundMarkup) {
				var citUid = $(foundMarkup).attr('data-cite-id');
				this.removeCiteFromReferences(citUid);

				var $quotes = $('q[data-cite-id=' + citUid + '],blockquote[data-cite-id=' + citUid + ']');

				$quotes.each(function () {
					if (this.nodeName === 'BLOCKQUOTE') {
						var $newBlock = $('<p></p>');
						$newBlock.append(this.childNodes);
						this.parentNode.replaceChild($newBlock[0], this);
					} else  {
						domUtils.removeFromDOM(this, rangeObject, true);
					}
				});

				rangeObject.select();

				return true;
			}
			return false;
		},

		addInlineQuote: function () {
			var classes = [nsClass('wrapper'), nsClass(++uid)].join(' ');
			
			var markup = jQuery(supplant(
					'<q class="{classes}" data-cite-id="{uid}"></q>',
					{ uid: uid, classes: classes }
			));

			var rangeObject = Aloha.Selection.rangeObject;

			// When the range is collapsed, extend it to a word.
			if (rangeObject.isCollapsed()) {
				domUtils.extendToWord(rangeObject);
			}

			domUtils.addMarkup(rangeObject, markup);

			// If the cite is not found, it was not created. Probably for
			// a incorrect caret position.
			if ($('[data-cite-id=' + uid + ']').length === 0) {
				return;
			}

			// select the modified range
			rangeObject.select();

			if (this.referenceContainer) {
				this.addCiteToReferences(uid);
			}

			if (this.sidebar && this.settings && this.settings.sidebar &&
			     this.settings.sidebar.open) {
				this.sidebar.open();
			}

			//	.activatePanel(nsClass('sidebar-panel'), markup);

			return false;
		},

		/**
		 * Removes cite from references
		 * @param uid
		 */
		removeCiteFromReferences: function (uid) {
			var index = this.getIndexOfCitation(uid);
			var wrapper = jQuery('.aloha-editable-active ' + nsSel(uid));
			var note = 'cite-note-' + uid;
			var ref = 'cite-ref-'  + uid;

			this.citations.splice(index, 1);
			wrapper.find('sup#' + ref).remove();
			this.createCiteAnchor(ref, note, index);

			if (this.referenceContainer) {
				this.referenceContainer.find('ol.references li#' + note).remove();

				if (0 === this.referenceContainer.find('ol.references li').length) {
					this.referenceContainer.find('h2').remove();
					this.referenceContainer.find('ol.references').remove();
				} else {
					for (var i = index; i < this.citations.length; i++) {
						var $cite = jQuery('.aloha-editable-active ' + nsSel(this.citations[i].uid));
						note = 'cite-note-' + this.citations[i].uid;
						ref = 'cite-ref-'  + this.citations[i].uid;

						$cite.find('sup#cite-ref-' + this.citations[i].uid).remove();
						$cite.append(this.createCiteAnchor(ref, note, i));
					}
				}
			}
		},

		/**
		 * Creates the 'sup' element and 'a' anchor added at the end of the cite.
		 * @param {String} ref
		 * @param {String} note
		 * @param {String} index
		 * @return {String}
		 */
		createCiteAnchor: function (ref, note, index) {
			return supplant(
				'<sup id="{ref}" contenteditable="false"><a href="#{note}">[{count}]</a></sup>',
				{ ref: ref, note: note, count: index + 1 }
			);
		},

		/**
		 * Adds an item for the citation matching the given uid to the
		 * references list. If no OL list for references exist, we create one.
		 * This method will assume that this.referenceContainer is a jQuery
		 * object container into which the references list should be built.
		 *
		 * @param {string} uid The uid of the citation to add.
		 */
		addCiteToReferences: function (uid) {
			var index = this.getIndexOfCitation(uid);

			var wrapper = jQuery('.aloha-editable-active ' + nsSel(uid));
			var note = 'cite-note-' + uid;
			var ref = 'cite-ref-'  + uid;

			wrapper.append(this.createCiteAnchor(ref, note, index));

			if (0 === this.referenceContainer.find('ol.references').length) {
				this.referenceContainer
				    .append('<h2>References</h2>')
				    .append('<ol class="references"></ol>');
			}

			this.referenceContainer.find('ol.references').append(
				supplant(
					'<li id="{note}"><a href="#{ref}">^</a> &nbsp; <span></span></li>',
					{ ref  : ref, note : note }
				)
			);
		},

		/**
		 * Responsible for updating the citation reference in memory, and in
		 * the references list when a user adds or changes information for a
		 * given citation.
		 *
		 * @param {string} uid
		 * @param {string} link
		 * @param {string} note
		 */
		addCiteDetails: function (uid, link, note) {
			this.citations[this.getIndexOfCitation(uid)] = {
				uid  : uid,
				link : link,
				note : note
			};

			if (link) {
				// Update link attribute
				var el = jQuery(nsSel(uid)).attr('cite', link);
			}

			// Update information in references list for this citation.
			if (this.referenceContainer) {
				jQuery('li#cite-note-' + uid + ' span').html(
					supplant(
						link ? '<a class="external" target="_blank" href="{url}">{url}</a>' : '',
						{ url: link }
					) + (note ? '. ' + note : '')
				);
			}
		},

		toString: function () {
			return 'aloha-citiation-plugin';
		},
		
		/**
		 * Make the given jQuery object (representing an editable) clean for saving
		 * Find all quotes and remove editing objects
		 * @param obj jQuery object to make clean
		 * @return void
		 */
		makeClean: function (obj) {

			// find all quotes
			obj.find('q, blockquote').each(function () {
				// Remove empty class attributes
				if (jQuery.trim(jQuery(this).attr('class')) === '') {
					jQuery(this).removeAttr('class');
				}
				// Only remove the data cite attribute when no reference container was set
				if (!this.referenceContainer) {
					jQuery(this).removeClass('aloha-cite-' + jQuery(this).attr('data-cite-id'));
			
					// We need to read this attribute for IE7. Otherwise it will
					// crash when the attribute gets removed. In IE7 this removal 
					// does not work at all. (no wonders here.. :.( )
					if (jQuery(this).attr('data-cite-id') != null) {
						jQuery(this).removeAttr('data-cite-id');
					}
				}
				
				jQuery(this).removeClass('aloha-cite-wrapper');
				
			});
		}

	});

});
