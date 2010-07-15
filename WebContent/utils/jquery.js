/**
 * This software or sourcecode is provided as is without any expressed
 * or implied warranties and may not be copied, otherwise distributed
 * (especially forwarded to third parties), reproduced and combined with
 * other code without our express prior written consent. The software or
 * source code and the concepts it is based upon are to be kept confidential
 * towards third parties. The software or sourcecode may be used solely
 * for the purpose of evaluating and testing purposes for a time of one
 * month from the first submission of the software or source code. In case
 * no arrangements about further use can be reached, the software or 
 * sourcecode has to be deleted.
 * 
 * Copyright(C) 2010 Gentics Software GmbH
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