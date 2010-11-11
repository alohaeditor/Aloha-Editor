/*!
*   This file is part of Aloha Editor
*   Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
*   Licensed unter the terms of http://www.aloha-editor.com/license.html
*//*
*	Aloha Editor is free software: you can redistribute it and/or modify
*   it under the terms of the GNU Affero General Public License as published by
*   the Free Software Foundation, either version 3 of the License, or
*   (at your option) any later version.*
*
*   Aloha Editor is distributed in the hope that it will be useful,
*   but WITHOUT ANY WARRANTY; without even the implied warranty of
*   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*   GNU Affero General Public License for more details.
*
*   You should have received a copy of the GNU Affero General Public License
*   along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/**
 * jQuery between Extension
 * 
 * insert either html code, a dom object OR a jQuery object inside of an existing text node.
 * if the chained jQuery object is not a text node, nothing will happen.
 * 
 * @param content HTML Code, DOM object or jQuery object to be inserted
 * @param offset character offset from the start where the content should be inserted
 */
jQuery.fn.between = function(content, offset) {
	if (this[0].nodeType !== 3) {
		// we are not in a text node, just insert the element at the corresponding position
		if (offset > this.children().size()) {
			offset = this.children().size();
		}
		if (offset <= 0) {
			this.prepend(content);
		} else {
			this.children().eq(offset -1).after(content);
		}
	} else {
		// we are in a text node so we have to split it at the correct position
		if (offset <= 0) {
			this.before(content);
		} else if (offset >= this[0].length) {
			this.after(content);		
		} else {
			var fullText = this[0].data;
			this[0].data = fullText.substring(0, offset);
			this.after(fullText.substring(offset, fullText.length));
			this.after(content);
		}
	}
};
/**
 * jQuery removeCss Extension
 * 
 * removes one or more style attributes completely. If the style attribute would be empty,
 * it will be removed  
 * 
 * @param cssName CSS style names, devided by ;
 */

jQuery.fn.removeCss = function( cssName ) {
	return this.each( function() {
		var oldstyle = jQuery(this).attr('style');
    	var style = jQuery.grep(jQuery(this).attr('style').split(";"), function(curStyleAttr) {
        			var curStyleAttrName = curStyleAttr.split(":");
        			if (curStyleAttrName[0]) {
        				if ( curStyleAttrName[0].toUpperCase().trim().indexOf(cssName.toUpperCase()) == -1) {
        					return curStyleAttr;
        				}
        			}
                }).join(";").trim();
		jQuery(this).removeAttr('style');
    	if (style.trim()) {
    		jQuery(this).attr('style', style);
    	}
    	return jQuery(this);
    });
};

/**
 * Make the object contenteditable. Care about browser version (name of contenteditable attribute depends on it)
 */
jQuery.fn.contentEditable  = function( b ) {
	// ie does not understand contenteditable but contentEditable
	// contentEditable is not xhtml compatible.
	var ce = 'contenteditable';
	if (jQuery.browser.msie && parseInt(jQuery.browser.version) == 7 ) {
		ce = 'contentEditable';
	}
	if ( b == undefined ) {
		return jQuery(this).attr(ce);
	} else if (b === '') {
		jQuery(this).removeAttr(ce);
	} else {
		if (b && b !== 'false') {
			b='true';
		} else {
			b='false';
		}
		jQuery(this).attr(ce, b);
	}
};
