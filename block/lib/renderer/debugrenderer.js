/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define("block/renderer/debugrenderer", ['block/renderer/abstractrenderer'],
function(AbstractRenderer) {
	"use strict";

	var DebugRenderer = new (AbstractRenderer.extend({
		/**
		 * @var jQuery element
		 */
		_constructor: function() {
			this._super('DebugRenderer');
		},

		render: function(attributes) {
			return "Hallo debug";
		}
	}))();
	return DebugRenderer;
});