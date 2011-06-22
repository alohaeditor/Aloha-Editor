/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

// ----------------------------------------------------------------------------
//
// Please look at http://www.aloha-editor.org/wiki/Sidebar for more information
// Please remember to document your contributions there.
//
// ----------------------------------------------------------------------------


// We give our immediately invoked function a name to aid in debugging
(function __Sidebar (window, undefined) {
	
	'use strict';
	
	var jQuery = window.alohaQuery || window.jQuery,
	         $ = jQuery,
	   GENTICS = window.GENTICS || (window.GENTICS = {}),
	     Aloha = window.Aloha;
	
	// Pseudo-namespace prefix for Sidebar elements
	// Rational:
	// We use a prefix instead of an enclosing class or id because we need to
	// be paranoid of accidentally inheritancing styles in an environment like
	// the one in which Aloha-Editor, with its numerous custom plugins operates
	// in. eg: .inner or .btn can be used in several plugins with eaching adding
	// to the class styles.
	var cssNS = 'aloha-sidebar';
	
	// ------------------------------------------------------------------------
	// Extend jQuery easing animations
	// ------------------------------------------------------------------------
	$.extend($.easing, {
		easeOutExpo: function (x, t, b, c, d) {
			return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
		},
		easeOutElastic: function (x, t, b, c, d) {
			var s=1.70158;var p=0;var a=c;
			if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
			if (a < Math.abs(c)) { a=c; var s=p/4; }
			else var s = p/(2*Math.PI) * Math.asin (c/a);
			return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
		}
	});
	
	// ------------------------------------------------------------------------
	// Helper functions
	// ------------------------------------------------------------------------
	
	function mkdotclass () {
		var str = '',
			prx = cssNS; // Make a copy of cssNS here for quicker lookup
		$.each(arguments, function () {str += ' .' + prx + '-' + this;});
		return str.trim();
	};
	
	function mkclass () {
		var str = '',
			prx = cssNS;
		$.each(arguments, function () {str += ' ' + prx + '-' + this;});
		return str.trim();
	};
	
	// TODO: Factorize this method to be used in other parts of Aloha-Editor
	// TODO: Offer parameter to define left and right delimiters in case the
	//		 default "{", and "}" are problematic
	String.prototype.supplant = function (/*'lDelim, rDelim,'*/ obj) {
		return this.replace(/\{([a-z0-9\-\_]+)\}/ig, function (str, p1, offset, s) {
			return obj[p1] || str;
		});
	};
	
	var uid  = +(new Date),
		nameSpacedClasses = {
			bar		: mkclass('bar'),
			bottom	: mkclass('bottom'),
			inner	: mkclass('inner'),
			panels	: mkclass('panels'),
			shadow	: mkclass('shadow'),
			toggle	: mkclass('toggle'),
			'toggle-img' : mkclass('toggle-img'),
			'config-btn' : mkclass('config-btn')
		};
	
	// ------------------------------------------------------------------------
	// Sidebar constructor
	// Only instance properties are to be defined here
	// ------------------------------------------------------------------------
	var Sidebar = function () {
		
		this.container = null;
		this.panels = {};
		
		this.init();
		
	};
	
	// ------------------------------------------------------------------------
	// Sidebar prototype
	// All properties to be shared across Sidebar instances can be placed in
	// the prototype object
	// ------------------------------------------------------------------------
	$.extend(Sidebar.prototype, {
		
		// We minimize reflow by building as much of the sidebar as we can 
		// before appending it to DOM.
		init: function () {
			var that = this,
				body = $('body'),
				bar	 = this.container = $(
					('\
					<div class="{bar}">							\
						<div class="{shadow}"></div>			\
						<div class="{toggle}">					\
							<div class="{toggle-img}"></div>	\
						</div>									\
						<div class="{inner}">		 			\
							<ul class="{panels}"></ul>	\
							<div class="{bottom}">				\
							</div>								\
						</div>									\
					</div>										\
				').supplant(nameSpacedClasses)
			);
			
			bar.css('opacity', 0)
			   .click(function () {
					that._barClicked.apply(that, arguments);
				});
			
			body.append(bar);
			
			$(window).resize(function () {
				that._updateScrolling();
			});
			
			this._updateScrolling();
			
			// Fade in nice and slow
			bar.animate({opacity: 1}, 500, 'linear');
			
			// Announce that the Sidebar has entered the building!
			body.trigger(mkclass('initialized'));
			
			console.log(bar);
		},
		
		_updateScrolling: function () {
			var bar = this.container,
				bottom = bar.find(mkdotclass('bottom')).position(),
				h = $(window).height();
			
			bar.height(h);
			bar.find(mkdotclass('shadow')).height(h);
			
			
			/*
			
			var panel = this._getCurrentPanel();
			
			if (!panel) {
				return;
			}
			
			panel.container
				.css({
					height	  : $(window).height(),
					overflowY : (bottom.top > bar.height()) ? 'scroll' : 'auto'
				});
			*/
		},
		
		_getCurrentPanel: function () {
			
		},
		
		_barClicked: function (ev) {
		
		},
		
		addPanel: function (panel) {
			
		}
		
	});
	
	$('body').bind(mkclass('initialized'), function () {
	});
	
	// Automatically invoke the Sidebar as soon as the DOM is ready
	$(function () {
		//Aloha.Sidebar = new Sidebar();
		window.xSidebar = Sidebar;
		window.Sidebar = new Sidebar();
	});
	
})(window);
