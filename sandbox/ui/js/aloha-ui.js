require([
	'../../src/aloha',
	'../../src/arrays',
	'../../src/boundaries'
], function (
	aloha,
	Arrays,
	Boundaries
) {
	'use strict';

  	[].forEach.call(document.querySelectorAll('.aloha-editable'), aloha);

  	/**
  	 * wires aloha-action-* classes on buttons to function calls
  	 */
  	var ACTIONS = {
  		'bold': aloha.typing.actions.formatBold,
  		'italic': aloha.typing.actions.formatItalic,
  		'orderedList': aloha.list.toUnorderedList,
  		'unorderedList': aloha.list.toUnorderedList,
  		'undo': aloha.undo.undo,
  		'redo': aloha.undo.redo
  	};
  	var CLASS_PREFIX = 'aloha-action-';
	
	/**
	 * executes an action identified by it's name
	 * 
	 * @param {String} actionName the name of the action to be executed
	 * @param {Object} alohaEvent alohaEvent object
	 */
	function execute(actionName, alohaEvent) {
		var action = ACTIONS[actionName];

		if (!action) {
			return;
		}

		if (action.mutate) {
			action.mutate(alohaEvent);
		} else if (actionName === 'undo' || actionName === 'redo') {
			action(alohaEvent.editable.undoContext, event.range);
		} else {
			action();
		}
	}

	/**
	 * extract the intended aloha action from a dom element
	 * will look through the classes to find an aloha-action-* class
	 *
	 * @param {Element} element dom element to search for an action
	 * @return {String} action name
	 */
	function getAction(element) {
		var className,
			classes = Arrays.coerce(element.classList).concat(Arrays.coerce(element.parentNode.classList));
		for (var i = 0; i < classes.length; i++) {
			className = classes[i];
			if (className.indexOf(CLASS_PREFIX) === 0) {
				return className.substr(CLASS_PREFIX.length);
			}
		}
		return false;
	}

	/**
	 * update the ui according to current state overrides
	 */
	function updateUi() {
		var overrides = aloha.overrides.harvest(Boundaries.container(Boundaries.get()[0]));
		// TODO simple, stateless, but slow
		$('.aloha-ui-toolbar .active').removeClass('active');
		overrides.forEach(function (override) {
			$('.' + CLASS_PREFIX + override[0]).addClass('active');
		});
	}

	var lastValidRange;

	// will be invoked after each aloha event
	function alohaCB(event) {
		if (event.type !== 'keyup' &&
			event.type !== 'click') {
			return;
		}
		
		if (!event.range) {
			// TODO it should not be neccessary to add missing values to the event
			var range = aloha.ranges.get(0);
			if (range) {
				lastValidRange = event.range = range;
			} else {
				range = lastValidRange;
			}
		}

		var action = getAction(event.nativeEvent.target);
		if (action) {
			execute(action, event);
		}

		updateUi();
	}
	window.alohaCB = alohaCB;
});