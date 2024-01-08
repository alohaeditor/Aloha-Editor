define([
    'jquery',
    'ui/splitButton',
], function (
    $,
    SplitButton
) {
    'use strict';

    var ToggleSplitButton = SplitButton.extend({

        /** @type {boolean} If this toggle button is currently active/selected */
        active: false,

        /**
         * @type {boolean} If the secondary button/action should always be visible.
         * When false, the secondary button/action will only be displayed when `active` is `true`.  */
        alwaysSecondary: false,

        init: function () {
            this._super();
            this.type = 'toggle-split-button';

            this.element.addClass('toggle-button');
            if (this.alwaysSecondary) {
                this.element.addClass('always-secondary');
            }
        },

        _onClick: function () {
            this._super();
            this.toggleActivation();
            this.triggerChangeNotification();
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
            this.element.addClass('active');
            if (!this.disabled) {
                this.secondaryButton.removeAttr('disabled');
            }
        },

        deactivate: function () {
            this.active = false;
            this.element.removeClass('active');
            if (!this.alwaysSecondary) {
                this.secondaryButton.attr('disabled', 'disabled');
            }
        },

        enable: function () {
            this._super();

            if (!this.active && !this.alwaysSecondary) {
                this.secondaryButton.attr('disabled', 'disabled');
            }
        },

        setValue: function (active) {
            this.active = active;
        },
        getValue: function () {
            return this.active;
        }
    });

    return ToggleSplitButton;
});
