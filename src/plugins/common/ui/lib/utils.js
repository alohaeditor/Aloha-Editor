/* utils.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2012 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * Aloha Editor is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or any later version.
 *
 * Aloha Editor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 *
 * As an additional permission to the GNU GPL version 2, you may distribute
 * non-source (e.g., minimized or compacted) forms of the Aloha-Editor
 * source code without the copy of the GNU GPL normally required,
 * provided you include this license notice and a URL through which
 * recipients can access the Corresponding Source.
 */
define([
	'ui/scopes',
	'ui/overlayElement'
], function (
	Scopes,
	OverlayElement
) {
	'use strict';

	var scopeFns = {};

	function normalizeScopeToFunction(scopes) {
		if (typeof scopes === 'string') {
			if (scopes.includes(',')) {
				scopes = scopes.split(',').map(function (part) {
					return part.trim();
				});
			} else {
				scopes = [scopes];
			}
		} else if (!Array.isArray(scopes)) {
			scopes = [];
		}

		scopes = scopes.filter(function (scope) {
			return typeof scope === 'string' && scope.length > 0;
		});

		if (scopes.length === 0) {
			return function () {
				return true;
			}
		}

		var functions = scopes.map(function (scope) {
			if (scopeFns[scope]) {
				return scopeFns[scope];
			}
			return scopeFns[scope] = function () {
				return Scopes.isActiveScope(scope);
			};
		});

		return function () {
			return functions.some(function (fn) {
				return fn();
			});
		}
	}

	

	function isUserCloseError(error) {
		return error instanceof OverlayElement.OverlayCloseError
			&& error.reason !== OverlayElement.ClosingReason.ERROR;
	}

	/**
	 * Util to ignore all errors which occur when a user closes a overlay pre-maturely.
	 * Will re-throw the error if it's a legit one.
	 *
	 * @param {*} error The error which has been thrown
	 * @param {*=} resolveValue The value that should be returned in the case it's a notification error.
	 * @returns 
	 */
	function handleUserCloseErrors(error, resolveValue) {
		if (isUserCloseError(error)) {
			return resolveValue;
		}

		throw error;
	}

	/**
	 * Wrapper for `handleUserCloseErrors`, which calls it on the promise' error handler.
	 *
	 * @param {Promise.<*>} promise A promise that should be handled
	 * @param {*=} resolveValue The value that should be returned in the case it's a notification error.
	 * @returns A promise which either resolves or throws the original error
	 */
	function ignoreUserCloseErrors(promise, resolveValue) {
		return promise.catch(function(error) {
			return handleUserCloseErrors(error, resolveValue);
		});
	}

	return {
		// Scope utils
		normalizeScopeToFunction: normalizeScopeToFunction,

		// Overlay utils
		isUserCloseError: isUserCloseError,
		handleUserCloseErrors: handleUserCloseErrors,
		ignoreUserCloseErrors: ignoreUserCloseErrors,
	};
});
