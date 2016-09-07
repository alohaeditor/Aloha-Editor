/*!
 * Repository Browser (https://github.com/gentics/Repository-Browser)
 * Author & Copyright (c) 2012-2014 Gentics Software GmbH
 * aloha-sales@gentics.com
 * Licensed under the terms of http://www.aloha-editor.com/license.html
 */
(function () {
	'use strict';

	function initialize($, Class, PubSub, i18n) {
		var $window = $(window);

		/**
		 * A count of the number of opened repository browsers instances.
		 *
		 * @type {number}
		 */
		var numOpenedBrowsers = 0;

		/**
		 * A list of repository browser instances.
		 *
		 * @type {Array.<Browser>}
		 */
		var instances = [];

		/**
		 * The lowest CSS z-index on for the repository browser overlay and
		 * modals.
		 *
		 * @type {number}
		 */
		var BASE_ZINDEX = 99999;

		/**
		 * Default values from which each repository browser instance will be
		 * created.
		 *
		 * @type {Object}
		 */
		var DEFAULTS = {
			repositoryManager : null,
			repositoryFilter  : [],
			objectTypeFilter  : [],
			renditionFilter   : ['cmis:none'], // ['*']
			filter            : ['url'],
			element           : null,
			isFloating        : false,
			padding           : 50,
			maxHeight         : 1000,
			minHeight         : 400,
			minWidth          : 660,
			maxWidth          : 2000,
			treeWidth         : 300,
			listWidth         : 'auto',
			listShrinkToFit   : true,
			pageSize          : 10,
			adaptPageSize     : false,
			rowHeight         : 24,
			rootPath          : '',
			rootFolderId      : 'aloha',
			columns : {
				icon    : {title: '',        width: 30,  sortable: false, resizable: false},
				name    : {title: 'Name',    width: 200, sorttype: 'text'},
				url     : {title: 'URL',     width: 220, sorttype: 'text'},
				preview : {title: 'Preview', width: 150, sorttype: 'text'}
			},
			i18n: {
				'Browsing'             : 'Browsing',
				'Close'                : 'Close',
				'in'                   : 'in',
				'Input search text...' : 'Input search text...',
				'numerous'             : 'numerous',
				'of'                   : 'of',
				'Repository Browser'   : 'Repository Browser',
				'Search'               : 'Search',
				'Searching for'        : 'Searching for',
				'Viewing'              : 'Viewing'
			}
		};

		/**
		 * Unique identifier counter.
		 *
		 * @type {number}
		 */
		var uid = (new Date()).getTime();

		/**
		 * Returns a unique ID
		 *
		 * @return {number}
		 */
		function unique() {
			return ++uid;
		}

		/**
		 * Enables selection on the given element.
		 *
		 * @param {jQuery.<Element>} $elem
		 */
		function enableSelection($elem) {
			$elem.removeAttr('unselectable');
			$elem.css({
				'-webkit-user-select' : 'text',
//				'-moz-user-select'    : 'text',  // Because this feature is broken in Firefox
				'user-select'         : 'text'
			});
			$elem.onselectstart = null;
		}

		/**
		 * Disables selection on the given element.
		 *
		 * @param {jQuery.<Element>} $elem
		 */
		function disableSelection($elem) {
			$elem.attr('unselectable', 'on');
			$elem.css({
				'-webkit-user-select' : 'none',
//				'-moz-user-select'    : 'none', // Because this feature is broken in Firefox
				'user-select'         : 'none'
			});
			$elem.onselectstart = function () {
				return false;
			};
		}

		/**
		 * Brings the given browser to the top of the z-index.
		 *
		 * @param {Browser} browser
		 */
		function bringToFront(browser) {
			$.each(instances, function (index) {
				this.element.css('z-index', BASE_ZINDEX + index);
			});
			browser.element.css('z-index', BASE_ZINDEX + 1 + instances.length);
		}

		/**
		 * Creates a modal for a repository browser instance.
		 *
		 * @param  {Function}         close
		 * @return {jQuery.<Element>}
		 */
		function modal(close) {
			var $modal = $('<div class="repository-browser-modal-window" style="z-index: ' + BASE_ZINDEX + ';"></div>');
			$('body').append($modal);
			return $modal;
		}

		/**
		 * Creates an overlay element which when clicked will closes all opened
		 * browser instances.
		 */
		function createOverlay() {
			var $overlay = $('<div class="repository-browser-modal-overlay" style="z-index: ' + BASE_ZINDEX + ';"></div>');
			$('body').append($overlay);
			$overlay.click(function () {
				$.each(instances, function (i, browser) {
					browser.close();
				});
			});
		}

		/**
		 * Shows the overlay element.
		 */
		function showOverlay() {
			disableSelection($('body'));
			$('.repository-browser-modal-overlay')
				.stop().css({top: 0, left: 0}).show();
		}

		/**
		 * Hides the overlay element.
		 */
		function hideOverlay() {
			enableSelection($('body'));
			$('.repository-browser-modal-overlay').hide();
		}

		/**
		 * Preloads repository browser images.
		 *
		 * @param {string} path
		 */
		function preload(path) {
			$.each([
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
			], function () {
				document.createElement('img').src = path + 'img/' + this;
			});
		}

		/**
		 * Creates the tree list view of a browser instance.
		 *
		 * @param  {Browser}          browser
		 * @param  {jQuery.<Element>} $container
		 * @param  {number}           height
		 * @return {jQuery.<Element>}
		 */
		function tree(browser, $container, height) {
			var $header = $('<div class="repository-browser-tree-header repository-browser-grab-handle">'
			            + browser._i18n('Repository Browser')
			            + '</div>');

			var $tree = $('<div class="repository-browser-tree"></div>');

			$container.append($header, $tree);

			$tree.height(height - $header.outerHeight(true));

			$tree.bind('loaded.jstree', function (event, data) {
				$(this).find('>ul>li:first').css('padding-top', 5);
				// Because jstree `open_node' will add substree items to every
				// item matched by the selector, we need to ensure that
				// `open_node' is invoked for one item at a time.
				$(this).find('li[rel="repository"]:first').each(function (i, li) {
					$tree.jstree('open_node', li);
				});
			});

			$tree.bind('select_node.jstree', function (event, data) {
				// Suppresses a bug in jsTree
				if (data.args[0].context) {
					return;
				}
				browser.treeNodeSelected(data.rslt.obj);
			});

			$tree.bind('open_node.jstree', function ($event, data) {
				browser.folderOpened(data.rslt.obj);
			});

			$tree.bind('close_node.jstree', function ($event, data) {
				browser.folderClosed(data.rslt.obj);
			});

			$tree.jstree({
				types        : browser.types,
				rootFolderId : browser.rootFolderId,
				plugins      : ['themes', 'json_data', 'ui', 'types'],
				core         : {animation: 250},
				ui           : {select_limit: 1},

				themes: {
					theme : 'browser',
					url   : browser.rootPath + 'css/jstree.css',
					dots  : true,
					icons : true
				},

				json_data: {
					correct_state: true,
					data: function (node, callback) {
						if (browser.manager) {
							browser.jstree_callback = callback;
							browser._fetchSubnodes.call(browser, node, callback);
						} else {
							callback();
						}
					}
				}
			});

			return $tree;
		}

		/**
		 * Creates the grid view of a browser instance.
		 *
		 * @param  {Browser}          browser
		 * @param  {jQuery.<Element>} $container
		 * @return {jQuery.<Element>}
		 */
		function grid(browser, $container) {
			var $grid = $('<div class="repository-browser-grid repository-browser-shadow repository-browser-top">'
			          + '<div class="ui-layout-west"></div>'
			          + '<div class="ui-layout-center"></div>'
			          + '</div>');
			$container.append($grid);
			return $grid;
		}

		/**
		 * Creates the title bar of a browser instance.
		 *
		 * @param  {Browser}          browser
		 * @param  {jQuery.<Element>} $container
		 * @return {jQuery.<Element>}
		 */
		function titlebar(browser, $container) {
			var $title  = $container.find('.ui-jqgrid-titlebar');

			var html = '<div class="repository-browser-btns">'
			         +		'<input type="text" class="repository-browser-search-field" />'
			         +		'<span class="repository-browser-btn repository-browser-search-btn">'
			         +			'<span class="repository-browser-search-icon"></span>'
			         +		'</span>'
			         +		'<span class="repository-browser-btn repository-browser-close-btn">'
			         +			browser._i18n('Close')
			         +		'</span>'
			         +		'<div class="repository-browser-clear"></div>'
			         + '</div>';

			$title.addClass('repository-browser-grab-handle').append(html);

			$title.find('.repository-browser-search-btn').click(function () {
				browser._triggerSearch();
			});

			var $search = $title.find('.repository-browser-search-field').keypress(function (event) {
				// ENTER ←┘
				if (13 === event.keyCode) {
					event.preventDefault();
					browser._triggerSearch();
				}
			});

			$search.val(browser._i18n('Input search text...'))
			       .addClass('repository-browser-search-field-empty');

			$search.focus(function () {
				if ($search.val() === browser._i18n('Input search text...')) {
					$search.val('').removeClass('repository-browser-search-field-empty');
				}
			});

			$search.blur(function () {
				if ('' === $search.val()) {
					$search.val(browser._i18n('Input search text...'))
					       .addClass('repository-browser-search-field-empty');
				}
			});

			$title.find('.repository-browser-close-btn').click(function () {
				browser.close();
			});

			$title.find('.repository-browser-btn')
				.mousedown(function () {
					$(this).addClass('repository-browser-pressed');
				})
				.mouseup(function () {
					$(this).removeClass('repository-browser-pressed');
				});

			return $title;
		}

		/**
		 * Creates the list view of a browser instance.
		 *
		 * @param  {Browser}          browser
		 * @param  {jQuery.<Element>} $container
		 * @param  {number}           height
		 * @return {jQuery.<Element>}
		 */
		function list(browser, $container, height) {
			var $list = $('<table id="list-' + unique() + '" class="repository-browser-list"></table>');

			// Because we need a hidden utility column to help us with auto
			// sorting
			var names = [''];
			var model = [{
				name	       : 'id',
				sorttype       : 'int',
				firstsortorder : 'asc',
				hidden	       : true
			}];

			var shrinkToFit = browser.listShrinkToFit;
			// check if the configured schrinkToFit value is a boolean or a number
			if (typeof shrinkToFit !== 'number' &&  typeof shrinkToFit !== 'boolean') {
				// if not try to convert it to a number
				shrinkToFit = parseInt(shrinkToFit, 10);
				// otherwise check if the original value is 'false' or default to true
				if (isNaN(shrinkToFit)) {
					shrinkToFit = browser.listShrinkToFit !== 'false';
				}
			}

			$.each(browser.columns, function (key, value) {
				names.push(value.title || '&nbsp;');
				model.push({
					name      : key,
					width     : value.width,
					sortable  : value.sortable,
					sorttype  : value.sorttype,
					resizable : value.resizable,
					fixed     : value.fixed
				});
			});

			/**
			 * jqGrid requires that we use an id, despite what the documentation says
			 * (http://www.trirand.com/jqgridwiki/doku.php?id=wiki:pager&s[]=pager):
			 * We need a unique id, however, in order to distinguish pager
			 * elements for each browser instance.
			 */
			var pagerId = 'repository-browser-list-page-' + unique();
			$container.append($list, '<div id="' + pagerId + '" class="repository-browser-grab-handle"></div>');

			$list.jqGrid({
				datatype      : 'local',
				width         : $container.width(),
				shrinkToFit   : shrinkToFit,
				colNames      : names,
				colModel      : model,
				caption       : '&nbsp;',
				altRows       : true,
				altclass      : 'repository-browser-list-altrow',
				resizeclass   : 'repository-browser-list-resizable',
				pager         : pagerId,
				viewrecords   : true,
				onPaging      : function (button) {},
				loadError     : function (xhr, status, error) {},
				ondblClickRow : function (rowid, iRow, iCol, e) {},
				gridComplete  : function () {},
				loadComplete  : function (data) {}
			});

			$container.find('.ui-jqgrid-bdiv').height(height - (
				$container.find('.ui-jqgrid-titlebar').height() +
				$container.find('.ui-jqgrid-hdiv').height() +
				$container.find('.ui-jqgrid-pager').height()
			));

			$list.click(function () {
				browser.rowClicked.apply(browser, arguments);
			});

			// Override jqGrid paging
			$container
				.find('.ui-pg-button').unbind()
				.find('>span.ui-icon').each(function () {
					var $icons = $(this).parent();
					var dir = this.className.match(/ui\-icon\-seek\-([a-z]+)/)[1];
					browser._pagingBtns[dir] = $icons;
					$icons.addClass('ui-state-disabled').click(function () {
						if (!$(this).hasClass('ui-state-disabled')) {
							browser._doPaging(dir);
						}
					});
				});

			$container.find('.ui-pg-input').parent().hide();
			$container.find('.ui-separator').parent().css('opacity', 0).first().hide();

			// Override jqGrid sorting
			var listProps = $list[0].p;
			$container.find('.ui-jqgrid-view tr:first th div').each(function (i) {
				if (false !== listProps.colModel[i].sortable) {
					$(this).css('cursor', 'pointer');
					$(this).unbind().click(function (event) {
						event.stopPropagation();
						browser._sortList(listProps.colModel[i], this);
					});
				}
			});

			titlebar(browser, $container);

			return $list;
		}

		/**
		 * Builds the UI elements for the given browser instance.
		 *
		 * @param  {Browser} browser
		 * @param  {!Object} opts
		 * @return {Object.<string, jQuery.<Element>>}
		 */
		function ui(browser, opts) {
			var $elem = browser.element.attr('data-repository-browser', unique());
			var $grid = grid(browser, $elem);

			$grid.resize();
			$elem.css('width', opts.maxWidth);
			$grid.css('width', opts.maxWidth); // Fix for IE7

			var $tree = tree(browser, $grid.find('.ui-layout-west'), $grid.height());
			var $list = list(browser, $grid.find('.ui-layout-center'), $grid.height());
			var $layout = $grid.layout({
				west__size               : opts.treeWidth - 1,
				west__minSize            : 0,
				west__maxSize            : opts.maxWidth,
				west__enableCursorHotkey : false,
				center__size             : 'auto',
				paneClass                : 'ui-layout-pane',
				resizerClass             : 'ui-layout-resizer',
				togglerClass             : 'ui-layout-toggler',
				onresize                 : function (name, elem) {
					if ('center' === name) {
						$list.setGridWidth(elem.width());
					}
				}
			});

			// Because otherwise IE scrolls the page to the right
			$elem.hide();
			hideOverlay();

			$layout.sizePane('west', opts.treeWidth); // Fix for a ui-layout bug in chrome

			$elem.resizable({
				autoHide  : true,
				minWidth  : opts.minWidth,
				minHeight : opts.minHeight,
				maxWidth  : opts.maxWidth,
				maxHeight : opts.maxHeight,
				handles   : 'all',
				resize    : function (e, ui) {
					browser._resizeHorizontal(opts.maxWidth - ui.size.width);
					browser._resizeVertical(opts.maxHeight - ui.size.height);
					browser._resizeInnerComponents();
				}
			});

			disableSelection($grid);

			$elem.mousedown(function () {
				bringToFront(browser);
			});

			return {
				$elem: $elem,
				$grid: $grid,
				$tree: $tree,
				$list: $list
			};
		}

		/**
		 * Repository Browser.
		 *
		 * Must be initialized with a configured repository manager.
		 *
		 * @class   Browser
		 * @extends Class
		 */
		var Browser = Class.extend({

			opened         : false,

			grid           : null,
			tree           : null,
			list           : null,

			_searchQuery   : null,
			_orderBy       : null,
			_currentFolder : null,

			/**
			 * A cache of repository objects that were queried through any of
			 * the repositories.
			 *
			 * This objec is shared between all instances of the repository
			 * browser! (TODO: we should change this)
			 *
			 * @type <Object.<string, Object>>
			 */
			_objs: {},

			/**
			 * Resize the components of the repository browser:
			 * <ul>
			 *     <li>jsTree</li>
			 *     <li>jqGrid</li>
			 *     <li>List of items inside of jqGrid</li>
			 * </ul>
			 */
			_resizeInnerComponents: function () {
				var $header = this.grid.find('.repository-browser-tree-header');
				var $container = this.grid.find('.ui-layout-center');

				this.tree.height(this.grid.height() - $header.outerHeight(true));

				$container.find('.ui-jqgrid-bdiv').height(this.grid.height() - (
					$container.find('.ui-jqgrid-titlebar').height() +
					$container.find('.ui-jqgrid-hdiv').height() +
					$container.find('.ui-jqgrid-pager').height()
				));

				if (this._adaptPageSize() && this._currentFolder) {
					this._fetchItems(this._currentFolder);
				}
			},

			/**
			 * Resizes the browser element vertically.
			 *
			 * @param {number} overflow Vertical pixel overflow
			 */
			_resizeVertical: function (overflow) {
				var height = (overflow > 0)
				           ? Math.max(this.minHeight, this.maxHeight - overflow)
				           : this.maxHeight;
				this.element.height(height);
				this.grid.height(height);
			},

			/**
			 * Resizes the browser element horizontally.
			 *
			 * @param {number} overflow Horizantal pixel overflow
			 */
			_resizeHorizontal: function (overflow) {
				var width = (overflow > 0)
						  ? Math.max(this.minWidth, this.maxWidth - overflow)
						  : this.maxWidth;
				this.element.width(width);
				this.grid.width(width);
			},

			/**
			 * Check whether resizing is allowed right now.
			 * This acts as a guard against endless resize cycles, that might occur in IE7
			 *
			 * The function will check, whether resizing was called more than 10 times in the same second and
			 * will block any further calls by returning false.
			 *
			 * @return {boolean} true if resizing is allowed, false if not
			 */
			_isResizeAllowed: function () {
				this.callsThisSecond = this.callsThisSecond || 0;
				var now = Math.floor(new Date().getTime() / 1000);
				if (now === this.lastCall) {
					if (this.callsThisSecond >= 10) {
						return false;
					} else {
						this.callsThisSecond++;
						return true;
					}
				} else {
					this.lastCall = now;
					this.callsThisSecond = 1;
					return true;
				}
			},

			/**
			 * Automatically resizes the browser modal, constraining its
			 * dimensions between minWidth and maxWidth.
			 */
			_onWindowResized: function () {
				if (!this._isResizeAllowed()) {
					return;
				}
				this._resizeHorizontal(this.maxWidth - $window.width() + this.padding);
				this._resizeVertical(this.maxHeight - $window.height() + this.padding);
				this._resizeInnerComponents();
			},

			/**
			 * Clears the search field.
			 */
			_clearSearch: function () {
				var $search = this.grid.find('.repository-browser-search-field');
				$search.val(this._i18n('Input search text...'))
				       .addClass('repository-browser-search-field-empty');
				this._searchQuery = null;
			},

			/**
			 * Retrieves the corresponding internationalization string for the
			 * given keyword.
			 *
			 * @param  {string} key The key for which a full i18n string is
			 *                      retrieved
			 * @return {string} The return value is either the i18n value matched
			 *                  by the given key, or else the key
			 */
			_i18n: function (key) {
				return this.i18n[key] || key;
			},

			/**
			 * Adapt the page size.
			 *
			 * @return {boolean} True if the page size was actually changed, false
			 *                   if not
			 */
			_adaptPageSize: function () {
				// if this is off, don't do anything
				if (!this.adaptPageSize || !this.list || !this.rowHeight) {
					return false;
				}
				var $container = this.grid.find('.ui-jqgrid-bdiv');
				// reduce by 20 px to leave place for a scrollbar
				var height = $container.innerHeight() - 20;
				if (height) {
					var newPageSize = Math.floor(height / this.rowHeight);
					if (newPageSize <= 0) {
						newPageSize = 1;
					}
					if (newPageSize !== this.pageSize) {
						this.pageSize = newPageSize;
						return true;
					}
					return false;
				}
				return false;
			},

			_constructor: function () {
				this.init.apply(this, arguments);
			},

			/**
			 * Initializes the browser instance based on the given configuration.
			 *
			 * @param {!Object} config
			 */
			init: function (config) {
				if (!config.repositoryManager) {
					$('body').trigger(
						'repository-browser-error',
						'Repository Manager not configured'
					);
				}

				var browser = this;
				var options = $.extend({}, DEFAULTS, config, {i18n: i18n});

				if (!options.element || 0 === options.element.length) {
					options.isFloating = true;
					options.element = modal();
				}

				browser.manager       = options.repositoryManager;
				browser._objs         = {};
				browser._searchQuery  = null;
				browser._orderBy      = null;
				browser._pagingOffset = 0;
				browser._pagingCount  = undefined; // Because isNaN(null) == false ! *sigh*
				browser._pagingBtns   = {
					first : null,
					end   : null,
					next  : null,
					prev  : null
				};

				$.extend(browser, options);

				preload(options.rootPath);

				var elements = ui(browser, options);

				browser.grid    = elements.$grid;
				browser.list    = elements.$list;
				browser.tree    = elements.$tree;
				browser.element = elements.$elem;

				// Because of legacy support
				browser.$_grid = browser.grid;
				browser.$_list = browser.list;
				browser._cachedRepositoryObjects = browser._objs;

				browser._adaptPageSize();
				browser.close();

				$window.resize(function () {
					browser._onWindowResized();
				});

				if (browser.manager) {
					browser._currentFolder = browser.getSelectedFolder();
					browser._fetchRepoRoot(browser.jstree_callback);
				}

				instances.push(this);

				PubSub.pub('repository-browser.initialized', {data: this});
			},

			/**
			 * Convert a repository object into an object that can be used with
			 * our tree component. Also add a reference to this object in our
			 * objs hash. According to the Repository specification, each object
			 * will at least have the following properties at least: id, name,
			 * url, and type. Any and all other attributes are optional.
			 *
			 * @param  {!Object} obj
			 * @return {Object}
			 */
			harvestRepoObject: function (obj) {
				var uid = unique();
				var resource = this._objs[uid] = $.extend(obj, {
					uid    : uid,
					loaded : false
				});
				return this.processRepoObject(resource);
			},

			/**
			 * Returns an object that is usable with your tree component.
			 *
			 * @param  {!Object} obj
			 * @return {Object}
			 */
			processRepoObject: function (obj) {
				var icon = '', attr, state, children, browser = this;

				switch (obj.baseType) {
				case 'folder':
					icon = 'folder';
					break;
				case 'document':
					icon = 'document';
					break;
				}

				// if the object has a type set, we set it as type to the node
				if (obj.type) {
					attr = {rel: obj.type, 'data-rep-oobj': obj.uid};
				}

				// set the node state
				state = (obj.hasMoreItems || 'folder' === obj.baseType) ? 'closed' : null;
				if (false === obj.hasMoreItems) {
					state = null;
				}

				// process children (if any)
				if (obj.children) {
					children = [];
					$.each(obj.children, function () {
						children.push(browser.harvestRepoObject(this));
						state = 'open';
					});
				}

				if (this._currentFolder && this._currentFolder.id === obj.id) {
					window.setTimeout(function () {
						browser.tree.jstree('select_node', 'li[data-rep-oobj="' + obj.uid + '"]');
					}, 0);
				}

				return {
					data: {
						title : obj.name,
						attr  : {'data-rep-oobj': obj.uid},
						icon  : icon
					},
					attr     : attr,
					state    : state,
					resource : obj,
					children : children
				};
			},

			/**
			 * Processes the repostiory manager response.
			 *
			 * @param {Array}    items
			 * @param {Object}   metainfo
			 * @param {function} callback
			 */
			_processRepoResponse: function (items, metainfo, callback) {
				var browser = this;
				var folderId = browser._currentFolder && browser._currentFolder.id;
				var data = [];
				var openedResource = null;
				// if the second parameter is a function, it is the callback
				if ('function' === typeof metainfo) {
					callback = metainfo;
					metainfo = undefined;
				}
				$.each(items, function () {
					data.push(browser.harvestRepoObject(this));
					if (folderId === this.id) {
						openedResource = this;
					}
				});
				if ('function' === typeof callback) {
					callback.call(browser, data, metainfo);
				}
				if (openedResource) {
					window.setTimeout(function () {
						browser.tree.jstree(
							'select_node',
							'li[data-repo-obj="' + openedResource.uid + '"]'
						);
					}, 0); // Is this timeout still necessary
				}
			},

			/**
			 * Retrieves a cached repository object that is associated with the
			 * given node element.
			 *
			 * @param  {jQuery.<Element>} $node
			 * @return {!Object} The cached repository object or null if none is
			 *                   found in the cache.
			 */
			_getObjectFromCache: function ($node) {
				if ('object' === typeof $node) {
					var uid = $node.find('a:first').attr('data-rep-oobj');
					return this._objs[uid];
				}
			},

			/**
			 * Queries repositories for items matching the given parameters.
			 *
			 * @param {Object}   params   Parameters for repository manager
			 * @param {function} callback Receives fetch results
			 */
			queryRepository: function (params, callback) {
				var browser = this;
				browser.manager.query(params, function (response) {
					var items = (response.results > 0) ? response.items : [];
					browser._processRepoResponse(items, {
						timeout      : response.timeout,
						numItems     : response.numItems,
						hasMoreItems : response.hasMoreItems
					}, callback);
				});
			},

			/**
			 * Lists the given items in the browser list view.
			 *
			 * @param {Array} items
			 */
			_listItems: function (items) {
				var browser = this;
				var $list = this.list.clearGridData();
				$.each(items, function () {
					var obj = this.resource;
					$list.addRowData(
						obj.uid,
						$.extend({id: obj.id}, browser.renderRowCols(obj))
					);
				});
			},

			/**
			 * Processes the items in the given data object.
			 *
			 * @param {Object} data
			 * @param {Object} metainfo
			 */
			_processItems: function (data, metainfo) {
				var $btns = this._pagingBtns;
				var disabled = 'ui-state-disabled';

				// if the total number of items is known, we can calculate the number of pages
				if (metainfo && ('number' === typeof metainfo.numItems)) {
					this._pagingCount = metainfo.numItems;
				} else {
					this._pagingCount = undefined;
				}

				this.grid.find('.loading').hide();
				this.list.show();
				this._listItems(data);

				if (this._pagingOffset <= 0) {
					$btns.first.add($btns.prev).addClass(disabled);
				} else {
					$btns.first.add($btns.prev).removeClass(disabled);
				}

				if (isNaN(this._pagingCount)) {
					$btns.end.addClass(disabled);
					if (data.length <= this.pageSize) {
						$btns.next.addClass(disabled);
					} else {
						$btns.next.removeClass(disabled);
					}
				} else if (this._pagingOffset + this.pageSize >= this._pagingCount) {
					$btns.end.add($btns.next).addClass(disabled);
				} else {
					$btns.end.add($btns.next).removeClass(disabled);
				}

				var from, to;

				if (0 === data.length && 0 === this._pagingOffset) {
					from = 0;
					to = 0;
				} else {
					from = this._pagingOffset + 1;
					to = from + data.length - 1;
				}

				var count = ('number' === typeof this._pagingCount)
				          ? this._pagingCount
				          : this._i18n('numerous');

				this.grid.find('.ui-paging-info')
				    .html(this._i18n('Viewing') + ' ' + from + ' - ' + to + ' '
							+ this._i18n('of') + ' ' + count);

				// when the repository manager reports a timeout, we handle it
				if (metainfo && metainfo.timeout) {
					this.handleTimeout();
				}
			},

			/**
			 * Fetches the sub nodes of the given nodes.
			 *
			 * @param {jQuery.<Element>} $nodes
			 * @param {function}         callback
			 */
			_fetchSubnodes: function ($nodes, callback) {
				var browser = this;
				if (-1 === $nodes) {
					browser._fetchRepoRoot(callback);
				} else {
					$nodes.each(function () {
						var obj = browser._getObjectFromCache($(this));
						if ('object' === typeof obj) {
							browser.fetchChildren(obj, callback);
						}
					});
				}
			},

			/**
			 * Fetches the root node.
			 *
			 * @param {function} callback
			 */
			_fetchRepoRoot: function (callback) {
				this.getRepoChildren({
					inFolderId       : this.rootFolderId,
					repositoryFilter : this.repositoryFilter
				}, function (data) {
					if ('function' === typeof callback) {
						callback(data);
					}
				});
			},

			/**
			 * Fetches items in the given folder.
			 *
			 * @param {Object} folder
			 */
			_fetchItems: function (folder) {
				if (!folder) {
					return;
				}

				var browser = this;
				var isSearching = 'string' === typeof this._searchQuery;

				// Because searching is should always be done recursively
				var recursive = isSearching;

				browser.list.setCaption(isSearching
					? browser._i18n('Searching for')
							+ ' ' + browser._searchQuery
							+ ' ' + browser._i18n('in')
							+ ' ' + folder.name
					: browser._i18n('Browsing') + ': ' + folder.name);

				browser.list.hide();
				browser.grid.find('.loading').show();

				browser.queryRepository({
					repositoryId     : folder.repositoryId,
					inFolderId       : folder.id,
					queryString      : browser._searchQuery,
					orderBy          : browser._orderBy,
					skipCount        : browser._pagingOffset,
					maxItems         : browser.pageSize,
					objectTypeFilter : browser.objectTypeFilter,
					renditionFilter  : browser.renditionFilter,
					filter           : browser.filter,
					recursive		 : recursive
				}, function (data, metainfo) {
					browser._processItems(data, metainfo);
				});
			},

			/**
			 * Fetches an object's children if we haven't already done so.
			 *
			 * @param {Object}   obj      A jsTree list item
			 * @param {function} callback Receives the fetched children
			 */
			fetchChildren: function (obj, callback) {
				var browser = this;
				var hasChildren = true === obj.hasMoreItems || 'folder' === obj.baseType;
				if (hasChildren && false === obj.loaded) {
					browser.getRepoChildren({
						inFolderId   : obj.id,
						repositoryId : obj.repositoryId
					}, function (data) {
						browser._objs[obj.uid].loaded = true;
						if ('function' === typeof callback) {
							callback(data);
						}
					});
				}
			},

			/**
			 * Gets child folders of a specified repository node.
			 *
			 * @param {Object}   params   Parameters for repository manager
			 * @param {function} callback Receives fetch results
			 */
			getRepoChildren: function (params, callback) {
				var browser = this;
				browser.manager.getChildren(params, function (items) {
					browser._processRepoResponse(items, callback);
				});
			},

			/**
			 * Pages the list according to the given direction.
			 *
			 * @param {string} dir
			 */
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
					// avoid "out of bounds" situation
					if (this._pagingOffset < 0) {
						this._pagingOffset = 0;
					}
					break;
				}
				this._fetchItems(this._currentFolder);
			},

			/**
			 * Builds a row that an be rendered in the grid layout from the
			 * given repository item.
			 *
			 * @param   {Object} resource Repository resource to render
			 * @returns {Object} Object representing the rendered row such that
			 *                   it can be used to populate the grid layout
			 */
			renderRowCols: function (resource) {
				var row = {};
				$.each(this.columns, function (colName) {
					switch (colName) {
					case 'icon':
						row.icon = '<div class="repository-browser-icon repository-browser-icon-' + resource.type + '"></div>';
						break;
					default:
						row[colName] = resource[colName] || '--';
					}
				});
				return row;
			},

			/**
			 * Sorts the browser item list.
			 *
			 * TODO: Fix this so that sorting does toggle between desc and asc
			 *		 when you click on a column on which we were not sorting.
			 *
			 * @param {Object}  colModel
			 * @param {Element} elem
			 */
			_sortList: function (colModel, elem) {
				// reset sort properties in all column headers
				this.grid.find('span.ui-grid-ico-sort').addClass('ui-state-disabled');

				colModel.sortorder = ('asc' === colModel.sortorder) ? 'desc' : 'asc';

				$(elem).find('span.s-ico').show()
				       .find('.ui-icon-' + colModel.sortorder)
				       .removeClass('ui-state-disabled');

				this._setSortOrder(colModel.name, colModel.sortorder)
				    ._fetchItems(this._currentFolder);
			},

			/**
			 * Adds new sort fields into the _orderBy array. If a field already
			 * exists, it will be spliced from where it is and unshifted to the
			 * end of the array.
			 *
			 * @param {string} by
			 * @param {string} order
			 */
			_setSortOrder: function (by, order) {
				var orderBy = this._orderBy || [];
				var field;
				var orderItem;
				var found = false;
				var i, j;
				var sortItem = {};
				sortItem[by] = order || 'asc';
				for (i = 0, j = orderBy.length; i < j; i++) {
					orderItem = orderBy[i];
					for (field in orderItem) {
						if (orderItem.hasOwnProperty(field) && field === by) {
							orderBy.splice(i, 1);
							orderBy.unshift(sortItem);
							found = true;
							break;
						}
					}
					if (found) {
						break;
					}
				}
				if (!found) {
					orderBy.unshift(sortItem);
				}
				this._orderBy = orderBy;
				return this;
			},

			/**
			 * Calls `onSelect()` when a list row is clicked.
			 *
			 * @param  {jQuery.<Event>}   event
			 * @return {jQuery.<Element>} Element at clicked row of null
			 */
			rowClicked: function (event) {
				var row = $(event.target).parent('tr');
				var item = null;
				if (row.length > 0) {
					var uid = row.attr('id');
					item = this._objs[uid];
					this.onSelect(item);
				}
				return item;
			},

			/**
			 * Queries the repository manager for items contained in folder that
			 * was clicked.
			 *
			 * @param {jQuery.<Element>} $node List item
			 */
			treeNodeSelected: function ($node) {
				var folder = this._getObjectFromCache($node);
				if (folder) {
					this._pagingOffset = 0;
					this._clearSearch();
					this._currentFolder = folder;
					this._fetchItems(folder);
					this.folderSelected(folder);
				}
			},

			/**
			 * Sends the search query to the server.
			 */
			_triggerSearch: function () {
				var $search = this.grid.find('input.repository-browser-search-field');
				var value = $search.val();
				if ('' === value || $search.hasClass('repository-browser-search-field-empty')) {
					value = null;
				} else if ('' === value) {
					value = null;
				}
				this._pagingOffset = 0;
				this._searchQuery = value;
				this._fetchItems(this._currentFolder);
			},

			/**
			 * Updates the object type filter option.
			 *
			 * @Obsolete?
			 * @param {Element} th
			 */
			getFieldOfHeader: function (th) {
				return th.find('div.ui-jqgrid-sortable').attr('id').replace('jqgh_', '');
			},

			/**
			 * Updates the object type filter option.
			 *
			 * @param {string} otf
			 */
			setObjectTypeFilter: function (otf) {
				this.objectTypeFilter = ('string' === typeof otf) ? [otf] : otf;
			},

			/**
			 * Returns the value of the object type filter.
			 */
			getObjectTypeFilter: function () {
				return this.objectTypeFilter;
			},

			/**
			 * Shows this repository browwser instance.
			 */
			show: function () {
				if (this.opened) {
					return;
				}
				this.opened = true;

				var browser = this;
				var $elem = browser.element;

				if (browser.isFloating) {
					showOverlay();

					$elem.stop().show().css({
						left : $window.scrollLeft() + (browser.padding / 2),
						top  : $window.scrollTop()  + (browser.padding / 2)
					}).draggable({
						handle : $elem.find('.repository-browser-grab-handle')
					});

					// Wake-up animation
					browser.grid.css({
						marginTop : 0,
						opacity   : 0
					}).animate({
						marginTop : 0,
						opacity   : 1
					}, 1500, 'easeOutExpo', function () {
						// Disable filter to prevent IE<=8 filter bug
						if ($.browser.msie) {
							$(this).add($elem).css(
								'filter',
								'progid:DXImageTransform.Microsoft.gradient(enabled = false)'
							);
						}
					});
				} else {
					$elem.stop().show().css({
						opacity : 1,
						filter  : 'progid:DXImageTransform.Microsoft.gradient(enabled = false)'
					});
				}
				browser._onWindowResized();
				browser.element.resize();
				numOpenedBrowsers++;
			},

			open: function () {
				this.show();
			},

			/**
			 * Hides this repository browser instance.
			 */
			close: function () {
				if (!this.opened) {
					return;
				}
				this.opened = false;
				this.element.fadeOut(250, function () {
					$(this).css('top', 0).hide();
					if (0 === numOpenedBrowsers || 0 === --numOpenedBrowsers) {
						hideOverlay();
					}
				});
			},

			/**
			 * Refreshes the browser's list by refetching the items of the
			 * current folder.
			 */
			refresh: function () {
				if (this._currentFolder) {
					this._fetchItems(this._currentFolder);
				}
			},

			/**
			 * This function gets called when a folder in the tree is opened.
			 *
			 * @param {Object} obj Folder data object
			 */
			folderOpened: function (obj) {
				var folder = this._getObjectFromCache(obj);
				if (folder) {
					this.manager.folderOpened(folder);
				}
			},

			/**
			 * This function gets called when a folder in the tree is closed.
			 *
			 * @param {Object} obj Folder data object
			 */
			folderClosed: function (obj) {
				var folder = this._getObjectFromCache(obj);
				if (folder) {
					this.manager.folderClosed(folder);
				}
			},

			/**
			 * This function gets called when a folder in the tree is selected.
			 *
			 * @param {object} obj Folder data object
			 */
			folderSelected: function (obj) {
				this.manager.folderSelected(obj);
			},

			/**
			 * Gets the selected folder.
			 *
			 * @return {object} selected Folder or undefined
			 */
			getSelectedFolder: function () {
				if ('function' === typeof this.manager.getSelectedFolder) {
					return this.manager.getSelectedFolder();
				}
			},

			destroy: function () {},

			/**
			 * User should implement this according to their needs
			 *
			 * @param {Object} item Repository resource for a row
			 */
			onSelect: function (item) {},

			/**
			 * Handle repository timeouts
			 */
			handleTimeout: function () {}
		});

		$(createOverlay);

		return Browser;
	}

	if ('function' === typeof define) {
		define('repository-browser-i18n-de', [], function () {
			return {
				'Browsing'                       : 'Durchsuchen',
				'Close'                          : 'Schließen',
				'in'                             : 'in',
				'Input search text...'           : 'Suchtext einfügen...',
				'numerous'                       : 'zahlreiche',
				'of'                             : 'von',
				'Repository Browser'             : 'Repository Browser',
				'Search'                         : 'Suchen',
				'Searching for'                  : 'Suche nach',
				'Viewing'                        : 'Anzeige',
				'button.switch-metaview.tooltip' : 'Zwischen Metaansicht und normaler Ansicht umschalten'
			};
		});
		define('repository-browser-i18n-en', [], function () {
			return {
				'Browsing'                       : 'Browsing',
				'Close'                          : 'Close',
				'in'                             : 'in',
				'Input search text...'           : 'Input search text...',
				'numerous'                       : 'numerous',
				'of'                             : 'of',
				'Repository Browser'             : 'Repository Browser',
				'Search'                         : 'Search',
				'Searching for'                  : 'Searching for',
				'Viewing'                        : 'Viewing',
				'button.switch-metaview.tooltip' : 'Switch between meta and normal view'
			};
		});
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
		], initialize);
	} else {
		window.Browser = initialize(
			window.jQuery,
			window.Class,
			{pub: function () {}} // PubSub noop interface
		);
	}
}());
