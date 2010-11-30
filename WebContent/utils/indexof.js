/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
/**
 * reimplementation of indexOf for current Microsoft Browsers
 * IE does not support indexOf() for Arrays
 * @param object to look for
 * @return index of obj in Array or -1 if not found
 * @hide
 */
if(!Array.indexOf){
	Array.prototype.indexOf = function(obj){
		for(var i=0; i<this.length; i++){
		    if(this[i]===obj){
		     return i;
		    }
	   	}
	   	return -1;
	};
}
