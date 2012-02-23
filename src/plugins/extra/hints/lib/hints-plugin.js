/*!
 * Aloha Editor
 * Author & Copyright (c) 2012 Gentics Software GmbH
 * aloha-sales@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

define(['aloha/jquery', 'aloha/plugin', 'hints/vendor/tipsy', 'css!hints/css/hints'],
function( jquery, plugin, tipsy ) {
	"use strict";
	return plugin.create( 'hints', {
		init: function() {
			jquery('.aloha-editable').tipsy({
			delayIn: 0,             // delay before showing tooltip (ms)
			delayOut: 0.5,          // delay before hiding tooltip (ms)
			fade: true,             // fade tooltips in/out?
			fallback: '',    // fallback text to use when no tooltip text
			gravity: 'w',           // gravity
			html: false,            // is tooltip content HTML?
			live: false,            // use live event support?
			offset: 0,              // pixel offset of tooltip from element
			opacity: 0.7,           // opacity of tooltip
			title: 'title',         // attribute/callback containing tooltip text
			trigger: 'focus'        // how tooltip is triggered - hover | focus | manual
			});
		}
	});
});