/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
define(
['aloha', 'aloha/jquery', 'aloha/contenthandlermanager'],
function( Aloha, jQuery, ContentHandlerManager ) {
	"use strict";

	var WordContentHandler = ContentHandlerManager.createHandler({
		/**
		 * Handle the pasting. Try to detect content pasted from word and transform to clean html
		 * @param content
		 */
		handleContent: function( content ) {
			if ( typeof content === 'string' ){
				content = jQuery( '<div>' + content + '</div>' );
			} else if ( content instanceof jQuery ) {
				content = jQuery( '<div>' ).append(content);
			}

			if (this.detectWordContent(content)) {
				this.transformWordContent(content);
			}

			return content.html();
		},

		/**
		 * Check whether the content of the given jQuery object is assumed to be pasted from word.
		 * @param content
		 * @return true for content pasted from word, false for other content
		 */
		detectWordContent: function (content) {
			var wordDetected = false;
			// check every element which was pasted.

			content.find('*').each(function() {
				// get the element style
				var style = jQuery(this).attr('style'),
					clazz;

				if (style) {
					// if 'mso' is found somewhere in the style, we found word content
					if (style.toLowerCase().indexOf('mso') >= 0) {
						wordDetected = true;
						return false;
					}
				}
				// get the element class
				clazz = jQuery(this).attr('class');
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
		},

		/**
		 * Check whether the given list span (first span in a paragraph which shall be a list item) belongs to an ordered list
		 * @param listSpan
		 * @return true for ordered lists, false for unordered
		 */
		isOrderedList: function(listSpan) {
			// when the span has fontFamily "Wingdings" it is an unordered list
			if (listSpan.css('fontFamily') == 'Wingdings' || listSpan.css('fontFamily') == 'Symbol') {
				return false;
			}
			// otherwise check for a number, letter or '(' as first character
			return listSpan.text().match(/^([0-9]{1,3}\.)|([0-9]{1,3}\)|([a-zA-Z]{1,5}\.)|([a-zA-Z]{1,5}\)))$/) ? true : false;
		},

		/**
		 * Transform lists pasted from word
		 * @param content
		 */
		transformListsFromWord: function (content) {
			var that = this,
				negateDetectionFilter, detectionFilter, spans,
				paragraphs, bulletClass, listElementClass;

			// this will be the class to mark paragraphs that will be transformed to lists
			listElementClass = 'aloha-list-element';
			bulletClass = 'aloha-list-bullet';

			// first step is to find all paragraphs which will be converted into list elements and mark them by adding the class 'aloha-list-element'
			detectionFilter = 'p.MsoListParagraphCxSpFirst,p.MsoListParagraph,p span';
			paragraphs = content.find(detectionFilter);
			paragraphs.each(function() {
				var jqElem = jQuery(this),
					fontFamily = jqElem.css('font-family') || '',
					msoList = jqElem.css('mso-list') || '',
					style = jqElem.attr('style') || '';

				// detect special classes
				if (jqElem.hasClass('MsoListParagraphCxSpFirst') || jqElem.hasClass('MsoListParagraph')) {
					jqElem.addClass(listElementClass);
				} else if (fontFamily.indexOf('Symbol') >= 0) {
					jqElem.closest('p').addClass(listElementClass);
				} else if (fontFamily.indexOf('Wingdings') >= 0) {
					jqElem.closest('p').addClass(listElementClass);
				} else if (msoList !== '') {
					jqElem.closest('p').addClass(listElementClass);
				} else if (style.indexOf('mso-list') >= 0) {
					jqElem.closest('p').addClass(listElementClass);
				}
			});

			// now we search for paragraphs with three levels of nested spans, where the innermost span contains nothing but &nbsp;
			detectionFilter = 'p span span span';
			spans = content.find(detectionFilter);
			spans.each(function() {
				var jqElem = jQuery(this),
					innerText = jqElem.text().trim().replace(/&nbsp;/g, ''),
					outerText;

				if (innerText.length === 0) {
					// check whether the outermost of the three spans contains nothing more than numbering
					outerText = jqElem.parent().parent().text().trim().replace(/&nbsp;/g, '');

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
			negateDetectionFilter = ':not('+detectionFilter+')';
			paragraphs = content.find(detectionFilter);

			if (paragraphs.length > 0) {
				paragraphs.each(function() {
					var jqElem = jQuery(this),
						jqNewLi, jqList, ordered, firstSpan, following, lists, margin, nestLevel;

					jqElem.removeClass(listElementClass);
					// first remove all font tags
					jqElem.find('font').each(function() {
						jQuery(this).contents().unwrap();
					});

					// initialize the nestlevel and the margin (we will try to detect nested
					// lists by comparing the left margin)
					nestLevel = 0;
					margin = parseFloat(jqElem.css('marginLeft'));
					// this array will hold all ul/ol elements
					lists = [];
					// get all following list elements
					following = jqElem.nextUntil(negateDetectionFilter);

					// get the first span in the element
					firstSpan = jQuery(jqElem.find('span.' + bulletClass));
					if (firstSpan.length === 0) {
						firstSpan = jQuery(jqElem.children('span:first'));
					}
					// use the span to detect whether the list shall be ordered or unordered
					ordered = that.isOrderedList(firstSpan);
					// finally remove the span (numbers, bullets are rendered by the browser)
					firstSpan.remove();

					// create the list element
					jqList = jQuery(ordered ? '<ol></ol>' : '<ul></ul>');
					lists.push(jqList);

					// add a new list item
					jqNewLi = jQuery('<li></li>');
					// add the li into the list
					jqList.append(jqNewLi);
					// append the contents of the old dom element to the li
					jqElem.contents().appendTo(jqNewLi);
					// replace the old dom element with the new list
					jqElem.replaceWith(jqList);

					// now proceed all following list elements
					following.each(function() {
						var jqElem = jQuery(this),
							newMargin, jqNewList;

						// remove all font tags
						jqElem.find('font').each(function() {
							jQuery(this).contents().unwrap();
						});
						// check the new margin
						newMargin = parseFloat(jqElem.css('marginLeft'));

						// get the first span
						firstSpan = jQuery(jqElem.find('span.' + bulletClass));
						if (firstSpan.length === 0) {
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
							jqNewList = jQuery(ordered ? '<ol></ol>' : '<ul></ul>');
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
		},

		/**
		 * Transform Title and Subtitle pasted from word
		 * @param content
		 */
		transformTitles: function(content) {
			content.find('p.MsoTitle').each(function() {
				// titles will be transformed to h1
				Aloha.Markup.transformDomObject(jQuery(this), 'h1');
			});
			content.find('p.MsoSubtitle').each(function() {
				// titles will be transformed to h1
				Aloha.Markup.transformDomObject(jQuery(this), 'h2');
			});
		},

		/**
		 * This is the main transformation method
		 * @param content
		 */
		transformWordContent: function (content) {
			// transform lists
			this.transformListsFromWord(content);

			// transform titles
			this.transformTitles(content);
		}
	});
	
	return WordContentHandler;
});