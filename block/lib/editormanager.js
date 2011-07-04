/*!
 * Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH
 * aloha-sales@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

define(
['core/registry'],
function(Registry) {
	"use strict";

	return new (Registry.extend({
		createEditor: function(definition) {
			if (!this.has(definition.type)) {
				throw 'Editor for type "' + definition.type + '" not found.';
			}
			var Editor = this.get(definition.type);
			return new Editor();
		}
	}))();
});