/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define("block/renderer/defaultrenderer", ['block/renderer/abstractrenderer'],
function(AbstractRenderer) {
	"use strict";

	var DefaultRenderer = new (AbstractRenderer.extend({
		/**
		 * @var jQuery element
		 */
		_constructor: function() {
			this._super('DefaultRenderer');
		},

		render: function(attributes) {
			return "Hallo default";
		}
	}))();
	return DefaultRenderer;
});