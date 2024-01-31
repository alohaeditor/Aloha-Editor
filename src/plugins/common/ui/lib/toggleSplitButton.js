define([
    'ui/splitButton'
], function (
    SplitButton
) {
    'use strict';

    var CLASS_ACTIVE = 'active';

    var ToggleSplitButton = SplitButton.extend({
        type: 'toggle-split-button',

        /** @type {boolean} If this toggle button is currently active/selected */
        active: false,

        /**
         * @type {boolean} If the secondary button/action should always be visible.
         * When false, the secondary button/action will only be displayed when `active` is `true`.  */
        alwaysSecondary: false,

        init: function () {
            this._super();

            this.element.addClass('toggle-button');
            if (this.alwaysSecondary) {
                this.element.addClass('always-secondary');
            }

            this._handleActiveState();
        },

        _onClick: function () {
            this._super();
            this.toggleActivation();
            this.triggerChangeNotification();
            this.click();
            this.onToggle(this.active);
        },

        _handleActiveState: function() {
			if (this.active) {
				this.element.addClass(CLASS_ACTIVE);
			} else {
				this.element.removeClass(CLASS_ACTIVE);
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

            if (!this.disabled) {
                this.secondaryButton.removeAttr('disabled');
            }
        },

        deactivate: function () {
            this.active = false;
            this._handleActiveState();

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

        setValue: function (value) {
			this.active = value;
			this._handleActiveState();
        },
        getValue: function () {
            return this.active;
        }
    });

    return ToggleSplitButton;
});
