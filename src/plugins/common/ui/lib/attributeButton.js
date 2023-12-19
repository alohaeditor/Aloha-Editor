define([
    'jquery',
    'aloha',
    'ui/button',
], function (
    $,
    Aloha,
    Button
) {
    'use strict';

    var counter = 0;

    var AttributeButton = Button.extend({

        targetElement: null,
        targetAttribute: '',        
        inputLabel: '',
        panelLabel: '',
        panelActiveOn: null,

        inputActive: false,

        panelRef: null,
        panelInputElement: null,

        init: function () {
            this._super();

            var wrapper = $('<div>', {
                class: 'aloha-attribute-button',
            }).append(this.element);
            this.element = wrapper;

            // Make sure it's a jquery element
            if (this.targetElement != null) {
                this.targetElement = $(this.targetElement);
            }

            // Don't need to init the sidebar if it has been disabled
            if (Aloha.Sidebar != null && !Aloha.Sidebar.disabled) {
                this.initSidebar();
            }
        },

        initSidebar: function () {
            var panelId = 'attribute_toggle_button_panel_' + counter;
            var inputId = 'attribute_toggle_button_input_' + counter;
            counter++;

            var initialValue = this.getValue();
            var _this = this;

            this.panelInputElement = $('<input>', {
                type: 'text',
                class: 'input-element',
                value: initialValue || '',
                id: inputId,
                activeOn: this.panelActiveOn,
                attr: {
                    autocapitalize: 'off',
                    autocomplete: 'off',
                }
            })
                .on('change', function (event) {
                    _this.handleInputChange(event);
                })
                .on('focus', function () {
                    _this.touch();
                });

            var panelContent = $('<div>', { class: 'input-container' })
                .append(
                    $('<label>', {
                        class: 'input-label',
                        text: this.inputLabel,
                        for: inputId,
                    }),
                    this.panelInputElement
                );

            this.panelRef = Aloha.Sidebar.right.addPanel({
                id: panelId,
                title: this.panelLabel,
                content: panelContent,
                expanded: true,
                activeOn: this.panelActiveOn,

                onInit: function () {
                    // Should be deactivated on default
                    if (!_this.inputActive) {
                        this.deactivate();
                    }
                },
                onActivate: function () { },
            });

            // Always make the sidebar visible
            Aloha.Sidebar.right.show();
        },

        handleInputChange: function (event) {
            this.touch();
            this.setValue(event.target.value);
            this.triggerChangeNotification();
        },

        updateTargetElement: function (element) {
            if (element == null || element.length === 0) {
                this.targetElement = null;
            } else {
                this.targetElement = $(element);
            }

            if (this.panelInputElement) {
                this.panelInputElement.val(this.getValue() || '');
            }         
        },
        activateInput: function() {
            this.inputActive = true;
            if (this.panelRef) {
                this.panelRef.activate();
            }
        },
        deactivateInput: function() {
            this.inputActive = false;
            if (this.panelRef) {
                this.panelRef.deactivate();
            }
        },

        setValue: function (value) {
            if (this.targetElement == null) {
                return;
            }
            this.targetElement.attr(this.targetAttribute, value);
        },
        getValue: function () {
            if (this.targetElement == null) {
                return null;
            }
            return this.targetElement.attr(this.targetAttribute);
        },

        enable: function () {
            this._super();
            this.panelInputElement.removeAttr('disabled');
        },
        disable: function () {
            this._super();
            this.panelInputElement.attr('disabled', 'disabled');
        },
    });

    return AttributeButton;
});
