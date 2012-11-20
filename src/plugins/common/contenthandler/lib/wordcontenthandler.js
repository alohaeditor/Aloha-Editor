/* wordcontenthandler.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2012 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * Aloha Editor is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or any later version.
 *
 * Aloha Editor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 *
 * As an additional permission to the GNU GPL version 2, you may distribute
 * non-source (e.g., minimized or compacted) forms of the Aloha-Editor
 * source code without the copy of the GNU GPL normally required,
 * provided you include this license notice and a URL through which
 * recipients can access the Corresponding Source.
 */
define([
	'jquery',
	'aloha',
	'aloha/contenthandlermanager',
	'contenthandler/contenthandler-utils',
	'util/dom'
], function (
	$,
	Aloha,
	Manager,
	Utils,
	Dom
) {
	'use strict';

	var jQuery = $;

	/**
	 * Matches the string "mso".
	 *
	 * @type {RexExp}
	 * @const
	 */
	var MSO = /mso/;

	/**
	 * Matches string starting with "#".
	 *
	 * @type {RexExp}
	 * @const
	 */
	var HASH_HREF = /^#(.*)/;

	/**
	 * Checks whether the given node is empty, ignoring white spaces.
	 *
	 * @param {jQuery.<HTMLElement>} $node
	 * @return {boolean} True if $node is empty.
	 */
	function isEmpty($node) {
		switch ($node[0].nodeName.toLowerCase()) {
		case 'table':
			return 0 === $node.find('tbody,tr').length;
		case 'tbody':
			return 0 === $node.find('tr').length;
		case 'tr':
			return 0 === $node.find('td,th').length;
		default:
			return '' === $.trim($node.text());
		}
	}

	/**
	 * Checks whether the given content element can be assumed to originate
	 * from Microsoft Word.
	 *
	 * @param {jQuery.<HTMLElement>} $content
	 * @return True if the content is determined to originate from an
	 *         office document.
	 */
	function isWordContent($content) {
		// Because reading the html of the content is way faster than iterating
		// its entire node tree, therefore we attempt this first.
		if (0 === $content.length || !MSO.test($content[0].outerHTML)) {
			return false;
		}
		var $nodes = $content.find('*');
		var i;
		var style;
		var classNames;
		// Because if "mso" is found somewhere in the style or class names then
		// the content originated form MS Word.
		for (i = 0; i < $nodes.length; i++) {
			style = $nodes.eq(i).attr('style');
			if (style && style.toLowerCase().indexOf('mso') >= 0) {
				return true;
			}
			classNames = $nodes.eq(i).attr('class');
			if (classNames && classNames.toLowerCase().indexOf('mso') >= 0) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Cleanup MS Word HTML.
	 *
	 * @param {jQuery.<HTMLElement>} $content
	 */
	function clean($content) {
		var $nodes = $content.find('*');
		var nodeName;
		var $node;
		var href;
		var i;
		for (i = 0; i < $nodes.length; i++) {
			$node = $nodes.eq(i);
			nodeName = $node[0].nodeName.toLowerCase();

			if ('a' === nodeName) {

				// Because when a href starts with #, it's the link to an
				// anchor and should be removed.
				href = $node.attr('href');
				if (href && HASH_HREF.test($.trim(href))) {
					$node.contents().unwrap();
				}
			} else if ('div' === nodeName || 'span' === nodeName) {

				// Because footnotes for example are wrapped in divs and should
				// be unwrap.
				$node.contents().unwrap();
			} else if ('td' !== nodeName && isEmpty($node)) {

				// Because any empty element (like spaces wrapped in spans) are
				// not needed, except table cells.
				$node.contents().unwrap();
			}
		}
	}

	/**
	 * Transform Title and Subtitle from MS Word.
	 *
	 * @param {jQuery.<HTMLElement>} $content
	 */
	function transformTitles($content) {
		$content.find('p.MsoTitle').each(function () {
			Aloha.Markup.transformDomObject($(this), 'h1');
		});
		$content.find('p.MsoSubtitle').each(function () {
			Aloha.Markup.transformDomObject($(this), 'h2');
		});
	}

	var WordContentHandler = Manager.createHandler({

		/**
		 * Handle content pasted from Word or Open/Libre Office.
		 *
		 * Tries to detect content pasted from office document and transforms
		 * into clean HTML.
		 *
		 * @param {jQuery.<HTMLElement>|string} content
		 * @return {string} Clean HTML
		 */
		handleContent: function (content) {
			var $content = Utils.wrapContent(content);
			if (!$content) {
				return content;
			}
			if (isWordContent($content)) {
				this.transformWordContent($content);
			}
			return $content.html();
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
			detectionFilter = 'p.MsoListParagraphCxSpFirst,p.MsoListParagraphCxSpMiddle,p.MsoListParagraphCxSpLast,p.MsoListParagraph,p span';
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
				    innerText = jQuery.trim(jqElem.text()).replace(/&nbsp;/g, ''),
					outerText;
				
				if (innerText.length === 0) {
					// check whether the outermost of the three spans contains nothing more than numbering
					outerText = jQuery.trim(jqElem.parent().parent().text()).replace(/&nbsp;/g, '');

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
			// We also have to include font because if IE9
			negateDetectionFilter = ':not(' + detectionFilter + ', font)';
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
					nestLevel = [];
					margin = parseFloat(jqElem.css('marginLeft'));
					// Fix for not found margin on level 0
					if (isNaN(margin)) {
						margin = 0;
					}
					// this array will hold all ul/ol elements
					lists = [];
					// get all following list elements
					following = jqElem.nextUntil(negateDetectionFilter);

					// get the first span in the element
					firstSpan = jQuery(jqElem.find('span.' + bulletClass));
					if (firstSpan.length === 0) {
						firstSpan = jqElem.find('span').eq(0);
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
						
						if (jqElem.is('font')) {
							//Fix for IE9
							return;
						}

						// remove all font tags
						jqElem.find('font').each(function() {
							jQuery(this).contents().unwrap();
						});
						// check the new margin
						newMargin = parseFloat(jqElem.css('marginLeft'));
						// Fix for not found margin on level 0
						if (isNaN(newMargin)) {
							newMargin = 0;
						}
						
						// get the first span
						firstSpan = jQuery(jqElem.find('span.' + bulletClass));
						if (firstSpan.length === 0) {
							firstSpan = jqElem.find('span').eq(0);
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
							nestLevel.push(newMargin);
							margin = newMargin;
						} else if (newMargin < margin && nestLevel.length > 0) {
							while(nestLevel.length > 0 && nestLevel[nestLevel.length - 1] > newMargin) {
								nestLevel.pop();
								lists.pop();
							}
							// end nested list and append element to outer list
							jqList = lists[lists.length - 1];
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
		 * Remove paragraph numbering from TOC feature
		 * @param content
		*/
		removeParagraphNumbering: function( content ) {
			var detectionFilter = 'h1,h2,h3,h4,h5,h6',
				paragraphs = content.find(detectionFilter);
			
			if (paragraphs.length > 0) {
				paragraphs.each(function() {
					var jqElem = jQuery(this),
						spans = jqElem.find('span'),
						links = jqElem.find('a');
				
					// remove TOC numbering
					spans.each(function() {
						if ( jQuery.trim(jQuery(this).text()).match(/^([\.\(]?[\d\D][\.\(]?){1,4}$/) ) {
							jQuery(this).remove();
						}
					})
				
					// remove TOC anchor links
					links.each(function() {
						// no href, so it's an anchor
						if ( typeof jQuery(this).attr('href') === 'undefined' ) {
							jQuery(this).contents().unwrap();
						}
					});
				
				});
			}
		},

		
		/**
		 * Transform TOC
		 * @param content
		*/
		transformToc: function( content ) {
			var detectionFilter = '[class*=MsoToc]',
				paragraphs = content.find(detectionFilter);

			paragraphs.each(function() {
				var jqElem = jQuery(this),
					spans = jqElem.find('span'),
					links = jqElem.find('a');

				// a table of contents entry looks like
				// 1. Title text ... 5
				// we get rid of the "... 5" part which repesents the page number
				spans.each(function() {
					if ( jQuery(this).attr('style') && jQuery(this).attr('style').search('mso-hide') > -1 ) {
						jQuery(this).remove();
					}
					jQuery(this).contents().unwrap();
				});

				// remove the anchor link of the toc item
				links.each(function() {
					jQuery(this).contents().unwrap();
				});
			});
		},

		/**
		 * This is the main transformation method
		 * @param {jQuery.<HTMLElement>} $content
		 */
		transformWordContent: function ($content) {
			this.transformToc($content);
			this.removeParagraphNumbering($content);
			this.transformListsFromWord($content);
			transformTitles($content);
			clean($content);
		}
	});
	
	return WordContentHandler;
});
