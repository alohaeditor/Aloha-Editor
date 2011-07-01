/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define("block/renderer/abstractrenderer",
['block/lifecyclemanager'],
function(BlockLifecycleManager) {
	"use strict";
	var AbstractRenderer = Class.extend({
		
		/**
		 * @var jQuery element
		 */
		_constructor: function(identifier) {
			BlockLifecycleManager.registerRenderer(identifier, this);
		},

		render: function() {
			throw new Exception('Please implement a render() method when subclassing AbstractRenderer!');
		}
	});
	return AbstractRenderer;
});