define([
	'aloha/core',
	'jquery',
	'ui/container',
	'ui/component',
	'PubSub',
	'aloha/jquery-ui'
], function (
	Aloha,
	jQuery,
	Container,
	Component,
	PubSub
) {
	'use strict';

	var idCounter = 0;

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

		components: {},

		/**
		 * All that this constructor does is save the components array into a
		 * local variable, to be used during instantialization.
		 *
		 * @param {object} settings
		 * @param {Array.<Array<string>>} components
		 * @constructor
		 */
		_constructor: function (settings, components) {
			var thisTab = this;
			this._super(settings, components);

			this.container = settings.container;
			this.list = this.container.data('list');
			this.panels = this.container.data('panels');
			this.id = 'tab-ui-container-' + (++idCounter);
			this.panel = jQuery('<div>', {id : this.id});
			this.handle = jQuery('<li><a href="#' + this.id + '">' +
				settings.label + '</a></li>');

			var i;
			var j;
			var component;
			var groupedComponents;
			var componentsByName = {};
			var group;
			var componentName;

			this.components = {};

			for (i = 0; i < components.length; i++) {
				if (typeof components[i] === 'string') {
					if (1 === components[i].length && components[i].charCodeAt(0) === 10) {
						this.panel.append('<div>');
					} else {
						componentName = components[i];	
						component = Component.render(thisTab.context, componentName);
						if (component) {
							component._container = this;
							this.storeComponent(component);
							this.panel.append(component.element);
							componentsByName[componentName] = component;
						}
					}
				} else {
					group = jQuery('<div>', {
						'class': 'aloha-ui-component-group'
					}).appendTo(this.panel);

					groupedComponents = components[i];
					for (j = 0; j < groupedComponents.length; j++) {
						if (1 === groupedComponents[j].length &&
						    groupedComponents[j].charCodeAt(0) === 10) {
							group.append('<div>');
						} else {
							componentName = groupedComponents[j];
							component = Component.render(thisTab.context, componentName);
							if (component) {
								component._container = this;
								this.storeComponent(component);
								group.append(component.element);
								componentsByName[componentName] = component;
							}
						}
					}
				}
			}

			this.panel.append('<div class="aloha-ui-clear">');

			function selectTab() {
				thisTab.container.tabs('select', thisTab.index);
				PubSub.pub('aloha.ui.container.activated', {data:thisTab});
			}

			PubSub.sub('aloha.ui.component.focus', function(message){
				var componentName = message.data;
				var component = componentsByName[componentName];
				if (component) {
					selectTab();
				}
			});

			this.handle.appendTo(this.list);
			this.panel.appendTo(this.panels);
			this.container.tabs('refresh');

			var alohaTabs = settings.container.data('aloha-tabs');
			this.index = alohaTabs.length;
			alohaTabs.push(this);
		},

		storeComponent: function (component) {
			if (!this.components[component.type]) {
				this.components[component.type] = [];
			}
			this.components[component.type].push(component);
		},

		/**
		 * @override
		 */
		show: function() {
			if ( 0 === this.list.children().length ) {
				return;
			}
			this.handle.show();
			this.visible = true;

			// If no tabs are selected, then select the tab which was just
			// shown.
			if ( 0 === this.container.find( '.ui-tabs-active' ).length ) {
				this.container.tabs( 'select', this.index );
			} else if ( this.container.tabs( 'option', 'selected' )
			            === this.index ) {
				this.container.tabs( 'select', this.index );
			}
		},

		/**
		 * @override
		 */
		hide: function() {
			var tabs = this.list.children();
			if ( 0 === tabs.length ) {
				return;
			}
			this.handle.hide();
			this.visible = false;

			// If the tab we just hid was the selected tab, then we need to
			// select another tab in its stead.  We will select the first
			// visible tab we find, or else we deselect all tabs.
			if ( this.index === this.container.tabs( 'option', 'selected' ) ) {
				tabs = this.container.data( 'aloha-tabs' );

				var i;
				for ( i = 0; i < tabs.length; ++i ) {
					if ( tabs[ i ].visible ) {
						this.container.tabs( 'select', i );
						return;
					}
				}

				// This does not work...
				// this.container.tabs( 'select', -1 );

				this.handle.removeClass( 'ui-tabs-active' );
			}
		}

	});

	jQuery.extend(Tab, {

		/**
		 * Creates holding elements for jQuery UI Tabs for a surface.
		 *
		 * @static
		 * @return {jQuery.<HTMLElement>} The holder container on which we
		 *                                invoke jQuery UI Tabs once it is
		 *                                populated with tab containers.
		 */
		createContainer: function () {
			var $container = jQuery('<div>');
			var $list = jQuery('<ul>').appendTo($container);
			var $panels = jQuery('<div>').appendTo($container);

			$container
				.data('list', $list)
				.data('panels', $panels)
				.data('aloha-tabs', [])
				.tabs({
					select: function (event, ui) {
						var tabs = $container.data('aloha-tabs');
						$container.data('aloha-active-container', tabs[ui.index]);
						PubSub.pub('aloha.ui.container.selected', {data: tabs[ui.index]});
					}
				});

			return $container;
		}
	});

	// Hide any groups that have no visible buttons
	PubSub.sub('aloha.ui.container.selected', function (message) {
		setTimeout(function () {
			message.data.container.find('.aloha-ui-component-group').each(function () {
				jQuery(this).removeClass('aloha-ui-hidden');
				if (0 === jQuery(this).find('button.ui-button:visible, input.ui-autocomplete-input:visible').length) {
					jQuery(this).addClass('aloha-ui-hidden');
				}
			});
		}, 1);
	});

	return Tab;
});
