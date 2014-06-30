(function (aloha, require) {
	'use strict';

	function main(
		Editables,
		Arrays,
		Typing,
		Keys,
		Undo,
		Ranges,
		Dom,
		CrazySlots
	) {
		var editor = {
			settings: {
				defaultBlockNodeName: 'div'
			},
			overrides: [],
			editables: {}
		};
		var elem = document.getElementById('aloha-editable');
		elem.setAttribute('contentEditable', 'true');
		var editable = Editables.Editable(elem);
		editable.overrides = [];
		editable.settings = {
			defaultBlockNodeName: 'div'
		};
		Editables.assocIntoEditor(editor, editable);
		var mutations = [
			{
				probability: 10,
				deletesRange: true,
				mutate: function (elem, range) {
					var texts = ['Lorem', 'ipsum', 'dolor', 'sit', 'amet,', 'quodsi', 'deleniti', 'per', 'at,',
								 'pro', 'aperiam', 'dissentiet', 'ad.', 'Hinc', 'nominati',
								 'pri', 'no,', 'et',
								 'vix', 'tacimates', 'maluisset', 'adversarium.', 'Et',
								 'mea', 'etiam', 'legendos,',
								 'posse', 'graeco', 'bonorum', 'per', 'in.',
								 'Dicant', 'insolens', 'iracundia', 'ne', 'vis,', 'in',
								 'eligendi', 'iudicabit', 'vis.'];

					var text = texts[CrazySlots.randomInt(0, texts.length - 1)];
					if (CrazySlots.randomInt(0, 20) !== 0) {
						Ranges.collapseToStart(range);
					}
					Undo.capture(editable.undoContext, {meta: 'typing'}, function () {
						Typing.actions.inputText.mutate({
							editable: editable,
							range: range,
							chr: text
						});
					});
				}
			}
		];
		function mutationFromAction(action) {
			return function (elem, range) {
				if (action.undo) {
					Undo.capture(editable.undoContext, {meta: action.undo}, function () {
						action.mutate({editable: editable, range:  range});
					});
				} else {
					action.mutate({editable: editable, range: range});
				}
			};
		}
		var simpleMutations = [
			{
				deletesRange: true,
				mutate: mutationFromAction(Typing.actions.deleteBackward)
			},
			{
				deletesRange: true,
				mutate: mutationFromAction(Typing.actions.deleteForward)
			},
			{
				deletesRange: true,
				endOfLineProbability: 4,
				mutate: mutationFromAction(Typing.actions.breakBlock)
			},
			{
				deletesRange: true,
				endOfLineProbability: 4,
				mutate: mutationFromAction(Typing.actions.breakLine)
			},
			{
				deletesRange: false,
				mutate: mutationFromAction(Typing.actions.formatBold)
			},
			{
				deletesRange: false,
				mutate: mutationFromAction(Typing.actions.formatItalic)
			},
			{
				deletesRange: false,
				mutate: mutationFromAction(Typing.actions.undo)
			},
			{
				deletesRange: false,
				mutate: mutationFromAction(Typing.actions.redo)
			}
		];
		mutations = mutations.concat(simpleMutations);
		CrazySlots.run(editable, mutations);
	}

	if (aloha) {
		require(['crazy-slots'], function (CrazySlots) {
			main(
				aloha.editables,
				aloha.arrays,
				aloha.typing,
				aloha.keys,
				aloha.undo,
				aloha.ranges,
				aloha.dom,
				CrazySlots
			);
		});
	} else {
		require([
			'../../src/editables',
			'../../src/arrays',
			'../../src/typing',
			'../../src/keys',
			'../../src/undo',
			'../../src/ranges',
			'../../src/dom',
			'crazy-slots'
		], main);
	}

}(window.aloha, window.require));
