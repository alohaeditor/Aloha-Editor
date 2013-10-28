require([
	'../src/aloha',
	'../src/editables',
	'../src/arrays',
	'../src/typing',
	'../src/keys',
	'../src/undo',
	'../src/ranges',
	'../src/crazy-slots'
], function (
	Aloha,
	Editables,
	Arrays,
	Typing,
	Keys,
	Undo,
	Ranges,
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
		Editables.assocIntoEditor(editor, editable);
		Undo.enter(editable.undoContext, {
			meta: {type: 'external'},
			partitionRecords: true
		});
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
					Typing.actions.insertText(range, text, editor);
				}
			}
		];
		var simpleActions = [
			Keys.CODES.delete,
			Keys.CODES.backspace,
			Keys.CODES.enter,
			'shift+' + Keys.CODES.enter,
			'ctrl+' + Keys.CODES.undo,
			'ctrl+shift+' + Keys.CODES.undo,
			'ctrl+' + Keys.CODES.bold,
			'ctrl+' + Keys.CODES.italic
		];
		var deletesRange = [
			Keys.CODES.delete,
			Keys.CODES.backspace,
			Keys.CODES.enter,
			'shift+' + Keys.CODES.enter
		];
		var endOfLineProbabilities = {};
		endOfLineProbabilities[Keys.CODES.enter] = 4;
		simpleActions.forEach(function (code) {
			mutations.push({
				deletesRange: Arrays.contains(deletesRange, code),
				endOfLineProbability: endOfLineProbabilities[code],
				mutate: function (elem, range) {
					Typing.actions[code](range, editor);
				}
			});
		});
		CrazySlots.run(editable.elem, mutations, {
			runs: 10000,
			wait: 0
		});
	}

	if ('undefined' === typeof aloha) {
		setVersion('src');
	} else {
		setVersion('build');
	}
	main()
});
