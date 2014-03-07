/*!
 * Aloha Editor
 * Author & Copyright (c) 2012 Gentics Software GmbH
 * aloha-sales@gentics.com
 * Licensed under the terms of http://www.aloha-editor.com/license.html
 */
define('RepositoryBrowser', [
	'jquery',
	'Class',
	'PubSub',
	'repository-browser-i18n-' + (
		(window && window.__DEPS__ && window.__DEPS__.lang) || 'en'
	),
	'jstree',
	'jqgrid',
	'jquery-layout'
], function (
	$,
	Class,
	PubSub,
	i18n
) {
	'use strict';

	var jQuery = $;
	var browserInstances = [];
	var numOpenedBrowsers = 0;
	var uid = (new Date()).getTime();
	var DEFAULTS = {
		repositoryManager: null,
		repositoryFilter: [],
		objectTypeFilter: [],
		renditionFilter: ['cmis:none'], // ['*']
		filter: ['url'],
		element: null,
		isFloating: false,
		verticalPadding: 100,
		horizontalPadding: 50,
		maxHeight: 1000,
		minHeight: 400,
		minWidth: 400,
		maxWidth: 1200,
		treeWidth: 300,
		listWidth: 'auto',
		pageSize: 8,
		adaptPageSize: false,
		rowHeight: 32,
		rootPath: '',
		rootFolderId: 'aloha',
		columns: {
			icon:    {title: '',        width: 30,  sortable: false, resizable: false},
			name:    {title: 'Name',    width: 200, sorttype: 'text'},
			url:     {title: 'URL',     width: 220, sorttype: 'text'},
			preview: {title: 'Preview', width: 150, sorttype: 'text'}
		},
		i18n: {
			'Browsing': 'Browsing',
			'Close': 'Close',
			'in': 'in',
			'Input search text...': 'Input search text...',
			'numerous': 'numerous',
			'of': 'of',
			'Repository Browser': 'Repository Browser',
			'Search': 'Search',
			'Searching for': 'Searching for',
			'Viewing': 'Viewing'
		}
	};

	/**
	 * Prevents native browser selection on the given element.
	 *
	 * @param {jQuery.<HTMLElement>} element An element on which to prevent
	 *                                       selection.
	 */
	function disableSelection($element) {
		$element.each(function () {
			jQuery(this)
				.attr('unselectable', 'on')
				.css({
				   '-moz-user-select': 'none',
				   '-webkit-user-select': 'none',
				   'user-select': 'none'
				})
				.each(function () {
				   this.onselectstart = function () { return false; };
				});
		});
	}

	/**
	 * Get icon name from given resource type.
	 *
	 * @param {string} type Resource type.
	 * @return {string} Icon name.
	 */
	function getIcon(type) {
		switch (type) {
		case 'folder':
			return 'folder';
		case 'document':
			return 'document';
		default:
			return '';
		}
	}

	/**
	 * Return unique id.
	 *
	 * @return {number}
	 */
	function uniqueId() {
		return ++uid;
	}

	/**
	 * FIXME: free cache
	 *
	 * @param {RepositoryBrowser} browser
	 * @param {object} obj
	 */
	function cacheWrite(browser, obj) {
		browser._cachedRepositoryObjects[obj.uid] = obj;
	}

	/**
	 * @param {RepositoryBrowser} browser
	 * @param {object} obj
	 * @return {object}
	 */
	function cacheRead(browser, uid) {
		return browser._cachedRepositoryObjects[uid];
	}

	/**
	 * @param {jQuery.<HTMLElement>} $node
	 * @return {string} Id of repository object tethered to the given DOM
	 *                  element.
	 */
	function getIdFromTreeNode($node) {
		return $node.find('a:first').attr('data-repo-obj');
	}

	/**
	 * Composite for jqGrid and jsTree
	 *
	 * Convert a repository object into an object that can be used with our tree
	 * component.  Also add a reference to this object in the cache.  According
	 * to the Repository specification, each object will at least have the
	 * following properties: id, name, url, and type.  Any and all other
	 * attributes are optional.
	 */
	function createComposite(props, browser) {
		var uid = uniqueId();

		var state =
				(false === props.hasMoreItems || 'folder' !== props.baseType)
				  ? null
				  : 'closed';

		// Initialize as array instead? will jstree accept empty list?
		var children = null;

		if (props.children) {
			state = 'open';
			children = [];
			var i;
			var child;
			for (i = 0; i < props.children.length; i++) {
				child = createComposite(props.children[i], browser);
				children.push(child);
				cacheWrite(browser, child.resource);
			}
		}

		var treeResource = $.extend(props, {
			uid: uid,
			loaded: false
		});

		return {
			state: state,
			resource: treeResource,
			children: children,
			// jsTreee <li> attributes
			attr: {
				rel: props.type,
				'data-repo-obj': uid
			},
			data: {
				title: props.name,
				icon: getIcon(props.baseType),
				attr: {
					'data-repo-obj': uid
				}
			}
		};
	}

	var RepositoryBrowser = Class.extend({

		/**
		 * @private
		 * @type <object> The repository objects queried through this browser.
		 */
		_cachedRepositoryObjects: {},

		/**
		 * @private
		 * @type <string> The last search query.
		 */
		_searchQuery: null,

		/**
		 * @private
		 * @type <?>
		 */
		_orderBy: null,

		/**
		 * @private
		 * @type <string> prefilled value of the search field
		 */
		_prefilledValue: null,

		/**
		 * @type {jsGrid<HTMLElement>}
		 */
		$_grid: null,

		/**
		 * @type {jsTree<HTMLElement>}
		 */
		$_tree: null,

		/**
		 * @type {jQuery.<HTMLElement>} The layout of the browser panels.
		 */
		$_list: null,

		/**
		 * @type {boolean} Whether or not the browser is visibly opened.  This
		 *                 flag is set to true when the show() function is
		 *                 called.
		 */
		_isOpened: true,

		/**
		 * @constructor
		 */
		_constructor: function () {
			this.init.apply(this, arguments);
		},

		/**
		 * Process the given browser configurations, and renders a hidden
		 * instance of this browser.
		 *
		 * @param {object} options User defined custom browser configurations.
		 */
		init: function (options) {
			options = jQuery.extend({}, DEFAULTS, options, {i18n: i18n});

			// If no element was specified on which to render the browser, then
			// we will create an overlay and render the browser on it.
			if (!options.element || 0 === options.element.length) {
				options.isFloating = true;
				options.element = this._createOverlay();
			}

			if (options.maxWidth < options.minWidth) {
				options.maxWidth = options.minWidth;
			}

			jQuery.extend(this, options);

			this._prefilledValue = this._i18n('Input search text...');
			this._cachedRepositoryObjects = {};
			this._searchQuery = null;
			this._orderBy = null;
			this._pagingCount = null;
			this._pagingOffset = 0;
			this._pagingBtns = {
				first: null,
				end: null,
				next: null,
				prev: null
			};

			this._initializeUI();
			browserInstances.push(this);
			PubSub.pub('repository-browser.initialized', {data: this});
		},

		/**
		 * Retrieves the corresponding internationalization string for the
		 * given keyword.
		 *
		 * @param {string} key The key for which a full i18n string is
		 *                     retrieved.
		 * @return {string} The return value is either the i18n value matched
		 *                  by the given key, or else the key.
		 */
		_i18n: function (key) {
			return this.i18n[key] || key;
		},

		/**
		 * Prepares the browser UI.
		 */
		_initializeUI: function () {
			this.element.attr('data-repository-browser', ++uid); //.html('');
			this.element.width(this.maxWidth);

			this.$_grid = this._createGrid(this.element).resize();
			this._setInitialHeight();
			this.$_tree = this._createTree(this.$_grid.find('.ui-layout-west'));
			this.$_list = this._createList(this.$_grid.find('.ui-layout-center'));

			var that = this;
			var give = this.treeWidth / 5;

			this.$_grid.layout({
				// Disable cursor hot keys since they interfere with text
				// editing.  For example, CTRL+left (wordwise left) and
				// CTRL+SHIFT+left (select wordwise left) would stop working.
				enableCursorHotkey: false,
				west__size: this.treeWidth - 1,
				west__minSize: this.treeWidth - give,
				west__maxSize: this.treeWidth + give,
				center__size: 'auto',
				paneClass: 'ui-layout-pane',
				resizerClass: 'ui-layout-resizer',
				togglerClass: 'ui-layout-toggler',
				onresize: function (name, $element) {
					if ('center' === name) {
						that.$_list.setGridWidth($element.width());
					}
				}
				// , applyDefaultStyles: true
			}).sizePane('west', this.treeWidth); // Fix for a ui-layout bug in
			                                     // chrome.
			disableSelection(this.$_grid);
			this._preloadImages();

			jQuery(function () {
				jQuery(window).resize(function () {
					that._onWindowResized();
				});
			});

			this.element.mousedown(function () {
				jQuery.each(browserInstances, function (index) {
					this.element.css('z-index', 99999 + index);
				});
				jQuery(this).css('z-index',
					99999 + browserInstances.length + 1);
			});

			// IE7 Work-around: Otherwise tree will not be displayed correctly.
			jQuery('.repository-browser-grid').css('width', this.maxWidth);

			this.close();

			// adapt the page size
			this._adaptPageSize();
		},

		/**
		 * Sets the initial height of the repository browser using the minHeight maxHeight setting.
		 */
		_setInitialHeight: function () {

			var overflow = this.maxHeight - jQuery(window).height() + this.verticalPadding;
			var targetHeight = overflow > 0 ? Math.max(this.minHeight, this.maxHeight - overflow) : this.maxHeight;

			this.$_grid.height(targetHeight);
		},

		/**
		 * Automatically resize the browser modal, constraining its dimensions
		 * between minWidth and maxWidth.
		 */
		_onWindowResized: function () {
			var overflow = this.maxWidth - jQuery(window).width() + this.horizontalPadding, $header, $container;
			var target = overflow > 0
			           ? Math.max(this.minWidth, this.maxWidth - overflow)
					   : this.maxWidth;
			this.element.width(target);
			this.$_grid.width(target);

			this._setInitialHeight();

			// adapt tree
			$header = this.$_grid.find('.repository-browser-tree-header');
			this.$_tree.height(this.$_grid.height() - $header.outerHeight(true));

			// adapt list
			$container = this.$_grid.find('.ui-layout-center');
			$container.find('.ui-jqgrid-bdiv').height(this.$_grid.height() - (
				$container.find('.ui-jqgrid-titlebar').height() +
				$container.find('.ui-jqgrid-hdiv').height() +
				$container.find('.ui-jqgrid-pager').height()
			));

			// adapt paging
			if (this._adaptPageSize()) {
				// if the pagesize changed, we need to refresh the list
				if (this._currentFolder) {
					this._fetchItems(this._currentFolder);
				}
			}
		},

		/**
		 * Preload images used by the browser UI.
		 */
		_preloadImages: function () {
			var path = this.rootPath + 'img/';
			var imgs = [
				'arrow-000-medium.png',
				'arrow-180.png',
				'arrow-315-medium.png',
				'arrow-stop-180.png',
				'arrow-stop.png',
				'arrow.png',
				'control-stop-square-small.png',
				'folder-horizontal-open.png',
				'folder-open.png',
				'magnifier-left.png',
				'page.png',
				'picture.png',
				'sort-alphabet-descending.png',
				'sort-alphabet.png'
			];
			var j = imgs.length;
			while (j) {
				var img = document.createElement('img');
				img.src = path + imgs[--j];
			}
		},

		/**
		 * Process the received repository items.
		 *
		 * @param {Array.<object>} items List objects retrieved by repository
		 *                               manager.
		 * @param {TODO} metainfo
		 * @param {function} callback Function to receive the processed items.
		 */
		_processRepoResponse: function (items, metainfo, callback) {
			// If the second parameter is a function, it is the callback;
			if (typeof metainfo === 'function') {
				callback = metainfo;
				metainfo = undefined;
			}

			var repobrowser = this;
			var collection = [];
			var currentFolder = repobrowser._currentFolder
			                 && repobrowser._currentFolder.id;
			var open = null;
			var composite;
			var i;

			for (i = 0; i < items.length; i++) {
				composite = createComposite(items[i], repobrowser);
				collection.push(composite);
				cacheWrite(repobrowser, composite.resource);

				if (currentFolder === composite.resource.id) {
					open = composite.resource;
				}
			}

			callback(collection, metainfo);

			if (open) {
				window.setTimeout(function () {
					repobrowser.$_tree.jstree(
						'select_node',
						'li[data-repo-obj="' + open.uid + '"]'
					);
				}, 0); // Is this timeout still necessary
			}
		},

		/**
		 * Retrieve the root node, and its children.
		 *
		 * @param {function(object)} callback A function to receive the
		 *                                    retrieved folder structure.
		 */
		_fetchRepoRoot: function (callback) {
			if (!this._currentFolder) {
				// get the selected folder
				this._currentFolder = this.getSelectedFolder();
			}

			if (this.repositoryManager) {
				this.getRepoChildren({
					inFolderId: this.rootFolderId,
					repositoryFilter: this.repositoryFilter
				}, callback);
			}
		},

		/**
		 * Retrieves a cached repository object that is associated with the
		 * given node element.
		 *
		 * @param {jQuery.<HTMLElement> $node The element whose corresponding
		 *                                    repository object is to be
		 *                                    retreived.
		 * @return {!Object} The cached repository object or null if none is
		 *                   found in the cache.
		 */
		_getObjectFromCache: function ($node) {
			if ($node && $node.length) {
				var id = $node.find('a:first').attr('data-repo-obj');
				return this._cachedRepositoryObjects[id];
			}
			return null;
		},

		/**
		 * Queries the repository manager for items contained in folder that
		 * was clicked.
		 *
		 * @param {jQuery.<Event>} $event jQuery event object.  Unused.
		 * @param {object} data An object containing information about the
		 *                      jstree node that was clicked.
		 */
		_onTreeNodeSelected: function ($event, data) {
			// Suppress a bug in jsTree.
			if (data.args[0].context) {
				return;
			}

			var repobrowser = this;
			var folder = cacheRead(repobrowser,
			                       getIdFromTreeNode(data.rslt.obj));

			if (folder) {
				// Reset paging and search
				repobrowser._pagingOffset = 0;
				repobrowser._currentFolder = folder;
				repobrowser._clearSearch();
				repobrowser._fetchItems(folder);
				repobrowser.folderSelected(folder);
			}
		},

		/**
		 * Render and initialize a jstree instance for the given container
		 * element.
		 *
		 * @param {jQuery.<HTMLElement>} $container The element in which the
		 *                                          jstree instance will be
		 *                                          rendered.
		 * @return {jQuery.<HTMLElement>} $tree Element which has been
		 *                                      initialized for jstree.
		 */
		_createTree: function ($container) {
			var $tree = jQuery('<div class="repository-browser-tree">');
			var $header = jQuery('<div class="repository-browser-tree-header' +
				' repository-browser-grab-handle">' +
				this._i18n('Repository Browser') + '</div>');

			$container.append($header, $tree);

			$tree.height(this.$_grid.height() - $header.outerHeight(true));

			$tree.bind('loaded.jstree', function ($event, data) {
				$(this).find('>ul>li:first').css('padding-top', 5);
				// Because jstree `open_node' will add substree items to every
				// item matched by the selector, we need to ensure that
				// `open_node' is invoked for one item at a time.
				$(this).find('li[rel="repository"]:first').each(
					function (i, li) {
						$tree.jstree('open_node', li);
					});
			});

			var that = this;

			// Bind the jsree select node event
			$tree.bind('select_node.jstree', function ($event, data) {
				that._onTreeNodeSelected($event, data);
			});

			// Bind the jsree open node event
			$tree.bind('open_node.jstree', function ($event, data) {
				that.folderOpened(data.rslt.obj);
			});

			// Bind the jsree close node event
			$tree.bind('close_node.jstree', function ($event, data) {
				that.folderClosed(data.rslt.obj);
			});

			$tree.jstree({
				types: this.types,
				rootFolderId: this.rootFolderId,
				plugins: ['themes', 'json_data', 'ui', 'types'],
				core: {animation: 250},
				themes: {
					url: this.rootPath + 'css/jstree.css',
					dots: true,
					icons: true,
					theme: 'browser'
				},
				json_data: {
					data: function (nodes, callback) {
						if (that.repositoryManager) {
							that.jstree_callback = callback;
							that._fetchSubnodes(nodes, callback);
						} else {
							callback();
						}
					},
					correct_state: true
				},
				ui: {select_limit: 1}
			});

			return $tree;
		},

		/**
		 * Creates a grid inside the given element.  The grid provides panels
		 * in which we render the folder list tree, and a the folder items
		 * list.
		 *
		 * @param {jQuery.<HTMLElement>} $container A DOM element in which to
		 *                                          render the grid.
		 * @return {jQuery.<HTMLElement} The grid element.
		 */
		_createGrid: function ($container) {
			var $grid = jQuery(
				'<div class="repository-browser-grid\
				             repository-browser-shadow\
							 repository-browser-rounded-top">\
					<div class="ui-layout-west"></div>\
					<div class="ui-layout-center"></div>\
				</div>'
			);
			$container.append($grid);
			return $grid;
		},

		/**
		 * Creates a table inwhich to render repository items.
		 *
		 * @param {jQuery.<HTMLElement>} $container A DOM element in which to
		 *                                          render the list.
		 * @return {jQuery.<HTMLElement} The list element.
		 */
		_createList: function ($container) {
			var $list = jQuery('<table id="repository-browser-list-' + (++uid)
			          + '" class="repository-browser-list"></table>');

			// This is a hidden utility column to help us with auto sorting.
			var model = [{
				name: 'id',
				sorttype: 'int',
				firstsortorder: 'asc',
				hidden: true
			}];

			var names = [''];

			jQuery.each(this.columns, function (key, value) {
				names.push(value.title || '&nbsp;');
				model.push({
					name: key,
					width: value.width,
					sortable: value.sortable,
					sorttype: value.sorttype,
					resizable: value.resizable,
					fixed: value.fixed
				});
			});

			/*
			 * jqGrid requires that we use an id, despite what the
			 * documentation says
			 * (http://www.trirand.com/jqgridwiki/doku.php?id=wiki:pager&s[]=pager).
			 * We need a unique id, however, in order to distinguish pager
			 * elements for each browser instance.
			 */
			var pagerUID = 'repository-browser-list-page-' + (++uid);
			$container.append($list, jQuery('<div id="' + pagerUID + '">'));

			$list.jqGrid({
				datatype: 'local',
				width: $container.width(),
				shrinkToFit: true,
				colNames: names,
				colModel: model,
				caption: '&nbsp;',
				altRows: true,
				altclass: 'repository-browser-list-altrow',
				resizeclass: 'repository-browser-list-resizable',

				// http://www.trirand.com/jqgridwiki/doku.php?id=wiki:pager&s[]=pager
				pager: '#' + pagerUID,

				// # of records to view in the grid.  Passed as parameter to url
				// when retrieving data from server.
				//rowNum: this.pageSize,
				viewrecords: true,

				// Event handlers:
				// http://www.trirand.com/jqgridwiki/doku.php?id=wiki:events
				// Fires after click on [page button] and before populating the
				// data.
				onPaging: function (button) {},

				// Called if the request fails.
				loadError: function (xhr, status, error) {},

				// Raised immediately after row was double clicked.
				ondblClickRow: function (rowid, iRow, iCol, e) {},

				// Fires after all the data is loaded into the grid and all
				// other processes are complete.
				gridComplete: function () {},

				// Executed immediately after every server request.
				loadComplete: function (data) {}
			});

			$container.find('.ui-jqgrid-bdiv').height(this.$_grid.height() - (
				$container.find('.ui-jqgrid-titlebar').height() +
				$container.find('.ui-jqgrid-hdiv').height() +
				$container.find('.ui-jqgrid-pager').height()
			));

			var that = this;

			$list.click(function () {
				that.rowClicked.apply(that, arguments);
			});

			// Override jqGrid paging.
			$container
				.find('.ui-pg-button').unbind()
				.find('>span.ui-icon').each(function () {
					var dir = this.className.match(/ui\-icon\-seek\-([a-z]+)/)[1];
					that._pagingBtns[dir] =
						jQuery(this)
							.parent()
							.addClass('ui-state-disabled')
							.click(function () {
								if (!jQuery(this).hasClass('ui-state-disabled')) {
									that._doPaging(dir);
								}
							});
					});

			// TODO: Implement this once repositories can handle it; hiding it
			// for now.
			$container.find('.ui-pg-input').parent().hide();
			$container.find('.ui-separator').parent().css('opacity', 0).first().hide();
			//$container.find('#repository-browser-list-pager-left').hide();

			this._createTitlebar($container);

			//this.$_grid.find('.loading').html('Loading...');

			// Override jqGrid sorting.
			var listProps = $list[0].p;
			$container.find('.ui-jqgrid-view tr:first th div').each(function (i) {
				if (false !== listProps.colModel[i].sortable) {
					jQuery(this).css('cursor', 'pointer');
					jQuery(this).unbind().click(function (event) {
						event.stopPropagation();
						that._sortList(listProps.colModel[i], this);
					});
				}
			});

			return $list;
		},

		/**
		 * Clear the search
		 */
		_clearSearch: function () {
			var $searchField = this.$_grid.find('.repository-browser-search-field');
			$searchField.val(this._prefilledValue).addClass('repository-browser-search-field-empty');
			this._searchQuery = null;
		},

		_createTitlebar: function ($container) {
			var $bar = $container.find('.ui-jqgrid-titlebar');

			var $btns = jQuery(
				'<div class="repository-browser-btns">\
					<input type="text" class="repository-browser-search-field" />\
					<span class="repository-browser-btn repository-browser-search-btn">\
						<span class="repository-browser-search-icon"></span>\
					</span>\
					<span class="repository-browser-btn repository-browser-close-btn">' +
						this._i18n('Close') +
					'</span>\
					<div class="repository-browser-clear"></div>\
				</div>'
			);

			var that = this;

			$bar.addClass('repository-browser-grab-handle').append($btns);

			$bar.find('.repository-browser-search-btn')
			    .html(this._i18n('Search'))
			    .click(function () {
					that._triggerSearch();
				});

			var $searchField = $bar.find('.repository-browser-search-field');

			this._clearSearch();

			$searchField.keypress(function (event) {
				// On ENTER.
				if (13 === event.keyCode) {
					that._triggerSearch();
				}
			});

			$searchField.focus(function () {
				if (jQuery(this).val() === that._prefilledValue) {
					jQuery(this)
						.val('')
						.removeClass('repository-browser-search-field-empty');
				}
			});

			$searchField.blur(function () {
				if (jQuery(this).val() === '') {
					that._clearSearch();
				}
			});

			$bar.find('.repository-browser-close-btn')
			    .click(function () {
					that.close();
				});

			$bar.find('.repository-browser-btn')
			    .mousedown(function () {
					jQuery(this).addClass('repository-browser-pressed');
				})
			    .mouseup(function () {
					jQuery(this).removeClass('repository-browser-pressed');
				});
		},

		_triggerSearch: function () {
			var $searchField = this.$_grid.find('input.repository-browser-search-field');
			var searchValue = $searchField.val();

			if (jQuery($searchField).hasClass('aloha-browser-search-field-empty') ||
			    '' === searchValue) {
				searchValue = null;
			}
			this._pagingOffset = 0;
			this._searchQuery = searchValue;
			this._fetchItems(this._currentFolder);
		},

		/**
		 * TODO: Fix this so that sorting does toggle between desc and asc when
		 *       you click on a column on which we were not sorting.
		 */
		_sortList: function (columnModel, element){
			// Reset sort properties in all column headers.
			this.$_grid.find('span.ui-grid-ico-sort').addClass('ui-state-disabled');

			columnModel.sortorder = ('asc' === columnModel.sortorder)
			                      ? 'desc'
								  : 'asc';

			jQuery(element)
				.find('span.s-ico').show()
				.find('.ui-icon-' + columnModel.sortorder)
				.removeClass('ui-state-disabled');

			this._setSortOrder(columnModel.name, columnModel.sortorder);
			this._fetchItems(this._currentFolder);
		},

		_doPaging: function (dir) {
			switch (dir) {
			case 'first':
				this._pagingOffset = 0;
				break;
			case 'end':
				if ((this._pagingCount % this.pageSize) === 0) {
					// item count is exactly divisible by page size
					this._pagingOffset = this._pagingCount - this.pageSize;
				} else {
					this._pagingOffset = this._pagingCount - (this._pagingCount % this.pageSize);
				}
				break;
			case 'next':
				this._pagingOffset += this.pageSize;
				break;
			case 'prev':
				this._pagingOffset -= this.pageSize;
				// avoid "ot of bounds" situation
				if (this._pagingOffset < 0) {
					this._pagingOffset = 0;
				}
				break;
			}
			this._fetchItems(this._currentFolder);
		},

		/**
		 * Adds new sort fields into the _orderBy array.  If a field already
		 * exists, it will be spliced from where it is and unshifted to the end
		 * of the array.
		 */
		_setSortOrder: function (by, order) {
			var sortItem = {};
			var isFound = false;
			var orderBy = this._orderBy || [];
			var orderItem;
			var field;
			var i;
			sortItem[by] = order || 'asc';

			for (i = 0; i < orderBy.length; ++i) {
				orderItem = orderBy[i];

				for (field in orderItem) {
					if (orderItem.hasOwnProperty(field)) {
						if (field === by) {
							orderBy.splice(i, 1);
							orderBy.unshift(sortItem);
							isFound = true;
							break;
						}
					}
				}

				if (isFound) {
					break;
				}
			}

			if (isFound) {
				orderBy.unshift(sortItem);
			}

			this._orderBy = orderBy;
		},

		_listItems: function (items) {
			var $list = this.$_list.clearGridData();
			var i;
			var obj;
			for (i = 0; i < items.length; i++) {
				obj = items[i].resource;
				$list.addRowData(
					obj.uid,
					jQuery.extend({id: obj.id}, this.renderRowCols(obj))
				);
			}
		},

		/**
		 * Handle repository timeouts
		 */
		handleTimeout: function () {
		},

		_processItems: function (data, metainfo) {
			// If the total number of items is known, we can calculate the
			// number of pages.
			this._pagingCount = (metainfo && jQuery.isNumeric(metainfo.numItems))
			                  ? metainfo.numItems
							  : null; // TODO: should we use undefined?

			this.$_grid.find('.loading').hide();
			this.$_list.show();
			this._listItems(data);

			var CSS_DISABLED = 'ui-state-disabled';
			var $btns = this._pagingBtns;

			if (this._pagingOffset <= 0) {
				$btns.first.add($btns.prev).addClass(CSS_DISABLED);
			} else {
				$btns.first.add($btns.prev).removeClass(CSS_DISABLED);
			}

			if (!jQuery.isNumeric(this._pagingCount)) {
				$btns.end.addClass(CSS_DISABLED);

				if (data.length <= this.pageSize) {
					$btns.next.addClass(CSS_DISABLED);
				} else {
					$btns.next.removeClass(CSS_DISABLED);
				}
			} else if (this._pagingOffset + this.pageSize >= this._pagingCount) {
				$btns.end.add($btns.next).addClass(CSS_DISABLED);
			} else {
				$btns.end.add($btns.next).removeClass(CSS_DISABLED);
			}

			var from;
			var to;

			if (0 === data.length && 0 === this._pagingOffset) {
				from = 0;
				to = 0;
			} else {
				from = this._pagingOffset + 1;
				to = from + data.length - 1;
			}

			this.$_grid.find('.ui-paging-info').html(
				this._i18n('Viewing') + ' ' +
				(from) + ' - '  +
				(to) + ' ' + this._i18n('of') + ' ' +
				(jQuery.isNumeric(this._pagingCount)
					? this._pagingCount : this._i18n('numerous'))
			);

			// when the repository manager reports a timeout, we handle it
			if (metainfo && metainfo.timeout) {
				this.handleTimeout();
			}
		},

		_createOverlay: function () {
			// We only want one overlay element.
			if (0 === jQuery('.repository-browser-modal-overlay').length) {
				jQuery('body').append(
					'<div class="repository-browser-modal-overlay" ' +
						'style="top: -99999px; z-index: 99999;"></div>');
			}

			var that = this;

			// Register a close procedure for each browser instance.
			jQuery('.repository-browser-modal-overlay').click(function () {
				that.close();
			});

			var $container = jQuery(
				'<div class="repository-browser-modal-window"' +
				' style="top: -99999px; z-index: 99999;">');

			jQuery('body').append($container);

			return $container;
		},

		_fetchSubnodes: function (nodes, callback) {
			if (-1 === nodes) {
				this._fetchRepoRoot(callback);
			} else {
				var i;
				for (i = 0; i < nodes.length; i++) {
					var obj = this._getObjectFromCache(nodes.eq(i));
					if (obj) {
						this.fetchChildren(obj, callback);
					}
				}
			}
		},

		// ====================================================================
		// API Methods
		// ====================================================================

		/**
		 * Get child folders of a specified repository node.
		 *
		 * @param {object} params An object containing parameters with which to
		 *                        fetch the objects.
		 * @param {function} callback Function to receive fetched items.
		 */
		getRepoChildren: function (params, callback) {
			if (this.repositoryManager) {
				var that = this;
				this.repositoryManager.getChildren(params, function (items) {
					that._processRepoResponse(items, callback);
				});
			}
		},

		/**
		 * Query repositories for items matching the given parameters.
		 *
		 * @param {object} params An object containing parameters with which to
		 *                        fetch the objects.
		 * @param {function} callback Function to receive fetched items.
		 */
		queryRepository: function (params, callback) {
			if (this.repositoryManager) {
				var that = this;
				this.repositoryManager.query(params, function (response) {
					that._processRepoResponse(
						(response.results > 0) ? response.items : [], {
							numItems: response.numItems,
							hasMoreItems: response.hasMoreItems,
							timeout: response.timeout
						}, callback
					);
				});
			}
		},

		/**
		 * Builds a row that an be rendered in the grid layout from the given
		 * repository item.
		 *
		 * @param {object} item The repository resource to render.
		 * @returns {object} An object representing the rendered row such that
		 *                   it can be used to populate the grid layout.
		 */
		renderRowCols: function (item) {
			var row = {};

			jQuery.each(this.columns, function (name, value) {
				switch (name) {
				case 'icon':
					row.icon = '<div class="repository-browser-icon '
							 + 'repository-browser-icon-' + item.type
							 + '"></div>';
					break;
				default:
					row[name] = item[name] || '--';
				}
			});

			return row;
		},

		/**
		 * User should implement this according to their needs.
		 *
		 * @param {object} item Repository resource for a row.
		 */
		onSelect: function (item) {},

		/**
		 * Fetch an object's children if we haven't already done so.
		 *
		 * @param {object} obj
		 * @param {function} callback A function to receive the fetched
		 *                            children object.
		 */
		fetchChildren: function (obj, callback) {
			if (true === obj.hasMoreItems || 'folder' === obj.baseType) {
				if (false === obj.loaded) {
					var that = this;
					this.getRepoChildren({
						inFolderId: obj.id,
						repositoryId: obj.repositoryId
					}, function (data) {
						that._cachedRepositoryObjects[obj.uid].loaded = true;
						if (typeof callback === 'function') {
							callback(data);
						}
					});
				}
			}
		},

		/**
		 * Handles click events on rows.
		 *
		 * @param {jQuery.<Event>} jQuery event object.
		 * @return {jQuery.<HTMLElement>} The clicked row of null.
		 */
		rowClicked: function ($event) {
			var row = jQuery($event.target).parent('tr');

			if (row.length) {
				var uid = row.attr('id');
				var item = this._cachedRepositoryObjects[uid];
				this.onSelect(item);
				return item;
			}

			return null;
		},

		getFieldOfHeader: function ($th) {
			return $th.find('div.ui-jqgrid-sortable').attr('id').replace('jqgh_', '');
		},

		_fetchItems: function (folder) {
			if (!folder) {
				return;
			}

			// When searching, we do this recursively.
			var recursive = (typeof this._searchQuery === 'string');

			this.$_list.setCaption((typeof this._searchQuery === 'string')
				? this._i18n('Searching for') + ' "' + this._searchQuery + '" ' +
				  this._i18n('in') + ' ' + folder.name
				: this._i18n('Browsing') + ': ' + folder.name);

			this.$_list.hide();
			this.$_grid.find('.loading').show();

			var that = this;

			this.queryRepository({
				repositoryId: folder.repositoryId,
				inFolderId: folder.id,
				queryString: this._searchQuery,
				orderBy: this._orderBy,
				skipCount: this._pagingOffset,
				maxItems: this.pageSize,
				objectTypeFilter: this.objectTypeFilter,
				renditionFilter: this.renditionFilter,
				filter: this.filter,
				recursive: recursive
			}, function (data, metainfo) {
				that._processItems(data, metainfo);
			});
		},

		setObjectTypeFilter: function (otf) {
			this.objectTypeFilter = (typeof otf === 'string') ? [otf] : otf;
		},

		getObjectTypeFilter: function () {
			return this.objectTypeFilter;
		},

		show: function () {
			this.open();
		},

		open: function () {
			if (this._isOpened) {
				return;
			}

			this._isOpened = true;
			var $element = this.element;

			if (this.isFloating) {
				//$element.find('.repository-browser-close-btn').show();
				jQuery('.repository-browser-modal-overlay')
					.stop()
					.css({top: 0, left: 0})
					.show();

				$element.stop().show();

				// recalculate sizes
				this._onWindowResized();
				this.$_grid.resize();

				var win	= jQuery(window);

				$element.css({
					left: this.horizontalPadding / 2,
					top: this.verticalPadding / 2
				}).draggable({
					handle: $element.find('.repository-browser-grab-handle')
				});

				// Wake-up animation.
				this.$_grid.css({
					marginTop: 0,
					opacity: 0
				}).animate({
					marginTop: 0,
					opacity: 1
				}, 1500, 'easeOutExpo', function () {
					// Disable filter to prevent IE<=8 filter bug.
					if (Aloha.browser.msie) {
						jQuery(this).add($element).css(
							'filter',
							'progid:DXImageTransform.Microsoft.gradient(enabled=false)'
						);
					}
				});
			} else {
				$element.stop().show().css({
					opacity: 1,
					filter: 'progid:DXImageTransform.Microsoft.gradient(enabled=false)'
				});
				this._onWindowResized();
				this.$_grid.resize();
			}

			++numOpenedBrowsers;
		},

		close: function () {
			if (!this._isOpened) {
				return;
			}

			this._isOpened = false;

			this.element.fadeOut(250, function () {
				jQuery(this).css('top', 0).hide();
				if (0 === numOpenedBrowsers || 0 === --numOpenedBrowsers) {
					jQuery('.repository-browser-modal-overlay').hide();
				}
			});
		},

		/**
		 * Refreshes the browser.
		 * TODO: Should we also refresh the tree?
		 */
		refresh: function () {
			// Refresh the list, if we have a current folder.
			if (this._currentFolder) {
				this._fetchItems(this._currentFolder);
			}
		},

		/**
		 * Gets called when a folder in the tree is opened.
		 *
		 * @param {jQuery.<HTMLElement>} $node Tree node.
		 */
		folderOpened: function($node) {
			var repobrowser = this;
			var folder = cacheRead(repobrowser, getIdFromTreeNode($node));
			if (folder) {
				repobrowser.repositoryManager.folderOpened(folder);
			}
		},

		/**
		 * This function gets called when a folder in the tree is closed
		 *
		 * @param {object} obj	folder data object
		 */
		folderClosed: function(obj) {
			var folder = this._getObjectFromCache(obj);

			if (folder) {
				if (this.repositoryManager) {
					this.repositoryManager.folderClosed(folder);
				}
			}
		},

		/**
		 * This function gets called when a folder in the tree is selected
		 *
		 * @param {object} obj	folder data object
		 */
		folderSelected: function(obj) {
			if (this.repositoryManager) {
				this.repositoryManager.folderSelected(obj);
			}
		},

		/**
		 * Get the selected folder
		 * @return {object} selected folder or undefined
		 */
		getSelectedFolder: function () {
			if (this.repositoryManager) {
				if (typeof this.repositoryManager.getSelectedFolder === 'function') {
					return this.repositoryManager.getSelectedFolder();
				}
			}
		},

		/**
		 * Adapt the page size.
		 * @return true if the page size was actually changed, false if not
		 */
		_adaptPageSize: function () {
			var listHeight, newPageSize, container;

			// if this is off, don't do anything
			if (!this.adaptPageSize || !this.$_list || !this.rowHeight) {
				return false;
			}

			// get the current height of the container
			container = this.$_grid.find('.ui-jqgrid-bdiv');
			// reduce by 20 px to leave place for a scrollbar
			listHeight = container.innerHeight() - 20;

			// do the math
			if (listHeight) {
				newPageSize = Math.floor(listHeight / this.rowHeight);
				if (newPageSize <= 0) {
					newPageSize = 1;
				}
				if (newPageSize !== this.pageSize) {
					this.pageSize = newPageSize;
					return true;
				} else {
					return false;
				}
			} else {
				return false;
			}
		}
	});

	return RepositoryBrowser;
});
define('repository-browser-i18n-de', [], function () {
	'use strict';
	return {
		'Browsing': 'Durchsuchen',
		'Close': 'Schließen',
		'in': 'in',
		'Input search text...': 'Suchtext einfügen...',
		'numerous': 'zahlreiche',
		'of': 'von',
		'Repository Browser': 'Repository Browser',
		'Search': 'Suchen',
		'Searching for': 'Suche nach',
		'Viewing': 'Anzeige',
		'button.switch-metaview.tooltip': 'Zwischen Metaansicht und normaler Ansicht umschalten'
	};
});
define('repository-browser-i18n-en', [], function () {
	'use strict';
	return {
		'Browsing': 'Browsing',
		'Close': 'Close',
		'in': 'in',
		'Input search text...': 'Input search text...',
		'numerous': 'numerous',
		'of': 'of',
		'Repository Browser': 'Repository Browser',
		'Search': 'Search',
		'Searching for': 'Searching for',
		'Viewing': 'Viewing',
		'button.switch-metaview.tooltip': 'Switch between meta and normal view'
	};
});
