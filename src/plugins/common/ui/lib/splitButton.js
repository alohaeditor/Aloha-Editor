/** @typedef {import('./button').Button} Button */

/**
 * @typedef {object} SplitButtonProperties
 * @property {'split-button'} type
 * @property {string=} secondaryLabel Label/Tooltip for the secondary action
 * @property {function(): void} secondaryClick Function which is getting called whenever the secondary button is clicked.
 * @property {boolean} secondaryVisible If the secondary button should be visible or not.
 *
 * @property {function(boolean): void} setSecondaryVisible Updates the `secondaryVisible` of the instance
 */

/** @typedef {Button & SplitButtonProperties} SplitButton */

define([
    'jquery',
    'ui/button',
    'i18n!ui/nls/i18n'
], function (
    $,
    Button,
    i18n
) {
    'use strict';

    /** @type {SplitButton} */
    var SplitButton = Button.extend(/** @type {SplitButton} */ ({
        type: 'split-button',

        secondaryLabel: null,
        secondaryClick: function () {},
        secondaryVisible: true,

        // Internals

        _$secondaryButton: null,

        init: function () {
            this._super();

            // Wrap both buttons in a div for proper styling
            var $container = $('<div>', {
                class: 'aloha-split-button ui-widget'
            }).append(this._$buttonElement);
            this._$buttonElement.addClass('aloha-split-button-main');

            var title = this.secondaryLabel || i18n.t('split-button.secondary.label');
            this._$secondaryButton = $('<button>', {
                class: 'aloha-split-button-secondary ui-widget',
                type: 'button',
                role: 'button',
                title: title,
            });
            this._$secondaryButton.append($('<i>', {
                class: 'aloha-button-icon aloha-button-secondary-icon material-symbols-outlined',
                text: 'arrow_drop_down',
            }));

            var _this = this;
            this._$secondaryButton.on('click', function () {
                _this.secondaryClick();
            });

            $container.append(this._$secondaryButton);

            this.element = $container;
        },

        enable: function() {
            this._super();
            this.element.removeClass('disabled');
            this._$secondaryButton
                .removeAttr('disabled');
        },
        disable: function() {
            this._super();
            this.element.addClass('disabled');
            this._$secondaryButton
                .attr('disabled', 'disabled');
        },

        setSecondaryVisible: function(visible) {
            this.secondaryVisible = visible;
            if (this.secondaryVisible) {
                this._$secondaryButton.show();
            } else {
                this._$secondaryButton.hide();
            }
        }
    }));

    return SplitButton;
});
