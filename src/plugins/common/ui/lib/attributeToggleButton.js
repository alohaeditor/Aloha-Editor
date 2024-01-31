define([
    'ui/attributeButton'
], function (
    AttributeButton
) {
    'use strict';

    var CLASS_ACTIVE = 'active';

    var AttributeToggleButton = AttributeButton.extend({
        type: 'attribute-toggle-button',

        active: false,

        _onClick: function () {
            this.touch();
            this.toggleActivation();
            this.click();
            this.onToggle(this.active);
        },
        _handleActiveState: function() {
            if (this.active) {
                this.element.addClass(CLASS_ACTIVE);
            } else {
                this.this.element.removeClass(CLASS_ACTIVE);    
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

    return AttributeToggleButton;
});
