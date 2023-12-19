define([
    'jquery',
    'aloha',
    'ui/attributeButton',
], function (
    $,
    Aloha,
    AttributeButton
) {
    'use strict';

    var CLASS_ACTIVE = 'active';

    var AttributeToggleButton = AttributeButton.extend({

        active: false,

        init: function () {
            this._super();
        },

        _onClick: function () {
            this.click();
            this.touch();
            this.toggleActivation();
            this.onToggle(this.active);
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
            this.element.addClass(CLASS_ACTIVE);
        },

        deactivate: function () {
            this.active = false;
            this.element.removeClass(CLASS_ACTIVE);
        },
    });

    return AttributeToggleButton;
});
