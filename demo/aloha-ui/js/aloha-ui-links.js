(function (aloha, $) {

	'use strict';

	var Dom = aloha.dom;
	var Keys = aloha.keys;
	var Carets = aloha.carets;
	var Editor = aloha.editor;
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
		var box = Carets.box(
			Boundaries.create(anchor, 0),
			Boundaries.create(anchor, 1)
		);
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
		$('.aloha-active').removeClass('aloha-active');
		Dom.addClass(anchor, 'aloha-active');
		Dom.addClass(toolbar, 'active');
		positionToolbar(toolbar, anchor);
		toolbar.querySelector('input').value = href;
		$('a.aloha-link-follow').attr('href', href);
		$('.aloha-action-target').toggleClass('active', '_blank' === target);
	}

	/**
	 * Retrieves a toolbar element.
	 *
	 * @private
	 * @param  {!Document} doc
	 * @return {?Element}
	 */
	function getToolbar(doc) {
		return Dom.upWhile(Dom.query('.aloha-link-toolbar', doc)[0], function (node) {
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
		$('a.aloha-active, a.aloha-link-follow')
			.attr('href', toolbar.querySelector('input').value);
	}

	/**
	 * Normalize boundaries, so that if either start or end boundaries are
	 * inside an anchor element both boundaries will snap to that element.
	 *
	 * If the boundaries are collapsed, they will be extended to word.
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
	 * Inserts a link at the boundary position.
	 *
	 * @param  {Array.<Boundary>} boundaries
	 * @return {Array.<Boundary>}
	 */
	function insertLink(boundaries) {
		boundaries = normalize(boundaries[0], boundaries[1]);
		if (Boundaries.container(boundaries[0]).nodeName !== 'A') {
			boundaries = Editing.wrap('A', boundaries[0], boundaries[1]);
			boundaries[0] = Boundaries.next(boundaries[0]);
			boundaries[1] = Boundaries.prev(boundaries[1]);
		}
		var doc = Boundaries.document(boundaries[0]);
		open(getToolbar(doc), Boundaries.container(boundaries[0]));
		Dom.query('.aloha-link-toolbar input[name=href]', doc)[0].focus();
		return boundaries;
	}

	/**
	 * Toggles the target attribute on any active anchor.
	 *
	 * @param  {Array.<Boundary>} boundaries
	 * @return {Array.<Boundary>}
	 */
	function toggleTarget(boundaries) {
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

	function escapeLink(boundaries) {
		var doc = Boundaries.document(boundaries[0]);
		var anchor = Dom.query('a.aloha-active', doc)[0];
		if (!anchor) {
			return boundaries;
		}
		var href = Dom.query('.aloha-link-toolbar input[name=href]', doc)[0];
		var boundary = Boundaries.next(Boundaries.fromEndOfNode(anchor));
		Editor.selection = Selections.select(
			Editor.selection,
			boundary,
			boundary
		);
		if (!href.value) {
			Dom.removeShallow(anchor);
		}
		return [boundary, boundary];
	}

	var shortcuts = {
		'enter'  : escapeLink,
		'escape' : escapeLink,
		'meta+k' : insertLink,
		'ctrl+k' : insertLink
	};

	var commands = {
		'link'   : { action: insertLink, node: 'a' },
		'target' : { action: toggleTarget }
	};

	/*
	 * link toolbar interactions
	 */
	$('.aloha-link-toolbar input[name=href]').on('keyup', function (event) {
		if (Editor.selection) {
			interact(
				getToolbar(Boundaries.document(Editor.selection.boundaries[0])),
				getAnchor(Editor.selection.boundaries)
			);
		}
		var key = Keys.parseKeys(event);
		var handler = Keys.shortcutHandler(key.meta, key.keycode, shortcuts);
		if (handler) {
			Editor.selection.boundaries = handler(Editor.selection.boundaries);
		}
	});

	function middleware(event) {
		var boundaries = event.selection.boundaries;
		var isInLink = 0 < Dom.childAndParentsUntil(
			Boundaries.container(boundaries[0]),
			Dom.isEditingHost
		).filter(function (node) { return 'A' === node.nodeName; }).length;
		if ('leave' === event.type) {
			if (isInLink) {
				Dom.addClass(
					getToolbar(Boundaries.document(boundaries[0])),
					'active'
				);
			}
			return event;
		}
		if (isInLink) {
			open(
				getToolbar(Boundaries.document(boundaries[0])),
				getAnchor(boundaries)
			);
		} else {
			$('.aloha-active').removeClass('aloha-active');
		}
		return event;
	}

	aloha.linksUi = {
		commands   : commands,
		shortcuts  : shortcuts,
		middleware : middleware
	};

})(window.aloha, window.jQuery);
