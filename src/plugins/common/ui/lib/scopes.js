define([],function(){

	var scopes = {
		'Aloha.empty': [],
		'Aloha.global': ['Aloha.empty'],
		'Aloha.continuoustext': ['Aloha.global']
	};

	function pushScopeAncestors(array, scope) {
		var parentScopes = scopes[scope];
		for (var i = 0; i < parentScopes.length; i++) {
			var parentScope = parentScopes[i];
			array.push(parentScope);
			pushScopeAncestors(array, parentScope);
		}
	}

	var scopeSetDuringSelectionChanged = false;

	Aloha.bind('aloha-selection-changed-before', function(){
		scopeSetDuringSelectionChanged = false;
	});

	Aloha.bind('aloha-selection-changed-after', function(event, range, originalEvent){
		// I don't know why we check for originalEvent != 'undefined', here is the original comment:
		// "Only set the specific scope if an event was provided, which means
		//  that somehow an editable was selected"
		if ( typeof originalEvent != 'undefined' && ! scopeSetDuringSelectionChanged ) {
			Scopes.setScope('Aloha.continuoustext');
		}
	});

	var Scopes = {

		activeScopes: [],

		/**
		 * Set the current scope
		 * @method
		 * @param {String} scope name of the new current scope
		 */
		setScope: function(scope) {
			// get the scope object
			var scopeObject = scopes[scope];

			if (typeof scopeObject === 'undefined') {
				// TODO log an error
				return;
			}

			scopeSetDuringSelectionChanged = true;
			if (Scopes.activeScopes[0] != scope) {
				Scopes.activeScopes = [scope];
				pushScopeAncestors(Scopes.activeScopes, scope);
				Aloha.trigger('aloha-ui-scope-change', Scopes.activeScopes);
			}
			console.log("active scopes: " + Scopes.activeScopes.toString());
		},

		createScope: function(scope, parentScopes){
			if ( ! parentScopes ) {
				parentScopes = ['Aloha.empty'];
			} else if (typeof parentScopes === 'string') {
				parentScopes = [parentScopes];
			}

			if (scopes.hasOwnProperty(scope)) {
				// TODO what if the scope already exists?
				return;
			}

			scopes[scope] = parentScopes;
		},

		/**
		 * @param name
		 *        The name of a component that exists in the tab that should be activated.
		 */
		activateTabOfButton: function(name){},
		unhideTab: function(){},
		hideTab: function(tabName){}
	};
	return Scopes;
});
