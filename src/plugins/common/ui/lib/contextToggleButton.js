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
            this._super();
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

        toggleActivation: function () {
            if (!this.active) {
                this.activate();
            } else {
                this.deactivate();
            }
        },

        activate: function () {
            this.active = true;
            this._handleActiveState();
        },

        deactivate: function () {
            this.active = false;
            this._handleActiveState();
        },
    });

    return ContextToggleButton;
});
