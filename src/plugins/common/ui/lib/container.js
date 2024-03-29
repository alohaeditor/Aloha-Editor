/**
 * Defines a `Container` Class.
 *
 * Containers are activated based on the `showOn` setting for the container.
 * The values are normalized to functions which accept an element and return a
 * boolean; true means the container should be shown.
 *
 * For efficiency, we group all containers that have the same normalized
 * `showOn()' function together, so we can evaluate it once, regardless of how
 * many containers are using the same logic. In order for this to work, the
 * exact same function must be returned from `Container.normalizeShowOn()' when
 * the logic is the same.
 *
 * The list of containers is then stored on the context instance as
 * `context.containers', which is a hash of `showOn()' ids to an array of
 * containers. The `showOn()' ids are unique identifiers that are stored as
 * properties of the `showOn()' function (see `getShowOnId()'). This gives us
 * constant lookup times when grouping containers.
 */

define([
	'jquery',
	'util/class',
	'ui/utils'
], function (
	$,
	Class,
	Utils
) {
	'use strict';

	var uid = 0;

	/**
	 * Gets the id of a normalized showOn option.  If the given function has
	 * not had its showOnId set it will receive one, the first time this
	 * function it is passed to this function.
	 *
	 * @param {function} showOn The function whose id we wish to get.
	 * @return {number} The id of the given function.
	 */
	function getShowOnId(showOn) {
		// Store a unique id on the showOn function.
		// See full explanation at top of file.
		if (!showOn.showOnId) {
			showOn.showOnId = ++uid;
		}
		return showOn.showOnId;
	}

	/**
	 * Show or hide a set of containers.
	 *
	 * @param {Array.<Container>} containers The set of containers to operate
	 *                                       on.
	 * @param {boolean} show Whether to show or hide the given containers.
	 */
	function toggleContainers(containers, show) {
		var action = show ? 'show' : 'hide',
		    i;
		for (i = 0; i < containers.length; i++) {
			containers[i][action]();
		}
	}

	var returnTrue = function () {
		return true;
	};

	/**
	 * Normalizes a showOn option into a function.
	 *
	 * @param {(string|boolean|function)} showOn
	 * @return function
	 */
	function normalizeShowOn(container, showOn) {
		switch ($.type(showOn)) {
		case 'function':
			return showOn;
		case 'object':
			if (!showOn.scope) {
				throw "Invalid showOn configuration";
			}

			return Utils.normalizeScopeToFunction(showOn.scope);			
		default:
			return returnTrue;
		}
	}

	/**
	 * Container class.
	 *
	 * @class
	 * @base
	 */
	var Container = Class.extend({

		_contextContainerKey: null,

		/**
		 * The containing (wrapper) element for this container.
		 *
		 * @type {jQuery<HTMLElement>}
		 */
		element: null,

		/**
		 * Initialize a new container with the specified properties.
		 *
		 * @param {object=} settings Optional properties, and override methods.
		 * @constructor
		 */
		_constructor: function (context, settings) {
			var showOn = normalizeShowOn(this, settings.showOn);
			this._contextContainerKey = getShowOnId(showOn);
			var group = context.containers[this._contextContainerKey];
			this.context = context;

			if (!group) {
				group = context.containers[this._contextContainerKey] = {
					shouldShow: showOn,
					containers: []
				};
			}
			group.containers.push(this);
		},

		/**
		 * Must be implemented by extending classes.
		 *
		 * @ingroup api
		 * @{
		 */

		/**
		 * A container is also a component; this is part of the component API.
		 */
		show: function () {},
		/**
		 * A container is also a component; this is part of the component API.
		 */
		hide: function () {},
		/**
		 * A container is also a component; this is part of the component API.
		 */
		focus: function () {},
		/**
		 * A container is also a component; this is part of the component API.
		 */
		foreground: function () {},

		/**
		 * The container was previously hidden, and now has become visible. This
		 * allows a container to let its children react to this.
		 */
		childVisible: function (childComponent, visible) {},
		/**
		 * The container was given focus; this method must give focus to all
		 * children of the container.
		 * Optional. (E.g. tab.js doesn't implement this.)
		 */
		childFocus: function (childComponent) {},
		/**
		 * The container was foregrounded; this method must foreground all children
		 * of the container.
		 */
		childForeground: function (childComponent) {},

		/**
		 * @} End of "ingroup api".
		 */

		destroy: function() {
			if (this._contextContainerKey) {
				delete this.context.containers[this._contextContainerKey];
				this._contextContainerKey = null;
			}
		},
	});

	// static fields

	$.extend( Container, {
		/**
		 * Given an array of elements, show appropriate containers.
		 *
		 * @param {object} context
		 * @param {string} eventType Type of the event triggered (optional)
		 * @static
		 */
		showContainersForContext: function (context, eventType) {
			var group,
			    groupKey,
			    containerGroups;
			if (!context.containers) {
				// No containers were constructed for the given context, so
				// there is nothing for us to do.
				return;
			}
			containerGroups = context.containers;
			for (groupKey in containerGroups) {
				if (containerGroups.hasOwnProperty(groupKey)) {
					group = containerGroups[groupKey];
					toggleContainers(group.containers, group.shouldShow(eventType));
				}
			}
		}
	});

	return Container;
});
