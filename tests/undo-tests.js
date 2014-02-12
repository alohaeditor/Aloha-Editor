(function (aloha) {
	'use strict';

	var Arrays = aloha.arrays;
	var Undo = aloha.undo;
	var Dom = aloha.dom;
	var Editing = aloha.editing;
	var Ranges = aloha.ranges;
	var Typing = aloha.typing;
	var Editables = aloha.editables;
	var Boundaries = aloha.boundaries;

	module('undo');

	function content(html) {
		return Arrays.coerce($('<div>' + html + '</div>').contents());
	}

	test('applyChangeSet', function () {
		var editable = document.getElementById('test-editable');

		var changeSet = {
			'changes': [
				{'type': 'insert',
				 'content': content('zero<b>one</b>two<i>three</i>four'),
				 'path': [[0, 'DIV']]},
				{'type': 'insert',
				 'content': content('<u>x</u>'),
				 'path': [[1, 'DIV'], [1, 'B']]},
				{'type': 'insert',
				 'content': content('x'),
				 'path': [[3, 'DIV'], [0, 'I'], [2, '#text']]}
			]
		};

		Undo.applyChangeSet(editable, changeSet);
		equal(editable.innerHTML, 'zero<b>one<u>x</u></b>two<i>thxree</i>four');
	});

	test('capture, inverseChangeSet', function () {
		var editable = $('#test-editable')[0];
		var controlEditable = Dom.clone(editable);
		var initialChangeSet = {
			'changes': [
				{'type': 'insert',
				 'content': content('zero<b>one</b>two<i>three</i>four'),
				 'path': [[0, 'DIV']]}
			]
		};
		Undo.applyChangeSet(editable, initialChangeSet);
		Undo.applyChangeSet(controlEditable, initialChangeSet);
		var initialEditable = Dom.clone(editable);

		var changeSet = {
			'changes': [
				// Top-levle insert (retained).
				{'type': 'insert',
				 'content': content('<x></x>1<y></y>2<z></z>3'),
				 'path': [[2, 'DIV']]},
				// Insert as a sibling to other inserts.
				{'type': 'insert',
				 'content': content('<b><em></em></b>'),
				 'path': [[5, 'DIV']]},
				// Insert contained in another insert (eliminated).
				{'type': 'insert',
				 'content': content('<i></i>'),
				 'path': [[5, 'DIV'], [0, 'B']]},
				// Delete contained in another insert (eliminated).
				{'type': 'delete',
				 'content': content('<em></em>'),
				 'path': [[5, 'DIV'], [1, 'B']]},
			]
		};

		var context = Undo.Context(editable);
		var capturedFrame = Undo.capture(context, {meta: true}, function () {
			Undo.applyChangeSet(editable, changeSet);
		});
		var capturedChangeSet = Undo.changeSetFromFrame(context, capturedFrame);
		Undo.applyChangeSet(controlEditable, capturedChangeSet);
		equal(editable.innerHTML, controlEditable.innerHTML);

		var undoChangeSet = Undo.inverseChangeSet(capturedChangeSet);
		Undo.applyChangeSet(editable, undoChangeSet);
		equal(editable.innerHTML, initialEditable.innerHTML);

		var redoChangeSet = Undo.inverseChangeSet(undoChangeSet);
		Undo.applyChangeSet(editable, redoChangeSet);
		equal(editable.innerHTML, controlEditable.innerHTML);
	});

	test('delete inside text node', function () {
		var editable = $('#test-editable')[0];
		$(editable).html('some <b>bold</b> text');
		var controlEditable = Dom.clone(editable);
		var context = Undo.Context(editable);
		var capturedFrame = Undo.capture(context, {meta: true}, function () {
			var range = Ranges.fromBoundaries([editable.firstChild, 2], [editable.firstChild, 3]);
			var haveToPassEmptyOverridesOtherwiseError = {overrides: []};
			Editing.delete(range, haveToPassEmptyOverridesOtherwiseError);
		});
		var modifiedEditable = Dom.clone(editable);
		var capturedChangeSet = Undo.changeSetFromFrame(context, capturedFrame);
		var undoChangeSet = Undo.inverseChangeSet(capturedChangeSet);
		Undo.applyChangeSet(editable, undoChangeSet);
		equal(editable.innerHTML, controlEditable.innerHTML);

		var redoChangeSet = Undo.inverseChangeSet(undoChangeSet);
		Undo.applyChangeSet(editable, redoChangeSet);
		equal(editable.innerHTML, modifiedEditable.innerHTML);
	});

	test('order of sequential deletes', function () {
		var editable = $('#test-editable')[0];
		$(editable).html('<b></b><i></i><em><strong></strong></em><span></span>');
		var controlEditable = Dom.clone(editable);
		var context = Undo.Context(editable);
		var capturedFrame = Undo.capture(context, {meta: true}, function () {
			var em = editable.childNodes[2];
			em.removeChild(em.firstChild);
			editable.removeChild(em);
			var i = editable.childNodes[1];
			editable.removeChild(i);
		});
		var changeSet = Undo.changeSetFromFrame(context, capturedFrame);
		var undoChangeSet = Undo.inverseChangeSet(changeSet);
		Undo.applyChangeSet(editable, undoChangeSet);
		equal(editable.innerHTML, controlEditable.innerHTML);
	});

	test('deletes contains a not-direct-child delete', function () {
		var editable = $('#test-editable')[0];
		$(editable).html('<div></div><div><i><b>legendos</b></i></div>quodsi<div></div>');
		var controlEditable = Dom.clone(editable);
		var context = Undo.Context(editable);
		var capturedFrame = Undo.capture(context, null, function () {
			var div = editable.childNodes[1];
			var i = div.firstChild;
			var legendos = i.firstChild.firstChild;
			var quodsi = div.nextSibling;
			div.removeChild(i);
			editable.removeChild(div);
			editable.removeChild(quodsi);
			var combinedTextNode = legendos;
			combinedTextNode.insertData(combinedTextNode.length, quodsi.data);
			editable.insertBefore(combinedTextNode, editable.childNodes[2]);
		});
		var changeSet = Undo.changeSetFromFrame(context, capturedFrame);
		var undoChangeSet = Undo.inverseChangeSet(changeSet);
		Undo.applyChangeSet(editable, undoChangeSet);
		equal(editable.innerHTML, controlEditable.innerHTML);
	});

	test('nested sorting of recordTree', function () {
		var editable = $('#test-editable')[0];
		$(editable).html('<div></div>xx<b>one<i>two</i>three</b>zz<div></div>');
		var controlEditable = Dom.clone(editable);
		var context = Undo.Context(editable);
		var capturedFrame = Undo.capture(context, null, function () {
			var xx = editable.childNodes[1];
			var b = editable.childNodes[2];
			var i = b.childNodes[1];
			var two = i.childNodes[0];
			var zz = editable.childNodes[3];
			var wrapper = document.createElement('I');
			editable.insertBefore(wrapper, xx);
			wrapper.appendChild(xx);
			wrapper.appendChild(b);
			wrapper.appendChild(zz);
			b.insertBefore(two, i);
			b.removeChild(i);
		});
		var changeSet = Undo.changeSetFromFrame(context, capturedFrame);
		var undoChangeSet = Undo.inverseChangeSet(changeSet);
		Undo.applyChangeSet(editable, undoChangeSet);
		equal(editable.innerHTML, controlEditable.innerHTML);
	});

	test('two deletes contain another delete', function () {
		var editable = $('#test-editable')[0];
		$(editable).html('<div></div>xx<b>one</b><i>two</i>zz<div></div>');
		var controlEditable = Dom.clone(editable);
		var context = Undo.Context(editable);
		var capturedFrame = Undo.capture(context, null, function () {
			var b = editable.childNodes[2];
			var one = b.childNodes[0];
			var i = editable.childNodes[3];
			var two = i.childNodes[0];
			b.removeChild(one);
			editable.removeChild(b);
			i.appendChild(b);
			b.appendChild(one);
			editable.removeChild(i);
			editable.appendChild(i);
		});
		var changeSet = Undo.changeSetFromFrame(context, capturedFrame);
		var undoChangeSet = Undo.inverseChangeSet(changeSet);
		Undo.applyChangeSet(editable, undoChangeSet);
		equal(editable.innerHTML, controlEditable.innerHTML);
	});

	test('an insert and a delete both contain another insert', function () {
		var editable = $('#test-editable')[0];
		$(editable).html('<i><b>xx</b></i>');
		var controlEditable = Dom.clone(editable);
		var context = Undo.Context(editable);
		var capturedFrame = Undo.capture(context, {meta: true}, function () {
			var b = document.createElement('B');
			editable.appendChild(b);
			var i0 = editable.firstChild;
			var b0 = i0.firstChild;
			var xx = b0.firstChild;
			b0.removeChild(xx);
			i0.insertBefore(xx, b0);
			i0.removeChild(b0);
			editable.insertBefore(b0, b);
			editable.removeChild(i0);
			b0.appendChild(i0);
		});
		var changeSet = Undo.changeSetFromFrame(context, capturedFrame);
		var undoChangeSet = Undo.inverseChangeSet(changeSet);
		Undo.applyChangeSet(editable, undoChangeSet);
		equal(editable.innerHTML, controlEditable.innerHTML);
	});

	test('reproduced formatting test', function () {
		var editable = $('#test-editable')[0];
		$(editable).html('iudicabit<i>vis,</i><i><b>ad.quodsiEtlegendos,legendos,no,maluissetinsolensDicantquodsiposseLoremsivixvis,per</b></i><br>sitno,<div><b><br></b></div>posseLoremproiracundiaper<b>dolor</b><div>no,</div><div><i>periracundiain</i></div><br>etiam<div><br></div>posse<div><br></div><div></div>inne<br>in.ipsum<br><br>');
		var controlEditable = Dom.clone(editable);
		var context = Undo.Context(editable);
		var capturedFrame = Undo.capture(context, {meta: true}, function () {

			var br = editable.childNodes[3];
			if (br.nodeName !== 'BR') throw Error();
			var b = document.createElement('B');
			Dom.wrap(br, b);

			var sitno = editable.childNodes[4]
			if (sitno.data !== 'sitno,') throw Error();
			var b2 = document.createElement('B');
			Dom.wrap(sitno, b2);

			var div = editable.childNodes[5];
			var bx = div.firstChild;
			var br2 = bx.firstChild;
			if (br.nodeName !== 'BR') throw Error();
			//bx.removeChild(br2);
			div.insertBefore(br2, bx);
			div.removeChild(bx);

			var b3 = document.createElement('B');
			Dom.wrap(br2, b3);

			var posseLorem = editable.childNodes[6];
			if (!(/^posseLorem/).test(posseLorem.data)) throw Error();
			var b4 = document.createElement('B');
			Dom.wrap(posseLorem, b4);

			var bx2 = editable.childNodes[7];
			if (bx2.nodeName !== 'B')throw Error();
			editable.removeChild(bx2);
			b4.appendChild(bx2);

			var dolor = bx2.firstChild;
			if (dolor.data !== 'dolor')throw Error();
			bx2.removeChild(dolor);
			b4.insertBefore(dolor, bx2);
			b4.removeChild(bx2);

			var div2 = editable.childNodes[7];
			var no = div2.firstChild;
			if (no.data !== 'no,') throw Error();
			var b5 = document.createElement('B');
			Dom.wrap(no, b5);

			var div3 = editable.childNodes[8];
			var i = div3.firstChild;
			if (i.nodeName !== 'I') throw Error();
			var b6 = document.createElement('B');
			Dom.wrap(i, b6);

			// 20
			editable.removeChild(b2)
			// 21
			b.appendChild(b2);
			// 22
			b2.removeChild(sitno);
			// 23
			b.insertBefore(sitno, b2);
			// 24
			b.removeChild(b2);

			// 25
			var i0 = editable.childNodes[2];
			var b0 = i0.firstChild;
			var adQuodsi = b0.firstChild;
			if (!(/^ad.quodsi/).test(adQuodsi.data)) throw Error();
			b0.removeChild(adQuodsi);
			// 26
			i0.insertBefore(adQuodsi, b0);
			// 27
			i0.removeChild(b0);
			// 28
			editable.insertBefore(b0, b);
			editable.removeChild(i0);
			// 29
			b0.appendChild(i0);
			// 30
			editable.removeChild(b);
			// 31
			b0.appendChild(b);
			if (br !== b.firstChild) throw Error();
			// 32
			b.removeChild(br);
			// 33
			b0.insertBefore(br, b);
			// 34
			b.removeChild(sitno);
			// 35
			b0.insertBefore(sitno, b);
			// 36
			b0.removeChild(b);
			// 37 character data
			dolor.replaceData(0, dolor.data.length, posseLorem.data + dolor.data);
			// 38
			b4.removeChild(posseLorem);
		});
		var changeSet = Undo.changeSetFromFrame(context, capturedFrame);
		var undoChangeSet = Undo.inverseChangeSet(changeSet);
		Undo.applyChangeSet(editable, undoChangeSet);
		equal(editable.innerHTML, controlEditable.innerHTML);
	});

	test('element is deleted from observed editable,'
	     + 'appended to a non-observed element,'
	     + 'and re-inserted with the non-observed element and removed again.', function () {
		var editable = $('#test-editable')[0];
		$(editable).html('<i></i>');
		var controlEditable = Dom.clone(editable);
		var context = Undo.Context(editable);
		var capturedFrame = Undo.capture(context, {meta: true}, function () {
			var i = editable.firstChild;
			var b = document.createElement('B');
			editable.removeChild(i);
			b.appendChild(i);
			editable.appendChild(b);
			b.removeChild(i);
		});
		var changeSet = Undo.changeSetFromFrame(context, capturedFrame);
		var undoChangeSet = Undo.inverseChangeSet(changeSet);
		Undo.applyChangeSet(editable, undoChangeSet);
		equal(editable.innerHTML, controlEditable.innerHTML);
	});

}(window.aloha));
