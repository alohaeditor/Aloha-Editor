define(['PubSub'],function(PubSub){

	var stateSettersByType = {
		'enable': function(component, value) {
			if (value) {
				component.enable();
			} else {
				component.disable();
			}
		},
		'show': function(component, value) {
			if (value) {
				component.show();
			} else {
				component.hide();
			}
		},
		'state': function(component, value) {
			component.setState(value);
		}
	};

	var state = {};


	function setState(componentName, stateType, stateValue) {
		state[componentName + '/' + stateType] = stateValue;
		PubSub.pub('aloha-ui-component-state-change.' + componentName, {state: stateType});
	}

	function getState(componentName, stateType) {
		return state[componentName + '/' + stateType];
	}

	function applyState(componentName, stateType, component) {
		var value = getState(componentName, stateType);
		if (null != value) {
			stateSettersByType[stateType](component, value);
		}
	}

	return {
		setState: setState,
		getState: getState,
		applyState: applyState,
		applyAllStates: function(componentName, component) {
			for (var stateType in stateSettersByType) {
				if (stateSettersByType.hasOwnProperty(stateType)) {
					applyState(componentName, stateType, component);
				}
			}
		}
	};
});
