/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
/**
 * Register the word paste handler
 */
GENTICS.Aloha.PastePlugin.WordPasteHandler = new GENTICS.Aloha.PastePlugin.PasteHandler();

/**
 * Handle the pasting. Try to detect content pasted from word and transform to clean html
 * @param jqPasteDiv
 */
GENTICS.Aloha.PastePlugin.WordPasteHandler.handlePaste = function(jqPasteDiv) {
	if (this.detectWordContent(jqPasteDiv)) {
		this.transformWordContent(jqPasteDiv);
	}
};

/**
 * Check whether the content of the given jQuery object is assumed to be pasted from word.
 * @param jqPasteDiv
 * @return true for content pasted from word, false for other content
 */
GENTICS.Aloha.PastePlugin.WordPasteHandler.detectWordContent = function (jqPasteDiv) {
	var wordDetected = false;
	// check every element which was pasted.
	
	jqPasteDiv.find('*').each(function() {
		// get the element style
		var style = jQuery(this).attr('style');
		if (style) {
			// if 'mso' is found somewhere in the style, we found word content
			if (style.toLowerCase().indexOf('mso') >= 0) {
				wordDetected = true;
				return false;
			}
		}
		// get the element class
		var clazz = jQuery(this).attr('class');
		if (clazz) {
			// if 'mso' is found somewhere in the class, we found word content
			if (clazz.toLowerCase().indexOf('mso') >= 0) {
				wordDetected = true;
				return false;
			}
		}
	});
	// return the result
	return wordDetected;
};

/**
 * Check whether the given list span (first span in a paragraph which shall be a list item) belongs to an ordered list
 * @param listSpan
 * @return true for ordered lists, false for unordered
 */
GENTICS.Aloha.PastePlugin.WordPasteHandler.isOrderedList = function(listSpan) {
	// when the span has fontFamily "Wingdings" it is an unordered list
	if (listSpan.css('fontFamily') == 'Wingdings' || listSpan.css('fontFamily') == 'Symbol') {
		return false;
	}
	// otherwise check for a number, letter or '(' as first character
	return listSpan.text().match(/^([0-9]{1,3}\.)|([0-9]{1,3}\)|([a-zA-Z]{1,5}\.)|([a-zA-Z]{1,5}\)))$/) ? true : false;
};

/**
 * Transform lists pasted from word
 * @param jqPasteDiv
 */
GENTICS.Aloha.PastePlugin.WordPasteHandler.transformListsFromWord = function (jqPasteDiv) {
	var that = this;

	// this will be the class to mark paragraphs that will be transformed to lists
	var listElementClass = 'aloha-list-element';
	var bulletClass = 'aloha-list-bullet';

	// first step is to find all paragraphs which will be converted into list elements and mark them by adding the class 'aloha-list-element'
	var detectionFilter = 'p.MsoListParagraphCxSpFirst,p.MsoListParagraph,p span';
	var paragraphs = jqPasteDiv.find(detectionFilter);
	paragraphs.each(function() {
		var jqElem = jQuery(this);
		// detect special classes
		if (jqElem.hasClass('MsoListParagraphCxSpFirst') || jqElem.hasClass('MsoListParagraph')) {
			jqElem.addClass(listElementClass);
		} else if (jqElem.css('font-family').indexOf('Symbol') >= 0) {
			jqElem.closest('p').addClass(listElementClass);
		} else if (jqElem.css('font-family').indexOf('Wingdings') >= 0) {
			jqElem.closest('p').addClass(listElementClass);
		} else if (jqElem.css('mso-list') && jqElem.css('mso-list') != '') {
			jqElem.closest('p').addClass(listElementClass);
		}
	});

	// now we search for paragraphs with three levels of nested spans, where the innermost span contains nothing but &nbsp;
	detectionFilter = 'p span span span';
	var spans = jqPasteDiv.find(detectionFilter);
	spans.each(function() {
		var jqElem = jQuery(this);
		var innerText = jqElem.text().trim().replace(/&nbsp;/g, '');
		if (innerText.length == 0) {
			// check whether the outermost of the three spans contains nothing more than numbering
			var outerText = jqElem.parent().parent().text().trim().replace(/&nbsp;/g, '');

			// patterns for list numbering
			// 1.
			// 1)
			// (1)
			// a.
			// a)
			// I.
			// i.
			// o § (or any other single character)
			if (outerText.match(/^([0-9]{1,3}\.)|([0-9]{1,3}\))|([a-zA-Z]{1,5}\.)|([a-zA-Z]{1,5}\))|(.)$/)) {
				jqElem.closest('p').addClass(listElementClass);
				jqElem.parent().parent().addClass(bulletClass);
			}
		}
	});

	// no detect all marked paragraphs and transform into lists
	detectionFilter = 'p.' + listElementClass;
	var negateDetectionFilter = ':not('+detectionFilter+')';
	paragraphs = jqPasteDiv.find(detectionFilter);

	if (paragraphs.length > 0) {
		paragraphs.each(function() {
			var jqElem = jQuery(this);
			jqElem.removeClass(listElementClass);
			// first remove all font tags
			jqElem.find('font').each(function() {
				jQuery(this).contents().unwrap();
			});
			
			// initialize the nestlevel and the margin (we will try to detect nested
			// lists by comparing the left margin)
			var nestLevel = 0;
			var margin = parseFloat(jqElem.css('marginLeft'));
			// this array will hold all ul/ol elements
			var lists = [];
			// get all following list elements
			var following = jqElem.nextUntil(negateDetectionFilter);
			
			// get the first span in the element
			var firstSpan = jQuery(jqElem.find('span.' + bulletClass));
			if (firstSpan.length == 0) {
				firstSpan = jQuery(jqElem.children('span:first'));
			}
			// use the span to detect whether the list shall be ordered or unordered
			var ordered = that.isOrderedList(firstSpan);
			// finally remove the span (numbers, bullets are rendered by the browser)
			firstSpan.remove();
			
			// create the list element
			var jqList = jQuery(ordered ? '<ol></ol>' : '<ul></ul>');
			lists.push(jqList);
			
			// add a new list item
			var jqNewLi = jQuery('<li></li>');
			// add the li into the list
			jqList.append(jqNewLi);
			// append the contents of the old dom element to the li
			jqElem.contents().appendTo(jqNewLi);
			// replace the old dom element with the new list
			jqElem.replaceWith(jqList);
			
			// now proceed all following list elements
			following.each(function() {
				var jqElem = jQuery(this);
				// remove all font tags
				jqElem.find('font').each(function() {
					jQuery(this).contents().unwrap();
				});
				// check the new margin
				var newMargin = parseFloat(jqElem.css('marginLeft'));
				
				// get the first span
				firstSpan = jQuery(jqElem.find('span.' + bulletClass));
				if (firstSpan.length == 0) {
					firstSpan = jQuery(jqElem.children('span:first'));
				}
				// ... and use it to detect ordered/unordered list elements (this
				// information will only be used at the start of a new list anyway)
				ordered = that.isOrderedList(firstSpan);
				// remove the span
				firstSpan.remove();
				
				// check for nested lists by comparing the margins
				if (newMargin > margin) {
					// create a new list
					var jqNewList = jQuery(ordered ? '<ol></ol>' : '<ul></ul>');
					// append the new list to the last list item of the prior list
					jqList.children(':last').append(jqNewList);
					
					// store the list and increase the nest level
					jqList = jqNewList;
					lists.push(jqList);
					nestLevel++;
					margin = newMargin;
				} else if (newMargin < margin && nestLevel > 0) {
					// end nested list and append element to outer list
					lists.pop();
					nestLevel--;
					jqList = lists[nestLevel];
					margin = newMargin;
				}
				
				// create a list item
				jqNewLi = jQuery('<li></li>');
				// add the li into the list
				jqList.append(jqNewLi);
				// append the contents of the old dom element to the li
				jqElem.contents().appendTo(jqNewLi);
				// remove the old dom element
				jqElem.remove();
			});
		});
	}
};

/**
 * Transform Title and Subtitle pasted from word
 * @param jqPasteDiv
 */
GENTICS.Aloha.PastePlugin.WordPasteHandler.transformTitles = function(jqPasteDiv) {
	jqPasteDiv.find('p.MsoTitle').each(function() {
		// titles will be transformed to h1
		GENTICS.Aloha.Markup.transformDomObject(jQuery(this), 'h1');
	});
	jqPasteDiv.find('p.MsoSubtitle').each(function() {
		// titles will be transformed to h1
		GENTICS.Aloha.Markup.transformDomObject(jQuery(this), 'h2');
	});
};

/**
 * This is the main transformation method
 * @param jqPasteDiv
 */
GENTICS.Aloha.PastePlugin.WordPasteHandler.transformWordContent = function (jqPasteDiv) {
	// transform lists
	this.transformListsFromWord(jqPasteDiv);

	// transform titles
	this.transformTitles(jqPasteDiv);
};
