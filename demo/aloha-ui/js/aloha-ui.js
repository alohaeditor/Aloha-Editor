(function (aloha) {
	'use strict';
	
	var Dom = aloha.dom;
	var Keys = aloha.keys;
	var Editor = aloha.editor;
	var Events = aloha.events;
	var Editing = aloha.editing;
	var Overrides = aloha.overrides;
	var Selections = aloha.selections;
	var Boundaries = aloha.boundaries;
	var Arrays = aloha.arrays;
	var ACTION_CLASS_PREFIX = 'aloha-action-';

	var $$ = (function () {

		/**
		 * jQuery-like wrapper for document.querySelectorAll .
		 *
		 * Will accept a selector or an element.
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
			elements: [],

			/**
			 * Attaches event handlers for an event
			 *
			 * @param  {string}   event
			 * @param  {function} handler
			 * @return {$$}
			 */
			on: function (event, handler) {
				this.elements.forEach(function (element) {
					Events.add(element, event, handler);
				});
				return this;
			},

			/**
			 * Adds a class.
			 *
			 * @param  {string} className
			 * @return {$$}
			 */
			addClass: function (className) {
				this.elements.forEach(function (element) {
					Dom.addClass(element, className);
				});
				return this;
			},

			/**
			 * Removes a class.
			 *
			 * @param  {string} className
			 * @return {$$}
			 */
			removeClass: function (className) {
				this.elements.forEach(function (element) {
					Dom.removeClass(element, className);
				});
				return this;
			},
			/**
			 * Updates an attribute
			 *
			 * @param  {string} name
			 * @param  {string} value
			 * @return {$$}
			 */
			setAttr: function (name, value) {
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
	 * Executes an action based on the given parameters list.
	 *
	 * @private
	 * @param  {!Array.<string>}   params
	 * @param  {!Array.<Boundary>} boundaries
	 * @return {Array.<Boundary>}
	 */
	function execute(params, boundaries) {
		var action = params.shift();
		return aloha.editor.ui.actions[action]
		     ? aloha.editor.ui.actions[action].apply(window, boundaries.concat(params))
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
	 * Deactivates all ui buttons.
	 *
	 * @private
	 */
	function resetUi() {
		$$('.aloha-ui .active, .aloha-ui.active').removeClass('active');
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
		var item = $$(selectors.join(',')).elements[0];
		if (!item) {
			return;
		}
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
			function (node) { return Dom.isEditingHost(node); }
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
	 * Updates formatting ui components.
	 *
	 * @param {!Selection}     selection
	 * @param {Array.<string>} formats
	 */
	function updateFormattingUi(selection, formats) {
		activateButtons(formats);
		activateMenus(formats);
	}

	/**
	 * Updates the ui according to current state overrides.
	 *
	 * Sets to active all ui toolbar elements that match the current overrides.
	 *
	 * @private
	 * @param {!Selection} selection
	 */
	function updateUi(selection) {
		resetUi();
		var formats = activeFormats(selection);
		aloha.editor.ui.updateHandlers.forEach(function (handler) {
			handler(selection, formats);
		});
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
			if (Editor.selection) {
				Dom.setStyle(Editor.selection.caret, 'display', 'none');
			}
			Editor.selection = null;
			resetUi();
		}
	});

	$$('.aloha-ui').on('mousedown', function (event) {
		if (event.target.nodeName === 'INPUT') {
			return;
		}
		var params = parseActionParams(event.target);
		if (params && Editor.selection && Editor.selection.boundaries) {
			var boundaries = execute(params, Editor.selection.boundaries);
			Editor.selection = Selections.select(
				Editor.selection,
				boundaries[0],
				boundaries[1]
			);
			updateUi(Editor.selection);
		}
	});

	/**
	 * Handles UI updates invoked by event.
	 *
	 * @param  {!Event} event
	 * @return {Event}
	 */
	function handleUi(event) {
		var type = event.type;
		if ('keydown' === type) {
			var handler = Keys.shortcutHandler(
				event.meta,
				event.keycode,
				aloha.editor.ui.shortcuts
			);
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
		if ('mouseup' === type || 'aloha.mouseup' === type) {
			eventLoop.inEditable = true;
		}
		if ('keydown' === type || 'keyup' === type || 'mouseup' === type || 'click' === type) {
			updateUi(event.selection);
		}
		return event;
	}

	/**
	 * Execute inline formatting or toggle overrides.
	 *
	 * @private
	 * @param  {!Boundary} start
	 * @param  {!Boundary} end
	 * @param  {string}    formatting
	 * @return {Array.<Boundary>}
	 */
	function inlineFormat(start, end, formatting) {
		if (!Boundaries.equals(start, end)) {
			return Editing.format(start, end, formatting);
		}
		var selection = Editor.selection;
		var override = Overrides.nodeToState[formatting];
		if (!override || !selection) {
			return [start, end];
		}
		var overrides = Overrides.joinToSet(
			selection.formatting,
			Overrides.harvest(Boundaries.container(start)),
			selection.overrides
		);
		selection.overrides = Overrides.toggle(overrides, override, true);
		return [start, end];
	}

	aloha.editor.stack.unshift(handleUi);

	// exports
	aloha.editor.ui = {
		'$$'      : $$,
		shortcuts : {},
		actions   : {
			'aloha-action-B'        : inlineFormat,
			'aloha-action-I'        : inlineFormat,
			'aloha-action-H2'       : Editing.format,
			'aloha-action-H3'       : Editing.format,
			'aloha-action-H4'       : Editing.format,
			'aloha-action-P'        : Editing.format,
			'aloha-action-PRE'      : Editing.format,
			'aloha-action-OL'       : Editing.format,
			'aloha-action-UL'       : Editing.format,
			'aloha-action-unformat' : function (start, end) {
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
		},
		update         : updateUi,
		updateHandlers : [updateFormattingUi]
	};
}(window.aloha));
