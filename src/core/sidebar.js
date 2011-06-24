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
(function SidebarClosure (window, undefined) {
	
	'use strict';
	
	var jQuery = window.alohaQuery || window.jQuery,
	         $ = jQuery,
	   GENTICS = window.GENTICS || (window.GENTICS = {}),
	     Aloha = window.Aloha;
	
	// ------------------------------------------------------------------------
	// Local (helper) variables
	// ------------------------------------------------------------------------
	
	// Pseudo-namespace prefix for Sidebar elements
	// Rational:
	// We use a prefix instead of an enclosing class or id because we need to
	// be paranoid of unintended style inheritance in an environment like the
	// one in which Aloha-Editor operates in, with its numerous custom plugins.
	// eg: .inner or .btn can be used in several plugins, with eaching adding
	// to the class styles properties that we don't want.
	var cssNS = 'aloha-sidebar';
	
	var uid  = +(new Date),
		nsClasses = {
			bar			  : nsClass('bar'),
			bottom		  : nsClass('bottom'),
			'config-btn'  : nsClass('config-btn'),
			inner		  : nsClass('inner'),
			panel		  : nsClass('panel'),
			'panel-title' : nsClass('panel-title'),
			panels		  : nsClass('panels'),
			shadow		  : nsClass('shadow'),
			toggle		  : nsClass('toggle'),
			'toggle-img'  : nsClass('toggle-img')
		};
	
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
	// Local (helper) functions
	// ------------------------------------------------------------------------
	
	// TODO: Consider Mustache.js for more comprehensive templating
	//		 Is it light-weight? It needs to be.
	// TODO: Offer parameter to define left and right delimiters in case the
	//		 default "{", and "}" are problematic
	String.prototype.supplant = function (/*'lDelim, rDelim,'*/ obj) {
		return this.replace(/\{([a-z0-9\-\_]+)\}/ig, function (str, p1, offset, s) {
			var replacement = obj[p1] || str;
			return (typeof replacement == 'function')
						? replacement() : replacement;
		});
	};
	
	// Creates a selector string with this component's namepsace prefixed the each classname
	function nsSel () {
		var str = '',
			prx = cssNS; // Make a copy of cssNS here for quicker lookup
		$.each(arguments, function () {str += ' .' + prx + '-' + this;});
		return str.trim();
	};
	
	// Creates string with this component's namepsace prefixed the each classname
	function nsClass () {
		var str = '',
			prx = cssNS;
		$.each(arguments, function () {str += ' ' + prx + '-' + this;});
		return str.trim();
	};
	
	function renderTemplate (str) {
		return (typeof str == 'string')
					? str.supplant(nsClasses)
					: str;
	};
	
	// ------------------------------------------------------------------------
	// Sidebar constructor
	// Only instance properties are to be defined here
	// ------------------------------------------------------------------------
	var Sidebar = function Sidebar (opts) {
		this.id = nsClass(++uid);
		this.panels = {};
		this.container = $(renderTemplate('			 \
			<div class="{bar}">						 \
				<div class="{shadow}"></div>		 \
				<div class="{toggle}">				 \
					<div class="{toggle-img}"></div> \
				</div>								 \
				<div class="{inner}">		 		 \
					<ul class="{panels}"></ul>		 \
					<div class="{bottom}">			 \
					</div>							 \
				</div>								 \
			</div>									 \
		'));
		
		this.init(opts);
	};
	
	// ------------------------------------------------------------------------
	// Sidebar prototype
	// All properties to be shared across Sidebar instances can be placed in
	// the prototype object
	// ------------------------------------------------------------------------
	$.extend(Sidebar.prototype, {
		
		// Build as much of the sidebar as we can before appending it to DOM
		// to minimize.
		init: function (opts) {
			var that = this,
				body = $('body'),
				bar	 = this.container;
			
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
			
			if (typeof opts == 'object') {
				var panels = opts.panels;
				if (typeof panels == 'object') {
					$.each(panels, function () {
						that.addPanel(this);
					});
				}
			}
			
			// Announce that the Sidebar has entered the building!
			body.trigger(nsClass('initialized'));
		},
		
		_updateScrolling: function () {
			var bar = this.container,
				bottom = bar.find(nsSel('bottom')).position(),
				h = $(window).height();
			
			bar.height(h);
			bar.find(nsSel('shadow')).height(h);
			
			
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
		
		// We try and build as much of the panel DOM as we can before inserting
		// it into the DOM in order to reduce reflow.
		addPanel: function (panel) {
			if (!(panel instanceof Panel)) {
				panel = new Panel(panel);
			}
			
			this.panels[panel.id] = panel;
			
			var li = $('<li id="' + panel.id + '">')
						.append(panel.title, panel.content);
			
			this.container.find(nsSel('panels')).append(li);
		}
		
	});
	
	
	// ------------------------------------------------------------------------
	// Panel constructor
	//
	//	TODO: Can we get a way with never exposing Panel as Aloha.Panel and
	//		  thereby force all interfacing with Panel to be done through the
	//		  Sidebar?
	// ------------------------------------------------------------------------
	var Panel = function Panel (opts) {
		this.id = nsClass(++uid);
		this.folds = {};
		this.button = null;
		this.title	 = $(renderTemplate('<div class="{panel-title}">Untitled</div>'));
		this.content = $(renderTemplate('<div class="{panel}"></div>'));
		
		this.init(opts);
	};
	
	// ------------------------------------------------------------------------
	// Panel prototype
	// ------------------------------------------------------------------------
	$.extend(Panel.prototype, {
		
		init: function (opts) {
			this.setTitle(opts.title)
				.setContent(opts.content);
		},
		
		// May also be called by the Sidebar to update title of panel
		// @param html - Markup string, DOM object, or jQuery object 
		setTitle: function (html) {
			if (html) {
				this.title.html(html);
			}
			
			return this;
		},
		
		// May also be called by the Sidebar to update content of panel
		// @param html - Markup string, DOM object, or jQuery object 
		// @param fold - (jQuery) fold element, or hash key of object in
		//				 this.folds
		setContent: function (html, fold) {
			if (html) {
				var typeofFold = typeof fold,
					obj;
				
				if (typeofFold == 'object') {
					obj = fold;
				} else if (typeofFold == 'string' || typeofFold == 'number') {
					obj = this.folds[fold];
				} else {
					obj = this.content.html(html);
				}
				
				if (typeof obj == 'object') {
					obj.html(html);
				}
			}
			
			return this;
		}
		
	});
	
	
	$('body').bind(nsClass('initialized'), function () {
		//
	});
	
	// Automatically invoke the Sidebar as soon as the DOM is ready
	$(function () {
		//Aloha.Sidebar = new Sidebar();
		window.Sidebar = new Sidebar({
			panels: [
				{
					title: 'Test title',
					content: 'Test content'
				}
			]
		});
	});
	
})(window);
