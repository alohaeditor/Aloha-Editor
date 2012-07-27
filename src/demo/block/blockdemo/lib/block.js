/* block.js is part of Aloha Editor project http://aloha-editor.org
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
	'block/block',
	'block/blockmanager',
	'blockdemo/vendor/underscore'
], function(jQuery, block, BlockManager, vcardTemplate) {
	"use strict";

	var CompanyBlock = block.AbstractBlock.extend({
		title: 'Company',

		getSchema: function() {
			return {
				symbol: {
					type: 'string',
					label: 'Stock Quote Name'
				}
			};
		},
		init: function($element, postProcessFn) {
			var that = this;
			$element.mouseover(function() {
				$element.append('<span class="stock-quote-overlay company-' + that.attr('symbol') + '"></span>');
			});
			$element.mouseout(function() {
				$element.find('.stock-quote-overlay').remove();
			});
			postProcessFn();
		},
		update: function($element, postProcessFn) {
			// Mapping Stock-Symbol -- Company Name (Fake!)
			switch (this.attr('symbol')) {
				case 'MSFT':
					$element.html('Microsoft');
					break;
				case 'AAPL':
					$element.html('Apple Inc.');
					break;
				default:
					$element.html(this.attr('symbol'));
			}

			postProcessFn();
		}
	});

	var EditableProductTeaserBlock = block.AbstractBlock.extend({
		title: 'product teaser',

		getSchema: function() {
			return {
				'price': {
					type: 'number',
					label: 'Price'
				}
			}
		},

		update: function($element, postProcessFn) {
			$element.html('<span class="aloha-editable">' + this.attr('title') + '</span> <strong class="price">(' + this.attr('price') + ')</strong>');
			postProcessFn();
		}
	});

	var ProductTeaserBlock = block.AbstractBlock.extend({
		title: 'product teaser',

		getSchema: function() {
			return {
				'title': {
					type: 'string',
					label: 'Product Title'
				},
				'price': {
					type: 'number',
					label: 'Price'
				}
			}
		},

		update: function($element, postProcessFn) {
			$element.html(this.attr('title') + ' <span class="price">(' + this.attr('price') + ' &euro;)</span>');
			postProcessFn();
		}
	});

	var ImageBlock = block.AbstractBlock.extend({
		title: 'Image',
		getSchema: function() {
			return {
				'image': {
					type: 'string',
					label: 'Image URI'
				},
				'position': {
					type: 'select',
					label: 'Position',
					values: [{
						key: '',
						label: 'No Float'
					}, {
						key: 'left',
						label: 'Float left'
					}, {
						key: 'right',
						label: 'Float right'
					}]
				}
			}
		},
		init: function($element, postProcessFn) {
			this.attr('image', $element.find('img').attr('src'));
			postProcessFn();
		},
		update: function($element, postProcessFn) {
			if (this.attr('position') === 'right') {
				$element.css('float', 'right');
			} else if (this.attr('position') === 'left') {
				$element.css('float', 'left');
			} else {
				$element.css('float', '');
			}

			$element.find('img').attr('src', this.attr('image'));
			postProcessFn();
		}
	});

	var EditableImageBlock = ImageBlock.extend({

	});

	var NewsBlock = block.AbstractBlock.extend({
		title: 'News',
		getSchema: function() {
			var that = this;
			return {
				'news': {
					type: 'button',
					buttonLabel: 'Change news',
					callback: function() {
						var numberOfNewsArticles = Math.floor((Math.random()*6)+1);
						alert('Will render ' + numberOfNewsArticles + ' news articles. (This is a placeholder for selecting news articles)');
						that.attr('numberofarticles', numberOfNewsArticles);
					}
				}
			}
		},
		update: function($element, postProcessFn) {
			var numberOfArticlesToBeCreated = this.attr('numberofarticles') - $element.find('.newselement').length;
			if (numberOfArticlesToBeCreated > 0) {
				// Insert specified number of articles
				for (var i=0; i<numberOfArticlesToBeCreated; i++) {
					$element.find('.newselement').first().clone().appendTo($element);
				}
			} else if (numberOfArticlesToBeCreated < 0) {
				// Delete articles
				$element.find('.newselement').slice(numberOfArticlesToBeCreated).remove();
			}
			postProcessFn();
		}
	});

	var SortableNewsBlock = NewsBlock.extend({
		title: 'Sortable News',
		init: function($element, postProcessFn) {
			var that = this;
			$element.sortable({
				stop: function() {
					that._fixScrollPositionBugsInIE();
				},
				cancel: '.aloha-block-handle'
			});

			postProcessFn();
		}
	});

	var ColumnBlock = block.AbstractBlock.extend({
		title: 'Columns',

		getSchema: function() {
			return {
				'columns': {
					type: 'number',
					label: 'Number of Columns',
					range: {
						min: 1,
						max: 4,
						step: 1
					}
				}
			}
		},
		init: function($element, postProcessFn) {
			this.calculateColumnWidths($element);
			postProcessFn();
		},
		update: function($element, postProcessFn) {
			this.updateDataAttributesFromColumnContents($element);

			var numberOfColumns = parseInt(this.attr('columns'));
			var columnDifference = numberOfColumns - $element.children('.column').length;
			if (columnDifference < 0) {
				// we need to remove the last N columns
				$element.children('.column').slice(columnDifference).remove();
			} else {
				// add new columns
				for (var i=0; i<columnDifference; i++) {
					var $column = this.getNewColumn();

					if (this.attr('column-contents-' + (numberOfColumns - columnDifference + i))) {
						$column.html(this.attr('column-contents-' + (numberOfColumns - columnDifference + i)));
					} else {
						$column.html('Some content');
					}

					$element.append($column);
					this.postProcessColumn($column);
				}
			}

			this.calculateColumnWidths($element);
			this.$element.children('.clear').remove();
			this.$element.append(jQuery('<div class="clear" />'));
			postProcessFn();
		},
		getNewColumn: function() {
			return jQuery('<div class="column aloha-editable" />');
		},
		postProcessColumn: function($column) {
		},
		updateDataAttributesFromColumnContents: function($element) {
			var that = this;
			$element.children('.column').each(function(i, el) {
				that.attr('column-contents-' + i, jQuery(el).html());
			});
		},
		calculateColumnWidths: function($element) {
			var numberOfColumns = $element.children('.column').length;
			$element.children('.column').css('width', Math.floor(100 / numberOfColumns) + '%');
		}
	});

	var UneditableColumnBlock = ColumnBlock.extend({
		init: function($element, postProcessFn) {
			var that = this;
			this.calculateColumnWidths($element);
			$element.children('.column').each(function() {
				that.postProcessColumn(jQuery(this));
			})
			postProcessFn();
		},
		getNewColumn: function() {
			return jQuery('<div class="column aloha-block-collection" />');
		},
		postProcessColumn: function($column) {
			var $button = $column.children('button.addNewBlock');
			if ($button.length === 0) {
				$button = jQuery('<button class="addNewBlock">Add new block</button>');
				$column.append($button);
			}
			$button.click(function() {
				var $newBlock = jQuery('<div>Test</div>');
				$newBlock.insertBefore($button);
				$newBlock.alohaBlock({

				});
			});
		}
	});

	return {
		CompanyBlock: CompanyBlock,
		EditableProductTeaserBlock: EditableProductTeaserBlock,
		ProductTeaserBlock: ProductTeaserBlock,
		ImageBlock: ImageBlock,
		EditableImageBlock: EditableImageBlock,
		NewsBlock: NewsBlock,
		SortableNewsBlock: SortableNewsBlock,
		ColumnBlock: ColumnBlock,
		UneditableColumnBlock: UneditableColumnBlock
	};
});