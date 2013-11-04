require([
	'../src/aloha',
	'../src/editables',
	'../src/arrays',
	'../src/typing',
	'../src/keys',
	'../src/undo',
	'../src/ranges',
	'../src/dom',
	'../src/crazy-slots'
], function (
	Aloha,
	Editables,
	Arrays,
	Typing,
	Keys,
	Undo,
	Ranges,
	Dom,
	CrazySlots
) {
	'use strict';

	function setVersion (version) {
		var h1 = document.getElementsByTagName('h1')[0];
		if (h1) {
			h1.innerHTML = h1.innerHTML + ': <span style="color:#df215a">' + version + '</span>';
		}
	}

	function main() {
		var editor = {
			settings: {
				defaultBlockNodeName: 'div'
			},
			overrides: [],
			editables: {}
		};
		var elem = document.getElementById('aloha-editable');
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
					Typing.actions.inputText.mutate({
						editable: editable,
						range: range,
						chr: text
					});
				}
			}
		];
		function mutationFromAction(action) {
			return function (elem, range) {
				action.mutate({editable: editable, range:  range});
			};
		}
		var simpleMutations = [
			{
				deletesRange: true,
				mutate: mutationFromAction(Typing.actions.deleteBackwards)
			},
			{
				deletesRange: true,
				mutate: mutationFromAction(Typing.actions.deleteForwards)
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

	if ('undefined' === typeof aloha) {
		setVersion('src');
	} else {
		setVersion('build');
	}
	main()
});
