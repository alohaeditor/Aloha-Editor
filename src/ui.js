/**
 * ui.js is part of Aloha Editor project http://www.alohaeditor.org
 *
 * Aloha Editor ● JavaScript Content Editing Library
 * Copyright (c) 2010-2015 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://www.alohaeditor.org/docs/contributing.html
 * @namespace ui
 */
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

	/**
	 * For the given command, determines if the command state is true for the
	 * specified node.
	 *
	 * @private
	 * @param  {Node}    node
	 * @param  {Command} command
	 * @return {boolean}
	 */
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

	/**
	 * Determines the states of the commands for the given event.
	 *
	 * @param  {Object.<string, command>} commands
	 * @param  {Event}                    event
	 * @return {Object.<string, boolean>}
	 * @memberOf ui
	 */
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

	/**
	 * Applies the given formatting command for blocks inside the given
	 * boundaries.
	 *
	 * @private
	 * @param  {Array.<Boundary>} boundaries
	 * @param  {Selection}        selection
	 * @param  {Command}          command
	 * @return {Array.<Boundary>}
	 */
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

	/**
	 * Applies the given formatting command for inline elements inside the given
	 * boundaries.
	 *
	 * @private
	 * @param  {Array.<Boundary>} boundaries
	 * @param  {Selection}        selection
	 * @param  {Command}          command
	 * @return {Array.<Boundary>}
	 */
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

	/**
	 * Removes formatting between the given boundaries according to the given command.
	 *
	 * @private
	 * @param  {Array.<Boundary>} boundaries
	 * @param  {Selection}        selection
	 * @param  {Command}          command
	 * @return {Array.<Boundary>}
	 */
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

	/**
	 * Executes the given command
	 *
	 * @private
	 * @param {Command}          command
	 * @param {Array.<Boundary>} boundaries
	 * @param {Editor}           editor
	 * @param {AlohaEvent}       event
	 */
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
		var editable = Editables.fromBoundary(editor, boundaries[0]);
		if (editable) {
			// TODO: Rely on nodechange event instead
			Fn.comp.apply(editor.stack, editor.stack)({
				preventSelection : false,
				type             : 'nodechange',
				nativeEvent      : event,
				editable         : editable,
				selection        : editor.selection,
				dnd              : editor.dnd
			});
		}
	}

	/**
	 * Binds the given function to only be executed if the current document
	 * selection is inside the given editable(s).
	 *
	 * @param {Editable|Array.<Editable>} editables
	 * @param {function(Boundaries, Editor, AlohaEvent)}
	 * @memberOf ui
	 */
	function bind(editables, fn) {
		var check = 0 === editables.length
		          ? Fn.returnTrue
		          : Fn.partial(Arrays.contains, editables);
		// TODO: I'm sorry. I'll fix this!
		var editor = (editables[0] || window['aloha'])['editor'];
		return function (event) {
			var selection = editor.selection;
			if (selection && selection.boundaries) {
				var boundaries = Boundaries.get(Boundaries.document(selection.boundaries[0]));
				if (boundaries && check(Editables.fromBoundary(editor, boundaries[0]))) {
					fn(boundaries, editor, event);
				}
			}
		};
	}

	/**
	 * Binds the given command.
	 *
	 * @param  {Command}           cmd
	 * @param  {Array.<Editable>=} editables
	 * @return {function(Boundaries, Editor, AlohaEvent)}
	 * @memberOf ui
	 */
	function command(editables, cmd) {
		if (Editables.is(editables)) {
			editables = [editables];
		}
		if (!Arrays.is(editables)) {
			cmd = editables;
			editables = [];
		}
		return bind(editables, Fn.partial(execute, cmd));
	}

	/**
	 * UI Commands.
	 *
	 * <pre>
	 * Commands:
	 *     p
	 *     h1
	 *     h2
	 *     h3
	 *     h4
	 *     ol
	 *     ul
	 *     pre
	 *     bold
	 *     italic
	 *     underline
	 *     unformat
	 * </pre>
	 *
	 * @type {Object}
	 * @memberOf ui
	 */
	var commands = {
		'p'         : { 'node' : 'p'                           },
		'h1'        : { 'node' : 'h1'                          },
		'h2'        : { 'node' : 'h2'                          },
		'h3'        : { 'node' : 'h3'                          },
		'h4'        : { 'node' : 'h4'                          },
		'ol'        : { 'node' : 'ol'                          },
		'ul'        : { 'node' : 'ul'                          },
		'pre'       : { 'node' : 'pre'                         },
		'bold'      : { 'node' : 'b', 'override' : 'bold'      },
		'italic'    : { 'node' : 'i', 'override' : 'italic'    },
		'underline' : { 'node' : 'u', 'override' : 'underline' },

		/**
		 * Unformat command.
		 *
		 * @type {Object}
		 * @memberOf ui.commands
		 */
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
