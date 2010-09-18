/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
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
 * jQuery Keydown extension Extension
 *
 */

jQuery.fn.cmdkeydown  = function( fn ) {
	return fn ? this.bind( 'cmdkeydown', fn ) : this.trigger( 'cmdkeydown' );
};

jQuery.fn.cmdkeyup  = function( fn ) {
	return fn ? this.bind( 'cmdkeyup', fn ) : this.trigger( 'cmdkeyup' );
};

jQuery(document).keyup(function (e) {
	switch( e.which ) {
		case 17:
			jQuery.isCtrlDown = false;
			jQuery.fn.trigger('cmdkeyup',  ['ctrl'] );
			break;
		case 91:
			jQuery.isMetaLDown = false;
			if ( !jQuery.isMetaRDown ) {
				jQuery.isMetaDown = false;
			}
			jQuery.fn.trigger('cmdkeyup',  ['meta'] );
			break;
		case 93:
			jQuery.isMetaRDown = false;
			if ( !jQuery.isMetaLDown ) {
				jQuery.isMetaDown = false;
			}
			jQuery.fn.trigger('cmdkeyup',  ['meta'] );
			break;
	}
});

jQuery(document).keydown(function (e) {
	switch( e.which ) {
		case 17:
			jQuery.isCtrlDown = true;
			jQuery.fn.trigger('cmdkeydown',  e );
			break;
		case 91:
			jQuery.isMetaLDown = true;
			jQuery.isMetaDown = true;
			jQuery.fn.trigger('cmdkeydown',  e );
			break;
		case 93:
			jQuery.isMetaRDown = true;
			jQuery.isMetaDown = true;
			jQuery.fn.trigger('cmdkeydown',  e );
			break;
	}
});

