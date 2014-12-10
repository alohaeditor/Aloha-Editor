define([
	'dom',
	'maps',
	'html',
	'arrays',
	'editing',
	'editables',
	'overrides',
	'boundaries',
	'selections',
	'functions'
], function (
	Dom,
	Maps,
	Html,
	Arrays,
	Editing,
	Editables,
	Overrides,
	Boundaries,
	Selections,
	Fn
) {
	'use strict';

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
		var selection = event.selection;
		var container = Boundaries.container(
			selection.boundaries['start' === selection.focus ? 0 : 1]
		);
		var overrides = Overrides.map(Overrides.joinToSet(
			selection.formatting,
			Overrides.harvest(container),
			selection.overrides
		));
		var nodes = Dom.childAndParentsUntil(
			container,
			Dom.isEditingHost
		).filter(Dom.isElementNode);
		Maps.forEach(commands, function (command, key) {
			if (command.override && command.override in overrides) {
				values[key] = !!overrides[command.override];
			} else {
				var value = 0;
				nodes.forEach(function (node) {
					value |= commandState(node, command);
				});
				values[key] = !!value;
			}
		});
		return values;
	}

	function formatBlock(boundaries, selection, command) {
		var style = command.style;
		var formatting = command.node.toUpperCase();
		boundaries = Editing.format(boundaries[0], boundaries[1], formatting);
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

	function formatInline(boundaries, selection, command) {
		var formatting = command.node.toUpperCase();
		if (!Boundaries.equals(boundaries[0], boundaries[1])) {
			return Editing.format(boundaries[0], boundaries[1], formatting);
		}
		var override = Overrides.nodeToState[formatting];
		if (!override) {
			return boundaries;
		}
		var overrides = Overrides.joinToSet(
			selection.formatting,
			Overrides.harvest(Boundaries.container(boundaries[0])),
			selection.overrides
		);
		selection.overrides = Overrides.toggle(overrides, override, true);
		return boundaries;
	}

	function removeFormatting(boundaries, selection, command) {
		command['nodes'].map(function (node) {
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

	function execute(command, boundaries, editor, event) {
		if (command.action) {
			boundaries = command.action(boundaries, editor.selection, command)
			          || boundaries;
		} else {
			var action = Html.isBlockNode({nodeName: command.node.toUpperCase()})
			           ? formatBlock
			           : formatInline;
			boundaries = action(boundaries, editor.selection, command);
		}
		editor.selection = Selections.select(
			editor.selection,
			boundaries[0],
			boundaries[1]
		);
		// TODO: Rely on nodechange event instead
		Fn.comp.apply(editor.stack, editor.stack)({
			preventSelection : false,
			type             : 'ui',
			nativeEvent      : event,
			editable         : Editables.fromBoundary(editor, boundaries[0]),
			selection        : editor.selection,
			dnd              : editor.dnd
		});
	}

	function bind(editables, fn) {
		editables = Arrays.is(editables) ? editables : [editables];
		if (0 === editables.length) {
			return fn;
		}
		return function (event) {
			var editor = editables[0].editor;
			var selection = editor.selection;
			if (!selection || !selection.boundaries) {
				return;
			}
			var boundaries = Boundaries.get(
				Boundaries.document(selection.boundaries[0])
			);
			if (!boundaries) {
				return;
			}
			var editable = Editables.fromBoundary(editor, boundaries[0]);
			if (!Arrays.contains(editables, editable)) {
				return;
			}
			fn(boundaries, editor, event);
		};
	}

	function command(editables, cmd) {
		return bind(editables, Fn.partial(execute, cmd));
	}

	var commands = {
		'p'         : { node : 'p'                         },
		'h2'        : { node : 'h2'                        },
		'h3'        : { node : 'h3'                        },
		'h4'        : { node : 'h4'                        },
		'ol'        : { node : 'ol'                        },
		'ul'        : { node : 'ul'                        },
		'pre'       : { node : 'pre'                       },
		'bold'      : { node : 'b', override : 'bold'      },
		'italic'    : { node : 'i', override : 'italic'    },
		'underline' : { node : 'u', override : 'underline' },
		'unformat'  : {
			'state'  : Fn.returnFalse,
			'action' : removeFormatting,
			'nodes'  : ['b', 'i', 'u', 'em', 'strong', 'sub', 'sup', 'del', 'small', 'code']
		}
	};

	return {
		bind     : bind,
		states   : states,
		command  : command,
		commands : commands
	};

});
