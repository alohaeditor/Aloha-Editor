/*!
 * Aloha Editor
 * Author & Copyright (c) 2012 Gentics Software GmbH
 * aloha-sales@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

define(['aloha', 'aloha/jquery', 'aloha/plugin', 'hints/vendor/tipsy', 'css!hints/css/hints'],
function( Aloha, jquery, plugin, tipsy ) {
	"use strict";
	return plugin.create( 'hints', {
		
		// define defaults
		delayIn:    0,      // delay before showing tooltip (ms)
		delayOut:   0.5,    // delay before hiding tooltip (ms)
		fade:       true,   // fade tooltips in/out?
		fallback:   '',     // fallback text to use when no tooltip text
		gravity:    'w',    // gravity
		html:       false,  // is tooltip content HTML?
		live:       false,  // use live event support?
		offset:     0,      // pixel offset of tooltip from element
		opacity:    0.7,    // opacity of tooltip
		title:      'title',// attribute/callback containing tooltip text
		trigger:    'focus',// how tooltip is triggered - hover | focus | manual

		// initialize plugin
		init: function() {
			if ( typeof this.settings.delayIn != 'undefined' ) {
				this.delayIn = parseFloat(this.settings.delayIn);
			}
			if ( typeof this.settings.delayOut != 'undefined' ) {
				this.delayOut = parseFloat(this.settings.delayOut);
			}
			if ( typeof this.settings.fade != 'undefined' ) {
				this.fade = this.settings.fade;
			}
			if ( typeof this.settings.fallback != 'undefined' ) {
				this.fallback = this.settings.fallback;
			}
			if ( typeof this.settings.gravity != 'undefined' ) {
				this.gravity = this.settings.gravity;
			}
			if ( typeof this.settings.html != 'undefined' ) {
				this.html = this.settings.html;
			}
			if ( typeof this.settings.live != 'undefined' ) {
				this.live = this.settings.live;
			}
			if ( typeof this.settings.offset != 'undefined' ) {
				this.offset = parseFloat(this.settings.offset);
			}
			if ( typeof this.settings.opacity != 'undefined' ) {
				this.opacity = parseFloat(this.settings.opacity);
			}
			if ( typeof this.settings.title != 'undefined' ) {
				this.title = this.settings.title;
			}
			if ( typeof this.settings.trigger != 'undefined' ) {
				this.trigger = this.settings.trigger;
			}
			
			jquery('.aloha-editable').tipsy({
				delayIn: this.delayIn,
				delayOut: this.delayOut,
				fade: this.fade,
				fallback: this.fallback,
				gravity: this.gravity,
				html: this.html,
				live: this.live,
				offset: this.offset,
				opacity: this.opacity,
				title: this.title,
				trigger: this.trigger
			});
		}

	});
});