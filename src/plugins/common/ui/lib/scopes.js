define([
	'jquery',
	'PubSub',
	'util/maps'
], function (
	$,
	PubSub,
	Maps
) {
	'use strict';

	var scopes = {
		    'Aloha.empty': [],
		    'Aloha.global': ['Aloha.empty'],
		    'Aloha.continuoustext': ['Aloha.global']
	    },
	    activeScopes = [],
	    addedScopes = {},
	    scopeSetDuringSelectionChanged = false;

	function pushScopeAncestors(ancestorScopes, scope) {
		if (!scopes.hasOwnProperty(scope)) {
			return;
		}
		var parentScopes = scopes[scope];
		for (var i = 0; i < parentScopes.length; i++) {
			var parentScope = parentScopes[i];
			ancestorScopes.push(parentScope);
			pushScopeAncestors(ancestorScopes, parentScope);
		}
	}

	Aloha.bind('aloha-selection-changed-before', function () {
		scopeSetDuringSelectionChanged = false;
	});

	Aloha.bind('aloha-selection-changed-after', function (event, range, originalEvent) {
		// I don't know why we check for originalEvent != 'undefined', here is
		// the original comment:
		// "Only set the specific scope if an event was provided, which means
		// that somehow an editable was selected"
		if (typeof originalEvent !== 'undefined' && ! scopeSetDuringSelectionChanged) {
			Scopes.setScope('Aloha.continuoustext');
		}
	});

	/**
	 * @deprecated
	 *     Scopes don't provide any additional functionality since
	 *     the visibility of containers and components can be
	 *     controlled individually.
	 */
	var Scopes = {

		/**
		 * Increments the scope counter for the given scope and requestor.
		 *
		 * A counter is maintained per scope and requestor. The counter
		 * can be incremented/decremented with enterScope/leaveScope.
		 *
		 * The first increment of the counter (the increment to 1) will
		 * make the scope active (isActiveScope() returns true) and
		 * publish the aloha.ui.scope.change event. Further increments
		 * will do nothing except increment the counter, which will
		 * require more leaveScope calls to be made to leave the scope.
		 *
		 * The last decrement of the counter (the decrement to 0) will
		 * make the scope inactive (isActiveScope() returns false) and
		 * publish the aloha.ui.scope.change event. Further decrements
		 * will do nothing.
		 *
		 * @param scope
		 *        The scope to enter.
		 * @param requestor
		 *        The subsystem or plugin that requests to leave the
		 *        scope. Can be used to isolate the scope counter to a
		 *        particular subsystem, usually a plugin. If not given,
		 *        a global counter will be used instead.
		 * @deprecated
		 *     Scopes don't provide any additional functionality since
		 *     the visibility of containers and components can be
		 *     controlled individually.
		 */
		enterScope: function(scope, requestor) {
			requestor = requestor || '_globalCounter';
			var counters = addedScopes[scope];
			if (!counters) {
				counters = addedScopes[scope] =  {};
			}
			var counter = counters[requestor] || 0;
			counters[requestor] = counter + 1;
			if (!counter) {
				PubSub.pub('aloha.ui.scope.change');
			}
		},

		/**
		 * Decrements the scope counter for the given scope and requestor.
		 *
		 * @param force
		 *        True when the scope should be left even if the counter
		 *        is non-zero after decrementing it.
		 * @see enterScope()
		 * @deprecated
		 *     Scopes don't provide any additional functionality since
		 *     the visibility of containers and components can be
		 *     controlled individually.
		 */
		leaveScope: function(scope, requestor, force) {
			requestor = requestor || '_globalCounter';
			var counters = addedScopes[scope];
			if (!counters) {
				return;
			}
			var counter = counters[requestor];
			if (!counter) {
				return;
			}
			counter -= 1;
			if (counter && !force) {
				counters[requestor] = counter;
			} else {
				delete counters[requestor];
				if (Maps.isEmpty(counters)) {
					delete addedScopes[scope];
				}
				PubSub.pub('aloha.ui.scope.change');
			}
		},

		/**
		 * @deprecated
		 *     Scopes don't provide any additional functionality since
		 *     the visibility of containers and components can be
		 *     controlled individually.
		 */
		isActiveScope: function(scope){
			if (addedScopes[scope]) {
				return true;
			}
			var isActive = (-1 !== $.inArray(scope, activeScopes));
			if (isActive) {
				return true;
			}
			return false;
		},

		/**
		 * @deprecated
		 *     See setScope()
		 */
		getPrimaryScope: function() {
			return activeScopes[0];
		},

		/**
		 * @deprecated
		 *     Problem with setScope is that scopes defined by multiple plugins are exclusive to one another.
		 *     Example: table plugin and link plugin - you want to be able to set both table and link scopes.
		 *     Use enterScope and leaveScope instead.
		 */
		setScope: function(scope) {
			scopeSetDuringSelectionChanged = true;
			if (activeScopes[0] != scope) {
				activeScopes = [scope];
				pushScopeAncestors(activeScopes, scope);
				PubSub.pub('aloha.ui.scope.change');
			}
		},

		/**
		 * @deprecated
		 *     This method was used to define an ancestry for scopes.
		 *     It is unknonwn what problem scope ancestry solved, and
		 *     the method is therefore deprecated.
		 */
		createScope: function(scope, parentScopes){
			if ( ! parentScopes ) {
				parentScopes = ['Aloha.empty'];
			} else if (typeof parentScopes === 'string') {
				parentScopes = [parentScopes];
			}
			scopes[scope] = parentScopes;
		}
	};
	return Scopes;
});
