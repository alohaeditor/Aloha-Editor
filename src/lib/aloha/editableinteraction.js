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
		setTimeout( function() {
			if ( obj && obj.context && obj.context.style && obj.context.style['background-color'] ) {
				obj.attr('data-original-background-color', obj.context.style['background-color']);
			}
			obj.css('background-color','#80B5F2');
		},
		50);
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
	
	function makeClean ( obj ) {
		if ( obj ) {
			jQuery( "[data-original-background-color]" , obj).each( function () {
				var color;
				if( color = jQuery( this ).attr( "data-original-background-color" )) {
					jQuery( this ).css('background-color', color);
				} else {
					jQuery( this ).css('background-color', '');
				}
				jQuery( this ).removeAttr( "data-original-background-color" );
			});
		}
	};
	
	return {
		highlight: highlight,
		unhighlight: unhighlight,
		makeClean: makeClean
	}
});
	