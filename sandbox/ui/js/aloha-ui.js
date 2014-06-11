require([
	'../../src/aloha',
	'../../src/arrays',
	'../../src/boromir',
	'../../src/boundaries',
	'../../src/dom',
	'../../src/formatting'
], function (
	aloha,
	Arrays,
	Boromir,
	Boundaries,
	Dom,
	Formatting
) {
	'use strict';

  	[].forEach.call(document.querySelectorAll('.aloha-editable'), aloha);
	
	var CLASS_PREFIX = 'aloha-action-';
	var caret = document.querySelector('.aloha-caret');

	/**
	 * executes an action which looks like
	 * {
	 *    format: true, // it's an action to format sth...
	 *    node: 'b'     // as <b>
	 * }
	 * the alohaEvent will be needed to execute the actions 
	 *
	 * @param {Object.<string,?>} action 
	 * @param {Object}            alohaEvent
	 */
	function execute(action, alohaEvent) {
		var boundaries = aloha.boundaries.get(document);

		if (action.format) {
			boundaries = Formatting.format(action.node, boundaries[0], boundaries[1]);
		}

		//Formatting.style('background', 'red', start, end);
		//Formatting.classes('important', start, end);

		Boundaries.select(boundaries[0], boundaries[1]);
		aloha.selections.show(caret, boundaries[1]);
	}

	/**
	 * extract the intended aloha action from a dom element
	 * will look through the classes to find an aloha-action-* class
	 *
	 * @param {Element} element dom element to search for an action
	 * @return {String} action name
	 */
	function getAction(element) {
		var action = {},
			actionArr,
			className,
			classes = Arrays.coerce(element.classList).concat(Arrays.coerce(element.parentNode.classList));
		// transform an action string, which is a class name applied to an element
		// into an action object like
		// { format: true, node: 'b' }
		// which would tell you its an action to format sth. with <b>
		for (var i = 0; i < classes.length; i++) {
			className = classes[i];
			if (className.indexOf(CLASS_PREFIX) === 0) {
				actionArr = className.substr(CLASS_PREFIX.length).split('-');
				action[actionArr[0]] = true;
				action.node = actionArr[1].toUpperCase();
				return action;
			}
		}
		return false;
	}

	/**
	 * update the ui according to current state overrides
	 */
	function updateUi() {
		var overrides = aloha.overrides.harvest(Boundaries.container(Boundaries.get(document)[0]));
		var node = Boromir(document.querySelector('.aloha-ui-toolbar'));

		/**
		 * set ui toolbar elements to active that match the current overrides
		 * 
		 * @param {Boromir} node to be updated
		 * @return {Boromir} node that has been updated
		 */
		function walk(node) {
			if (node.type() === Boromir.ELEMENT) {
				node = node.removeClass('active');
				overrides.forEach(function (override) {
					if (node.hasClass(CLASS_PREFIX + override[0])) {
						node = node.addClass('active');
					}
				});
			}
			return node.children(node.children().map(walk));
		}
		node = walk(node);
		node.updateDom();
	}

	aloha.editor.stack.unshift(function handleUi(event) {
		if (event.type !== 'keyup' &&
			event.type !== 'click') {
			return event;
		}
		
		var action = getAction(event.nativeEvent.target);
		if (action) {
			execute(action, event);
		}

		updateUi();
		return event;
	});
});