/* cite-plugin.js is part of the Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2024 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 * License http://aloha-editor.org/license.php
 */
define([
	'aloha',
	'jquery',
	'PubSub',
	'aloha/plugin',
	'aloha/content-rules',
	'ui/ui',
	'ui/icons',
	'ui/toggleSplitButton',
	'ui/modal',
	'ui/utils',
	'util/dom',
	'i18n!cite/nls/i18n'
], function (
	Aloha,
	$,
	PubSub,
	Plugin,
	ContentRules,
	Ui,
	Icons,
	ToggleSplitButton,
	Modal,
	Utils,
	domUtils,
	i18n
) {
	'use strict';

	var NODE_NAME_Q = 'Q';
	var NODE_NAME_BLOCKQUOTE = 'BLOCKQUOTE';

	var TYPE_SINGLE_QUOTE = 'q';
	var TYPE_BLOCKQUOTE = 'blockquote';
	var ATTR_CITE_ID = 'data-cite-id';
	var ATTR_CITE = 'cite';
	var CLASS_WRAPPER = 'wrapper';

	var SLOT_QUOTE_BUTTON = 'quote';

	var NAMESPACE = 'aloha-cite';
	var globalCiteId = 0;

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
		return Array.from(arguments)
			.map(function (part) {
				return '.' + (part === '' ? NAMESPACE : NAMESPACE + '-' + part);
			})
			.join(' ')
			.trim();
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
		return Array.from(arguments)
			.map(function (part) {
				return part === '' ? NAMESPACE : NAMESPACE + '-' + part;
			})
			.join(' ')
			.trim();
	}

	/**
	 * Checks if an element has a data-cite-id and, if not, adds one.
	 * @param effective jQuery object representing the element to be checked.
	 * @return {number} The cite-id for this element.
	 */
	function assureCitationHasId(effective) {
		var activeUid = effective.attr(ATTR_CITE_ID);
		if (!activeUid) {
			activeUid = ++globalCiteId;
			effective.addClass([nsClass(CLASS_WRAPPER)].join(' '));
			effective.addClass(nsClass(activeUid));
			effective.attr(ATTR_CITE_ID, activeUid);
		}
		return activeUid;
	}

	function checkVisibility(editable) {
		// If we have no editable, then we don't want to show the button
		if (editable == null || editable.obj == null) {
			plugin._quoteButton.hide();
			return;
		}

		var config = plugin.getEditableConfig(editable.obj);
		var enabled = config
			&& ($.inArray(TYPE_SINGLE_QUOTE, config) > -1)
			&& ContentRules.isAllowed(editable.obj[0], NODE_NAME_Q);

		if (enabled) {
			plugin._quoteButton.show();
		} else {
			plugin._quoteButton.hide();
		}
	}

	var plugin = {
		dependencies: ['format'],

		citations: [],
		referenceContainer: null,
		settings: null,
		config: [TYPE_SINGLE_QUOTE, TYPE_BLOCKQUOTE],

		init: function () {
			// Harvest configuration options that may be defined outside the plugin.
			if (Aloha.settings && Aloha.settings.plugins && Aloha.settings.plugins.cite) {

				var referenceContainer = $(Aloha.settings.plugins.cite.referenceContainer);

				if (referenceContainer.length) {
					plugin.referenceContainer = referenceContainer;
				}

				if (typeof Aloha.settings.plugins.cite !== 'undefined') {
					plugin.settings = Aloha.settings.plugins.cite;
				}
			}

			const FormatPlugin = Aloha.require('format/format-plugin');

			// Delete the entry for a single quote, as we "replace" it here.
			delete FormatPlugin.buttonConfig[TYPE_SINGLE_QUOTE];
			plugin._quoteButton = Ui.adopt(SLOT_QUOTE_BUTTON, ToggleSplitButton, {
				tooltip: i18n.t('cite.button.tooltip'),
				icon: Icons.QUOTE,
				pure: true,
				contextType: 'modal',
				secondaryClick: function () {
					plugin.showQuoteModal();
				},
				onToggle: function (activated) {
					if (activated) {
						plugin.showQuoteModal(true);
					} else {
						plugin.removeQuote();
					}
				}
			});

			// We brute-forcishly push our button settings into the format plugin configuration,
			// so that it shows up in the typography menu correctly.
			FormatPlugin.buttonConfig[TYPE_BLOCKQUOTE] = {
				icon: Icons.QUOTE,
				label: i18n.t('button.blockquote.tooltip'),
				typography: true,
				header: false,
			};
			FormatPlugin.config.push(TYPE_BLOCKQUOTE);

			// Then rebuild the buttons of the format plugin, so that our adjustments work as expected.
			FormatPlugin.initButtons();

			// Set the button visible if it's enabled via the config
			PubSub.sub('aloha.editable.activated', function (message) {
				var editable = message.editable;
				checkVisibility(editable);
			});

			// Reset and hide the button when leaving an editable
			PubSub.sub('aloha.editable.deactivated', function () {
				plugin._quoteButton.hide();
				plugin._quoteButton.setActive(false);
			});

			checkVisibility(Aloha.activeEditable);

			PubSub.sub('aloha.format.pre_change', function (message) {
				if (message.oldFormat === TYPE_BLOCKQUOTE && message.newFormat !== TYPE_BLOCKQUOTE) {
					plugin.removeQuote()
				}
			});
			PubSub.sub('aloha.format.changed', function (message) {
				if (message.oldFormat !== TYPE_BLOCKQUOTE && message.newFormat === TYPE_BLOCKQUOTE) {
					plugin.initBlockQuote();
				}
			});

			PubSub.sub('aloha.selection.context-change', function (message) {
				var quoteFound = false;
				var nodeName;
				var effective = message.range.markupEffectiveAtStart;
				var i = effective.length;
				plugin.effective = $();

				// Check whether any of the effective items are citation tags
				while (i) {
					nodeName = effective[--i].nodeName;
					if (nodeName === NODE_NAME_Q || nodeName === NODE_NAME_BLOCKQUOTE) {
						quoteFound = true;
						assureCitationHasId($(effective[i]));
						$.merge(plugin.effective, $(effective[i]));
					}
				}

				plugin._quoteButton.setActive(quoteFound);
			});
		},

		/**
		 * Create component context for insert quote button.
		 *
		 * @param existingQuote The existing quote if applicable.
		 */
		createQuoteContext: function (existingQuote) {
			let title = i18n.t('cite.button.add.quote');
			let source = '';
			let note = '';

			if (existingQuote) {
				let quoteIdx = plugin.getIndexOfCitation(existingQuote.getAttribute(ATTR_CITE_ID));

				title = i18n.t('cite.button.edit.quote');
				source = existingQuote.cite;
				note = plugin.citations[quoteIdx].note;
			}

			return {
				openerReference: SLOT_QUOTE_BUTTON,
				title: title,
				controls: {
					source: {
						type: 'input',
						options: {
							label: i18n.t('cite.label.source')
						}
					},
					// TODO: Rework this note handling. Especially in context with the CMS,
					// as the note can't be handled there.
					// note: {
					// 	type: 'input',
					// 	options: {
					// 		label: i18n.t('cite.label.note')
					// 	}
					// }
				},
				initialValue: {
					source: source,
					// note: note
				}
			}
		},

		/**
		 * Opens the create/edit quote modal.
		 */
		showQuoteModal: function () {
			let range = Aloha.Selection.getRangeObject();
			let limit = Aloha.activeEditable.obj;

			if (limit[0] && limit[0].nodeName === NODE_NAME_Q || limit[0].nodeName === NODE_NAME_BLOCKQUOTE) {
				limit = limit.parent();
			}

			let foundMarkup = range.findMarkup(
				function (node) {
					return node != null && (node.nodeName === NODE_NAME_Q || node.nodeName === NODE_NAME_BLOCKQUOTE);
				},
				limit);

			return Modal.openDynamicModal(
				plugin.createQuoteContext(foundMarkup)
			).then(function (control) {
				return control.value;
			}).then(function (formData) {
				if (foundMarkup) {
					plugin.addCiteDetails(foundMarkup.getAttribute(ATTR_CITE_ID), formData.source, formData.note);
				} else {
					// When no markup was found, a new inline quote is created. The markup for blockquotes
					// is generated before the modal is shown.
					let createdQuote = plugin.addInlineQuote();
					if (!createdQuote) {
						return;
					}

					plugin.addCiteDetails(createdQuote.attr(ATTR_CITE_ID), formData.source, formData.note);
				}
			}).catch(function (error) {
				try {
					return Utils.handleUserCloseErrors(error);
				} catch (nonCloseError) {
					console.error(nonCloseError);
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
			var c = plugin.citations;
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
			return plugin.citations.push({
				uid: uid,
				link: null,
				notes: null
			}) - 1;
		},

		/**
		 * Formats the current selection with blockquote.
		 */
		initBlockQuote: function () {
			if (Aloha.activeEditable) {
				$(Aloha.activeEditable.obj[0]).click();
			}

			// Check whether the markup is found in the range (at the start of the range).
			let foundMarkup = Aloha.Selection.rangeObject.findMarkup(function () {
				if (this.nodeName && (typeof this.nodeName === 'string')) {
					return this.nodeName === NODE_NAME_BLOCKQUOTE;
				}

				return false;
			}, Aloha.activeEditable.obj);

			if (foundMarkup) {
				let citeId = foundMarkup.getAttribute(ATTR_CITE_ID);

				if (!citeId) {
					citeId = ++globalCiteId;

					foundMarkup.classList.add(nsClass(CLASS_WRAPPER));
					foundMarkup.classList.add(nsClass(citeId));
					foundMarkup.setAttribute(ATTR_CITE_ID, citeId);
				}

				if (plugin.referenceContainer) {
					plugin.addCiteToReferences(citeId);
				}

				plugin.showQuoteModal(false);

				return foundMarkup;
			}

			return false;
		},

		/**
		 * Removes quote. Returns true if a quote was found and removed.
		 * @return {boolean} True if quote markup was removed and false otherwise.
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
				return this.nodeName === NODE_NAME_Q
					|| this.nodeName === NODE_NAME_BLOCKQUOTE;
			}, Aloha.activeEditable.obj);

			// If the we click the quote button on a range that contains quote
			// markup, then we will remove the quote markup, otherwise we will
			// wrap the selection in a quote.
			if (foundMarkup) {
				var citUid = $(foundMarkup).attr(ATTR_CITE_ID);
				plugin.removeCiteFromReferences(citUid);

				var $quotes = $([TYPE_SINGLE_QUOTE, TYPE_BLOCKQUOTE].map(function(type) {
					return type + '[' + ATTR_CITE_ID + '="' + citUid + '"]';
				}).join(','));

				$quotes.each(function () {
					domUtils.removeFromDOM(this, rangeObject, true);
				});

				rangeObject.select();

				return true;
			}
			return false;
		},

		addInlineQuote: function () {
			var classes = [nsClass(CLASS_WRAPPER), nsClass(++globalCiteId)].join(' ');

			var markup = $('<' + TYPE_SINGLE_QUOTE + '>', {
				class: classes,
			});
			markup.attr(ATTR_CITE_ID, globalCiteId);

			var rangeObject = Aloha.Selection.rangeObject;

			// When the range is collapsed, extend it to a word.
			if (rangeObject.isCollapsed()) {
				domUtils.extendToWord(rangeObject);
			}

			domUtils.addMarkup(rangeObject, markup);
			domUtils.doCleanup({
				'merge': true,
				'removeempty': true,
				'mergeable': function (obj) {
					return obj.nodeName === NODE_NAME_Q;
				}
			}, rangeObject);

			// If the cite is not found, it was not created. Probably for
			// a incorrect caret position.
			if ($('[' + ATTR_CITE_ID + '=' + globalCiteId + ']').length === 0) {
				return false;
			}

			// select the modified range
			rangeObject.select();

			if (plugin.referenceContainer) {
				plugin.addCiteToReferences(globalCiteId);
			}

			return markup;
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
			var index = plugin.getIndexOfCitation(uid);
			var wrapper = $('.aloha-editable-active ' + nsSel(uid));
			var note = 'cite-note-' + uid;
			var ref = 'cite-ref-' + uid;

			plugin.citations.splice(index, 1);
			wrapper.find('sup#' + ref).remove();
			plugin.createCiteAnchor(ref, note, index);

			if (!plugin.referenceContainer) {
				return;
			}
			plugin.referenceContainer.find('ol.references li#' + note).remove();

			if (0 === plugin.referenceContainer.find('ol.references li').length) {
				plugin.referenceContainer.find('h2').remove();
				plugin.referenceContainer.find('ol.references').remove();
			} else {
				for (var i = index; i < plugin.citations.length; i++) {
					var $cite = $('.aloha-editable-active ' + nsSel(plugin.citations[i].uid));
					note = 'cite-note-' + plugin.citations[i].uid;
					ref = 'cite-ref-' + plugin.citations[i].uid;

					$cite.find('sup#cite-ref-' + plugin.citations[i].uid).remove();
					$cite.append(plugin.createCiteAnchor(ref, note, i));
				}
			}
		},

		/**
		 * Adds an item for the citation matching the given uid to the
		 * references list. If no OL list for references exist, we create one.
		 * This method will assume that this.referenceContainer is a jQuery
		 * object container into which the references list should be built.
		 *
		 * @param {string} referenceCiteId The uid of the citation to add.
		 */
		addCiteToReferences: function (referenceCiteId) {
			var index = plugin.getIndexOfCitation(referenceCiteId);

			var wrapper = $('.aloha-editable-active ' + nsSel(referenceCiteId));
			var note = 'cite-note-' + referenceCiteId;
			var ref = 'cite-ref-' + referenceCiteId;

			wrapper.append(plugin.createCiteAnchor(ref, note, index));

			if (0 === plugin.referenceContainer.find('ol.references').length) {
				plugin.referenceContainer
					.append('<h2>References</h2>')
					.append('<ol class="references"></ol>');
			}
			plugin.referenceContainer.find('ol.references').append(
				supplant(
					'<li id="{note}"><a href="#{ref}">^</a> &nbsp; <span></span></li>',
					{ ref: ref, note: note }
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
			plugin.citations[plugin.getIndexOfCitation(uid)] = {
				uid: uid,
				link: link,
				note: note
			};

			if (link) {
				$(nsSel(uid)).attr(ATTR_CITE, link);
			} else {
				$(nsSel(uid)).removeAttr(ATTR_CITE);
			}

			if (plugin.referenceContainer) {
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
			$element.find([TYPE_SINGLE_QUOTE, TYPE_BLOCKQUOTE].join(',')).each(function () {
				var $elem = $(this);
				// Remove empty class attributes
				if ($.trim($elem.attr('class')) === '') {
					$elem.removeAttr('class');
				}
				// Only remove the data cite attribute when no reference
				// container was set
				if (!plugin.referenceContainer) {
					$elem.removeClass(nsClass($elem.attr(ATTR_CITE_ID)));

					// We need to read this attribute for IE7 otherwise it will
					// crash when the attribute gets removed. In IE7 this
					// removal does not work at all. (no wonders here.. :.( )
					if ($elem.attr(ATTR_CITE_ID) != null) {
						$elem.removeAttr(ATTR_CITE_ID);
					}
				}
				$elem.removeClass(nsClass(CLASS_WRAPPER));
			});
		}
	};

	plugin = Plugin.create('cite', plugin);

	return plugin;
});
