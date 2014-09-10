(function (aloha) {
	'use strict';
	
	var Fn = aloha.fn;
	var Dom = aloha.dom;
	var Keys = aloha.keys;
	var Editor = aloha.editor;
	var Events = aloha.events;
	var Editing = aloha.editing;
	var Overrides = aloha.overrides;
	var Selections = aloha.selections;
	var Boundaries = aloha.boundaries;
	var Traversing = aloha.traversing;
	var Arrays = aloha.arrays;
	var ACTION_CLASS_PREFIX = 'aloha-action-';

	var $$ = (function () {
		/**
		 * jQuery-like wrapper for document.querySelectorAll
		 * Will accept a selector or an element
		 *
		 * @param  {string|Element} selector
		 * @return {Array.<Element>}
		 */
		function $$ (selectorOrElement) {
			this.elements = typeof selectorOrElement === 'string'
				? Arrays.coerce(document.querySelectorAll(selectorOrElement))
				: [selectorOrElement];
		}
		$$.prototype = {
			/**
			 * Array of matched elements
			 * @type {Array.<Element>}
			 */
			elements : [],
			/**
			 * Attaches event handlers for an event
			 *
			 * @param {string}   event
			 * @param {function} handler
			 * @return {$$}
			 */
			on : function (event, handler) {
				this.elements.forEach(function (element) {
					Events.add(element, event, handler);
				});
				return this;
			},
			/**
			 * Adds a class
			 *
			 * @param {string} className
			 * @return {$$}
			 */
			addClass : function (className) {
				this.elements.forEach(function (element) {
					Dom.addClass(element, className);
				});
				return this;
			},
			/**
			 * Removes a class
			 *
			 * @param {string} className
			 * @return {$$}
			 */
			removeClass : function (className) {
				this.elements.forEach(function (element) {
					Dom.removeClass(element, className);
				});
				return this;
			},
			/**
			 * Updates an attribute
			 *
			 * @param {string} name
			 * @param {string} value
			 * @return {$$}
			 */
			setAttr : function (name, value) {
				this.elements.forEach(function (element) {
					Dom.setAttr(element, name, value);
				});
				return this;
			}
		};
		return function (selectorOrElement) {
			return new $$(selectorOrElement);
		};
	})();

	/**
	 * Executes an action based on the given parameters list
	 *
	 * @private
	 * @param  {!Array.<string>}   params
	 * @param  {!Array.<Boundary>} boundaries
	 * @return {Array.<Boundary>}
	 */
	function execute(params, boundaries) {
		var action = params.shift();
		return actions[action]
		     ? actions[action].apply(window, boundaries.concat(params))
		     : boundaries;
	}

	/**
	 * Parse an element and it's parent elements
	 * whether an aloha-action-* class name is present.
	 * An array will be returned, containing the whole
	 * matching class at index 0, and the parameters
	 * split by dash as the following keys.
	 *
	 * @private
	 * @param  {!Element} element
	 * @return {Array.<string>}
	 */
	function parseActionParams(element) {
		var match;
		var parameters = [];
		Dom.childAndParentsUntil(element, function (element) {
			if (element.className) {
				match = element.className.match(/aloha-action-(\S+)/);
			}
			if (match || Dom.hasClass(element, 'aloha-ui')) {
				return true;
			}
			return false;
		});
		if (match) {
			parameters = match[1].split('-');
			parameters.unshift(match[0]);
		}
		return parameters;
	}

	/**
	 * Positions the given toolbar element to point to the anchor element in the
	 * document.
	 *
	 * @param {!Element} toolbar
	 * @param {!Element} anchor
	 */
	function positionToolbar(toolbar, anchor) {
		var box = aloha.carets.box(Boundaries.range(
			Boundaries.create(anchor, 0),
			Boundaries.create(anchor, 1)
		));
		var center = Math.round(box.left + (box.width / 2));
		var win = Dom.documentWindow(anchor.ownerDocument);
		var windowWidth = win.innerWidth;
		var toolbarWidth = parseInt(Dom.getComputedStyle(toolbar, 'width'), 10);
		var buffer = 10;
		var xMin = buffer;
		var xMax = (windowWidth - toolbarWidth) - buffer;
		var x = Math.min(xMax, Math.max(xMin, center - (toolbarWidth / 2)));
		var y = box.top + box.height + buffer;
		Dom.setStyle(toolbar, 'left', x + 'px');
		Dom.setStyle(toolbar, 'top', y + 'px');
		var arrow = toolbar.querySelector('.aloha-arrow-up');
		var arrowOffset = (x <= xMin || x >= xMax) ? (center - x) + 'px' : 'auto';
		Dom.setStyle(arrow, 'margin-left', arrowOffset);
	}

	function notAnchor(node) { return 'A' !== node.nodeName; }
	function hasClass(className, node) { return Dom.hasClass(node, className); }

	var LinksUI = {

		/**
		 * Opens the given context toolbar for editing the given anchor.
		 *
		 * @param {!Element} toolbar
		 * @param {!Element} anchor
		 */
		open: function (toolbar, anchor) {
			var href = Dom.getAttr(anchor, 'href');
			$$('.aloha-active').removeClass('aloha-active');
			Dom.addClass(anchor, 'aloha-active');
			Dom.addClass(toolbar, 'opened');
			positionToolbar(toolbar, anchor);
			toolbar.querySelector('input').value = href;
			$$('a.aloha-link-follow').setAttr('href', href);
		},

		/**
		 * Closes the context toolbar.
		 *
		 * @param {!Element} toolbar
		 */
		close: function(toolbar) {
			$$('.aloha-active').removeClass('aloha-active');
			Dom.removeClass(toolbar, 'opened');
		},

		/**
		 * Retrieves a toolbar element from the given document if one exists.
		 *
		 * @param  {!Document} doc
		 * @return {?Element}
		 */
		toolbar: function (doc) {
			var toolbar = doc.querySelector('.aloha-link-toolbar');
			return (toolbar && Dom.hasClass(toolbar.parentNode, 'aloha-3d'))
				 ? toolbar.parentNode
				 : toolbar;
		},

		/**
		 * Resolves the anchor element from the boundaries
		 *
		 * @param  {Array.<Boundary>} boundaries
		 * @return {?Element}
		 */
		anchor: function (boundaries) {
			var cac = Boundaries.commonContainer(boundaries[0], boundaries[1]);
			return Dom.upWhile(cac, notAnchor);
		},

		/**
		 * Returns the element or its first ancestor that has a 'aloha-ui'
		 * class, if any.
		 *
		 * @param  {!Element} element
		 * @return {?Element}
		 */
		closestToolbar: function (element) {
			var toolbar = Dom.upWhile(element, Fn.complement(Fn.partial(hasClass, 'aloha-ui')));
			return (toolbar && Dom.hasClass(toolbar.parentNode, 'aloha-3d'))
				 ? toolbar.parentNode
				 : toolbar;
		},

		/**
		 * Handles user interaction on the context toolbar.
		 *
		 * @param {!Element} element
		 * @param {!Element} anchor
		 */
		interact: function (toolbar, anchor) {
			$$('a.aloha-active, a.aloha-link-follow').setAttr(
				'href',
				toolbar.querySelector('input').value
			);
		},

		/**
		 * Normalize boundaries, so that if either start
		 * or end boundaries are inside an anchor tag
		 * both boundaries will snap to that tag.
		 * If the boundaries are collapsed, they will be
		 * extended to word.
		 *
		 * @param  {!Boundary} start
		 * @param  {!Boundary} end
		 * @return {Array.<Boundary>}
		 */
		normalize: function (start, end) {
			var boundaries = [start, end];
			for (var i = 0; i < boundaries.length; i++) {
				var anchor = Dom.upWhile(Boundaries.container(boundaries[i]), notAnchor);
				if (anchor) {
					return [
						Boundaries.next(Boundaries.fromNode(anchor)),
						Boundaries.fromEndOfNode(anchor)
					];
				}
			}
			return Boundaries.equals(start, end)
			     ? Traversing.expand(start, end, 'word')
			     : boundaries;
		},

		/**
		 * Inserts a link at the boundary position
		 *
		 * IMPORTANT: this function MUST be a named
		 * function, because we will need to
		 * prevent a selection update when a new link
		 * is inserted later on.
		 * 
		 * @param  {!Boundary} start
		 * @param  {!Boundary} end
		 * @return {Array.<Boundary>}
		 */
		insertLink: function insertLink (start, end) {
			var boundaries = LinksUI.normalize(start, end);
			if (Boundaries.container(boundaries[0]).nodeName !== 'A') {
				boundaries = Editing.wrap('A', boundaries[0], boundaries[1]);
				boundaries[0] = Boundaries.next(boundaries[0]);
				boundaries[1] = Boundaries.fromEndOfNode(boundaries[0])[0];
			}
			LinksUI.open(
				LinksUI.toolbar(document),
				Boundaries.container(boundaries[0])
			);
			$$('.aloha-link-toolbar input[name=href]').elements[0].focus();
			return boundaries;
		},

		/**
		 * Toggles the target attribute on any active anchor.
		 *
		 * @param  {!Boundary} start
		 * @param  {!Boundary} end
		 * @return {Array.<Boundary>}
		 */
		toggleTarget: function (start, end) {
			var anchor = $$('.aloha-active').elements[0];
			if (!anchor) {
				return [start, end];
			}
			if ('_blank' === Dom.getAttr(anchor, 'target')) {
				Dom.removeAttr(anchor, 'target');
			} else {
				Dom.setAttr(anchor, 'target', '_blank');
			}
			return [start, end];
		},

		/**
		 * Updates the ui according to any active anchor element.
		 */
		update: function () {
			var anchor = $$('a.aloha-active').elements[0];
			if (!anchor) {
				return;
			}
			var href = Dom.getAttr(anchor, 'href');
			var target = Dom.getAttr(anchor, 'target');
			$$('.aloha-link-toolbar input[name=href]').value = href;
			if ('_blank' === target) {
				$$('.aloha-action-target').addClass('active');
			} else {
				$$('.aloha-action-target').removeClass('active');
			}
		}
	};

	/**
	 * Links-specific UI handling.
	 *
	 * @param  {!Event} event
	 * @return {Event}
	 */
	function handleLinks(event) {
		var anchor = LinksUI.anchor(event.selection.boundaries);
		var toolbar = LinksUI.toolbar(event.nativeEvent.target.ownerDocument);
		if (!toolbar) {
			return;
		}
		if (anchor) {
			return LinksUI.open(toolbar, anchor);
		}
		if (toolbar === LinksUI.closestToolbar(event.nativeEvent.target)) {
			return LinksUI.interact(toolbar, anchor, event);
		}
		return LinksUI.close(toolbar);
	}

	/**
	 * Deactivates all ui buttons.
	 *
	 * @private
	 */
	function resetUi() {
		$$('.aloha-ui .active').removeClass('active');
	}

	/**
	 * Toggles ui action buttons to active state based on the given list of
	 * formats.
	 *
	 * @private
	 * @param {Array.<string>} formats
	 */
	function activateButtons(formats) {
		var selectors = formats.reduce(function (list, format) {
			return list.concat('.aloha-ui .' + ACTION_CLASS_PREFIX + format);
		}, []);
		$$(selectors.join(',')).addClass('active');
	}

	/**
	 * Updates ui menu buttons based on the given list of formats.
	 *
	 * @private
	 * @param {Array.<string>} formats
	 */
	function activateMenus(formats) {
		var selectors = formats.reduce(function (list, format) {
			return list.concat('.aloha-ui .dropdown-menu .' + ACTION_CLASS_PREFIX + format);
		}, []);
		var items = $$(selectors.join(','));
		if (0 === items.length) {
			return;
		}
		var item = items.elements[0];
		var group = Dom.upWhile(item, function (node) {
			return !Dom.hasClass(node, 'btn-group');
		});
		var toggler = group.querySelector('.dropdown-toggle');
		Dom.addClass(toggler, 'active');
		toggler.firstChild.data = item.textContent + ' ';
	}

	/**
	 * Computes a list of all active formats determined from the given
	 * selection.
	 *
	 * Formats are simply a lists of node names which reflect semantic formatting.
	 *
	 * @private
	 * @param  {!Selection} selection
	 * @return {Array.<string>}
	 */
	function activeFormats(selection) {
		var nodes = Dom.childAndParentsUntilIncl(
			Boundaries.container(selection.boundaries[0]),
			function (node) { return Dom.isEditingHost(node.parentNode); }
		);
		var overrides = Overrides.joinToSet(
			selection.formatting,
			selection.overrides
		);
		var active = nodes.map(function (node) { return node.nodeName; });
		var unactive = [];
		overrides.forEach(function (override) {
			var format = Overrides.stateToNode[override[0]];
			if (format) {
				if (override[1]) {
					active.push(format);
				} else {
					unactive.push(format);
				}
			}
		});
		return Arrays.difference(Arrays.unique(active), unactive);
	}

	/**
	 * Updates the ui according to current state overrides.
	 *
	 * Sets to active all ui toolbar elements that match the current overrides.
	 *
	 * @private
	 * @param {!Event} event
	 */
	function updateUi(selection) {
		resetUi();
		var formats = activeFormats(selection);
		activateButtons(formats);
		activateMenus(formats);
		if (Arrays.contains(formats, 'A')) {
			LinksUI.update(selection);
		}
	}

	var eventLoop = { inEditable: false };

	$$(document).on('mousedown', function (event) {
		eventLoop.inEditable = false;
	});

	$$(document).on('mouseup', function (event) {
		if (eventLoop.inEditable) {
			return;
		}
		var ui = Dom.upWhile(event.target, function (node) {
			return !Dom.hasClass(node, 'aloha-ui');
		});
		if (!ui) {
			Editor.selection = null;
			resetUi();
		}
	});

	$$('.aloha-ui').on('mousedown', function (event) {
		if (event.target.nodeName === 'INPUT') {
			return;
		}
		var params = parseActionParams(event.target);
		var selection = Editor.selection;
		if (params && selection) {
			selection.boundaries = execute(params, selection.boundaries);
			Selections.select(
				selection,
				selection.boundaries[0],
				selection.boundaries[1],
				selection.focus
			);
		}
		updateUi(selection);
	});

	$$('.aloha-link-toolbar input[name=href]').on('keyup', function (event) {
		if (Editor.selection) {
			LinksUI.interact(
				LinksUI.toolbar(event.target.ownerDocument),
				LinksUI.anchor(Editor.selection.boundaries)
			);
		}

		var shortcuts = { 
			'enter' : function () {
				var anchor = $$('a.aloha-active').elements[0];
				var href = $$('.aloha-link-toolbar input[name=href]').elements[0];
				var boundary = Boundaries.next(Boundaries.fromEndOfNode(anchor));
				Editor.selection = Selections.select(
					Editor.selection,
					boundary,
					boundary
				);
				updateUi(Editor.selection);
				if (!href.value) {
					Dom.removeShallow(anchor);
				}
				return [boundary, boundary];
			} 
		};
		var key = Keys.parseKeys(event);
		var handler = Keys.shortcutHandler(key.meta, key.keycode, shortcuts);
		if (handler) {
			Editor.selection.boundaries = handler(
				Editor.selection.boundaries[0],
				Editor.selection.boundaries[1]
			);
		}
	});
	
	var shortcuts = {
		'meta+k' : LinksUI.insertLink,
		'ctrl+k' : LinksUI.insertLink
	};

	var actions = {
		'aloha-action-B'       : Editing.format,
		'aloha-action-I'       : Editing.format,
		'aloha-action-H2'      : Editing.format,
		'aloha-action-H3'      : Editing.format,
		'aloha-action-H4'      : Editing.format,
		'aloha-action-P'       : Editing.format,
		'aloha-action-PRE'     : Editing.format,
		'aloha-action-OL'      : Editing.format,
		'aloha-action-UL'      : Editing.format,
		'aloha-action-A'       : LinksUI.insertLink,
		'aloha-action-target'  : LinksUI.toggleTarget,
		'aloha-action-unformat': function (start, end) {
			var boundaries = [start, end];
			['B', 'I', 'U'].forEach(function (format) {
				boundaries = Editing.unformat(
					boundaries[0],
					boundaries[1],
					format
				);				
			});
			return boundaries;
		}
	};

	/**
	 * Handles UI updates invoked by event
	 *
	 * @param  {!Event} event
	 * @return {Event}
	 */
	function handleUi(event) {
		if ('keydown' === event.type) {
			var handler = Keys.shortcutHandler(event.meta, event.keycode, shortcuts);
			if (handler) {
				event.selection.boundaries = handler(
					event.selection.boundaries[0], 
					event.selection.boundaries[1]
				);
				if (handler.name === 'insertLink') {
					event.preventSelection = true;
				}
				return event;
			}
		}
		var type = event.type;
		if ('mouseup' === type || 'aloha.mouseup' === type) {
			eventLoop.inEditable = true;
		}
		if ('keyup' === type || 'click' === type) {
			handleLinks(event);
		}
		if ('keydown' === type || 'keyup' === type || 'click' === type) {
			updateUi(event.selection);
		}
		return event;
	}

	aloha.editor.stack.unshift(handleUi);

	// exports
	aloha.editor.ui = {
		'$$'      : $$,
		shortcuts : shortcuts,
		actions   : actions
	};
}(window.aloha));
