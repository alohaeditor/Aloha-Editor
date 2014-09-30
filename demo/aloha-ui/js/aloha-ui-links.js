(function (aloha) {

	'use strict';

	var Ui = aloha.editor.ui;
	var $$ = Ui.$$;
	var Dom = aloha.dom;
	var Keys = aloha.keys;
	var Maps = aloha.maps;
	var Editor = aloha.editor;
	var Arrays = aloha.arrays;
	var Editing = aloha.editing;
	var Selections = aloha.selections;
	var Boundaries = aloha.boundaries;
	var Traversing = aloha.traversing;

	/**
	 * Positions the given toolbar element to point to the anchor element in the
	 * document.
	 *
	 * @private
	 * @param {!Element} toolbar
	 * @param {!Element} anchor
	 */
	function positionToolbar(toolbar, anchor) {
		var box = aloha.carets.box(Boundaries.range(
			Boundaries.create(anchor, 0),
			Boundaries.create(anchor, 1)
		));
		var center = Math.round(box.left + (box.width / 2));
		var win = Dom.documentWindow(anchor.ownerDocument);
		var windowWidth = win.innerWidth;
		var toolbarWidth = parseInt(Dom.getComputedStyle(toolbar, 'width'), 10);
		var buffer = 10;
		var xMin = buffer;
		var xMax = (windowWidth - toolbarWidth) - buffer;
		var x = Math.min(xMax, Math.max(xMin, center - (toolbarWidth / 2)));
		var y = box.top + box.height + buffer;
		Dom.setStyle(toolbar, 'left', x + 'px');
		Dom.setStyle(toolbar, 'top', y + 'px');
		// var arrow = toolbar.querySelector('.aloha-arrow-up');
		// var arrowOffset = (x <= xMin || x >= xMax) ? (center - x) + 'px' : 'auto';
		// Dom.setStyle(arrow, 'margin-left', arrowOffset);
	}

	function notAnchor(node) { return 'A' !== node.nodeName; }

	/**
	 * Opens the given context toolbar for editing the given anchor.
	 *
	 * @private
	 * @param {!Element} toolbar
	 * @param {!Element} anchor
	 */
	function open(toolbar, anchor) {
		var href = Dom.getAttr(anchor, 'href');
		var target = Dom.getAttr(anchor, 'target');
		$$('.aloha-active').removeClass('aloha-active');
		Dom.addClass(anchor, 'aloha-active');
		Dom.addClass(toolbar, 'active');
		positionToolbar(toolbar, anchor);
		toolbar.querySelector('input').value = href;
		$$('a.aloha-link-follow').setAttr('href', href);
		if ('_blank' === target) {
			$$('.aloha-action-target').addClass('active');
		} else {
			$$('.aloha-action-target').removeClass('active');
		}
	}

	/**
	 * Retrieves a toolbar element.
	 *
	 * @private
	 * @return {?Element}
	 */
	function getToolbar() {
		return Dom.upWhile($$('.aloha-link-toolbar').elements[0], function (node) {
			return !Dom.hasClass(node, 'aloha-ui');
		});
	}

	/**
	 * Resolves the anchor element from the boundaries
	 *
	 * @private
	 * @param  {Array.<Boundary>} boundaries
	 * @return {?Element}
	 */
	function getAnchor(boundaries) {
		return Dom.upWhile(Boundaries.container(boundaries[0]), notAnchor)
			|| Dom.upWhile(Boundaries.container(boundaries[1]), notAnchor);
	}

	/**
	 * Handles user interaction on the context toolbar.
	 *
	 * @private
	 * @param {!Element} element
	 * @param {!Element} anchor
	 */
	function interact(toolbar, anchor) {
		$$('a.aloha-active, a.aloha-link-follow').setAttr(
			'href',
			toolbar.querySelector('input').value
		);
	}

	/**
	 * Normalize boundaries, so that if either start
	 * or end boundaries are inside an anchor element
	 * both boundaries will snap to that element.
	 *
	 * If the boundaries are collapsed, they will be
	 * extended to word.
	 *
	 * @private
	 * @param  {!Boundary} start
	 * @param  {!Boundary} end
	 * @return {Array.<Boundary>}
	 */
	function normalize(start, end) {
		var boundaries = [start, end];
		for (var i = 0; i < boundaries.length; i++) {
			var anchor = Dom.upWhile(Boundaries.container(boundaries[i]), notAnchor);
			if (anchor) {
				return [
					Boundaries.fromStartOfNode(anchor),
					Boundaries.fromEndOfNode(anchor)
				];
			}
		}
		return Boundaries.equals(start, end)
			 ? Traversing.expand(start, end, 'word')
			 : boundaries;
	}

	/**
	 * Inserts a link at the boundary position
	 *
	 * IMPORTANT: this function MUST be a named
	 * function, because we will need to
	 * prevent a selection update when a new link
	 * is inserted later on.
	 *
	 * @private
	 * @param  {!Boundary} start
	 * @param  {!Boundary} end
	 * @return {Array.<Boundary>}
	 */
	function insertLink(start, end) {
		var boundaries = normalize(start, end);
		if (Boundaries.container(boundaries[0]).nodeName !== 'A') {
			boundaries = Editing.wrap('A', boundaries[0], boundaries[1]);
			boundaries[0] = Boundaries.next(boundaries[0]);
			boundaries[1] = Boundaries.fromEndOfNode(boundaries[0])[0];
		}
		open(getToolbar(), Boundaries.container(boundaries[0]));
		$$('.aloha-link-toolbar input[name=href]').elements[0].focus();
		return boundaries;
	}

	/**
	 * Toggles the target attribute on any active anchor.
	 *
	 * @private
	 * @param  {!Boundary} start
	 * @param  {!Boundary} end
	 * @return {Array.<Boundary>}
	 */
	function toggleTarget(start, end) {
		var boundaries = [start, end];
		var anchor = getAnchor(boundaries);
		if (!anchor) {
			return boundaries;
		}
		if ('_blank' === Dom.getAttr(anchor, 'target')) {
			Dom.removeAttr(anchor, 'target');
		} else {
			Dom.setAttr(anchor, 'target', '_blank');
		}
		return boundaries;
	}

	/**
	 * Updates the ui according to any active anchor element.
	 *
	 * @private
	 * @param {!Selection}     selection
	 * @param {Array.<string>} formats
	 */
	function update(selection, formats) {
		if (Arrays.contains(formats, 'A')) {
			open(getToolbar(), getAnchor(selection.boundaries));
		} else {
			$$('.aloha-active').removeClass('aloha-active');
		}
	}

	var shortcuts = {
		'enter' : function (start, end) {
			var anchor = $$('a.aloha-active').elements[0];
			if (!anchor) {
				return [start, end];
			}
			var href = $$('.aloha-link-toolbar input[name=href]').elements[0];
			var boundary = Boundaries.next(Boundaries.fromEndOfNode(anchor));
			Editor.selection = Selections.select(
				Editor.selection,
				boundary,
				boundary
			);
			if (!href.value) {
				Dom.removeShallow(anchor);
			}
			Ui.update(Editor.selection);
			return Editor.selection.boundaries;
		}
	};

	/*
	 * link toolbar interactions
	 */
	$$('.aloha-link-toolbar input[name=href]').on('keyup', function (event) {
		if (Editor.selection) {
			interact(getToolbar(), getAnchor(Editor.selection.boundaries));
		}
		var key = Keys.parseKeys(event);
		var handler = Keys.shortcutHandler(key.meta, key.keycode, shortcuts);
		if (handler) {
			Editor.selection.boundaries = handler(
				Editor.selection.boundaries[0],
				Editor.selection.boundaries[1]
			);
		}
	});

	Ui.actions = Maps.merge(Ui.actions, {
		'aloha-action-A'      : insertLink,
		'aloha-action-target' : toggleTarget
	});

	Ui.shortcuts = Maps.merge(Ui.shortcuts, {
		'meta+k' : insertLink,
		'ctrl+k' : insertLink
	});

	Ui.updateHandlers.push(update);

})(window.aloha);
