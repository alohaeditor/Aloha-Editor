define([
	'PubSub'
], function (
	PubSub
) {
	'use strict';

	/**
	 * Mapping of which scopes are required for another to exist and which should be considered active.
	 * When a scope is changed, it will resolve all "depended" scopes and mark them active.
	 *
	 * Example:
	 * ```
	 * ROOT = []
	 * GLOBAL = []
	 * A = [ROOT]
	 * B = [A]
	 * C = [GLOBAL]
	 * D = [B, C]
	 * 
	 * > enterScope(A)
	 * < [A, ROOT]
	 * 
	 * > setScope(ROOT) // Reset
	 * > enterScope(B)
	 * < [B, A, ROOT]
	 * 
	 * > setScope(ROOT) // Reset
	 * > enterScope(D)
	 * < [D, B, A, ROOT, C, GLOBAL]
	 * 
	 * > leaveScope(A)
	 * < [ROOT, C, GLOBAL]
	 * ```
	 * 
	 * @type {object.<string, Set.<string>>}
	 */
	var DEPENDENCY_MAPPING = {};

	var SCOPE_EMPTY = 'Aloha.empty';
	var SCOPE_GLOBAL = 'Aloha.global';
	var SCOPE_CONTINUOUS_TEXT = 'Aloha.continuoustext';

	var MARKER_TEMP = Symbol('temporary-scope');

	DEPENDENCY_MAPPING[SCOPE_EMPTY] = new Set();
	DEPENDENCY_MAPPING[SCOPE_GLOBAL] = new Set([SCOPE_EMPTY]);
	DEPENDENCY_MAPPING[SCOPE_CONTINUOUS_TEXT] = new Set([SCOPE_GLOBAL]);

	var RESERVED_SCOPES = [SCOPE_EMPTY, SCOPE_GLOBAL, SCOPE_CONTINUOUS_TEXT];
	var DEFAULT_SCOPE = SCOPE_EMPTY;

	var activeScopes = new Set([SCOPE_EMPTY]);
	var resolvedActiveScopes = new Set([SCOPE_EMPTY]);

	/**
	 * Simple debounce function to prevent spam/unnceccary changes.
	 * @param {function} fn Function call which should be debounced
	 * @param {number} time How long the debounce time in `ms` should be.
	 */
	function debounce(fn, time) {
		var timer = -1;
		var bound = this;

		function schedule() {
			var args = Array.from(arguments);
			if (timer !== -1) {
				window.clearTimeout(timer);
			}
			timer = window.setTimeout(function() {
				fn.apply(bound, args);
			}, time);
		}

		return schedule;
	}

	function setIsDifferent(a, b) {
		if (a.size !== b.size) {
			return true;
		}

		var values = a.values();
		var hasDiff = false;
		for (var i = 0; i < a.size; i++) {
			if (!b.has(values.next().value)) {
				hasDiff = true;
				break;
			}
		}

		return hasDiff;
	}

	PubSub.sub('aloha.editable.activated', function() {
		Scopes.enterScope(SCOPE_CONTINUOUS_TEXT);
	});

	/**
	 * Utility yo manage the scope/functionality/visibility of UI Elements.
	 * A scope is simply a namespace, to determine where the selection/interaction
	 * is currently at.
	 */
	var Scopes = {
		SCOPE_EMPTY: SCOPE_EMPTY,
		SCOPE_GLOBAL: SCOPE_GLOBAL,
		SCOPE_CONTINUOUS_TEXT: SCOPE_CONTINUOUS_TEXT,

		/**
		 * Attempts to register the provided scope with it's dependencies.
		 *
		 * @param {string} scope The name of the scope attempting to register
		 * @param {Array.<string>=} dependencies An optional list of "dependencies"/other scopes which should be active, when `scope` is entered.
		 * @returns {boolean} If it was successfully registered.
		 */
		registerScope: function (scope, dependencies) {
			if (typeof scope !== 'string') {
				throw new Error('Scope has to be a string');
			}
			if (RESERVED_SCOPES.includes(scope)) {
				throw new Error('You may not override reserved scopes (' + RESERVED_SCOPES.join(',') + ')');
			}
			if (Array.isArray(dependencies)) {
				for (var i = 0; i < dependencies.length; i++) {
					// Cannot register a dependency which isn't registered itself.
					if (!DEPENDENCY_MAPPING.hasOwnProperty(dependencies[i])) {
						return false;
					}
				}
			} else {
				dependencies = [];
			}

			DEPENDENCY_MAPPING[scope] = new Set(dependencies);

			return true;
		},

		/**
		 * Attempts to remove the specified scope.
		 * If the scope is a depency for another scope, the removal will fail, unless `force` is set to `true`.
		 * When `force` is enabled, it'll remove the scope from the other scope's dependency list.
		 *
		 * @param {string} scope The scope to be removed
		 * @param {boolean=} force If this scope is registered as a dependency in other scopes, if it should be removed instead to fail.
		 * @returns {boolean} If it was able to remove the scope.
		 */
		removeScope: function (scope, force) {
			if (!DEPENDENCY_MAPPING.hasOwnProperty(scope)) {
				return false;
			}
			if (RESERVED_SCOPES.includes(scope)) {
				throw new Error('You may not remove reserved scopes (' + RESERVED_SCOPES.join(',') + ')');
			}

			var entries = Object.entries();
			for (var i = 0; entries.length; i++) {
				if (DEPENDENCY_MAPPING[entries[0]].has(scope)) {
					if (!force) {
						return false;
					}
					DEPENDENCY_MAPPING[entries[0]].delete(scope);
				}
			}

			delete DEPENDENCY_MAPPING[scope];

			return true;
		},

		/**
		 * Helper function to resolve all active scopes.
		 * May contain duplicates, so removal of these should be done on the initial call,
		 * as this function is being called recursively.
		 *
		 * @param {string} scope Scope to resolve all scopes from
		 *
		 * @returns {Set.<string>} All active scopes.
		 */
		_resolveScopes: function (scope) {
			var deps = DEPENDENCY_MAPPING[scope];
			if (deps == null || deps.size === 0 || deps.has(MARKER_TEMP)) {
				return new Set();
			}

			var out = new Set();
			deps.forEach(function (el) {
				out.add(el);
				Scopes._resolveScopes(el).forEach(function (resolved) {
					out.add(resolved);
				});
			});

			return out;
		},		

		/**
	 	 * Helper function which does diff check and triggers the proper event.
		 * @param {Set.<string>} newActiveScopes The new scopes to apply
		 * @returns {boolean} If the new scopes have been applied (Only false if they are the same already).
		 */
		_modifyState: debounce(function(newActiveScopes) {
			var previousScopes = Array.from(activeScopes);
			var previousScopeList = Array.from(resolvedActiveScopes);

			activeScopes = newActiveScopes;
			resolvedActiveScopes = new Set();
			activeScopes.forEach(function (toResolve) {
				resolvedActiveScopes.add(toResolve);
				Scopes._resolveScopes(toResolve).forEach(function (resolved) {
					resolvedActiveScopes.add(resolved);
				});
			});

			PubSub.pub('aloha.ui.scope.change', {
				previousScopes: previousScopes,
				previousScopeList: previousScopeList,
				activeScopes: Array.from(activeScopes),
				activeScopeList: Array.from(resolvedActiveScopes),
			});
		}, 10),

		/**
		 * Attempts to enter the specified scope.
		 * If the scope isn't registered yet, it'll simply return `false`.
		 * Will not trigger a new change if the current scope is the same.
		 *
		 * @param {string} scope The scope to enter
		 * @param {boolean=} temp If this is a temporary scope and should be removed once it's being left.
		 *
		 * @returns {boolean} If the scope is now active.
		 */
		enterScope: function (scope, temp) {
			if (!DEPENDENCY_MAPPING.hasOwnProperty(scope)) {
				if (!temp) {
					return false;
				}
				DEPENDENCY_MAPPING[scope] = new Set([MARKER_TEMP]);
			}
			if (activeScopes.has(scope)) {
				return true;
			}

			var newScopes = structuredClone(activeScopes);
			newScopes.add(scope);

			if (!setIsDifferent(newScopes, activeScopes)) {
				return false;
			}

			return Scopes._modifyState(newScopes);
		},

		/**
		 * Attempts to leave the specified scope.
		 *
		 * @param {string} scope The scope to leave.
		 *
		 * @returns {boolean} If the scope has been successfully left.
		 */
		leaveScope: function (scope) {
			// You cannot leave the empty/default scope or undefined ones.
			if (!DEPENDENCY_MAPPING.hasOwnProperty(scope) || scope === SCOPE_EMPTY) {
				return false;
			}
			// Special check for when we would try to leave the default scope, which would do nothing.
			if (activeScopes.size === 1 && activeScopes.has(DEFAULT_SCOPE) && scope === DEFAULT_SCOPE) {
				// `false`, as the 'state' wouldn't be different.
				return false;
			}
			// Not active, so nothing to do.
			if (!activeScopes.has(scope)) {
				return true;
			}

			var newScopes = structuredClone(activeScopes);
			newScopes.delete(scope);
			if (DEPENDENCY_MAPPING[scope][0] === MARKER_TEMP) {
				delete DEPENDENCY_MAPPING[scope];
			}
			if (newScopes.size === 0) {
				newScopes.add(DEFAULT_SCOPE);
			}

			if (!setIsDifferent(newScopes, activeScopes)) {
				return false;
			}

			return Scopes._modifyState(newScopes);
		},

		/**
		 * Overrides the active scopes to the specified ones.
		 *
		 * @param {string|Array.<string>} scopes One or more scopes to be set active.
		 * @param {boolean=} ignoreInvalid If it should ignore invalid scope entries.
		 *
		 * @returns {boolean} If it successfully set the scopes.
		 */
		setScope: function (scope, ignoreInvalid) {
			if (typeof scope === 'string') {
				scope = [scope];
			} else if (!Array.isArray(scope) || scope.length === 0) {
				scope = [DEFAULT_SCOPE];
			}

			var newScopes = new Set();
			for (var i = 0; i < scope.length; i++) {
				if (!DEPENDENCY_MAPPING.hasOwnProperty(scope[i]) && !ignoreInvalid) {
					return false;
				}
				newScopes.add(scope[i]);
			}

			if (newScopes.size === 0) {
				newScopes.add(DEFAULT_SCOPE);
			}

			if (!setIsDifferent(newScopes, activeScopes)) {
				return false;
			}

			return Scopes._modifyState(newScopes);
		},

		/**
		 * @param {string} scope The scope to check
		 * @returns {boolean} If the scope is currently active or not.
		 */
		isActiveScope: function (scope) {
			return resolvedActiveScopes.has(scope);
		},

		/**
		 * Returns the currently active scopes.
		 *
		 * @param {boolean=} withResolved If it should include additionally resolved scopes or not.
		 */
		getActiveScopes: function (withResolved) {
			return Array.from(withResolved ? resolvedActiveScopes : activeScopes);
		}
	};

	return Scopes;
});
