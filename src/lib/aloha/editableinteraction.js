/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define(['aloha/jquery'],
function(jQuery) {
	"use strict";
	
	function highlight ( obj ) {
		
		if ( obj && obj.context && obj.context.style && obj.context.style['background-color'] ) {
			obj.attr('data-original-background-color', obj.context.style['background-color']);
		}
		obj.css('background-color','#80B5F2'); 
	};
	
	function unhighlight ( obj ) {
		var color;
		if ( obj ) {
			if ( color = obj.attr('data-original-background-color')  ) {
				jQuery(obj).css('background-color', color);
			} else {
				jQuery(obj).css('background-color', '');
			}
			jQuery(obj).removeAttr('data-original-background-color');
		}
	};
	
	return {
		highlight: highlight,
		unhighlight: unhighlight
	}
});
	