define([
	'jquery',
	'aloha/core',
	'ui/surface',
	'ui/tab',
	'ui/floating',
	'ui/scopes',
	'ui/dynamicUi',
	'i18n!ui/nls/i18n',
	'jqueryui'
], function (
	$,
	Aloha,
	Surface,
	Tab,
	floating,
	Scopes,
	DynamicUi,
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
		_context: null,
		_moveTimeout: null,
		_repositionTimeout: null,
		$_container: null,
		_tabBySlot: null,
		_tabs: [],
		_tabSettings: null,
		_adoptedComponents: {},
		_activeResponive: 'desktop',
		$_inactiveContainer: null,

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
			this._super(context);
			this._context = context;
			this.$element = $('<div>', { class: 'aloha-ui aloha-ui-toolbar', unselectable: 'on' });
			this.$_inactiveContainer = $('<div>', {
				class: 'aloha-ui aloha-ui-toolbar-inactive-components',
				unselectable: 'on',
			}).hide();

			var _this = this;

			$(function() {
				_this.$_inactiveContainer.appendTo(window.document.body);
			});

			this._tabBySlot = {};
			this._isResponsiveMode = responsiveMode;
			this._tabSettings = tabs;

			var initialSetup = true;

			function handleMedia(query, target) {
				var media = window.matchMedia(query);
				media.onchange = function(change) {
					if (change.matches) {
						_this._activeResponive = target;
						_this._setupTabs(false);
					}
				};
				if (media.matches) {
					_this._activeResponive = target;
					_this._setupTabs(initialSetup);
				}
				initialSetup = false;
			}

			// TODO: Define the breakpoints somewhere static
			handleMedia('(max-width: 400px)', 'mobile');
			handleMedia('(min-width: 401px) and (max-width: 1024px)', 'tablet');
			handleMedia('(min-width: 1025px)', 'desktop');
			
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

		_setupTabs: function (initialSetup) {
			var _this = this;
			var tmpSlots = {};

			// Destroy all old tabs
			this._tabs.forEach(function(tabData) {
				if (!initialSetup) {
					// The tab itself is going to be destroyed, but the components inside of it need to persist.
					// Therefore, we move them into the inactive-container before deletion/removal.
					Object.entries(tabData.tab._componentBySlot).forEach(function(entry) {
						tmpSlots[entry[0]] = entry[1];

						var $inactiveComponentContainer = _this.$_inactiveContainer.find('[data-slot="' + entry[0] + '"');
						if ($inactiveComponentContainer.length < 1) {
							$inactiveComponentContainer = $('<div>', {
								attr: {
									'data-slot': entry[0],
								},
							})
								.append(entry[1].element)
								.appendTo(_this.$_inactiveContainer);
						} else {
							$inactiveComponentContainer.children().remove();
							$inactiveComponentContainer.append(entry[1].element);
						}
					});
				}

				tabData.tab.destroy();
			});

			// Re-create the container to get rid of the old stuff
			if (this.$_container != null) {
				this.$_container.tabs('destroy');
				this.$_container.remove();
			}
			this.$_container = Tab.createContainer().appendTo(this.$element);

			// Clear out old settings
			this._tabs = [];
			this._tabBySlot = {};

			var activeToolbarSettings = this._tabSettings[this._activeResponive];
			var appliedSlots = [];

			// Create the tabs from the now active settings
			(activeToolbarSettings.tabs || []).forEach(function(tabSettings) {
				var tabInstance = new Tab(_this._context, {
					label: i18n.t(tabSettings.label, tabSettings.label),
					showOn: tabSettings.showOn,
					container: _this.$_container
				}, tabSettings.components);

				Object.keys(tabInstance._elemBySlot).forEach(function(slot) {
					_this._tabBySlot[slot] = tabInstance;
					appliedSlots.push(slot);
				});

				_this._tabs.push({ tab: tabInstance, settings: tabSettings });
			});

			// Here we check each slot again, if the component has been used before and was moved to
			// the inactive-container. If it is, reuse it.
			// Otherwise, if the component has been adopted, but wasn't bound yet (i.E. wasn't configured to show up yet),
			// then we adopt it from the adoptedComponents data.
			if (!initialSetup) {
				appliedSlots.forEach(function(slot) {
					var tab = _this._tabBySlot[slot];
					if (!tab) {
						return;
					}

					var component;
					if (tmpSlots[slot]) {
						component = tmpSlots[slot];
						delete tmpSlots[slot];
					} else if (_this._adoptedComponents[slot]) {
						component = _this._adoptedComponents[slot];
					}

					if (component) {
						tab.adoptInto(slot, component);
					}
				});
			}

			this._primaryScopeForegroundTab();
		},

		_primaryScopeForegroundTab: function() {
			var primaryScope = Scopes.getPrimaryScope(),
				settings,
				i;

			for (i = 0; i < this._tabs.length; i++) {
				settings = this._tabs[i].settings;
				if (
					'object' === $.type(settings.showOn)
					&& settings.showOn.scope === primaryScope
					&& this._tabs[i].tab.hasVisibleComponents()
				) {
					this._tabs[i].tab.foreground();
					break;
				}
			}
		},

		adoptInto: function (slot, component) {
			this._adoptedComponents[slot] = component;
			var tab = this._tabBySlot[slot];
			return tab && tab.adoptInto(slot, component);
		},

		unadopt: function(slot) {
			delete this._adoptedComponents[slot];
			var tab = this._tabBySlot[slot];
			delete this._tabBySlot[slot];
			if (tab) {
				tab.unadopt(slot);
			}
		},

		getActiveContainer: function () {
			return this.$_container.data('aloha-active-container');
		},

		getContainers: function () {
			return this.$_container.data('aloha-tabs');
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

		openDynamicDropdown: function(componentName, config) {
			return DynamicUi.openDynamicDropdown(componentName, config);
		},
		openDynamicModal: function(config) {
			return DynamicUi.openDynamicModal(config);
		},

		/**
		 * Sets the width of the toolbar to match the Editable. On small screens, full width is used.
		 */
		setWidth: function () {
			if (this._isResponsiveMode && Aloha.activeEditable) {
				var windowMinWidth = 600;
				var editableWidth = parseInt(Aloha.activeEditable.obj.css("width"));
				var width = (window.innerWidth < windowMinWidth) ? '100%' : editableWidth + 'px';
				this.$element.css('width', width);
			}
		},

		/**
		 * Recalculates the width and position of the toolbar. Should be called when the window is resized.
		 */
		reposition: function () {
			var toolbar = this;
			if (toolbar._repositionTimeout) {
				window.clearTimeout(toolbar._repositionTimeout);
			}
			toolbar._repositionTimeout = setTimeout(function () {
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
