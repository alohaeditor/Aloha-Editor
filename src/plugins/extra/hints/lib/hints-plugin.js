/* hints-plugin.js is part of Aloha Editor project http://aloha-editor.org
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
define(['aloha', 'jquery', 'aloha/plugin', 'hints/vendor/tipsy', 'css!hints/css/hints'],
function( Aloha, jquery, plugin, tipsy ) {
	"use strict";
	return plugin.create( 'hints', {
		
		// define defaults
		delayIn:    Aloha.settings.plugins.hints.delayIn,      // delay before showing tooltip (ms)
		delayOut:   Aloha.settings.plugins.hints.delayOut,    // delay before hiding tooltip (ms)
		fade:       Aloha.settings.plugins.hints.fade,   // fade tooltips in/out?
		fallback:   Aloha.settings.plugins.hints.fallback,     // fallback text to use when no tooltip text
		gravity:    Aloha.settings.plugins.hints.gravity,    // gravity
		html:       Aloha.settings.plugins.hints.html,  // is tooltip content HTML?
		live:       Aloha.settings.plugins.hints.live,  // use live event support?
		offset:     Aloha.settings.plugins.hints.offset,      // pixel offset of tooltip from element
		opacity:    Aloha.settings.plugins.hints.opacity,    // opacity of tooltip
		title:      Aloha.settings.plugins.hints.title,// attribute/callback containing tooltip text
		trigger:    Aloha.settings.plugins.hints.trigger,// how tooltip is triggered - hover | focus | manual


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