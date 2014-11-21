(function (aloha) {
	'use strict';

	var Fn = aloha.fn;
	var Dom = aloha.dom;
	var Maps = aloha.maps;
	var Keys = aloha.keys;
	var Html = aloha.html;
	var Arrays = aloha.arrays;
	var Editor = aloha.editor;
	var Events = aloha.events;
	var Editing = aloha.editing;
	var Overrides = aloha.overrides;
	var Selections = aloha.selections;
	var Boundaries = aloha.boundaries;
	var SelectionChange = aloha.selectionchange;

	/**
	 * Deactivates all ui buttons.
	 *
	 * @private
	 * @param {!Document} doc
	 */
	function resetUi(doc) {
		Dom.query('.aloha-ui .active, .aloha-ui.active', doc).forEach(
			function (elem) { Dom.removeClass(elem, 'active'); }
		);
	}

	var eventLoop = { inEditable: false };

	// Resets inEditable flag throught click cycle
	Events.add(document, 'mousedown', function () {
		eventLoop.inEditable = false;
	});

	Events.add(document, 'mouseup', function (event) {
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
			resetUi(document);
		}
	});

	// Because Bootstrap dropdowm menu's use anchor tags containing "href='#'"
	// which causes the page to jump to the top
	Dom.query('.aloha-ui', document).forEach(function (elem) {
		Events.add(elem, 'click', function (event) {
			Events.preventDefault(event);
		});
	});

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

	/**
	 * Handles UI updates invoked by event.
	 *
	 * Handlers on the aloha.editor.stack are only invoked when interactions
	 * happens in an editable.
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
				aloha.ui.shortcuts
			);
			if (false && handler) {
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
				fire('overrides.changed', {
					selection: event.selection,
					overrides: overrides,
					nodes: nodes
				});
				state.overrides = overrides;
			}
		}
		return event;
	}

	var state = {overrides: null};

	function commandState(node, command) {
		if (command.node && node.nodeName !== command.node.toUpperCase()) {
			return false;
		}
		if (command.style) {
			var result = 1;
			Maps.forEach(command.style, function (value, prop) {
				result &= (value === Dom.getStyle(node, prop));
			});
			if (!result) {
				return false;
			}
		}
		if (command.classes) {

		}
		return true;
	}

	function states(commands, event) {
		var values = {};
		Maps.forEach(commands, function (command, key) {
			if (command.state && command.state in event.overrides) {
				values[key] = !!event.overrides[command.state];
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
		on(
			'nodes.changed selection.changed overrides.changed',
			bind(editable, function (event) {
				resetUi(document);
				Maps.forEach(states(commands, event), onEvent);
			})
		);
		Maps.forEach(commands, function (command, selector) {
			bindCommand(bind(editable, Fn.partial(execute, command)), selector);
		});
	}

	function onSelectionChange(boundaries) {
		var cac = Boundaries.commonContainer(boundaries[0], boundaries[1]);
		if (Dom.isEditableNode(cac)) {
			var nodes = Dom.childAndParentsUntil(
				Boundaries.container(boundaries[0]),
				Dom.isEditingHost
			).filter(Dom.isElementNode);
			var overrides = Overrides.joinToSet(
				Editor.selection.formatting,
				Editor.selection.overrides
			);
			fire('selection.changed', {
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
	var changeEvents = 'nodes.changed selection.changed overrides.changed';

	function on(editable, eventNames, handler) {
		if ('*' === eventNames) {
			eventNames = changeEvents;
		}
		eventNames.split(' ').forEach(function (event) {
			if (!handlers[event]) {
				handlers[event] = [];
			}
			handlers[event].push(bind(editable, handler));
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

	SelectionChange.addHandler(document, SelectionChange.handler(
		Fn.partial(aloha.boundaries.get, document),
		[],
		onSelectionChange
	));

	aloha.ui = {
		on               : on,
		hook             : hook,
		states           : states,
		execute          : execute,
		command          : command,
		removeFormatting : removeFormatting,
		shortcuts        : []
	};

	aloha.editor.stack.unshift(handleUi);

}(window.aloha));
