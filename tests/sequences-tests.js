(function (aloha) {
	'use strict';

	var Html = aloha.html;

	// `readMarkers

	function readMarkers(marked) {
		var onlyBrackets = marked.replace(/[\{\}\|]/g, '');
		var bracketsStart = onlyBrackets.search(/\[/);
		var bracketsEnd = onlyBrackets.search(/\]/) - 1;
		var brackets = bracketsStart > -1 && bracketsEnd > -1
		             ? [bracketsStart, bracketsEnd]
		             : [];
		var onlyBraces = marked.replace(/[\[\]\|]/g, '');
		var bracesStart = onlyBraces.search(/\{/);
		var bracesEnd = onlyBraces.search(/\}/) - 1;
		var braces = bracesStart > -1 && bracesEnd > -1
		           ? [bracesStart, bracesEnd]
		           : [];
		return {
			braces   : braces,
			brackets : brackets,
			single   : marked.replace(/[\{\}\[\]]/g, '').search(/\|/),
			content  : marked.replace(/[\{\}\[\]\|]/g, '')
		};
	}

	// `compareSpans `test

	[
		['ab[{cde12}]34',  0], // a == b
		['[abcde]{1234}', -1], // a < b
		['{abcde}[1234]',  1], // a > b
		['[ab{cde]1234}', -1], // a < b
		['ab{cde[12}34]',  1], // a > b
		['[ab{cde12}34]', -1], // a < b
		['{ab[cde12]34}',  1]  // a > b
	].forEach(function (test) {
		var markers = readMarkers(test[0]);
		var a = markers.brackets;
		var b = markers.braces;
		var result = compareSpans(a, b);
		if (test[1] !== result) {
			console.error(
				'compareSpan(a[' + a + '], b[' + b + '])'
				+ ' expected ' + test[1] + ' but got ' + result
			);
		}
	});

	[
		['[a{b]c}', true],
		['{a[b}c]', true],
		['[a{b}c]', false],
		['{a[b]c}', false],
		['{ab[c]}', false],
		['[{a}bc]', false],
		['[{abc}]', false],
		['[ab]{c}', false],
		['[a]b{c}', false]
	].forEach(function (test) {
		var markers = readMarkers(test[0]);
		var a = markers.brackets;
		var b = markers.braces;
		if (test[1] !== overlaps(a, b)) {
			console.error('overlap() failed:', test);
		}
	});

	// [one{two]three[four}five] => [one{two}]{three}[{four}five]
	// [one{two]three[four}five] => [one]{[two]three[four]}[five]
	// [one{two]three}fourfive => [one{two}]{three}fourfive
	// [one{two]three}fourfive => [one]{[two]three}fourfive
	// [one{two]three}fourfive => [one{two}]{three}fourfive
	// {one[two}three]fourfive => {one[two]}[three]fourfive

	[{
		formatting: 'one{twothreefour}five',
		// [one{two]th[r]ee[four}five]
		initialSpans: [
			['[onetwo]threefourfive', 'a'],
			['onetwoth[r]eefourfive', 'b'],
			['onetwothree[fourfive]', 'c']
		],
		expectedSpans: [
			['[one]twothreefourfive', 'a'],
			['one[twothreefour]five', 'x'],
			['one[two]threefourfive', 'a'],
			['onetwoth[r]eefourfive', 'b'],
			['onetwothree[four]five', 'c'],
			['onetwothreefour[five]', 'c']
		]
	}, {
		formatting: 'onetwo{three}fourfive',
		// [onetwo]{th[r]ee}[fourfive]
		initialSpans: [
			['[onetwo]threefourfive', 'a'],
			['onetwoth[r]eefourfive', 'b'],
			['onetwothree[fourfive]', 'c']
		],
		expectedSpans: [
			['[onetwo]threefourfive', 'a'],
			['onetwo[three]fourfive', 'x'],
			['onetwoth[r]eefourfive', 'b'],
			['onetwothree[fourfive]', 'c']
		]
	}, {
		formatting: 'one{twothreefour}five',
		// [on[e{two]]three[[[fo]ur}fi]ve]
		// [on(e)]{[(two)]three[(<fo>ur)]}[(fi)ve]
		initialSpans: [
			['[onetwo]threefourfive', 'a'],
			['on[etwo]threefourfive', 'b'],
			['onetwothree[fourfive]', 'c'],
			['onetwothree[fourfi]ve', 'd'],
			['onetwothree[fo]urfive', 'e']
		],
		expectedSpans: [
			['[one]twothreefourfive', 'a'],
			['on[e]twothreefourfive', 'b'],
			['one[twothreefour]five', 'x'],
			['one[two]threefourfive', 'a'],
			['one[two]threefourfive', 'b'],
			['onetwothree[four]five', 'c'],
			['onetwothree[four]five', 'd'],
			['onetwothree[fo]urfive', 'e'],
			['onetwothreefour[five]', 'c'],
			['onetwothreefour[fi]ve', 'd']
		]
	}].forEach(function (test) {
		var markered = readMarkers(test.formatting);
		var formatting = markered.braces.concat('x');
		var initial = test.initialSpans.reduce(function (list, markers) {
			return list.concat([
				readMarkers(markers[0]).brackets.concat(markers[1])
			]);
		}, []);
		var content = markered.content;
		format(initial, formatting).forEach(function (format, index) {
			var text = content.substring(0, format[0]) + '['
			         + content.substring(format[0], format[1])
			         + ']' + content.substring(format[1]);
			var expected = test.expectedSpans[index];
			if (!(expected[0] === text && expected[1] === format[2])) {
				console.error(
					'format() failed:\n'
					+ 'Expected: "' + expected[0] + ', ' + expected[1] + '"\n'
					+ 'Result: "' + text + ', ' + format[2] + '"'
				);
			}
		});
	});

	// `readMarkers `tests

	[{
		test     : '012[345]6789',
		content  : '0123456789',
		braces   : [],
		brackets : [3, 6],
		single   : -1
	}, {
		test     : '0|12[345]6789',
		content  : '0123456789',
		braces   : [],
		brackets : [3, 6],
		single   : 1
	}, {
		test     : '0{1}2[345]6789',
		content  : '0123456789',
		braces   : [1, 2],
		brackets : [3, 6],
		single   : -1
	}, {
		test     : '0{12[3}45]6789',
		content  : '0123456789',
		braces   : [1, 4],
		brackets : [3, 6],
		single   : -1
	}].forEach(function (test) {
		aloha.maps.forEach(readMarkers(test.test), function (value, key) {
			if (test[key].toString() !== value.toString()) {
				console.error(
					'readMarkers() test:',
					'Expected ' + key + ' to be "' + value + '", but got "' + test[key] + '"'
				);
			}
		});
	});

	// `sequenceChanges `tests

	[

		['a b c d', 'a b * c d'    , [  0,  0,  1,  0,  0         ]],
		['a b c d', 'a b d'        , [  0,  0, -1,  0             ]],
		['a b c d', 'a * b c'      , [  0,  1,  0,  0, -1         ]],
		['a b c d', '* a b c *'    , [  1,  0,  0,  0, -1,  1     ]],
		['a b c d', 'b * c'        , [ -1,  0,  1,  0, -1         ]],
		['a b c d', 'b d c'        , [ -1,  0, -2,  0,            ]],
		['a b c d', 'a b c d * *'  , [  0,  0,  0,  0,  1,  1     ]],
		['a b c d', '* * * a b c d', [  1,  1,  1,  0,  0,  0,  0 ]]

	].forEach(function (test) {
		var changes = sequenceChanges(
			test[0].split(' '),
			test[1].split(' '),
			function (a, b) { return a === b; },
			aloha.arrays.contains
		);
		if (changes.join(',') !== test[2].join(',')) {
			console.error(changes, test[2]);
		}
	});

	// `remove `tests

	(function () {
		var original = [];
		var expected = [];
		[

			//   |
			//   { }
			//   {   }
			//   {       }
			//   {             }
			//       [     ]
			// 0 1 2 3 4 5 6 7 8 9
			['0{1}23456789', '0{1}26789'],
			['0{12}3456789', '0{12}6789'],
			['0{1234}56789', '0{12}6789'],
			['0{1234567}89', '0{1267}89'],

			//       |
			//       {   }
			//       {     }
			//       {         }
			//       [     ]
			// 0 1 2 3 4 5 6 7 8 9
			['012{34}56789', '012{}6789'],
			['012{345}6789', '012{}6789'],
			['012{34567}89', '012{67}89'],

			//         |
			//         { }
			//         {   }
			//         {       }
			//       [     ]
			// 0 1 2 3 4 5 6 7 8 9
			['0123{4}56789', '0126789'],
			['0123{45}6789', '012{}6789'],
			['0123{4567}89', '012{67}89'],

			//             |
			//             {   }
			//       [     ]
			// 0 1 2 3 4 5 6 7 8 9
			['012345{67}89', '012{67}89'],

			//               |
			//               { }
			//       [     ]
			// 0 1 2 3 4 5 6 7 8 9
			['0123456{7}89', '0126{7}89']
		].forEach(function (test) {
			original.push(readMarkers(test[0]).braces);
			var braces = readMarkers(test[1]).braces;
			expected.push(0 === braces.length ? [-1,-1] : braces);
		});
		var sequence = copy({
			content    : '0123456789',
			boundaries : original
		});
		var range = readMarkers('012{345}6789').braces;
		var result = remove(sequence, range[0], range[1]);
		if ('0126789' !== result.content) {
			console.error('remove() tests: result.content don\'t match');
		}
		var preserved = result.boundaries;
		expected.forEach(function (expected, index) {
			if (preserved[index] && expected.toString() !== preserved[index].toString()) {
				console.error(
					'remove() tests #' + index + ': Expected "',
					expected.toString() || '   ',
					'" but got "',
					preserved[index].toString() || '   ',
					'"'
				);
			}
		});
	}());

	// `create `tests

	[{
		markup  : '<div contentEditable="true">foo<u>ba<i>r</i> baz</u><img/>  qux</div>',
		content : 'foobar baz' + VOID_CHARACTER + 'qux',
		control : 'foo{ba[r] baz}' + VOID_CHARACTER + '  qux',
		markers : {
			U : 'braces',
			I : 'brackets'
		}
	}].forEach(function (test) {
		var sequence = create(Html.parse(test.markup, document)[0]);
		if (test.content !== sequence.content) {
			console.error(
				'create() test:',
				'Expected "', test.content, '" ',
				'but got "', sequence.content, '"'
			);
		}
		var markers = readMarkers(test.control);
		sequence.boundaries.forEach(function (range) {
			var marker = test.markers[range[2].nodeName];
			if (marker && (range.slice(0, -1).toString() !== markers[marker].toString())) {
				console.error(
					'parseDom() test:',
					'Expected "', markers[marker].toString(), '" ',
					'but got "', range.slice(0, -1).toString(), '"'
				);
			}
		});
	});

	[{
		markup  : '<div> &nbsp;foo &nbsp;&nbsp;<u>ba<i>r</i> baz</u>      qux</div>',
		content : ' foo   bar baz qux'
	}].forEach(function (test) {
		// var sequence = create(Html.parse(test.markup, document)[0]);
		// console.error(test.content === sequence.content);
		// test.content.split('').map(function(x){return x.charCodeAt()})
		// sequence.content.split('').map(function(x){return x.charCodeAt()})
	});

	// `insertBefore `insertAfter

	(function () {
		var seq = create(Html.parse(
			'<p contentEditable="true"><b>one</b>two <br/> <i><u>three</u>four</i>five</p>',
			document
		)[0]);
		seq.boundaries = [[3,13]];
		var result1 = hint(seq, seq.boundaries[0]);
		seq = insertBefore(seq, seq.boundaries[0][0], '123');
		var result2 = hint(seq, seq.boundaries[0]);
		seq = insertAfter(seq, seq.boundaries[0][0], '456');
		var result3 = hint(seq, seq.boundaries[0]);
		var expect1 = 'one▓[two three]▓fourfive';
		var expect2 = 'one123▓[two three]▓fourfive';
		var expect3 = 'one123▓[456two three]▓fourfive';
		aloha.asserts.assert(
			expect1 === result1,
			'Expected "' + expect1 + '" but got "' + result1 + '"'
		);
		if (expect2 !== result2) {
			console.error(
				'insertBefore() test: Expected "' + expect2 + '" but got "' + result2 + '"'
			);
		}
		if (expect3 !== result3) {
			console.error(
				'insertAfter() test: Expected "' + expect3 + '" but got "' + result3 + '"'
			);
		}
	})();

	(function () {
		var seq = create(Html.parse('<p contentEditable="true">one <br> two</p>', document)[0]);
		console.log(seq.element.innerHTML === update(seq).element.innerHTML);
		seq = create(Html.parse('<p contentEditable="true">one<br>two</p>', document)[0]);
		seq = insertAfter(seq, 4, '>');
		seq = insertAfter(seq, 3, '<');
		console.log(hint(seq, seq.formatting[0]));
		seq = create(Html.parse('<p contentEditable="true">one<br>two</p>', document)[0]);
		seq = insertBefore(seq, 4, '>');
		seq = insertBefore(seq, 3, '<');
		console.log(hint(seq, seq.formatting[0]));
	})();

}(window.aloha));
