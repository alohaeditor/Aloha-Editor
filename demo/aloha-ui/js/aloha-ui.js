(function (aloha) {
	'use strict';

	var Fn = aloha.fn;
	var Dom = aloha.dom;
	var Maps = aloha.maps;
	var Html = aloha.html;
	var Arrays = aloha.arrays;
	var Editor = aloha.editor;
	var Events = aloha.events;
	var Editing = aloha.editing;
	var Overrides = aloha.overrides;
	var Selections = aloha.selections;
	var Boundaries = aloha.boundaries;
	var SelectionChange = aloha.selectionchange;

	function mapsEquals(a, b) {
		var key;
		for (key in a) {
			if (a[key] !== b[key]) {
				return false;
			}
		}
		for (key in b) {
			if (a[key] !== b[key]) {
				return false;
			}
		}
		return true;
	}

	var state = {
		eventsInitialized: false,
		inEditable: false,
		overrides: null
	};

	var changeEvents = 'ui.nodeChanged ui.selectionChanged ui.overridesChanged';

	function commandState(node, command) {
		if (command.state) {
			return command.state(node, command);
		}
		if (!(command.node || command.style || command.classes)) {
			return false;
		}
		if (command.node && node.nodeName !== command.node.toUpperCase()) {
			return false;
		}
		var result;
		if (command.style) {
			result = 1;
			Maps.forEach(command.style, function (value, prop) {
				result &= (value === Dom.getStyle(node, prop));
			});
			if (!result) {
				return false;
			}
		}
		if (command.classes) {
			result = 1;
			Maps.forEach(command.classes, function (value, prop) {
				result &= Dom.hasClass(node, prop);
			});
			if (!result) {
				return false;
			}
		}
		return true;
	}

	function states(commands, event) {
		var values = {};
		Maps.forEach(commands, function (command, key) {
			if (command.override && command.override in event.overrides) {
				values[key] = !!event.overrides[command.override];
			} else {
				var state = 0;
				event.nodes.forEach(function (node) {
					state |= commandState(node, command);
				});
				values[key] = !!state;
			}
		});
		return values;
	}

	function formatBlock(selection, formatting, style) {
		var boundaries = Editing.format(
			selection.boundaries[0],
			selection.boundaries[1],
			formatting
		);
		if (!style) {
			return boundaries;
		}
		Dom.nodesAndSiblingsBetween(
			Boundaries.container(boundaries[0]),
			Boundaries.container(boundaries[1])
		).forEach(function (node) {
			if (formatting === node.nodeName) {
				Maps.forEach(style, function (value, prop) {
					Dom.setStyle(node, prop, value);
				});
			}
		});
		return boundaries;
	}

	/**
	 * Executes inline formatting or toggle overrides.
	 *
	 * @private
	 * @param  {!Boundary} start
	 * @param  {!Boundary} end
	 * @param  {string}    formatting
	 * @return {Array.<Boundary>}
	 */
	function formatInline(selection, formatting) {
		var start = selection.boundaries[0];
		var end = selection.boundaries[1];
		if (!Boundaries.equals(start, end)) {
			return Editing.format(start, end, formatting);
		}
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

	function removeFormatting(selection, command) {
		var boundaries = selection.boundaries;
		command.nodes.map(function (node) {
			return node.toUpperCase();
		}).forEach(function (formatting) {
			boundaries = Editing.wrap(
				formatting,
				boundaries[0],
				boundaries[1],
				true
			);
		});
		return boundaries;
	}

	function bind(editable, fn) {
		return function (event) {
			var selection = event.selection || Editor.selection;
			if (selection && selection.boundaries) {
				var cac = Boundaries.commonContainer(
					selection.boundaries[0],
					selection.boundaries[1]
				);
				if (Dom.editingHost(cac) === editable) {
					fn.apply(null, arguments);
				}
			}
		};
	}

	function hook(editable, commands, onEvent, bindCommand) {
		var doc = editable.ownerDocument;
		on(changeEvents, bind(editable, function (event) {
			Maps.forEach(states(commands, event), onEvent);
		}));
		Maps.forEach(commands, function (command, selector) {
			bindCommand(bind(editable, Fn.partial(execute, command)), selector);
		});
	}

	function onSelectionChange(boundaries) {
		var cac = Boundaries.commonContainer(boundaries[0], boundaries[1]);
		if (Editor.selection && Dom.isEditableNode(cac)) {
			var nodes = Dom.childAndParentsUntil(
				Boundaries.container(boundaries[0]),
				Dom.isEditingHost
			).filter(Dom.isElementNode);
			var overrides = Overrides.joinToSet(
				Editor.selection.formatting,
				Editor.selection.overrides
			);
			fire('ui.selectionChanged', {
				selection: Editor.selection,
				overrides: overrides,
				nodes: nodes
			});
		}
	}

	function command(editable, cmd) {
		return bind(editable, Fn.partial(execute, cmd));
	}

	function execute(command) {
		var boundaries;
		if (command.action) {
			boundaries = command.action(Editor.selection, command)
			          || Editor.selection.boundaries;
		} else {
			var node = command.node.toUpperCase();
			var action = Html.isBlockNode({nodeName: node})
			           ? formatBlock
			           : formatInline;
			boundaries = action(Editor.selection, node, command.style);
		}
		Editor.selection = Selections.select(
			Editor.selection,
			boundaries[0],
			boundaries[1]
		);
		onSelectionChange(boundaries);
	}

	var handlers = {};

	function on(elem, eventNames, handler) {
		var fn;
		if (Dom.documentWindow(elem)) {
			init(elem);
			fn = handler;
		} else {
			init(elem.ownerDocument);
			fn = bind(elem, handler);
		}
		if ('*' === eventNames) {
			eventNames = changeEvents;
		}
		eventNames.split(' ').forEach(function (event) {
			if (!handlers[event]) {
				handlers[event] = [];
			}
			handlers[event].push(fn);
		});
	}

	function fire(eventName) {
		if (handlers[eventName]) {
			var args = Arrays.coerce(arguments).slice(1);
			handlers[eventName].forEach(function (handler) {
				handler.apply(null, args);
			});
		}
	}

	function init(doc) {
		if (state.eventsInitialized) {
			return;
		}

		state.eventsInitialized = true;

		SelectionChange.addHandler(doc, SelectionChange.handler(
			Fn.partial(Boundaries.get, doc),
			[],
			onSelectionChange
		));

		Editor.stack.unshift(function handleUi(event) {
			state.inEditable = true;
			var type = event.type;
			if ('keydown' === type) {
				var overrides = Overrides.map(Overrides.joinToSet(
					event.selection.formatting,
					event.selection.overrides
				));
				if (!state.overrides || !mapsEquals(state.overrides, overrides)) {
					var nodes = Dom.childAndParentsUntil(
						Boundaries.container(event.selection.boundaries[0]),
						Dom.isEditingHost
					).filter(Dom.isElementNode);
					fire('ui.overridesChanged', {
						selection: event.selection,
						overrides: overrides,
						nodes: nodes
					});
					state.overrides = overrides;
				}
			}
			return event;
		});

		// Resets inEditable flag at start of click cycle
		Events.add(doc, 'mousedown', function () {
			state.inEditable = false;
		});

		Events.add(doc, 'mouseup', function (event) {
			if (state.inEditable) {
				return;
			}
			var ui = Dom.upWhile(event.target, function (node) {
				return !Dom.hasClass(node, 'aloha-ui');
			});
			if (!ui) {
				fire('ui.clickOutside', event);
				if (Editor.selection) {
					Dom.setStyle(Editor.selection.caret, 'display', 'none');
				}
				Editor.selection = null;
			}
		});

		// Because Bootstrap dropdowm menu's use anchor tags containing
		// "href='#'" which causes the page to jump to the top
		Dom.query('.aloha-ui', doc).forEach(function (elem) {
			Events.add(elem, 'click', function (event) {
				Events.preventDefault(event);
			});
		});
	}

	var commands = {
		p        : { node : 'p'                      },
		h2       : { node : 'h2'                     },
		h3       : { node : 'h3'                     },
		h4       : { node : 'h4'                     },
		pre      : { node : 'pre'                    },
		ol       : { node : 'ol'                     },
		ul       : { node : 'ul'                     },
		bold     : { node : 'b', override : 'bold'   },
		italic   : { node : 'i', override : 'italic' },
		unformat : {
			state  : Fn.returnFalse,
			action : removeFormatting,
			nodes  : ['b', 'i', 'u']
		}
	};

	aloha.ui = {
		on               : on,
		hook             : hook,
		states           : states,
		execute          : execute,
		command          : command,
		commands         : commands,
		removeFormatting : removeFormatting,
		shortcuts        : []
	};

}(window.aloha));
