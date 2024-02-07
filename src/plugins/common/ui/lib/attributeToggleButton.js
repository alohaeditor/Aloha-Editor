define([
    'ui/attributeButton'
], function (
    AttributeButton
) {
    'use strict';

    var CLASS_ACTIVE = 'active';

    var AttributeToggleButton = AttributeButton.extend({
        type: 'attribute-toggle-button',

        /** @type {boolean} If this button is currently active. */
		active: false,

		/** @type {boolean} When clicked, if it should *not* toggle it's `active` state. */
		pure: false,

        _onClick: function () {
            this.touch();
            var switched = !this.active;
            if (!this.pure) {
                this.toggleActivation();
            }
            this.click();
            this.onToggle(switched);
        },
        _handleActiveState: function() {
            if (this.active) {
                this.element.addClass(CLASS_ACTIVE);
            } else {
                this.element.removeClass(CLASS_ACTIVE);    
            }
        },

        onToggle: function (isActive) { },

        setActive: function(active) {
			this.active = active;
			this._handleActiveState();
		},
        setPure: function(pure) {
			this.pure = pure;
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

    return AttributeToggleButton;
});
