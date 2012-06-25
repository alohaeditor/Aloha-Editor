define([
	'jquery',
	'ui/surface',
	'ui/tab',
	'ui/subguarded',
	'ui/floating',
	'vendor/jquery.store',
	'aloha/jquery-ui'
],
function (jQuery, Surface, Tab, subguarded, floating, Store) {
	var store = new Store;

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

	function forcePositionIntoWindow(position, $element) {
		var $window = jQuery(window);
		var left = position.left;
		var top = position.top - $window.scrollTop();

		if (top + $element.height() < 0) {
			top = 0;
		} else if (top > $window.height()) {
			top = $window.height() - $element.height();
		}

		if (left + $element.width() < 0) {
			left = 0;
		} else if (left > $window.width()) {
			left = jQuery.width() - $element.width();
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

			this.$element = jQuery('<div>', {'class': 'aloha-ui-toolbar'});

			var settings;
			var tabs = editable.settings.toolbar;
			var container = Tab.createContainer().appendTo(this.$element);
			var i;
			for (i = 0; i < tabs.length; i++) {
				settings = tabs[i];
				this._tabs.push(new Tab({
					label: settings.label || '',
					showOn: settings.showOn,
					editable: editable,
					container: container
				}, settings.components));
			}

			this.initializeFloating();
		},

		move: function () {
			if (Aloha.activeEditable && Toolbar.isFloating) {
				floating.floatSurface(this, Aloha.activeEditable,
					Toolbar.setFloatingPosition);
			}
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
				'aloha-editable-activated'
			], Surface.onActivatedSurface,
				this, function ($event, range, event) {
				//surface.move();
			});

			var isScrolling = false;
			jQuery(window).scroll(function ($event, nativeEvent) {
				// FIXME: only do this for active surfaces.
				if (!isScrolling) {
					isScrolling = true;
					setTimeout(function () {
						isScrolling = false;
						//surface.move();
					}, 50);
				}
			});

			this.addPin();

			if (Toolbar.isFloating) {
				this.$element.css('position', 'absolute');
			} else {
				var position = forcePositionIntoWindow({
					top: Toolbar.pinTop,
					left: Toolbar.pinLeft
				}, this.$element);

				this.$element.css({
					'position': 'fixed',
					'top': position.top,
					'left': position.left
				});
			}

			this.$element.css('z-index', 9999).draggable({
				'distance': 20,
				'stop': function (event, ui) {
					Toolbar.setFloatingPosition(ui.position);
					if (!Toolbar.isFloating) {
						storePinPosition(ui.position);
					}
				}
			});
		},

		addPin: function () {
			var $pin = jQuery('<div class="aloha-ui-pin">');

			this.$element.find('.ui-tabs:first').append($pin);

			if (!Toolbar.isFloating) {
				$pin.addClass('aloha-ui-pin-down');
			}

			var surface = this;

			$pin.click(function () {
				Toolbar.isFloating = !Toolbar.isFloating;

				var position;

				if (Toolbar.isFloating) {
					position = {
						top: Toolbar.pinTop,
						left: Toolbar.pinLeft
					};
					unstorePinPosition();
				} else {
					position = surface.$element.offset();
					storePinPosition(position);
				}

				Toolbar.setFloatingPosition(position);

				floating.togglePinSurfaces(Toolbar.instances, position,
					Toolbar.isFloating);
			});
		},

		/**
		 * Shows the toolbar.
		 */
		show: function () {
			var position = Toolbar.getFloatingPosition();

			this.$element.stop().css({
				top: position.top,
				left: position.left
			});

			// We hide any active controls and show this editable's controls.
			Toolbar.element.children().detach();
			Toolbar.element.append(this.$element);
			Toolbar.element.stop().fadeTo(200, 1);
		},

		/**
		 * Hides the toolbar.
		 */
		hide: function () {
			var toolbar = this;
			Toolbar.element.stop().fadeOut(200, function () {
				toolbar.$element.detach();
			});
		}
	});

	jQuery.extend(Toolbar, {

		/**
		 * A set of all toolbar instances.
		 * @type {Toolbar}
		 */
		instances: [],

		/**
		 * Whether or not floating toolbar surfaces should be pinned.
		 * @type {boolean}
		 */
		isFloating: true,

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
		 * Initializes the toolbar manager.
		 */
		init: function () {
			Toolbar.element = jQuery('<div>', {
				'class': 'aloha-surface aloha-toolbar'
			}).hide().appendTo('body');

			Surface.trackRange(Toolbar.element);

			if (store.get('Aloha.FloatingMenu.pinned') === 'true') {
				Toolbar.pinTop = parseInt(store.get('Aloha.FloatingMenu.top'), 10);
				Toolbar.pinLeft = parseInt(store.get('Aloha.FloatingMenu.left'), 10);
				Toolbar.isFloating = false;
			} else {
				Toolbar.isFloating = true;
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
