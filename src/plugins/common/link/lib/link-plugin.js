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
 * It presents its user interface in the Toolbar, in a Sidebar panel.
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
	'ui/port-helper-attribute-field',
	'ui/ui',
	'ui/scopes',
	'ui/button',
	'ui/toggleButton',
	'ui/contextButton',
	'ui/input',
	'i18n!link/nls/i18n',
	'PubSub',
	'util/keys',
	'link/link-target',
	'ui/dynamicForm',
	'ui/overlayElement',
	'../../../shared/languages/languages'
], function (
	$,
	Aloha,
	Plugin,
	Ephemera,
	ContentRules,
	Dom,
	AttributeField,
	Ui,
	Scopes,
	Button,
	ToggleButton,
	ContextButton,
	Input,
	i18n,
	PubSub,
	Keys,
	LinkTarget,
	DynamicForm,
	OverlayElement,
	LanguageRepository
) {
	'use strict';

	var configurations = {};
	var jQuery = $;
	var pluginNamespace = 'aloha-link';
	var oldValue = '';
	var newValue;

	/**
	 * Regular expression that matches if an URL is an external link.
	 */
	var EXTERNAL_LINK_REG_EXP = /^([a-z]){3,10}:\/\/.+/i;

	/**
	 * Field for hrefLang value in the link sidebar.
	 */
	var hrefLangField;

	/**
	 * Language repository
	 */
	var LANG_REPOSITORY;

	/**
	 * Initializes href lang input text.
	 */
	function initHrefLang(plugin, sidebar) {
		hrefLangField = AttributeField({
			name: 'hreflangfield',
			valueField: 'id',
			minChars: 1,
			open: function (elm, ui) {
				// known issue http://bugs.jquery.com/ticket/10079
				// $.css('z-index') return 1e+9, and when call partseInt, then
				// parseInt($.css('z-index'), 10) returns 1.
				// Only firefox issue
				// Everytime is open the autocomple the z-index must be set,
				// because is automatically changed.
				if (Aloha.browser.mozilla) {
					hrefLangField.getInputJQuery().autocomplete('widget').css('z-index', '9999999999');
				}
			}
		});

		if (plugin.flags) {
			hrefLangField.setTemplate(
				 '<div class="aloha-wai-lang-img-item">' +
				  '<img class="aloha-wai-lang-img" src="{url}" />' +
				  '<div class="aloha-wai-lang-label-item">{name} ({id})</div>' +
				  '</div>');
		} else {
			hrefLangField.setTemplate('<div class="aloha-wai-lang-img-item">' +
				  '<div class="aloha-wai-lang-label-item">{name} ({id})</div>' +
				  '</div>'
			);
		}

		hrefLangField.setObjectTypeFilter(['language/link']);

		hrefLangField.addListener('item-change', function() {
			if (this.getItem()) {
				jQuery(sidebar.effective ).attr( 'hreflang', this.getItem().id);
			}
		});

		hrefLangField.addListener('keyup', function() {
			if (jQuery.trim(this.getValue()).length === 0) {
				this.setValue('');
				jQuery(sidebar.effective ).attr( 'hreflang', '');
			}
		});
	}

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
		 * The value that will automatically be set to an anchor tag's title
		 * attribute if its href field matches the titleregex, and the editor
		 * has not manually defined the title attribute.
		 *
		 * @type {string}
		 */
		title: null,

		/**
		 * Regular Expression string which the field's href value will be tested
		 * against in order to determine whether or not to set the configured
		 * title attribute value.
		 *
		 * @type {string}
		 */
		titleregex: null,

		/**
		 * all links that match the targetregex will get set the target
		 * e.g. ^(?!.*aloha-editor.com).* matches all href except aloha-editor.com
		 */
		targetregex: '',

		/**
		  * this target is set when either targetregex matches or not set
		  * e.g. _blank opens all links in new window
		  */
		target: '',

		/**
		 * all links that match the cssclassregex will get set the css class
		 * e.g. ^(?!.*aloha-editor.com).* matches all href except aloha-editor.com
		 */
		cssclassregex: null,

		/**
		  * this target is set when either cssclassregex matches or not set
		  */
		cssclass: '',

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
		 * This variable is used to ignore one selection changed event. We need
		 * to ignore one selectionchanged event when we set our own selection.
		 */
		ignoreNextSelectionChangedEvent: false,

		/**
		 * Internal update interval reference to work around an ExtJS bug
		 */
		hrefUpdateInt: null,

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

			if ('undefined' !== typeof this.settings.title) {
				this.title = this.settings.title;
			}
			if ('undefined' !== typeof this.settings.titleregex) {
				this.titleregex = this.settings.titleregex;
			}
			if (typeof this.settings.targetregex != 'undefined') {
				this.targetregex = this.settings.targetregex;
			}
			if (typeof this.settings.target != 'undefined') {
				this.target = this.settings.target;
			}
			if (typeof this.settings.cssclassregex != 'undefined') {
				this.cssclassregex = this.settings.cssclassregex;
			}
			if (typeof this.settings.cssclass != 'undefined') {
				this.cssclass = this.settings.cssclass;
			}
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
				plugin.initSidebar(Aloha.Sidebar.right);
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

		initSidebar: function (sidebar) {
			var pl = this;
			sidebar.addPanel( {
				id       : pl.nsClass( 'sidebar-panel-target' ),
				title    : i18n.t( 'floatingmenu.tab.link' ),
				content  : '',
				expanded : true,
				activeOn : 'a, link',

				onInit: function () {
					initHrefLang(pl, this);

					var infoFields = '';
					if (jQuery.isArray(pl.settings.sidebar)) {
						jQuery.each(pl.settings.sidebar, function () {
							infoFields += '<div class="' + pl.nsClass('title-container') + '"><fieldset><legend>' + _i18n(this.title) + '</legend><span class="' + pl.nsClass( this.attr ) + '"></span></fieldset></div>';
						});
					}

					 var that = this,
						 content = this.setContent(
							'<div class="' + pl.nsClass( 'target-container' ) + '"><fieldset><legend>' + i18n.t( 'link.target.legend' ) + '</legend><ul><li><input type="radio" name="targetGroup" class="' + pl.nsClass( 'radioTarget' ) + '" value="_self" /><span>' + i18n.t( 'link.target.self' ) + '</span></li>' +
							'<li><input type="radio" name="targetGroup" class="' + pl.nsClass( 'radioTarget' ) + '" value="_blank" /><span>' + i18n.t( 'link.target.blank' ) + '</span></li>' +
							'<li><input type="radio" name="targetGroup" class="' + pl.nsClass( 'radioTarget' ) + '" value="_parent" /><span>' + i18n.t( 'link.target.parent' ) + '</span></li>' +
							'<li><input type="radio" name="targetGroup" class="' + pl.nsClass( 'radioTarget' ) + '" value="_top" /><span>' + i18n.t( 'link.target.top' ) + '</span></li>' +
							'<li><input type="radio" name="targetGroup" class="' + pl.nsClass( 'radioTarget' ) + '" value="framename" /><span>' + i18n.t( 'link.target.framename' ) + '</span></li>' +
							'<li><input type="text" class="' + pl.nsClass( 'framename' ) + '" /></li></ul></fieldset></div>' +
							'<div class="' + pl.nsClass( 'title-container' ) + '" ><fieldset><legend>' + i18n.t( 'link.title.legend' ) + '</legend><input type="text" class="' + pl.nsClass( 'linkTitle' ) + '" /></fieldset></div>' +
							'<div class="' + pl.nsClass( 'href-lang-container' ) + '" ><fieldset><legend>' + i18n.t( 'href.lang.legend' ) + '</legend></fieldset></div>' +
							infoFields
						).content;

					 jQuery(hrefLangField.getInputElem()).addClass(pl.nsClass( 'hrefLang' ));
					 jQuery(content).find("." + pl.nsClass( 'href-lang-container' ) + " fieldset").append(hrefLangField.getInputElem());

					 jQuery( pl.nsSel( 'framename' ) ).on( 'keyup', function () {
						jQuery( that.effective ).attr( 'target', jQuery( this ).val().replace( '\"', '&quot;' ).replace( "'", "&#39;" ) );
					 } );

					 jQuery( pl.nsSel( 'radioTarget' ) ).on( 'change', function () {
						if ( jQuery( this ).val() == 'framename' ) {
							jQuery( pl.nsSel( 'framename' ) ).slideDown();
						} else {
							jQuery(pl.nsSel('framename')).slideUp().val( '' );
							jQuery(that.effective).attr('target', jQuery( this ).val());
						}
					 } );

					 jQuery( pl.nsSel( 'linkTitle' ) ).on( 'keyup', function () {
						jQuery( that.effective ).attr( 'title', jQuery( this ).val().replace( '\"', '&quot;' ).replace( "'", "&#39;" ) );
					 } );
				},

				onActivate: function ( effective ) {
					var that = this;
					that.effective = effective;
					if ( jQuery( that.effective ).attr( 'target' ) != null ) {
						var isFramename = true;
						jQuery( pl.nsSel( 'framename' ) ).hide().val( '' );
						jQuery( pl.nsSel( 'radioTarget' ) ).each( function () {
							jQuery( this ).removeAttr('checked');
							if ( jQuery( this ).val() === jQuery( that.effective ).attr( 'target' ) ) {
								isFramename = false;
								jQuery( this ).attr( 'checked', 'checked' );
							}
						} );
						if ( isFramename ) {
							jQuery( pl.nsSel( 'radioTarget[value="framename"]' ) ).attr( 'checked', 'checked' );
							jQuery( pl.nsSel( 'framename' ) )
								.val( jQuery( that.effective ).attr( 'target' ) )
								.show();
						}
					} else {
						jQuery( pl.nsSel( 'radioTarget' ) ).first().attr( 'checked', 'checked' );
						jQuery( that.effective ).attr( 'target', jQuery( pl.nsSel( 'radioTarget' ) ).first().val() );
					}

					var that = this;
					that.effective = effective;
					jQuery( pl.nsSel( 'linkTitle' ) ).val( jQuery( that.effective ).attr( 'title' ) );

					var hrefLangAttr = jQuery(effective).attr('hreflang');

					if (hrefLangAttr && hrefLangAttr.length > 0) {
						var languageName = getLanguageName(hrefLangAttr);
						hrefLangField.setValue(languageName);
					} else {
						hrefLangField.setValue('');
					}

					if (EXTERNAL_LINK_REG_EXP.test(jQuery(effective).attr('href'))) {
						hrefLangField.enableInput();
					} else {
						hrefLangField.disableInput();
					}
				}

			} );

			sidebar.show();
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
					if (plugin.findLinkMarkup()) {
						console.log('TODO: Open link modal');
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
			if (!configurations[this._isScopeActive_editableId]) {
				this._removeLinkButton.hide();
				// The calls to enterScope and leaveScope by the link
				// plugin are not balanced.
				// When the selection is changed from one link to
				// another, the link scope is incremented more than
				// decremented, which necessitates the force=true
				// argument to leaveScope.
				Scopes.leaveScope(this.name, 'link', true);
			} else if ( show ) {
				// Never show the removeLinkButton when the link itself
				// is the editable.
				if (Aloha.activeEditable && Aloha.activeEditable.obj[0].nodeName === 'A') {
					this._removeLinkButton.hide();
				} else {
					this._removeLinkButton.show();
				}
				Scopes.enterScope(this.name, 'link');
			} else {
				this._removeLinkButton.hide();
				// The calls to enterScope and leaveScope by the link
				// plugin are not balanced.
				// When the selection is changed from one link to
				// another, the link scope is incremented more than
				// decremented, which necessitates the force=true
				// argument to leaveScope.
				Scopes.leaveScope(this.name, 'link', true);
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
		 * Initialize the buttons
		 */
		createButtons: function () {
			var that = this;

			this._insertLinkButton = Ui.adopt("insertLink", ContextButton, {
				tooltip: i18n.t("button.addlink.tooltip"),
				icon: "aloha-icon aloha-icon-link",
				context: function () {
					let href = 'https://';
					let anchor = '';
					let newTab = false;
					let existingLink = that.findLinkMarkup();

					if (existingLink) {
						href = existingLink.getAttribute('href');

						let anchorIdx = href.indexOf('#')

						if (anchorIdx >= 0) {
							anchor = href.substring(anchorIdx + 1)
							href = href.substring(0, anchorIdx);
						}

						newTab = existingLink.getAttribute('target') === '_blank';
					}


					return {
						title: 'Insert Link',
						initialValue: {
							url: {
								target: href,
								anchor: anchor,
							},
							newTab: {
								checked: newTab
							},
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

				contextType: 'modal',
				contextResolve: function(formData) {
					that.upsertLink(formData);
				},
				contextReject: function(error) {
					if (
						error instanceof OverlayElement.OverlayCloseError
						&& error.reason !== OverlayElement.ClosingReason.ERROR
					) {
						// Error can be safely ignored
						return;
					}

					console.error('Error while opening link modal', error);
				},
			});

			this._removeLinkButton = Ui.adopt("removeLink", Button, {
				tooltip: i18n.t("button.removelink.tooltip"),
				icon: "aloha-icon aloha-icon-unlink",
				click: function() {
					that.removeLink();
				}
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

					if (linkData.newTab && linkData.newTab.checked) {
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
			console.log('CREATING LINK:', linkData)

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
				that.ignoreNextSelectionChangedEvent = idx < maxIdx;

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
		 * Automatically sets (or unsets) the title attribute value of the given
		 * AttributeField's target anchor element based on the link's href
		 * value.
		 *
		 * @param {AttributeField} field The AttributeField that is to be used.
		 * @param {string} value The value to which the title attribute is to be
		 *                       set to.
		 * @param {string} regex A string representing a regular expression
		 *                       against which to test the href value of the
		 *                       AttributeField `field`, to predicate whether
		 *                       the title field should be update or not.
		 */
		automaticallySetTitle: function (field, value, regex) {
			var currentValue = jQuery(field.getTargetObject()).attr('title');
			var canOverwriteTitle = !currentValue || value === currentValue;
			if (value && canOverwriteTitle) {
				field.setAttribute('title', value, regex, field.getValue());
			}
		},

		/**
		 * Updates the link object depending on the src field
		 */
		hrefChange: function () {
			console.log('TODO: Get target link object');
			var href = '';
			var hrefTargetObject = null;
			var setAutoValues = hrefTargetObject && !hrefTargetObject.attr('data-ignore-auto-values');

			// No need to check setAutoValues here, since the title will not be
			// changed anyway once a custom title has been set.
			console.log('TODO: Automatically set title');
			/*
			this.automaticallySetTitle(
				this.hrefField,
				this.title,
				this.titleregex
			);
			 */

			// For now hard coded attribute handling with regex.
			// Avoid creating the target attribute, if it's unnecessary, so
			// that XSS scanners (AntiSamy) don't complain.
			if (setAutoValues && this.target) {
				console.log('TODO: Automatically set target');
			}

			if (setAutoValues && null != this.cssclassregex) {
				console.log('TODO: Automatically set CSS class');
			}

			console.log('TODO: Trigger aloha-link-href-change')
			console.log('TODO: Pub aloha.link.changed');

			if ( typeof this.onHrefChange == 'function' ) {
				console.log('TODO: Call onHrefChange()');
			}

			// href is an external link
			else if (EXTERNAL_LINK_REG_EXP.test(href)){
				hrefLangField.enableInput();
			}
			// href is being defined
			else {
				hrefLangField.setValue('');
				hrefLangField.disableInput();
			}

			Aloha.Sidebar.right.checkActivePanels(Aloha.Selection.getRangeObject());

			console.log('TODO: Fill sidebar info');
		}
	});

	/**
	 * Add additional target objects, in case the selection includes
	 * several links tag
	 *
	 * @param {RangeObject} rangeObject Selection Range
	 * @param {LinkPlugin} that Link Plugin object
	 */
	function addAdditionalTargetObject(rangeObject, field) {
		var links = rangeObject.findAllMarkupByTagName('A', rangeObject);
		for (var i = 0, len = links.length; i < len; i++) {
			field.addAdditionalTargetObject(links[i]);
		}
	}

	/**
	 * Selection change handler.
	 *
	 * @param {LinkPlugin} that This Link Plugin object
	 * @param {RangeObject} rangeObject Selection Range
	 * @returns {boolean|DomObject} The Dom Object if a link was selected,
	 *                    False otherwise
	 */
	function selectionChangeHandler(that, rangeObject) {
		var foundMarkup,
		    enteredLinkScope = false;

		// Check if we need to ignore this selection changed event for
		// now and check whether the selection was placed within a
		// editable area.
		if (!that.ignoreNextSelectionChangedEvent &&
			Aloha.Selection.isSelectionEditable() &&
			Aloha.activeEditable != null ) {

			foundMarkup = jQuery(that.findLinkMarkup(rangeObject));

			if (foundMarkup.length > 0) {
				that.toggleLinkScope(true);

				that.prepareAnchor(foundMarkup.attr('href'));

				// now we are ready to set the target object
				foundMarkup.attr('data-ignore-auto-values', 'true');
				that.hrefChange();
				foundMarkup.removeAttr('data-ignore-auto-values');

				Aloha.trigger('aloha-link-selected');
				enteredLinkScope = true;

				console.log('TODO: Pub aloha.link.selected');
			} else {
				that.toggleLinkScope(false);
				Aloha.trigger('aloha-link-unselected');
			}
		} else {
			that.toggleLinkScope(false);
		}

		that.ignoreNextSelectionChangedEvent = false;
		return enteredLinkScope ? foundMarkup : false;
	}
} );
