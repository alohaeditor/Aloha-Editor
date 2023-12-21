define([
	'jquery',
	'ui/container',
	'ui/utils',
	'PubSub',
	'jqueryui'
], function (
	$,
	Container,
	Utils,
	PubSub
) {
	'use strict';

	var idCounter = 0;
	var slottedComponents = {};
	var GROUP_LINE_BREAK = '\n';

	/**
	 * Defines a Container object that represents a collection of related
	 * component groups to be rendered together on the toolbar.  Tabs are
	 * organized by feature and functionality so that related controls can be
	 * brought in and out of view depending on whether they are
	 * appropriate for a given user context.
	 *
	 * Tabs can be defined declaritively in the Aloha configuration in the
	 * following manner:
	 *
	 *    Aloha.settings.toolbar: [
	 *      {
	 *         label: 'Lists',
	 *         showOn: 'ul,ol,*.parent(.aloha-editable ul,.aloha-editable ol)',
	 *         components: [ [ 'orderedList', 'unorderedList' ] ]
	 *      }
	 *    ]
	 *
	 * Alternatively, tabs can also be created imperatively in this way:
	 * new Tab( options, components ).
	 *
	 * @class
	 * @extends {Container}
	 */
	var Tab = Container.extend({

		_elemBySlot: null,
		_groupBySlot: null,
		_groupByComponent: null,
		_scopeFnBySlot: null,
		_slotInScope: null,

		/**
		 * All that this constructor does is save the components array into a
		 * local variable, to be used during instantialization.
		 *
		 * @param {object} settings
		 * @param {Array.<Array<string>>} components
		 * @constructor
		 */
		_constructor: function (context, settings, components) {
			this._elemBySlot = {};
			this._groupBySlot = {};
			this._groupByComponent = {};
			this._scopeFnBySlot = {};
			this._slotInScope = {};

			this._slotsList = [];
			this._super(context, settings);

			this.container = settings.container;
			this.list = this.container.data('list');
			this.panels = this.container.data('panels');
			this.id = 'tab-ui-container-' + (++idCounter);
			this.panel = $('<div>', { id: this.id, 'unselectable': 'on' });
			this.handle = $('<li><a href="' + location.href.replace(/#.*$/, '') + '#' + this.id + '">' +
				settings.label + '</a></li>');

			// Make sure the link is marked as representational, otherwise a click on the link will cause the CMS UI
			// to handle the click and change the edit/preview mode.
			this.handle.find('a').attr('role', 'presentation');

			this._setupComponents(components);

			this.panel.append($('<div>', { 'class': 'aloha-ui-clear', 'unselectable': 'on' }));
			this.handle.appendTo(this.list);
			this.panel.appendTo(this.panels);
			this.container.tabs('refresh');

			var alohaTabs = settings.container.data('aloha-tabs');
			this.index = alohaTabs.length;
			alohaTabs.push(this);

			var _this = this;
			PubSub.sub('aloha.ui.scope.change', function() {
				Object.keys(_this._scopeFnBySlot).forEach(function(slot) {
					if (!slottedComponents[slot] || !_this._elemBySlot[slot]) {
						return;
					}
					var $elem = $(_this._elemBySlot[slot]);
					_this._slotInScope[slot] = _this._scopeFnBySlot[slot]();

					if (_this._slotInScope[slot]) {
						$elem.removeClass('out-of-scope');
					} else {
						$elem.addClass('out-of-scope');
					}
				});

				if (_this.visible && !_this.hasVisibleComponents()) {
					_this.hide();
				}
			});
		},

		_setupComponents: function (componentGroups) {
			var _this = this;

			// Ignore invalid/empty groups
			if (!Array.isArray(componentGroups) || componentGroups.length === 0) {
				return;
			}

			// First, normalize the layout, as it might be defined as a 1 dimensional array instead of 2
			// i.E. : { components: ['foo', 'bar'] } -> { components: [ ['foo', 'bar'] ]}
			if (
				!Array.isArray(componentGroups[0])
				&& componentGroups[0] != null
				&& ((typeof componentGroups[0] === 'string') || (typeof componentGroups[0] === 'object'))
			) {
				componentGroups = [componentGroups];
			}

			componentGroups.forEach(function (components) {
				// Hide the group until the first button is adopted into it.
				var $groupContainer = $('<div>', {
					'class': 'aloha-ui-component-group aloha-ui-hidden',
					'unselectable': 'on'
				}).appendTo(_this.panel);
				var groupProps = { element: $groupContainer, visibleCounter: 0 };

				components.forEach(function (component) {
					if (typeof component === 'string') {
						component = {
							slot: component,
						};
					}

					// Ignore invalid entries
					if (typeof component !== 'object' || component == null) {
						return;
					}

					// If it's a line-break inside of a group, then insert it as such and end here
					if (component.slot === GROUP_LINE_BREAK) {
						_this.panel.append('<div>', {
							class: 'aloha-ui-group-break',
							unselectable: 'on'
						});
						return;
					}

					// Placeholder/Container where the actual component is getting mounted into
					// once it's valid
					var $container = $('<span>', {
						class: 'aloha-ui-component-slot',
						attr: {
							'data-slot': component.slot,
						},
						unselectable: 'on',
					});
					$groupContainer.append($container);

					// Register the slot and component to this tabs instance
					_this._groupBySlot[component.slot] = groupProps;
					_this._elemBySlot[component.slot] = $container;
					_this._scopeFnBySlot[component.slot] = Utils.normalizeScopeToFunction(component.scope);
				});
			});
		},

		adoptInto: function (slot, component) {
			var elem = this._elemBySlot[slot],
				group;
			if (!elem) {
				return false;
			}
			slottedComponents[slot] = component;
			component.adoptParent(this);
			elem.append(component.element);
			group = this._groupBySlot[slot];
			this._slotsList.push(slot);
			if (group) {
				this._groupByComponent[component.id] = group;
				if (component.isVisible()) {
					if (!group.visibleCounter) {
						group.element.removeClass('aloha-ui-hidden');
					}
					group.visibleCounter += 1;
				}
			}
			return true;
		},

		foreground: function () {
			this.container.tabs('option', 'active', this.index);
		},

		childForeground: function (childComponent) {
			this.foreground();
		},

		hasVisibleComponents: function () {
			var siblings = this._elemBySlot;
			var slot;
			for (slot in siblings) {
				if (siblings.hasOwnProperty(slot) && slottedComponents[slot]) {
					if (slottedComponents[slot].visible && this._slotInScope[slot]) {
						return true;
					}
				}
			}
			return false;
		},

		childVisible: function (childComponent, visible) {
			if (visible) {
				childComponent.container.show();
			} else if (!childComponent.container.hasVisibleComponents()) {
				childComponent.container.hide();
			}
			var group = this._groupByComponent[childComponent.id];
			if (!group) {
				return;
			}
			if (visible) {
				if (0 === group.visibleCounter) {
					group.element.removeClass('aloha-ui-hidden');
				}
				group.visibleCounter += 1;
			} else {
				group.visibleCounter -= 1;
				if (0 === group.visibleCounter) {
					group.element.addClass('aloha-ui-hidden');
				}
			}
		},

		/**
		 * @override
		 */
		show: function () {
			if (!this.list.children().length || !this.hasVisibleComponents()) {
				return;
			}

			this.handle.show();
			this.visible = true;

			var activeTabs = this.container.find('.ui-tabs-active').length;

			// Hiding all tabs may hide the toolbar, so showing the
			// first tab again must also show the toolbar. While
			// hiding the toolbar, the collapsible option had to be
			// set to deselect all tabs.
			this.container.tabs('option', 'collapsible', false);
			this.container.show();

			// If no tabs are selected, then select the tab which was just shown.
			if (!activeTabs ||
				this.container.tabs('option', 'selected') === this.index) {
				this.foreground();
			}
		},

		/**
		 * @override
		 */
		hide: function () {
			var tabs = this.list.children();
			if (0 === tabs.length) {
				return;
			}
			this.handle.hide();
			this.visible = false;

			var selected = this.container.tabs('option', 'selected');

			// If the tab we just hid was the selected tab or there is no
			// selected tab, then we need to select another tab in its stead.
			// We will select the first visible tab we find, or else we
			// deselect all tabs.
			var firstVisibleTabIndex = -1;
			tabs = this.container.data('aloha-tabs');
			var i;
			for (i = 0; i < tabs.length; ++i) {
				if (tabs[i].visible) {
					firstVisibleTabIndex = i;
					break;
				}
			}

			if (selected == -1 || selected == this.index && firstVisibleTabIndex >= 0) {
				this.container.tabs('select', firstVisibleTabIndex);
			}

			if (firstVisibleTabIndex < 0) {
				// It doesn't make any sense to leave the toolbar
				// visible after all tabs have been hidden. To deselect
				// all tabs we have to enable the collapsible option.
				this.container.tabs({ collapsible: true, active: false });
				this.container.hide();
			}
		}

	});

	$.extend(Tab, {

		/**
		 * Creates holding elements for jQuery UI Tabs for a surface.
		 *
		 * @static
		 * @return {jQuery.<HTMLElement>} The holder container on which we
		 *                                invoke jQuery UI Tabs once it is
		 *                                populated with tab containers.
		 */
		createContainer: function () {
			var $container = $('<div>', { 'unselectable': 'on' });
			var $list = $('<ul>', { 'unselectable': 'on' }).appendTo($container);
			var $panels = $('<div>', { 'unselectable': 'on' }).appendTo($container);

			$container
				.data('list', $list)
				.data('panels', $panels)
				.data('aloha-tabs', [])
				.tabs({
					select: function (event, ui) {
						var tabs = $container.data('aloha-tabs');
						$container.data('aloha-active-container', tabs[ui.index]);
						PubSub.pub('aloha.ui.container.selected', { data: tabs[ui.index] });
					}
				});

			return $container;
		}
	});

	return Tab;
});
