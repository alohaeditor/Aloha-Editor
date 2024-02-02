/* link-plugin.js is part of the Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 * License http://aloha-editor.org/license.php
 */
/* Aloha Link Plugin
 * -----------------
 * This plugin provides an interface to allow the user to insert, edit and
 * remove links within an active editable.
 * Clicking on any links inside the editable activates the this plugin's
 * floating menu scope.
 */
define([
	'jquery',
	'aloha',
	'aloha/plugin',
	'aloha/ephemera',
	'aloha/content-rules',
	'util/dom',
	'ui/ui',
	'ui/scopes',
	'ui/button',
	'ui/toggleButton',
	'ui/toggleSplitButton',
	'ui/input',
	'i18n!link/nls/i18n',
	'PubSub',
	'util/keys',
	'link/link-target',
	'ui/dynamicForm',
	'ui/overlayElement',
	'ui/modal',
	'../../../shared/languages/languages'
], function (
	$,
	Aloha,
	Plugin,
	Ephemera,
	ContentRules,
	Dom,
	Ui,
	Scopes,
	Button,
	ToggleButton,
	ToggleSplitButton,
	Input,
	i18n,
	PubSub,
	Keys,
	LinkTarget,
	DynamicForm,
	OverlayElement,
	Modal,
	LanguageRepository
) {
	'use strict';

	var configurations = {};
	var jQuery = $;
	var pluginNamespace = 'aloha-link';

	/**
	 * Language repository
	 */
	var LANG_REPOSITORY;


	/**
	 * Gets the language name for laguage code 'langCode'.
	 * @param {string} langCode Language code
	 */
	function getLanguageName(langCode) {
		return LANG_REPOSITORY.languageData ? LANG_REPOSITORY.languageData[langCode].name : langCode;
	}

	/**
	 * Properties for cleaning up markup immediately after inserting new link
	 * markup.
	 *
	 * Successive anchor elements are generally not merged, but an exception
	 * needs to be made in the process of creating links: adjacent fragments of
	 * new links are coalesced whenever possible.
	 *
	 * @type {object}
	 */
	var insertLinkPostCleanup = {
		merge: true,
		mergeable: function (node) {
			return ('aloha-new-link' === node.className && node.nextSibling &&
				'aloha-new-link' === node.nextSibling.className);
		}
	};

	Ephemera.classes('aloha-link-pointer', 'aloha-link-text');

	function setupMousePointerFix() {
		jQuery(document).on('keydown.aloha-link.pointer-fix', function (e) {
				// metaKey for OSX, 17 for PC (we can't check
				// e.ctrlKey because it's only set on keyup or
				// keypress, not on keydown).
				if (e.metaKey || Keys.getToken(e.keyCode) === 'control') {
					jQuery('body').addClass('aloha-link-pointer');
				}
			})
			.on('keyup.aloha-link.pointer-fix', function (e) {
				if (e.metaKey || Keys.getToken(e.keyCode) === 'control') {
					jQuery('body').removeClass('aloha-link-pointer');
				}
			});
	}

	function teardownMousePointerFix() {
		jQuery(document).unbind('.aloha-link.pointer-fix');
	}

	function setupMetaClickLink(editable) {
		editable.obj.on('click.aloha-link.meta-click-link','a',  function (e) {
			// Use metaKey for OSX and ctrlKey for PC
			if (e.metaKey || e.ctrlKey) {
				// blur current editable. user is waiting for the link to load
				Aloha.activeEditable.blur();
				// hack to guarantee a browser history entry
				window.setTimeout(function () {
					location.href = e.target;
				}, 0);
				e.stopPropagation();
				return false;
			}
		});
	}

	function teardownMetaClickLink(editable) {
		editable.obj.unbind('.aloha-link.meta-click-link');
	}

	/**
	 * Get the translation from the given i18n object.
	 * The object should be composed like:
	 * {
	 *   "en": "Path",
	 *   "de": "Pfad"
	 * }
	 *
	 * If the translation in the current language is not found,
	 * the first translation will be returned
	 * @param i18nObject {Object} i18n Object
	 * @return translation {String}
	 */
	function _i18n(i18nObject) {
		if (!i18nObject) {
			return '';
		}
		if (i18nObject.hasOwnProperty(Aloha.settings.locale)) {
			return i18nObject[Aloha.settings.locale];
		}

		for (var lang in i18nObject) {
			if (i18nObject.hasOwnProperty(lang)) {
				return i18nObject[lang];
			}
		}

		return '';
	}

	function createLinkTargetFromConfig(
		config,
        name,
        applyChanges,
        validateFn,
        onChangeFn,
        onTouchFn
	) {
		var tmpOptions = config.options || {};
		var component = Ui.adopt(name, LinkTarget, {
			value: tmpOptions.value,
			targetLabel: tmpOptions.targetLabel,
			anchorLabel: tmpOptions.anchorLabel,

			changeNotify: function (value) {
                applyChanges(value);
                validateFn(value);
                onChangeFn(value);
            },
            touchNotify: function () {
                onTouchFn();
            },
		});
		return component;
	}

	return Plugin.create('link', {
		/**
		 * Default configuration allows links everywhere
		 */
		config: [ 'a' ],

		/**
		 * the defined object types to be used for this instance
		 */
		objectTypeFilter: [],

		/**
		 * handle change on href change
		 * called function ( obj, href, item );
		 */
		onHrefChange: null,

		/**
		 * HotKeys used for special actions
		 */
		hotKey: {
			insertLink: i18n.t('insertLink', 'ctrl+k')
		},

		/**
		 * Default input value for a new link
		 */
		hrefValue: 'http://',

		/**
		 * Shows the flags when setting language ('hreflang' attribute).
		 */
		flags: true,

		/**
		 * Initializes the plugin.
		 */
		init: function () {
			var plugin = this;

			DynamicForm.componentFactoryRegistry['link-target'] = createLinkTargetFromConfig;

			if (typeof this.settings.objectTypeFilter != 'undefined') {
				this.objectTypeFilter = this.settings.objectTypeFilter;
			}
			if (typeof this.settings.onHrefChange != 'undefined') {
				this.onHrefChange = this.settings.onHrefChange;
			}
			if (typeof this.settings.hotKey != 'undefined') {
				jQuery.extend(true, this.hotKey, this.settings.hotKey);
			}
			if (typeof this.settings.hrefValue != 'undefined') {
				this.hrefValue = this.settings.hrefValue;
			}

			this.createButtons();
			this.subscribeEvents();
			this.bindInteractions();

			Aloha.bind('aloha-plugins-loaded', function () {
				PubSub.pub('aloha.link.ready', {
					plugin: plugin
				});
			});

			LANG_REPOSITORY = new LanguageRepository(
				'link-languages',
				this.flags,
				'iso639-1',
				Aloha.settings.locale,
				'language/link'
			);
		},

		nsSel: function () {
			var stringBuilder = [], prefix = pluginNamespace;
			jQuery.each(arguments, function () {
				stringBuilder.push('.' + (this == '' ? prefix : prefix + '-' + this));
			});
			return jQuery.trim(stringBuilder.join(' '));
		},

		//Creates string with this component's namepsace prefixed the each classname
		nsClass: function () {
			var stringBuilder = [], prefix = pluginNamespace;
			jQuery.each(arguments, function () {
				stringBuilder.push(this == '' ? prefix : prefix + '-' + this);
			});
			return jQuery.trim(stringBuilder.join(' '));
		},

		/**
		 * Subscribe for events
		 */
		subscribeEvents: function () {
			var plugin = this;
			var editablesCreated = 0;

			PubSub.sub('aloha.editable.created', function (message) {
				var editable = message.editable;
				var config = plugin.getEditableConfig(editable.obj);
				var enabled = config
				           && (jQuery.inArray('a', config) > -1)
				           && ContentRules.isAllowed(editable.obj[0], 'a');

				configurations[editable.getId()] = !!enabled;

				if (!enabled) {
					return;
				}

				// enable hotkey for inserting links
				editable.obj.on('keydown.aloha-link', plugin.hotKey.insertLink, function () {
					let existingLink = plugin.findLinkMarkup();

					if (existingLink) {
						Modal.openDynamicModal(
							plugin.createInsertLinkContext(existingLink)
						).then(function (control) {
							return control.value;
						}).then(function (formValue) {
							that.upsertLink(formData);
						}).catch(function (error) {
							if (error instanceof OverlayElement.OverlayCloseError && error.reason !== OverlayElement.ClosingReason.ERROR) {
								console.log(error);
							}
						})
					} else {
						plugin.insertLink(true);
					}
					return false;
				});

				editable.obj.find('a').each(function() {
					plugin.addLinkEventHandlers(this);
				});

				if (0 === editablesCreated++) {
					setupMousePointerFix();
				}
			});

			PubSub.sub('aloha.editable.destroyed', function (message) {
				message.editable.obj.unbind('.aloha-link');
				if (0 === --editablesCreated) {
					teardownMousePointerFix();
				}
			});

			PubSub.sub('aloha.editable.activated', function (message) {
				if (configurations[message.editable.getId()]) {
					plugin._insertLinkButton.show();
				} else {
					plugin._insertLinkButton.hide();
				}
				setupMetaClickLink(message.editable);
			});

			PubSub.sub('aloha.selection.context-change', function (message) {
				plugin._insertLinkButton.setActive(plugin.findLinkMarkup(message.range));

				if (!Aloha.activeEditable) {
					plugin.lastActiveLink = false;
					return;
				}
				var activeLink = false;
				plugin.lastActiveLink = activeLink;
			});

			// Fixes problem: if one clicks from inside an aloha link outside
			// the editable and thereby deactivates the editable, the link scope
			// will remain active
			PubSub.sub('aloha.editable.deactivated', function (message) {
				if (plugin.lastActiveLink !== false) {
					// Leave the link scope lazily to avoid flickering when
					// switching between anchor element editables
					setTimeout(function () {
						if (!plugin.lastActiveLink) {
							plugin.toggleLinkScope(false);
						}
					}, 100);
					plugin.lastActiveLink = false;
				}
				teardownMetaClickLink(message.editable);
			});
		},

		/**
		 * lets you toggle the link scope to true or false
		 * @param show bool
		 */
		toggleLinkScope: function ( show ) {
			// Check before doing anything as a performance improvement.
			// The _isScopeActive_editableId check ensures that when
			// changing from a normal link in an editable to an editable
			// that is a link itself, the removeLinkButton will be
			// hidden.
			if (this._isScopeActive === show && Aloha.activeEditable && this._isScopeActive_editableId === Aloha.activeEditable.getId()) {
				return;
			}
			this._isScopeActive = show;
			this._isScopeActive_editableId = Aloha.activeEditable && Aloha.activeEditable.getId();
			if (!configurations[this._isScopeActive_editableId] || !show) {
				// The calls to enterScope and leaveScope by the link
				// plugin are not balanced.
				// When the selection is changed from one link to
				// another, the link scope is incremented more than
				// decremented, which necessitates the force=true
				// argument to leaveScope.
				Scopes.leaveScope(this.name, 'link', true);
			} else if ( show ) {
				Scopes.enterScope(this.name, 'link');
			}
		},

		/**
		 * Add event handlers to the given link object
		 * @param link object
		 */
		addLinkEventHandlers: function ( link ) {
			var that = this;

			// show pointer on mouse over
			jQuery( link ).mouseenter( function ( e ) {
				Aloha.Log.debug( that, 'mouse over link.' );
				that.mouseOverLink = link;
				that.updateMousePointer();
			} );

			// in any case on leave show text cursor
			jQuery( link ).mouseleave( function ( e ) {
				Aloha.Log.debug( that, 'mouse left link.' );
				that.mouseOverLink = null;
				that.updateMousePointer();
			} );

			// follow link on ctrl or meta + click
			jQuery( link ).click( function ( e ) {
				if ( e.metaKey ) {
					// blur current editable. user is waiting for the link to load
					Aloha.activeEditable.blur();
					// hack to guarantee a browser history entry
					window.setTimeout( function () {
						location.href = e.target;
					}, 0 );
					e.stopPropagation();

					return false;
				}
			} );
		},

		/**
		 * Create component context for insert link button.
		 *
		 * @param existingLink The existing link if applicable.
		 */
		createInsertLinkContext: function (existingLink) {
			let href = 'https://';
			let anchor = '';
			let newTab = false;
			let toggleActive = false;

			if (existingLink) {
				href = existingLink.getAttribute('href');

				let anchorIdx = href.indexOf('#')

				if (anchorIdx >= 0) {
					anchor = href.substring(anchorIdx + 1)
					href = href.substring(0, anchorIdx);
				}

				newTab = existingLink.getAttribute('target') === '_blank';
				toggleActive = true;
			}

			return {
				title: 'Insert Link',
				active: toggleActive,
				initialValue: {
					url: {
						target: href,
						anchor: anchor,
					},
					newTab: newTab,
				},
				controls: {
					url: {
						type: 'link-target',
						validate: function (value) {
							return (value == null || !value.target) ? {
								required: true
							} : null;
						},
					},
					newTab: {
						type: 'checkbox',
						options: {
							label: 'Open in new Tab',
						},
					},
				},
			};
		},

		/**
		 * Opens the create/edit link modal.
		 *
		 * @param existingLink The link markup at the current range if available.
		 */
		showLinkModal: function (existingLink) {
			var that = this;

			Modal.openDynamicModal(
				that.createInsertLinkContext(existingLink)
			).then(function (control) {
				return control.value;
			}).then(function (formData) {
				that.upsertLink(formData);
			}).catch(function (error) {
				if (error instanceof OverlayElement.OverlayCloseError && error.reason !== OverlayElement.ClosingReason.ERROR) {
					console.log(error);
				}
			})
		},

		/**
		 * Initialize the buttons
		 */
		createButtons: function () {
			var that = this;

			this._insertLinkButton = Ui.adopt("insertLink", ToggleSplitButton, {
				tooltip: i18n.t("button.addlink.tooltip"),
				icon: "aloha-icon aloha-icon-link",
				contextType: 'modal',

				secondaryClick: function () {
					that.showLinkModal(that.findLinkMarkup());
				},
				onToggle: function (activated) {
					if (activated) {
						that.showLinkModal(that.findLinkMarkup());
					} else {
						that.removeLink();
					}
				},
			});
		},

		/**
		 * Parse a all editables for links and bind an onclick event
		 * Add the link short cut to all edtiables
		 */
		bindInteractions: function () {
			var that = this;

			jQuery( document )
				.keydown( function ( e ) {
					Aloha.Log.debug( that, 'Meta key down.' );
					that.metaKey = e.metaKey;
					that.updateMousePointer();
				} ).keyup( function ( e ) {
					Aloha.Log.debug( that, 'Meta key up.' );
					that.metaKey = e.metaKey;
					that.updateMousePointer();
				} );
		},

		/**
		 * Updates the mouse pointer
		 */
		updateMousePointer: function () {
			if ( this.metaKey && this.mouseOverLink ) {
				Aloha.Log.debug( this, 'set pointer' );
				jQuery( this.mouseOverLink ).removeClass( 'aloha-link-text' );
				jQuery( this.mouseOverLink ).addClass( 'aloha-link-pointer' );
			} else {
				jQuery( this.mouseOverLink ).removeClass( 'aloha-link-pointer' );
				jQuery( this.mouseOverLink ).addClass( 'aloha-link-text' );
			}
		},

		/**
		 * Check whether inside a link tag
		 * @param {RangeObject} range range where to insert the
		 *			object (at start or end)
		 * @return markup
		 * @hide
		 */
		findLinkMarkup: function ( range ) {
			if ( typeof range == 'undefined' ) {
				range = Aloha.Selection.getRangeObject();
			}
			if ( Aloha.activeEditable ) {
				// If the anchor element itself is the editable, we
				// still want to show the link tab.
				var limit = Aloha.activeEditable.obj;
				if (limit[0] && limit[0].nodeName === 'A') {
					limit = limit.parent();
				}
				return range.findMarkup(function () {
					return this.nodeName == 'A';
				}, limit);
			} else {
				return null;
			}
		},

		/**
		 * Find all link markup in the specified range
		 * @param {RangeObject} range range to search link markup in
		 * @return {Array} markup An array containing all found link markup
		 * @hide
		 */
		findAllLinkMarkup: function ( range ) {
			if ( typeof range == 'undefined' ) {
				range = Aloha.Selection.getRangeObject();
			}

			var markup = range.findAllMarkupByTagName('a', range);

			if (markup.length > 0) {
				return markup;
			}

			markup = this.findLinkMarkup(range);

			return markup ? [ markup ] : [];
		},

		/**
		 * Format the current selection or if collapsed the current word as
		 * link. If inside a link tag the link is removed.
		 */
		upsertLink: function (linkData) {
			if ( Aloha.activeEditable ) {
				let existingLink = this.findLinkMarkup(Aloha.Selection.getRangeObject());

				if (existingLink) {
					let href = linkData.url.target;

					if (linkData.url.anchor) {
						href += "#" + linkData.url.anchor;
					}

					existingLink.setAttribute('href', href);

					if (linkData.newTab) {
						existingLink.setAttribute('target', '_blank');
					} else {
						existingLink.removeAttribute('target');
					}
				} else {
					this.insertLink(true, linkData);
				}
			}
		},

		/**
		 * Insert a new link at the current selection. When the selection is
		 * collapsed, the link will have a default link text, otherwise the
		 * selected text will be the link text.
		 */
		insertLink: function ( extendToWord, linkData ) {
			var that = this,
			    range = Aloha.Selection.getRangeObject(),
			    linkText,
			    newLink;

			// There are occasions where we do not get a valid range, in such
			// cases we should not try and add a link
			if ( !( range.startContainer && range.endContainer ) ) {
				return;
			}

			// do not nest a link inside a link
			if ( this.findLinkMarkup( range ) ) {
				return;
			}

			// if selection is collapsed then extend to the word.
			if ( range.isCollapsed() && extendToWord !== false ) {
				Dom.extendToWord( range );
			}

			let href = linkData.url.target;

			if (linkData.url.anchor) {
				href += '#' + linkData.url.anchor
			}

			let target = linkData.newTab ? '" target="_blank' : '';

			if ( range.isCollapsed() ) {
				// insert a link with text here
				linkText = i18n.t( 'newlink.defaulttext' );
				newLink = jQuery( '<a href="' + href + target + '" class="aloha-new-link">' + linkText + '</a>' );
				Dom.insertIntoDOM( newLink, range, jQuery( Aloha.activeEditable.obj ) );
				range.startContainer = range.endContainer = newLink.contents().get( 0 );
				range.startOffset = 0;
				range.endOffset = linkText.length;
			} else {
				newLink = jQuery( '<a href="' + href + target + '" class="aloha-new-link"></a>' );
				Dom.addMarkup( range, newLink, false );
				Dom.doCleanup(insertLinkPostCleanup, range);
			}

			Aloha.activeEditable.obj.find( 'a.aloha-new-link' ).each( function ( i ) {
				that.addLinkEventHandlers( this );
				jQuery(this).removeClass( 'aloha-new-link' );
			} );

			range.select();


			// because the Aloha Selection is deprecated I need to convert it to a ragne
			var apiRange = Aloha.createRange();
			apiRange.setStart(range.startContainer, range.startOffset);
			apiRange.setEnd(range.endContainer, range.endOffset);

			PubSub.pub('aloha.link.insert', {range: apiRange});
			this.hrefChange();
		},

		/**
		 * Remove an a tag and clear
		 */
		removeLink: function ( terminateLinkScope ) {
			var	range = Aloha.Selection.getRangeObject(),
				foundMarkup = this.findAllLinkMarkup();
			var linkText;
			var that = this;
			var maxIdx = foundMarkup.length - 1;

			$.each(foundMarkup, function (idx, link) {
				linkText = jQuery(link).text();
				// remove the link
				Dom.removeFromDOM( link, range, true );

				range.startContainer = range.endContainer;
				range.startOffset = range.endOffset;

				// select the (possibly modified) range
				range.select();

				if ( typeof terminateLinkScope == 'undefined' ||
						terminateLinkScope === true ) {
					Scopes.setScope('Aloha.continuoustext');
				}

				// trigger an event for removing the link
				var apiRange = Aloha.createRange();
				apiRange.setStart(range.startContainer, range.startOffset);
				apiRange.setEnd(range.endContainer, range.endOffset);

				PubSub.pub('aloha.link.remove', {
					range: apiRange,
					text: linkText
				});
			});
		},

		/**
		 * Updates the link object depending on the src field
		 */
		hrefChange: function () {
			let link = this.findLinkMarkup()
			let href = link.getAttribute('href');
			let linkObj = $(link);
			let signalPayload = {
				href: href,
				obj: linkObj,
				item: null
			};
			let pubPayload = {
				href: href,
				element: linkObj,
				input: null
			};

			Aloha.trigger('aloha-link-href-change', signalPayload);
			PubSub.pub('aloha.link.changed', pubPayload);

			if ( typeof this.onHrefChange == 'function' ) {
				this.onHrefChange.call(this, linkObj, href, null);
			}
		}
	});
} );
