/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
define(
['aloha/plugin', 'aloha/floatingmenu', 'i18n!attributes/nls/i18n', 'i18n!aloha/nls/i18n', 'css!attributes/css/attributes.css'],
function(Plugin, FloatingMenu, i18n, i18nCore) {
	"use strict";

	var
		jQuery = window.alohaQuery || window.jQuery, $ = jQuery,
		GENTICS = window.GENTICS,
		Aloha = window.Aloha;
	
	
	
	
     return Plugin.create('attributes', {
		_constructor: function(){
			this._super('attributes');
		},
		
		// namespace prefix for this plugin
    // Pseudo-namespace prefix
		ns : 'aloha-attributes',
		uid  : 'attributes',
		// namespaced classnames
		nsClasses : {},
    
    
		supplant : function(str, obj) {
			return str.replace(/\{([a-z0-9\-\_]+)\}/ig, function (str, p1, offset, s) {
				var replacement = obj[p1] || str;
				return (typeof replacement == 'function') ? replacement() : replacement;
			});
		},
		
		/**
		 * Wrapper to all the supplant method on a given string, taking the
		 * nsClasses object as the associative array containing the replacement
		 * pairs
		 *
		 * @param {String} str
		 * @return {String}
		 */
		renderTemplate : function(str) {
			return (typeof str === 'string') ? this.supplant(str, this.nsClasses) : str;
		},
		
		/**
		 * Generates a selector string with this component's namepsace prefixed the
		 * each classname
		 *
		 * Usage:
		 *		nsSel('header,', 'main,', 'foooter ul')
		 *		will return
		 *		".aloha-myplugin-header, .aloha-myplugin-main, .aloha-mypluzgin-footer ul"
		 *
		 * @return {String}
		 */
		nsSel : function() {
			var strBldr = [], prx = this.ns;
			$.each(arguments, function () { strBldr.push('.' + (this == '' ? prx : prx + '-' + this)); });
			return strBldr.join(' ').trim();
		},
		
		/**
		 * Generates s string with this component's namepsace prefixed the each
		 * classname
		 *
		 * Usage:
		 *		nsClass('header', 'innerheaderdiv')
		 *		will return
		 *		"aloha-myplugin-header aloha-myplugin-innerheaderdiv"
		 *
		 * @return {String}
		 */
		nsClass : function (){
			var strBldr = [], prx = this.ns;
			$.each(arguments, function () { strBldr.push(this == '' ? prx : prx + '-' + this); });
			return strBldr.join(' ').trim();
		},
		
		config: ['true'],
		
		activeOn: 'a,span,div,p,q,blockquote,h1,h2,h3,h4,h5,h6,em,i,b',
				
		/**
		 * Initialize the plugin
		 */
		init: function () {
			var that = this;
			this.nsClasses = {
				newattributename	: this.nsClass('newattributename'),
				newattributebutton	: this.nsClass('newattributebutton'),
				newattributewert	: this.nsClass('newattributewert'),
				container	: this.nsClass('container'),
				attribcontainer	: this.nsClass('attribcontainer'),
				newattribute	: this.nsClass('newattribute'),
				item	: this.nsClass('item'),
				iteminput	: this.nsClass('iteminput')
			};
			if ( typeof this.settings.activeOn !== 'undefined') {
				this.activeOn = this.settings.activeOn;
			}
			jQuery('body').bind('aloha', function (ev, sidebars) { that.initSidebar(Aloha.Sidebars.right); });
		},
				
		getSidebarContent: function() {
			return this.renderTemplate(
					'<div class="{container}">\
						\
						<div class="{attribcontainer}">\
							attribcontainer\
						</div>\
						\
						<div class="{newattribute}">\
						Neues Attribut<br\>\
						<label for="{newattributename}">Name:</label><input type="text" id="{newattributename}"/>\
						<label for="{newattributewert}">Wert:</label><input type="text" id="{newattributewert}"/>\
						<button id="{newattributebutton}">Hinzuf&uuml;gen</button>\
						</div>\
						\
					</div>'
				);
		},
		
		updateSidebarWithAttributes: function() {
			var el = this.effective[0];
			var $container = this.content.find(this.nsSel('attribcontainer'));
			$container.html('');
			for (var attr, i=0, attrs=el.attributes, l=attrs.length; i<l; i++){
				attr = attrs.item(i)
				console.log(attr.nodeName);
				console.log(attr.nodeValue);
				var item = jQuery(this.renderTemplate('<div class="{item}"><label for="{iteminput}'+attr.nodeName+'">'+attr.nodeName+'</label><input id="{iteminput}'+attr.nodeName+'" class="{iteminput}" data-attrname="'+attr.nodeName+'" type="text" value="'+attr.nodeValue+'"/></div>'));
				$container.append(item);
			}
		},
		
		initSidebar: function(sidebar) {
			var pl = this;
			pl.sidebar = sidebar;
			var sidebarcontent = this.getSidebarContent();
			sidebar.addPanel({
                    
                    id         : pl.nsClass('sidebar-panel'),
                    title     : 'Attributes',
                    content     : '',
                    expanded : true,
                    activeOn : this.activeOn,
                    
                    onInit     : function () {
                        var that = this;
                        pl.content = this.setContent(sidebarcontent).content;
                        
                        pl.content.find('#'+pl.nsClass('newattributebutton')).click(function () {
                            var name = jQuery('#'+pl.nsClass('newattributename')).val();
							var wert = jQuery('#'+pl.nsClass('newattributewert')).val();
							jQuery('#'+pl.nsClass('newattributename')).val('');
							jQuery('#'+pl.nsClass('newattributewert')).val('');
							jQuery(pl.effective).attr(name, wert);
							pl.updateSidebarWithAttributes();
                        });
						/*
						content.find(nsSel('reset-button')).click(function () {
                            var content = that.content;
                            pl.processH(that.effective);
							jQuery(that.effective).removeClass('aloha-customized');
							that.content.find(nsSel('input')).val(that.effective.attr('id'));
                        });*/
                    },
                    
                    onActivate: function (effective) {
						var that = this;
						that.effective = effective;
						//DO STUFF HERE
						pl.effective = effective;
						pl.updateSidebarWithAttributes();
                    }
                    
                });
			sidebar.show().open();
		}
	});
});
