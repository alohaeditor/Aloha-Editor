/* cite-plugin.js is part of the Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 * License http://aloha-editor.org/license.php
 */
define([
    'aloha',
	'jquery',
	'PubSub',
	'aloha/plugin',
	'aloha/content-rules',
	'aloha/sidebar',
	'ui/ui',
	'ui/toggleButton',
	'ui/scopes',
	'ui/port-helper-attribute-field',
	'format/format-plugin',
	'util/dom',
	'i18n!cite/nls/i18n'
], function (
	Aloha,
	$,
	PubSub,
	Plugin,
	ContentRules,
	Sidebars,
	Ui,
	ToggleButton,
	Scopes,
	AttributeField,
	Format,
	domUtils,
	i18n
) {
	'use strict';

	var configurations = {};
	var ns  = 'aloha-cite';
	var uid = (new Date()).getTime();

	// namespaced classnames
	var nsClasses = {
		'quote'       : nsClass('quote'),
		'blockquote'  : nsClass('blockquote'),
		'panel-label' : nsClass('panel-label'),
		'panel-field' : nsClass('panel-field'),
		'panel-btns'  : nsClass('panel-btns'),
		'link-field'  : nsClass('link-field'),
		'note-field'  : nsClass('note-field'),
		'references'  : nsClass('references')
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
		$.each(arguments, function () {
			strBldr.push('.' + ('' === this ? prx : prx + '-' + this));
		});
		return $.trim(strBldr.join(' '));
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
		$.each(arguments, function () {
			strBldr.push('' === this ? prx : prx + '-' + this);
		});
		return $.trim(strBldr.join(' '));
	}
	

	/**
	 * Sets cites inputs
	 * @param plugin
	 */
	function updateCiteInputs(plugin) {
		var citeAnchorValue = plugin.effective.attr('cite');

		if (citeAnchorValue) {
			plugin.citeHrefField.setValue(citeAnchorValue);
		} else {
			plugin.citeHrefField.setPlaceholder();
		}

		var index = plugin.getIndexOfCitation(plugin.effective.attr('data-cite-id'));
		var note = plugin.citations[index].note;

		if (note) {
			plugin.citeNoteField.setValue(note);
		} else {
			plugin.citeNoteField.setPlaceholder();
		}
	}

	/**
	 * Updates de inputs text of the sidebar and also the cite details.
	 * @param plugin
	 */
	var saveCiteDetails = function (plugin) {
		var citeHrefFieldValue = plugin.citeHrefField.getValue();
		var citeNoteValue = null;

		if (plugin.referenceContainer) {
			citeNoteValue = plugin.citeNoteField.getValue();
		}

		if (typeof plugin.sideBarPanel !== 'undefined') {
			plugin.sideBarPanel.content.find(nsSel('link-field input')).val(citeHrefFieldValue);
			plugin.sideBarPanel.content.find(nsSel('note-field textarea')).val(citeNoteValue);
		}

		plugin.effective.attr('cite', citeHrefFieldValue);

		plugin.addCiteDetails(
			plugin.effective.attr('data-cite-id'),
			citeHrefFieldValue,
			citeNoteValue
		);
	};

	/**
	 * Initialization to show the required inputs in the Aloha toolbar.
	 * @param plugin
	 */
	function initShowOnToolbar(plugin) {
		plugin.removeCiteButton = Ui.adopt("removeCite", ToggleButton, {
			tooltip: i18n.t("button.removeCite.tooltip"),
			icon: "aloha-icon aloha-icon-unlink",
			scope: 'Aloha.continuoustext',
			click: function () {
				plugin.removeQuote();
			}
		});

		plugin.citeHrefField = AttributeField({
			name: 'editCite',
			width: 320,
			placeholder: 'Link',
			cls: 'aloha-cite-href-field',
			scope: 'Aloha.continuoustext',
			noTargetHighlight: false,
			targetHighlightClass: 'aloha-focus'
		});

		plugin.citeNoteField = AttributeField({
			name: 'editNote',
			width: 320,
			placeholder: 'Note',
			cls: 'aloha-cite-note-href-field',
			scope: 'Aloha.continuoustext',
			noTargetHighlight: false,
			targetHighlightClass: 'aloha-focus'
		});

		if (!plugin.referenceContainer) {
			plugin.citeNoteField.setValue('');
			plugin.citeNoteField.hide();
		}

		var onSaveInputs = function () {
			saveCiteDetails(plugin);
		}

		plugin.citeHrefField.getInputJQuery().bind('keyup change', onSaveInputs);
		plugin.citeNoteField.getInputJQuery().bind('keyup change', onSaveInputs);
	}

	/**
	 * Initializes the sidebar.
	 *
	 * Note that if the sidebar is not loaded, aloha-sidebar-initialized will
	 * not fire and this listener will not be called, which is what we would
	 * want if there are no sidebars
	 *
	 * @param {Plugin} plugin
	 */
	function setupSidebar(plugin) {

		Aloha.ready(function () {
			plugin.sidebar = Sidebars.right.show().addPanel({
				id       : nsClass('sidebar-panel'),
				title    : 'Citation',
				content  : '',
				expanded : true,
				activeOn : 'q, blockquote',

				onInit: function () {
					var panel = this;

					var additionalReferenceContainer = plugin.referenceContainer
							? '<label class="{panel-label}" for="{note-field}-textarea">Note</label>'
							+ '<div class="{panel-field} {note-field}" style="margin: 5px;">'
							+ '<textarea id="{note-field}-textarea"></textarea></div>'
							: '';

					var content = this.setContent(renderTemplate(
						'<label class="{panel-label}" for="{link-field}-input">Link</label>' +
						'<div class="{panel-field} {link-field}" ' + 
						'style="margin: 5px;"><input type="text" id="{link-field}-input" /></div>' +
						additionalReferenceContainer
					)).content;

					content.find('input, textarea').bind('keyup change', function () {
						var noteValue = panel.content.find(nsSel('note-field textarea')).val();
						var linkValue = panel.content.find(nsSel('link-field input')).val();

						if (plugin.showOnToolbar) {
							plugin.citeNoteField.setValue(noteValue);
							plugin.citeHrefField.setValue(linkValue);
						}
						plugin.addCiteDetails(
							panel.content.attr('data-cite-id'),
							linkValue,
							noteValue
						);
					});
				},

				/**
				 * Invoked during aloha-selection-changed, if activeOn function
				 * returns true for the current selection. Will populate panel
				 * fields with the details of the selected citation if they are
				 * already available.  If no citation exists for the selected
				 * quotation, then one will be created for it first.
				 */
				onActivate: function (effective) {
					var activeUid = assureCitationHasId(effective);
					var index = plugin.getIndexOfCitation(activeUid);
					this.content.attr('data-cite-id', activeUid);
					this.content.find(nsSel('link-field input'))
					    .val(effective.attr('cite'));
					this.content.find(nsSel('note-field textarea'))
					    .val(plugin.citations[index].note);
				}
			});
			plugin.sideBarPanel = Sidebars.right.getPanelById(nsClass('sidebar-panel'));
		});
	}
	
	/**
	 * Checks if an element has a data-cite-id and, if not, adds one.
	 * @param {effective} JQuery object representing the element to be checked.
	 * @return {number} The cite-id for this element.
	 */
	function assureCitationHasId(effective) {
		var activeUid = effective.attr('data-cite-id');
		if (!activeUid) {
			activeUid = ++uid;
			effective.addClass([nsClass('wrapper')].join(' '));
			effective.addClass('aloha-cite-' + activeUid);
			effective.attr('data-cite-id', activeUid);
		}
		return activeUid;
	}

	return Plugin.create('cite', {

		citations: [],
		referenceContainer: null,
		settings: null,
		sidebar: null,
		config: ['quote', 'blockquote'],

		init: function () {
			var plugin = this;

			// Harverst configuration options that may be defined outside of the
			// plugin
			if (Aloha.settings && Aloha.settings.plugins && Aloha.settings.plugins.cite) {

				var referenceContainer = $(Aloha.settings.plugins.cite.referenceContainer);

				plugin.showOnToolbar = !!Aloha.settings.plugins.cite.showOnToolbar;

				if (referenceContainer.length) {
					plugin.referenceContainer = referenceContainer;
				}

				if (typeof Aloha.settings.plugins.cite !== 'undefined') {
					plugin.settings = Aloha.settings.plugins.cite;
				}

				if (typeof plugin.settings.sidebar === 'undefined') {
					plugin.settings.sidebar = {};
				}

				var sidebar = plugin.settings.sidebar;

				if (typeof sidebar.open === 'undefined') {
					sidebar.open = true;
				}

				if (typeof sidebar.open === 'string') {
					sidebar.open = !(sidebar.open === '0' || sidebar.open.toLowerCase() === 'false');
				}
			}

			this._quoteButton = Ui.adopt('quote', ToggleButton, {
				tooltip: i18n.t('cite.button.add.quote'),
				icon: nsClass('button', 'inline-button'),
				scope: 'Aloha.continuoustext',
				click: function () {
					if (!plugin.removeQuote()) {
						plugin.addInlineQuote();
					}
				}
			});

			setupSidebar(this);

			// We brute-forcishly push our button settings into the
			// multiSplitButton. The multiSplitButton will pick it up and render
			// it.
			Format.multiSplitButton.pushItem({
				name: 'blockquote',
				tooltip: i18n.t('cite.button.add.blockquote'),
				icon: nsClass('button', 'block-button'),
				click: function () {
					if (!plugin.removeQuote()) {
						plugin.addBlockQuote();
					}
				}
			});

			PubSub.sub('aloha.editable.created', function (message) {
				var editable = message.editable;
				var config = plugin.getEditableConfig(editable.obj);

				var isQuoteEnabled = config
					&& ($.inArray('quote', config) > -1)
					&& ContentRules.isAllowed(editable.obj[0], 'q');

				var isBlockQuoteEnabled = config
					&& ($.inArray('blockquote', config) > -1)
					&& ContentRules.isAllowed(editable.obj[0], 'blockquote');

				configurations[editable.getId()] = {
					quote: isQuoteEnabled,
					blockquote: isBlockQuoteEnabled
				};
			});

			PubSub.sub('aloha.editable.activated', function (message) {
				var config = configurations[message.editable.getId()];
				plugin._quoteButton.show(!!config.quote);
				if (config.blockquote) {
					Format.multiSplitButton.showItem('blockquote');
				} else {
					Format.multiSplitButton.hideItem('blockquote');
				}
			});

			if (plugin.showOnToolbar) {
				initShowOnToolbar(plugin);
			}

			PubSub.sub('aloha.editable.destroyed', function (message) {
				delete configurations[message.editable.getId()];
			});

			PubSub.sub('aloha.selection.context-change', function (message) {
				var quoteFound = false;
				var blockquoteFound = false;
				var nodeName;
				var effective = message.range.markupEffectiveAtStart;
				var i = effective.length;
				plugin.effective = $();

				// Check whether any of the effective items are citation tags
				while (i) {
					nodeName = effective[--i].nodeName;
					if (nodeName === 'Q') {
						quoteFound = true;
						assureCitationHasId($(effective[i]));
						$.merge(plugin.effective, $(effective[i]));
					} else if (nodeName === 'BLOCKQUOTE') {
						blockquoteFound = true;
						assureCitationHasId($(effective[i]));
						$.merge(plugin.effective, $(effective[i]));
					}
				}

				if (plugin.showOnToolbar) {
					if (quoteFound || blockquoteFound) {
						plugin.citeHrefField.show();
						plugin.removeCiteButton.show();

						updateCiteInputs(plugin);
						Scopes.enterScope(plugin.name, 'cite');

						plugin.citeHrefField.foreground();
					} else {
						plugin.citeHrefField.hide();
						plugin.removeCiteButton.hide();
						plugin.removeCiteButton.setState(false);

						Scopes.leaveScope(plugin.name, 'cite', true);
					}
				}

				plugin._quoteButton.setState(quoteFound);

				if (blockquoteFound) {
					Format.multiSplitButton.setActiveItem('blockquote');
				}

				if (!Aloha.activeEditable) {
					return;
				}

				var config = configurations[Aloha.activeEditable.getId()];

				plugin._quoteButton.show(!!config.quote);

				if (config.blockquote) {
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
			while (min < max) {
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

		/**
		 * Formats the current selection with blockquote.
		 */
		addBlockQuote: function () {
			if (Aloha.activeEditable) {
				Aloha.activeEditable.obj.click();
			}
			var markup = $('<blockquote class="aloha-cite-wrapper aloha-cite-'
			           + (++uid) + '" ' + 'data-cite-id="'
			           + uid + '"></blockquote>');
			Aloha.Selection.changeMarkupOnSelection(markup);
			if (this.referenceContainer) {
				this.addCiteToReferences(uid);
			}
			if (this.sidebar && this.settings && this.settings.sidebar && this.settings.sidebar.open) {
				this.sidebar.sidebar.open();
			}
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
				$(Aloha.activeEditable.obj[0]).click();
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
			
			var markup = $(supplant(
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

			if (this.sidebar && this.settings && this.settings.sidebar && this.settings.sidebar.open) {
				Sidebars.right.open();
			}

			//	.activatePanel(nsClass('sidebar-panel'), markup);

			return false;
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
		 * Removes cite from references
		 * @param uid
		 */
		removeCiteFromReferences: function (uid) {
			var index = this.getIndexOfCitation(uid);
			var wrapper = $('.aloha-editable-active ' + nsSel(uid));
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
						var $cite = $('.aloha-editable-active ' + nsSel(this.citations[i].uid));
						note = 'cite-note-' + this.citations[i].uid;
						ref = 'cite-ref-'  + this.citations[i].uid;

						$cite.find('sup#cite-ref-' + this.citations[i].uid).remove();
						$cite.append(this.createCiteAnchor(ref, note, i));
					}
				}
			}
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

			var wrapper = $('.aloha-editable-active ' + nsSel(uid));
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
		 * Updates the citation reference in memory, and in the references list
		 * when a user adds or changes information for a given citation.
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
				$('.aloha-cite-' + uid).attr('cite', link);
			}
			if (this.referenceContainer) {
				$('li#cite-note-' + uid + ' span').html((
					link ? '<a class="external" target="_blank" href="' + link + '">' + link + '</a>'
					     : ''
				) + (note ? '. ' + note : ''));
			}
		},

		/**
		 * Makes the given jQuery object (representing an editable) clean for
		 * saving Find all quotes and remove editing objects.
		 *
		 * @param {jQuery.<Element>} $element
		 */
		makeClean: function ($element) {
			var plugin = this;
			$element.find('q,blockquote').each(function () {
				var $elem = $(this);
				// Remove empty class attributes
				if ($.trim($elem.attr('class')) === '') {
					$elem.removeAttr('class');
				}
				// Only remove the data cite attribute when no reference
				// container was set
				if (!plugin.referenceContainer) {
					$elem.removeClass('aloha-cite-' + $elem.attr('data-cite-id'));
			
					// We need to read this attribute for IE7 otherwise it will
					// crash when the attribute gets removed. In IE7 this
					// removal does not work at all. (no wonders here.. :.( )
					if ($elem.attr('data-cite-id') != null) {
						$elem.removeAttr('data-cite-id');
					}
				}
				$elem.removeClass('aloha-cite-wrapper');
			});
		}
	});
});
