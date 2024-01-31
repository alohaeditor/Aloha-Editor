define([
    'ui/contextButton'
], function (
    ContextButton
) {
    'use strict';

    var CLASS_ACTIVE = 'aloha-button-active';

    var ContextToggleButton = ContextButton.extend({
        type: 'context-toggle-button',

        active: false,

        init: function() {
            this._super();
            this._handleActiveState();
        },

        _onClick: function () {
            this.touch();
            this.toggleActivation();
            this.click();
            this.onToggle(this.active);
            this._handleContextClick();
        },

        _handleActiveState: function() {
			if (this.active) {
				this.buttonElement.addClass(CLASS_ACTIVE);
			} else {
				this.buttonElement.removeClass(CLASS_ACTIVE);
			}
		},

        onToggle: function (isActive) { },

        setActive: function(active) {
			this.active = active;
			this._handleActiveState();
		},
		toggleActivation: function () {
			this.setActive(!this.active);
		},
        activate: function () {
			this.setActive(true);
        },
        deactivate: function () {
            this.setActive(false);
        },
    });

    return ContextToggleButton;
});
