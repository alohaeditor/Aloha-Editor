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
	'ui/text',
	'i18n!link/nls/i18n',
	'PubSub',
	'util/keys',
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
	Text,
	i18n,
	PubSub,
	Keys,
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
			scope: 'Aloha.continuoustext',
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
		jQuery(document).bind('keydown.aloha-link.pointer-fix', function (e) {
				// metaKey for OSX, 17 for PC (we can't check
				// e.ctrlKey because it's only set on keyup or
				// keypress, not on keydown).
				if (e.metaKey || Keys.getToken(e.keyCode) === 'control') {
					jQuery('body').addClass('aloha-link-pointer');
				}
			})
			.bind('keyup.aloha-link.pointer-fix', function (e) {
				if (e.metaKey || Keys.getToken(e.keyCode) === 'control') {
					jQuery('body').removeClass('aloha-link-pointer');
				}
			});
	}

	function teardownMousePointerFix() {
		jQuery(document).unbind('.aloha-link.pointer-fix');
	}

	function setupMetaClickLink(editable) {
		editable.obj.delegate('a', 'click.aloha-link.meta-click-link', function (e) {
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
		 * Indicates whether a special input field for anchors
		 * is visible. (default: false).
		 */
		anchorLinks: false,

		/**
		 * Initializes the plugin.
		 */
		init: function () {
			var plugin = this;

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
			if (typeof this.settings.anchorLinks != 'undefined') {
				var val = this.settings.anchorLinks;

				this.anchorLinks = val === true || (typeof val == 'string' && val.toLowerCase() != 'false');
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
					 
					 jQuery( pl.nsSel( 'framename' ) ).live( 'keyup', function () {
						jQuery( that.effective ).attr( 'target', jQuery( this ).val().replace( '\"', '&quot;' ).replace( "'", "&#39;" ) );
					 } );
					 
					 jQuery( pl.nsSel( 'radioTarget' ) ).live( 'change', function () {
						if ( jQuery( this ).val() == 'framename' ) {
							jQuery( pl.nsSel( 'framename' ) ).slideDown();
						} else {
							jQuery(pl.nsSel('framename')).slideUp().val( '' );
							jQuery(that.effective).attr('target', jQuery( this ).val());
						}
					 } );
					 
					 jQuery( pl.nsSel( 'linkTitle' ) ).live( 'keyup', function () {
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
				editable.obj.bind('keydown.aloha-link', plugin.hotKey.insertLink, function () {
					if (plugin.findLinkMarkup()) {
						plugin.hrefField.foreground();
						plugin.hrefField.focus();
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
					plugin._formatLinkButton.show();
					plugin._insertLinkButton.show();
				} else {
					plugin._formatLinkButton.hide();
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
				if (configurations[Aloha.activeEditable.getId()]) {
					activeLink = selectionChangeHandler(plugin, message.range);
					// Only foreground the tab containing the href field the
					// first time the user enters the link scope to avoid
					// intefering with the user's manual tab selection
					if (activeLink !== false && !activeLink.is(plugin.lastActiveLink)) {
						// put the field into foreground with a timeout, so that this
						// overrules other plugins that change the active toolbar tab
						// by setting the scope
						setTimeout(function () {
							plugin.hrefField.foreground();
						}, 10);
					}
				}
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
				this.hrefField.hide();
				if (this.anchorLinks) {
					this.anchorField.hide();
					this.toggleAnchor.setState(false);
					this.toggleAnchor.hide();
				}
				this._insertLinkButton.hide();
				this._removeLinkButton.hide();
				this._formatLinkButton.setState(false);
				// The calls to enterScope and leaveScope by the link
				// plugin are not balanced.
				// When the selection is changed from one link to
				// another, the link scope is incremented more than
				// decremented, which necessitates the force=true
				// argument to leaveScope.
				Scopes.leaveScope(this.name, 'link', true);
			} else if ( show ) {
				this.hrefField.show();
				if (this.anchorLinks) {
					this.toggleAnchor.show();
				}
				this._insertLinkButton.hide();
				// Never show the removeLinkButton when the link itself
				// is the editable.
				if (Aloha.activeEditable && Aloha.activeEditable.obj[0].nodeName === 'A') {
					this._removeLinkButton.hide();
				} else {
					this._removeLinkButton.show();
				}
				this._formatLinkButton.setState(true);
				Scopes.enterScope(this.name, 'link');
			} else {
				this.hrefField.hide();
				if (this.anchorLinks) {
					this.anchorField.hide();
					this.toggleAnchor.hide();
				}
				this._insertLinkButton.show();
				this._removeLinkButton.hide();
				this._formatLinkButton.setState(false);
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

			this._formatLinkButton = Ui.adopt("formatLink", ToggleButton, {
				tooltip: i18n.t("button.addlink.tooltip"),
				icon: "aloha-icon aloha-icon-link",
				scope: 'Aloha.continuoustext',
				click: function() {
					that.formatLink();
				}
			});

			this._insertLinkButton = Ui.adopt("insertLink", Button, {
				tooltip: i18n.t("button.addlink.tooltip"),
				icon: "aloha-icon aloha-icon-link",
				scope: 'Aloha.continuoustext',
				click: function() {
					that.insertLink(false);
				}
			});

			this.hrefField = AttributeField({
				name: 'editLink',
				width: 320,
				valueField: 'url',
				cls: 'aloha-link-href-field',
				scope: 'Aloha.continuoustext',
				noTargetHighlight: false,
				targetHighlightClass: 'aloha-focus',
				modifyValue: function (href) {
					if (!that.anchorLinks) {
						return href;
					}

					// append the anchor from the anchorField
					var anchor = that.anchorField.getValue();
					if (anchor) {
						href = href + '#' + anchor;
					}
					return href;
				}
			});
			this.hrefField.setTemplate('<span><b>{name}</b><br/>{url}</span>');
			this.hrefField.setObjectTypeFilter( this.objectTypeFilter );

			if (this.anchorLinks) {
				this.toggleAnchor = Ui.adopt('toggleAnchor', ToggleButton, {
					tooltip: i18n.t('button.toggleanchor.tooltip'),
					icon: "aloha-icon aloha-icon-anchor",
					click: function() {
						if (that.anchorField.isVisible()) {
							that.anchorField.clear();
							that.hrefField.focus();
						} else {
							that.anchorField.show();
							that.anchorField.focus();
						}

						return false;
					}
				});

				this.anchorField = Ui.adopt('editAnchor', Text, {
					init: function () {
						this._super();
						this.element.bind("keyup", function onKeyup(event) {
							if ((event.keyCode == 13 || event.keyCode == 27)) {
								that.hrefField.finishEditing(true);
							}
						});
					},

					clear: function() {
						this.setInputValue('');
						this.updateValue('');
					},

					setInputValue: function(anchor) {
						this.element.val(anchor);

						if (anchor && (!this.isVisible() || !that.toggleAnchor.getState())) {
							this.show();
							that.toggleAnchor.setState(true);
						} else if (!anchor && (this.isVisible() || that.toggleAnchor.getState())) {
							this.hide();
							that.toggleAnchor.setState(false);
						}
					},

					// Text provides setInput() but that is only called
					// on the "change" event (e.g. when the element loses
					// focus). updateValue() is intended to be called for
					// every keystroke.
					updateValue: function(anchor) {
						var repoItem = that.hrefField.getItem();
						if (repoItem) {
							// when a repository item is selected, we "reselect" it, so that the anchor will
							// be updated in the href field
							that.hrefField.setItem(repoItem);
						} else {
							var href = that.hrefField.getValue();
							// if the href only contains http:// (or https://), we remove the href when an anchor has been set
							if (/^https?:\/\/$/.test(href) && anchor) {
								that.hrefField.setValue('');
							}
							// updatetarget will update the href field (include the new anchor value)
							that.hrefField.updateTarget();
						}
						that.hrefChange();
					}
				});
				this.anchorField.hide();
			}

			this._removeLinkButton = Ui.adopt("removeLink", Button, {
				tooltip: i18n.t("button.removelink.tooltip"),
				icon: "aloha-icon aloha-icon-unlink",
				scope: 'Aloha.continuoustext',
				click: function() {
					that.removeLink();
				}
			});
		},

		/**
		 * Save the anchor from the selected link to the
		 * anchor field.
		 */
		prepareAnchor: function (href) {
			if (!this.anchorLinks) {
				return;
			}

			var anchor;
			var idx = href.indexOf('#');

			if (idx < 0) {
				anchor = '';
			} else {
				anchor = href.substring(idx + 1);
			}

			this.anchorField.setInputValue(anchor);
		},

		/**
		 * Remove the anchor from the href field, when a
		 * link is selected.
		 */
		stripAnchor: function () {
			if (!this.anchorLinks || this.hrefField.getItem()) {
				return;
			}

			var href = this.hrefField.getValue();
			var idx = href.indexOf('#');

			if (idx < 0) {
				return;
			}

			href = href.substring(0, idx);
			this.hrefField.setValue(href);
		},

		/**
		 * Move a possible anchor from the href field to the
		 * anchor field. Called when a link is pasted into
		 * the href field.
		 */
		splitAnchor: function () {
			if (!this.anchorLinks) {
				return;
			}

			var href = this.hrefField.getValue()
			var idx = href.indexOf('#');

			if (idx < 0) {
				if (this.anchorField.isVisible()) {
					this.anchorField.clear();
				}

				return;
			}

			var anchor = href.substring(idx + 1);

			href = href.substring(0, idx);
			this.anchorField.setInputValue(anchor);
			this.hrefField.setValue(href);

			if (anchor) {
				this.anchorField.element.focus();
			}
		},

		/**
		 * Parse a all editables for links and bind an onclick event
		 * Add the link short cut to all edtiables
		 */
		bindInteractions: function () {
			var that = this;

			this.hrefField.addListener('item-change', function() {
				// because 'hrefChange()' references 'this' object.
				that.hrefChange();
			});

			if (this.anchorLinks) {
				this.hrefField.addListener('keypress', function(event) {
					if (String.fromCharCode(event.charCode || event.keyCode) == '#') {
						if (!that.anchorField.isVisible()) {
							that.toggleAnchor.setState(true);
							that.anchorField.show();
						} else {
							that.anchorField.element.select();
						}

						that.anchorField.focus();

						return false;
					}

					return true;
				});

				this.hrefField.addListener('paste', function(event) {
					// At the time this event is processed, the pasted
					// content is still not in the input field.
					setTimeout(function() {
						that.splitAnchor();
						that.hrefChange();
					}, 0);
				});
			}

			// update link object when src changes
			this.hrefField.addListener( 'keyup', function ( event ) {
				if (Keys.getToken(event.keyCode) === 'escape') {
					var curval = that.hrefField.getValue(true);
					if ( curval[ 0 ] == '/' || // local link
						 curval[ 0 ] == '#' || // inner document link
						 curval.match( /^.*\.([a-z]){2,4}$/i ) || // local file with extension
						 curval.match( EXTERNAL_LINK_REG_EXP ) || // external link (http(s), ftp(s), ssh, file, skype, ... )
						 curval.match( /^(mailto|tel):.+/i ) // mailto / tel link
					) {
						// could be a link better leave it as it is
					} else {
						// the user searched for something and aborted
						var hrefValue = that.hrefField.getValue();

						// restore original value and hide combo list
						that.hrefField.setValue( hrefValue );

						if ( hrefValue == that.hrefValue || hrefValue == '' ) {
							that.removeLink( false );
						}
					}
				}

				that.hrefChange();

				// Terminate the link scope and show the final link.
				if (Keys.getToken(event.keyCode) === 'enter') {
					// Update the selection and place the cursor at the end of the link.
					var	range = Aloha.Selection.getRangeObject();

					// We have to ignore the next 2 onselectionchange events.
					// The first one we need to ignore is the one trigger when
					// we reposition the selection to right at the end of the
					// link.

					that.ignoreNextSelectionChangedEvent = true;

					var hrefValue = jQuery( that.hrefField.getInputElem() ).attr( 'value' );

					if ( hrefValue == that.hrefValue || hrefValue == '' ) {
						that.removeLink( false );
					}

					window.setTimeout( function () {
						Scopes.setScope('Aloha.continuoustext');
					}, 100 );
				} else {
					// Check whether the value in the input field has changed
					// because if it has, then the ui-attribute object's store
					// needs to be cleared. The reason we need to do this
					// clearing is because once the auto-suggeset combo box is
					// shown and/or populated, the next enter keypress event
					// would be handled as if the user is selecting one of the
					// elements in the down down list.
					newValue = jQuery( that.hrefField.getInputElem() ).attr( 'value' );
					if ( oldValue != newValue ) {
						oldValue = newValue;
					}
				}
			});

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
		 * Format the current selection or if collapsed the current word as
		 * link. If inside a link tag the link is removed.
		 */
		formatLink: function () {
			if ( Aloha.activeEditable ) {
				if ( this.findLinkMarkup( Aloha.Selection.getRangeObject() ) ) {
					this.removeLink();
				} else {
					this.insertLink();
				}
			}
		},

		/**
		 * Insert a new link at the current selection. When the selection is
		 * collapsed, the link will have a default link text, otherwise the
		 * selected text will be the link text.
		 */
		insertLink: function ( extendToWord ) {
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

			// activate floating menu tab
			this.hrefField.foreground();

			// if selection is collapsed then extend to the word.
			if ( range.isCollapsed() && extendToWord !== false ) {
				Dom.extendToWord( range );
			}
			if ( range.isCollapsed() ) {
				// insert a link with text here
				linkText = i18n.t( 'newlink.defaulttext' );
				newLink = jQuery( '<a href="' + that.hrefValue + '" class="aloha-new-link">' + linkText + '</a>' );
				Dom.insertIntoDOM( newLink, range, jQuery( Aloha.activeEditable.obj ) );
				range.startContainer = range.endContainer = newLink.contents().get( 0 );
				range.startOffset = 0;
				range.endOffset = linkText.length;
			} else {
				newLink = jQuery( '<a href="' + that.hrefValue + '" class="aloha-new-link"></a>' );
				Dom.addMarkup( range, newLink, false );
				Dom.doCleanup(insertLinkPostCleanup, range);
			}

			Aloha.activeEditable.obj.find( 'a.aloha-new-link' ).each( function ( i ) {
				that.addLinkEventHandlers( this );
				jQuery(this).removeClass( 'aloha-new-link' );
			} );

			range.select();


			// focus has to become before prefilling the attribute, otherwise
			// Chrome and Firefox will not focus the element correctly.
			this.hrefField.focus();

			// prefill and select the new href
			// We need this guard because sometimes the element has not yet been initialized
			if ( this.hrefField.hasInputElem() ) {
				jQuery( this.hrefField.getInputElem() ).attr( 'value', that.hrefValue ).select();
			}

			// because the Aloha Selection is deprecated I need to convert it to a ragne
			var apiRange = Aloha.createRange();
			apiRange.setStart(range.startContainer, range.startOffset);
			apiRange.setEnd(range.endContainer, range.endOffset);

			PubSub.pub('aloha.link.insert', {range: apiRange});
			this.hrefChange();
		},

		/**
		 * Remove an a tag and clear the current item from the hrefField
		 */
		removeLink: function ( terminateLinkScope ) {
			var	range = Aloha.Selection.getRangeObject(),
				foundMarkup = this.findLinkMarkup();
			var linkText;

			// clear the current item from the href field
			this.hrefField.setItem(null);
			if (this.anchorLinks) {
				this.anchorField.clear();
			}

			if ( foundMarkup ) {
				linkText = jQuery(foundMarkup).text();
				// remove the link
				Dom.removeFromDOM( foundMarkup, range, true );

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
			}
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
			var hrefTargetObject = jQuery(this.hrefField.getTargetObject());
			var setAutoValues = hrefTargetObject && !hrefTargetObject.attr('data-ignore-auto-values');
			var that = this;

			// No need to check setAutoValues here, since the title will not be
			// changed anyway once a custom title has been set.
			this.automaticallySetTitle(
				this.hrefField,
				this.title,
				this.titleregex
			);

			// For now hard coded attribute handling with regex.
			// Avoid creating the target attribute, if it's unnecessary, so
			// that XSS scanners (AntiSamy) don't complain.
			if (setAutoValues && this.target) {
				this.hrefField.setAttribute(
					'target',
					this.target,
					this.targetregex,
					this.hrefField.getValue()
				);
			}

			if (setAutoValues && null != this.cssclassregex) {
				this.hrefField.setAttribute(
					'class',
					this.cssclass,
					this.cssclassregex,
					this.hrefField.getValue()
				);
			}

			var href = that.hrefField.getValue(true);
			var element = that.hrefField.getTargetObject();

			Aloha.trigger('aloha-link-href-change', {
				 href: href,
				 obj: element,
				 item: that.hrefField.getItem()
			});

			PubSub.pub('aloha.link.changed', {
				href: href,
				element: element,
				input: that.hrefField.getInputElem()
			});

			if ( typeof this.onHrefChange == 'function' ) {
				this.onHrefChange.call(
					this,
					this.hrefField.getTargetObject(),
					href,
					this.hrefField.getItem()
				);
			}

			var hrefFieldItem = this.hrefField.getItem();
			// If href has been set to an item (Page)
			if (hrefFieldItem && hrefFieldItem.language) {
				var languageName = getLanguageName(hrefFieldItem.language);

				this.hrefField.setAttribute('hreflang', hrefFieldItem.language);
				hrefLangField.setValue(languageName);
				hrefLangField.disableInput();
			}
			// href is an external link
			else if (EXTERNAL_LINK_REG_EXP.test(href)){
				hrefLangField.enableInput();
			}
			// href is being defined
			else {
				hrefLangField.setValue('');
				this.hrefField.setAttribute('hreflang', '');
				hrefLangField.disableInput();
			}

			Aloha.Sidebar.right.checkActivePanels(Aloha.Selection.getRangeObject());

			// fill all info fields
			if (jQuery.isArray(that.settings.sidebar)) {
				jQuery.each(that.settings.sidebar, function () {
					if (hrefFieldItem && hrefFieldItem.hasOwnProperty(this.attr)) {
						jQuery(that.nsSel(this.attr)).text(hrefFieldItem[this.attr]);
					} else {
						jQuery(that.nsSel(this.attr)).text("");
					}
				});
			}
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
				that.hrefField.setTargetObject(foundMarkup, 'href');
				addAdditionalTargetObject(rangeObject, that.hrefField);
				that.stripAnchor();
				that.hrefChange();
				foundMarkup.removeAttr('data-ignore-auto-values');

				// if the selection-changed event was raised by the first click interaction on this page
				// the hrefField component might not be initialized. When the user switches to the link
				// tab to edit the link the field would be empty. We check for that situation and add a
				// special interval check to set the value once again
				if (jQuery('#' + that.hrefField.getInputId()).length == 0) {
					// there must only be one update interval running at the same time
					if (that.hrefUpdateInt !== null) {
						clearInterval(that.hrefUpdateInt);
					}

					// register a timeout that will set the value as soon as the href field was initialized
					that.hrefUpdateInt = setInterval( function () {
						if (jQuery( '#' + that.hrefField.getInputId()).length > 0) { // the object was finally created
							that.prepareAnchor(foundMarkup.attr('href'));
							that.hrefField.setTargetObject(foundMarkup, 'href');
							that.stripAnchor();
							that.hrefChange();

							clearInterval(that.hrefUpdateInt);
						}
					}, 200);
				}
				Aloha.trigger('aloha-link-selected');
				enteredLinkScope = true;

				PubSub.pub('aloha.link.selected', {
					input: that.hrefField.getInputElem(),
					href: that.hrefField.getTargetObject().attr('href'),
					element: that.hrefField.getTargetObject()
				});
			} else {
				that.toggleLinkScope(false);
				that.hrefField.setTargetObject(null);
				Aloha.trigger('aloha-link-unselected');
			}
		} else {
			that.toggleLinkScope(false);
		}

		that.ignoreNextSelectionChangedEvent = false;
		return enteredLinkScope ? foundMarkup : false;
	}
} );
