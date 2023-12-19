define([
    'jquery',
    'ui/component',
    'i18n!ui/nls/i18n'
], function (
    $,
    Component,
    i18n
) {
    'use strict';

    var counter = 0;

    // Using a function, so that it's different objects, otherwise it'd use the same
    // object in multiple instance
    function createDefaultValue() {
        return {
            target: '',
            anchor: '',
        };
    }

    var LinkTarget = Component.extend({
        /**
         * @typedef {object} LinkTarget
         * @property {string} target - The URL to where the link should go to. May not include the `anchor` part.
         * @property {string} anchor - Separated `anchor` part of the URL.
         */
        /** @type {null|LinkTarget} */
        value: null,

        targetLabel: null,
        anchorLabel: null,

        targetInput: null,
        anchorInput: null,

        init: function () {
            this.element = $('<div>', {
                class: 'aloha-ui ui-widget aloha-link-target',
            });

            // Default the value property
            if (this.value == null) {
                this.value = createDefaultValue();
            }

            var _this = this;

            this.targetInput = $('<input>', {
                type: 'url',
                class: 'input-element target-input',
                id: 'linkTarget_target_' + counter,
                attr: {
                    autocapitalize: 'off',
                    autocomplete: 'off',
                }
            })
                // Set the initial value
                .val(this.value.target)
                .on('focus', function () {
                    _this.touch();
                })
                .on('change', function (event) {
                    _this.handleTargetChange(event);
                })
                .on('paste', function (event) {
                    var clipboard = event.originalEvent.clipboardData;
                    var data;

                    // Clipboard API may not be available
                    if (!clipboard) {
                        data = event.target.value;
                    } else {
                        data = clipboard.getData('text');
                    }

                    _this.handlePasteData(event, data);
                });

            this.anchorInput = $('<input>', {
                type: 'text',
                class: 'input-element anchor-input',
                id: 'linkTarget_anchor_' + counter,
                attr: {
                    autocapitalize: 'off',
                    autocomplete: 'off',
                }
            })
                .val(this.value.anchor)
                .on('focus', function () {
                    _this.touch();
                })
                .on('change', function (event) {
                    _this.handleAnchorChange(event);
                });

            $('<div>', { class: 'input-container' })
                .append(
                    $('<label>', {
                        class: 'input-label',
                        text: this.targetLabel || i18n.t('link-target.target.label'),
                        for: 'linkTarget_target_' + counter,
                    }),
                    this.targetInput
                )
                .appendTo(this.element);

            $('<div>', { class: 'input-container' })
                .append(
                    $('<label>', {
                        class: 'input-label',
                        text: this.anchorLabel || i18n.t('link-target.anchor.label'),
                        for: 'linkTarget_anchor_' + counter,
                    }),
                    this.anchorInput
                )
                .appendTo(this.element);

            counter++;
        },

        handleTargetChange: function (event) {
            this.value.target = event.target.value;
            this.triggerChangeNotification();
        },

        handleAnchorChange: function (event) {
            this.value.anchor = event.target.value;
            this.triggerChangeNotification();
        },

        handlePasteData: function (event, data) {
            try {
                var parsed = new URL(data);

                // Event has to be canceled, as we set the value manually
                // Otherwise the browser will fill in the value after we have
                // done so, making our changes irrelevant.
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();

                // URL.hash has the # before, so we cut it away
                this.value.anchor = (parsed.hash || '').substring(1);
                parsed.hash = '';
                this.value.target = parsed.toString();

                this.applyValueToInputs();

                if (typeof _this.changeNotify === 'function') {
                    _this.changeNotify(_this.value);
                }
            } catch (err) {
                // Ignore if it can't be parsed
            }
        },

        applyValueToInputs: function () {
            this.targetInput.val(this.value.target);
            this.anchorInput.val(this.value.anchor);
        },

        setValue: function (value) {
            this.value = value || createDefaultValue();
        },
        getValue: function () {
            return this.value;
        },

        enable: function () {
            this._super();
            $(this.targetInput, this.anchorInput)
                .removeAttr('disabled')
                .attr('aria-disabled', 'false');
        },
        disable: function () {
            this._super();
            $(this.targetInput, this.anchorInput)
                .attr('disabled', 'disabled')
                .attr('aria-disabled', 'false');
        }
    });

    return LinkTarget;
});
