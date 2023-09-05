define([
	'jquery',
	'aloha/core',
	'ui/surface',
	'ui/tab',
	'ui/floating',
	'ui/context',
	'i18n!ui/nls/i18n',
	'jqueryui'
], function (
	$,
	Aloha,
	Surface,
	Tab,
	floating,
	Context,
	i18n
) {
	'use strict';

	function isFloatingEnabled() {
		return !Aloha.settings
			|| !Aloha.settings.toolbar
			|| Aloha.settings.toolbar.floating !== false;
	}

	/**
	 * The toolbar is configured via `settings.toolbar` and is defined as an
	 * array of tabs with component groups, where the groups are arrays of
	 * controls.
	 *
	 * There are separate components for each context, but only the components
	 * for the active context are shown.
	 *
	 * As a container for tabs, the toolbar serves to group together groups of
	 * control components so that they can be shown and hidden together in their
	 * feature/functional set.  For example groups of table controls would be
	 * placed in a table tab, groups of list controls in an image tab, and so
	 * forth.
	 *
	 * Toolbar class and manager
	 *
	 * @class
	 * @extends {Surface}
	 */
	var Toolbar = Surface.extend({
		_moveTimeout: null,
		_repositionTimeout: null,
		$_container: null,
		_tabBySlot: null,
		_tabs: [],

		/**
		 * Returns true if the "responsiveMode" setting has been set to true. Indicates
		 * that the toolbar should not float and should have certain behaviour
		 * modified in order to work better on mobile devices.
		 * @type {boolean}
		 */
		_isResponsiveMode: false,

		/**
		 * Toolbar constructor.
		 *
		 * @param context
		 * @param {!Array.<(Object|Array|string)>} tabs
		 * @param {boolean} responsiveMode
		 * @constructor
		 * @override
		 */
		_constructor: function (context, tabs, responsiveMode) {
			var tabSettings,
			    tabInstance,
			    i,
			    key;
			this._super(context);
			this.$element = $('<div>', {'class': 'aloha-ui aloha-ui-toolbar', 'unselectable': 'on'});
			this.$_container = Tab.createContainer().appendTo(this.$element);
			this._tabBySlot = {};
			this._isResponsiveMode = responsiveMode;

			for (i = 0; i < tabs.length; i++) {
				tabSettings = tabs[i];
				tabInstance = new Tab(context, {
					label: i18n.t(tabSettings.label, tabSettings.label),
					showOn: tabSettings.showOn,
					container: this.$_container
				}, tabSettings.components);
				for (key in tabInstance._elemBySlot) {
					if (tabInstance._elemBySlot.hasOwnProperty(key)) {
						this._tabBySlot[key] = tabInstance;
					}
				}
				this._tabs.push({tab: tabInstance, settings: tabSettings});
			}

			// Pinning behaviour is global in that if one toolbar is pinned,
			// then all other toolbars will be pinned to that position.
			if (isFloatingEnabled()) {
				var positionStyle = this._isResponsiveMode ? 'absolute' : undefined;
				floating.makeFloating(this, Toolbar, positionStyle);
			}

			if (this._isResponsiveMode) {
				this.$element.addClass('responsive');
			}
		},

		adoptInto: function (slot, component) {
			var tab = this._tabBySlot[slot];
			return tab && tab.adoptInto(slot, component);
		},

		getActiveContainer: function () {
			return this.$_container.data('alohaActiveContainer');
		},

		getContainers: function () {
			return this.$_container.data('alohaTabs');
		},

		/**
		 * Moves the toolbar into the optimal position near the active editable.
		 *
		 * @param {number} duration The length of time the moving animation
		 *                          should run.
		 */
		_move: function (duration) {
			// We need to order the invocation of the floating animation to
			// occur after the the height of the toolbar's DOM has been
			// caluclated.
			var toolbar = this;
			if (toolbar._moveTimeout) {
				window.clearTimeout(toolbar._moveTimeout);
			}
			toolbar._moveTimeout = window.setTimeout(function () {
				toolbar._moveTimeout = null;
				if (Aloha.activeEditable) {
					if (toolbar._isResponsiveMode) {
						floating.floatSurface(
							toolbar,
							Aloha.activeEditable,
							false
						);
					} else if (Toolbar.isFloatingMode) {
						floating.floatSurface(
							toolbar,
							Aloha.activeEditable,
							duration,
							Toolbar.setFloatingPosition
						);
					}
				}
				// 20ms should be small enough to appear instantaneous to the
				// user but large enough to avoid doing unnecessary work when
				// the selection changes multiple times within a short time
				// frame.
			}, 20);
		},

		addPin: function () {
			var $pin = $('<div class="aloha-ui-pin">');
			var $element = this.$element;
			$element.find('.ui-tabs').append($pin);
			$element.find('.ui-tabs').hover(function () {
				$element.addClass('aloha-ui-hover');
			}, function () {
				$element.removeClass('aloha-ui-hover');
			});

			if (!Toolbar.isFloatingMode) {
				$pin.addClass('aloha-ui-pin-down');
			}

			var surface = this;

			$pin.click(function () {
				Toolbar.isFloatingMode = !Toolbar.isFloatingMode;
				var position;

				if (Toolbar.isFloatingMode) {
					position = {
						top: Toolbar.pinTop,
						left: Toolbar.pinLeft
					};
				} else {
					position = surface.$element.offset();
					position.top -= $(window).scrollTop();
				}

				Toolbar.setFloatingPosition(position);
				floating.togglePinSurface(surface, position, Toolbar.isFloatingMode);
			});
		},

		/**
		 * Shows the toolbar.
		 */
		show: function () {
			Toolbar.$surfaceContainer.children().detach();
			Toolbar.$surfaceContainer.append(this.$element);
			Toolbar.$surfaceContainer.stop().fadeTo(200, 1);
			if (isFloatingEnabled()) {
				var position = Toolbar.getFloatingPosition();
				this.$element.stop().css({
					top: position.top,
					left: position.left
				});
				this._move();
			}
		},

		/**
		 * Hides the toolbar.
		 */
		hide: function () {
			Toolbar.$surfaceContainer.stop().fadeOut(200, function () {
				Toolbar.$surfaceContainer.children().detach();
			});
			if (this._isResponsiveMode) {
				floating.removeResponsiveStyles();
			}
		},

		/**
		 * Sets the width of the toolbar to match the Editable. On small screens, full width is used.
		 */
		setWidth: function() {
			if (this._isResponsiveMode && Aloha.activeEditable) {
				var windowMinWidth = 600;
				var editableWidth = parseInt(Aloha.activeEditable.obj.width());
				var width = (window.innerWidth < windowMinWidth) ? '100%' : editableWidth + 'px';
				this.$element.css('width', width);
			}
		},

		/**
		 * Recalculates the width and position of the toolbar. Should be called when the window is resized.
		 */
		reposition: function() {
			var toolbar = this;
			if (toolbar._repositionTimeout) {
				window.clearTimeout(toolbar._repositionTimeout);
			}
			toolbar._repositionTimeout = setTimeout(function() {
				toolbar._repositionTimeout = null;
				toolbar.setWidth();
				toolbar._move();
			}, 20);
		}
	});

	$.extend(Toolbar, {

		/**
		 * An element on which all toolbar surfaces are to be rendered on the
		 * page.
		 * @type {jQuery.<HTMLElement>}
		 */
		$surfaceContainer: null,

		/**
		 * Whether or not floating toolbar surfaces should be pinned.
		 * @type {boolean}
		 */
		isFloatingMode: true,

		/**
		 * Left position of pinned toolbars.
		 * @type {number}
		 */
		pinLeft: 0,

		/**
		 * Top position of pinned toolbars.
		 * @type {number}
		 */
		pinTop: 0,

		/**
		 * Initializes the toolbar manager.  Adds the surface container
		 * element, and sets up floating behaviour settings.
		 */
		init: function () {
			// TODO should use context.js to get the context element
			Toolbar.$surfaceContainer = $('<div>', {
				'class': 'aloha aloha-surface aloha-toolbar',
				'unselectable': 'on'
			}).hide();

			// In the built aloha.js, init will happend before the body has
			// finished loading, so we have to defer appending the element.
			$(function () {
				Toolbar.$surfaceContainer.appendTo('body');
			});
			Surface.trackRange(Toolbar.$surfaceContainer);
			var pinState = floating.getPinState();
			Toolbar.pinTop = pinState.top;
			Toolbar.pinLeft = pinState.left;
			Toolbar.isFloatingMode = !pinState.isPinned;
		},

		setFloatingPosition: function (position) {
			Toolbar.pinTop = position.top;
			Toolbar.pinLeft = position.left;
		},

		getFloatingPosition: function () {
			return {
				top: Toolbar.pinTop,
				left: Toolbar.pinLeft
			};
		}
	});

	Toolbar.init();

	return Toolbar;
});
