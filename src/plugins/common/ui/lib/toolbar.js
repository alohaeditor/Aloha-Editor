define([
	'jquery',
	'aloha/core',
	'ui/surface',
	'ui/tab',
	'ui/subguarded',
	'ui/floating',
	'PubSub',
	'vendor/jquery.store',
	'aloha/jquery-ui'
], function (
	$,
	Aloha,
	Surface,
	Tab,
	subguarded,
	floating,
	PubSub,
	Store
) {
	'use strict';

	var store = new Store();

	function storePinPosition(offset) {
		store.set('Aloha.FloatingMenu.pinned', 'true');
		store.set('Aloha.FloatingMenu.top', offset.top);
		store.set('Aloha.FloatingMenu.left', offset.left);
	}

	function unstorePinPosition() {
		store.del('Aloha.FloatingMenu.pinned');
		store.del('Aloha.FloatingMenu.top');
		store.del('Aloha.FloatingMenu.left');
	}

	function forcePositionIntoWindow(position) {
		var $window = $(window);
		var left = position.left;
		var top = position.top;

		if (top < 0) {
			top = 0;
		} else if (top > $window.height()) {
			top = $window.height() / 2;
		}

		if (left < 0) {
			left = 0;
		} else if (left > $window.width()) {
			left = $window.width() / 2;
		}

		return {
			top: top,
			left: left
		};
	}

	/**
	 * The toolbar is configured via `settings.toolbar` and is defined as an
	 * array of tabs with component groups, where the groups are arrays of
	 * controls.
	 *
	 * There are separate components for each editable, but only the components
	 * for the active editable are shown.
	 *
	 * As a container for tabs, the toolbar serves to group together groups of
	 * control components so that they can be shown and hidden together in
	 * their feature/functional set.  For exmaple groups of table controls
	 * would be placed in a table tab, groups of list controls in an image tab,
	 * and so forth.
	 *
	 * Toolbar class and manager
	 *
	 * @class
	 * @extends {Surface}
	 */
	var Toolbar = Surface.extend({

		/**
		 * Whether this is a floating surface or not.
		 * @type {boolean}
		 */
		isFloatingSurface: false,

		_tabs: [],

		$_container: null,

		/**
		 * Toolbar constructor.
		 *
		 * @param {Aloha.Editable} editable
		 * @constructor
		 * @override
		 */
		_constructor: function (editable) {
			this._super(editable);

			// All containers are rendered in a div specific to the editable to
			// make it easy to show and hide the toolbar containers on
			// activate/deactivate.  The editable instance gets a reference to
			// this div.

			this.$element = $('<div>', {'class': 'aloha-ui-toolbar'});

			this.$_container = Tab.createContainer().appendTo(this.$element);

			var settings;
			var tabs = editable.settings.toolbar;
			var i;
			for (i = 0; i < tabs.length; i++) {
				settings = tabs[i];
				this._tabs.push(new Tab({
					label: settings.label || '',
					showOn: settings.showOn,
					editable: editable,
					container: this.$_container
				}, settings.components));
			}

			this.initializeFloating();
		},

		getActiveContainer: function () {
			return this.$_container.data('aloha-active-container');
		},

		getContainers: function () {
			return this.$_container.data('aloha-tabs');
		},

		_move: function (duration) {
			// We need to order the invocation of the floating animation to
			// occur after a sequence point so that the element's height will
			// be correct.
			var that = this;
			setTimeout(function () {
				if (Aloha.activeEditable && Toolbar.isFloatingMode) {
					that.$element.stop();
					floating.floatSurface(that, Aloha.activeEditable, duration,
						function (position) {
							Toolbar.setFloatingPosition(position);
						});
				}
			}, 1);
		},

		/**
		 * Pinning behaviour is global in that if one toolbar is pinned, then
		 * all other toolbars will be pinned to that position.
		 */
		initializeFloating: function () {
			this.isFloatingSurface = true;

			var surface = this;

			subguarded([
				'aloha-selection-changed',
				'aloha.ui.container.selected'
			], Surface.onActivatedSurface, this, function () {
				surface._move();
			});

			$(window).scroll(function () {
				// TODO: only do this for active surfaces.
				surface._move(0);
			});

			this.addPin();

			if (Toolbar.isFloatingMode) {
				this.$element.css('position', 'fixed');
			} else {
				var position = forcePositionIntoWindow({
					top: Toolbar.pinTop,
					left: Toolbar.pinLeft
				});

				Toolbar.setFloatingPosition(position);

				this.$element.css({
					'position': 'fixed',
					'top': position.top,
					'left': position.left
				});
			}

			this.$element.css('z-index', 10100).draggable({
				'distance': 20,
				'stop': function (event, ui) {
					Toolbar.setFloatingPosition(ui.position);
					if (!Toolbar.isFloatingMode) {
						storePinPosition(ui.position);
					}
				}
			});

			// Resizable toolbars are possible, and would be a nice feature.
			//this.$element.resizable();
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
					unstorePinPosition();
				} else {
					position = surface.$element.offset();
					position.top -= $(window).scrollTop();
					storePinPosition(position);
				}

				Toolbar.setFloatingPosition(position);

				floating.togglePinSurfaces(Toolbar.instances, position,
					Toolbar.isFloatingMode);
			});
		},

		/**
		 * Shows the toolbar.
		 */
		show: function () {
			Toolbar.$surfaceContainer.children().detach();
			Toolbar.$surfaceContainer.append(this.$element);
			Toolbar.$surfaceContainer.stop().fadeTo(200, 1);

			var position = Toolbar.getFloatingPosition();

			this.$element.stop().css({
				top: position.top,
				left: position.left
			});

			this._move();
		},

		/**
		 * Hides the toolbar.
		 */
		hide: function () {
			Toolbar.$surfaceContainer.stop().fadeOut(200, function () {
				Toolbar.$surfaceContainer.children().detach();
			});
		}
	});

	$.extend(Toolbar, {

		/**
		 * A set of all toolbar instances.
		 * @type {Toolbar}
		 */
		instances: [],

		/**
		 * An element on which all toolbar surfaces are to be rendered on the
		 * page.
		 * @type {$.<HTMLElement>}
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
			Toolbar.$surfaceContainer = $('<div>', {
				'class': 'aloha aloha-surface aloha-toolbar'
			}).hide().appendTo('body');

			Surface.trackRange(Toolbar.$surfaceContainer);

			if (store.get('Aloha.FloatingMenu.pinned') === 'true') {
				Toolbar.pinTop = parseInt(store.get('Aloha.FloatingMenu.top'), 10);
				Toolbar.pinLeft = parseInt(store.get('Aloha.FloatingMenu.left'), 10);
				Toolbar.isFloatingMode = false;
			} else {
				Toolbar.isFloatingMode = true;
			}
		},

		/**
		 * Creates a toolbar for an editable.
		 *
		 * @param {Aloha.Editable} editable
		 * @returns {Toolbar}
		 */
		createSurface: function (editable) {
			if (editable.settings.toolbar &&
			    editable.settings.toolbar.length) {
				var surface =  new Toolbar(editable);

				if (!editable.toolbars) {
					editable.toolbars = [];
				}
				editable.toolbars.push(surface.$element);

				Toolbar.instances.push(surface);

				return surface;
			}

			return null;
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
	Surface.registerType(Toolbar);

	return Toolbar;
});
