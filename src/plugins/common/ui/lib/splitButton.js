define([
    'ui/button',
    'i18n!ui/nls/i18n'
], function (
    Button,
    i18n
) {
    'use strict';

    var SplitButton = Button.extend({

        secondaryButton: null,

        /** @type {(string|null)} Label/Tooltip for the secondary action */
        secondaryLabel: null,

        /** @type {function} Function which is getting called whenever the secondary button is clicked. */
        secondaryClick: function () { },

        init: function () {
            this._super();
            this.type = 'split-button';

            // Wrap both buttons in a div for proper styling
            var $container = $('<div>', {
                class: 'ui-split-button'
            }).append(this.element);

            var title = this.secondaryLabel || i18n.t('split-button.secondary.label');
            this.secondaryButton = $('<button>', {
                class: 'ui-split-button-secondary ui-widget',
                type: 'button',
                role: 'button',
                'aria-disabled': false,
                title: title,
            });
            this.secondaryButton.append('<span class="ui-button-icon-secondary ui-icon aloha-jqueryui-icon ui-icon-splitbtn-expand"></span>');

            var _this = this;
            this.secondaryButton.on('click', function () {
                _this.secondaryClick();
            });

            $container.append(this.secondaryButton);

            this.element = $container;
        },

        enable: function() {
            this._super();
            this.secondaryButton
                .removeAttr('disabled')
                .attr('aria-disabled', 'false');
        },
        disable: function() {
            this._super();
            this.secondaryButton
                .attr('disabled', 'disabled')
                .attr('aria-disabled', 'true');
        }
    });

    return SplitButton;
});
