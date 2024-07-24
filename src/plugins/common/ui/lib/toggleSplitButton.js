/** @typedef {import('./splitButton').SplitButton} SplitButton */
/** @typedef {import('./toggleButton').CommonToggleProperties} CommonToggleProperties */

/**
 * @typedef {object} ToggleSplitButtonProperties
 * @property {'toggle-split-button'} type
 * @property {boolean} alwaysSecondary If the secondary button/action should always be visible.
 * When `false`, the secondary button/action will only be displayed when `active` is `true`.
 * @property {function(boolean): void} setAlwaysSecondary Updates the `alwaysSecondary` of the instance
 */

/** @typedef {SplitButton & CommonToggleProperties & ToggleSplitButtonProperties} ToggleSplitButton */

define([
    'ui/splitButton'
], function (
    SplitButton
) {
    'use strict';

    var CLASS_ACTIVE = 'active';
    var CLASS_ALWAYS_SECONDARY = 'always-secondary';

    /** @type {ToggleSplitButton} */
    var ToggleSplitButton = SplitButton.extend(/** @type {ToggleSplitButton} */ ({
        type: 'toggle-split-button',

		active: false,
		pure: false,

        alwaysSecondary: false,

        init: function () {
            this._super();

            this.element.addClass('toggle-button');

            this._handleAlwaysSecondary();
            this._handleActiveState();
        },

        _onClick: function () {
            this.touch();
            var switched = !this.active;
            if (!this.pure) {
                this.toggleActivation();
            }
            this.triggerChangeNotification();
            this.click();
            this.onToggle(switched);
        },

        _handleAlwaysSecondary: function() {
            if (this.alwaysSecondary) {
                this.element.addClass(CLASS_ALWAYS_SECONDARY);
            } else {
                this.element.removeClass(CLASS_ALWAYS_SECONDARY);
            }
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

        setAlwaysSecondary: function(alwaysSecondary) {
            this.alwaysSecondary = alwaysSecondary;
            this._handleAlwaysSecondary();
        },

        setValue: function (value) {
			this.active = value;
			this._handleActiveState();
        },
        getValue: function () {
            return this.active;
        }
    }));

    return ToggleSplitButton;
});
