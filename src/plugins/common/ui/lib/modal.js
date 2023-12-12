define([
    'jquery',
    'ui/dynamicForm',
    'ui/overlayElement',
    'i18n!ui/nls/i18n',
], function (
    $,
    DynamicForm,
    OverlayElement,
    i18n
) {
    'use strict';

    // Note: Typings are in overlayElement

    /**
     * Opens a modal with a dynamic form configuration.
     * @template {*} T
     * @param {DynamicFormModalConfiguration.<T>} config - The config for how to open the modal and what to do with it.
     * @returns {Promise.<OverlayElementControl.<T>>} - A Promise for a overlay element control.
     */
    function openDynamicModal(config) {
        var $modalOverlay = $('<div>', { class: 'aloha aloha-modal-overlay' });

        var $modal = $('<div>', {
            class: 'aloha aloha-ui aloha-modal',
            modal: true,
        });

        // Build the header
        var $modalHeader = $('<div>', {
            class: 'modal-header',
            html: '<div class="header-title">' + config.title + '</div>'
        });

        // Build the body
        var $modalBody = $('<div>', { class: 'modal-body' });
        var $modalBodyContainer = $('<div>', { class: 'modal-body-container' });

        // Build the footer
        var $modalFooter = $('<div>', { class: 'modal-footer' });
        var $cancelButton = $('<button>', {
            class: 'footer-button cancel-button',
            text: i18n.t('button.cancel.label'),
        });
        var $confirmButton = $('<button>', {
            class: 'footer-button confirm-button',
            text: i18n.t('button.confirm.label'),
        });
        $modalFooter.append($cancelButton, $confirmButton);

        var generatedForm;

        function updateFormDOMValidity() {
            if (!generatedForm) {
                return;
            }

            if (!generatedForm.control.valid) {
                $confirmButton.attr('disabled', 'disabled');
                generatedForm.$element
                    .addClass('form-invalid')
                    .removeClass('form-valid');
            } else {
                $confirmButton.removeAttr('disabled');
                generatedForm.$element
                    .addClass('form-valid')
                    .removeClass('form-invalid');
            }
        }

        // Build the form and append it correctly
        generatedForm = DynamicForm.buildDynamicForm(config, updateFormDOMValidity);
        $modalBodyContainer.append(generatedForm.$element);
        $modalBody.append($modalBodyContainer);

        // Append all modal parts to the modal
        $modal.append($modalHeader);
        $modal.append($modalBody);
        $modal.append($modalFooter);

        // prevent scrolling while modal is open
        $(document.body).css('overflow', 'none');
        $modalOverlay.appendTo(document.body);
        $modal.appendTo(document.body);
        
        var open = true;
        var reject = function() {}

        function closeModal() {
            $modalOverlay.remove();
            $modal.remove();
            $(document.body).css('overflow', '');
            open = false;
        }

        var modalValue = new Promise(function (resolve, valReject) {
            reject = valReject;

            $cancelButton.on('click', function () {
                closeModal();
                reject(new OverlayElement.OverlayCloseError(OverlayElement.ClosingReason.CANCEL));
            });

            $confirmButton.on('click', function () {
                closeModal();
                resolve(generatedForm.value);
            });

            if (!!config.closeOnOverlayClick) {
                $modalOverlay.on('click', function () {
                    closeModal();
                    reject(new OverlayElement.OverlayCloseError(OverlayElement.ClosingReason.OVERLAY_CLICK));
                });
            }

            if (!!config.closeOnEscape) {
                $(window.document).on('keydown', function (event) {
                    if (event.key === 'Escape') {
                        closeModal();
                        reject(new OverlayElement.OverlayCloseError(OverlayElement.ClosingReason.ESCAPE));
                    }
                });
            }
        });

        return Promise.resolve({
            close: function() {
                if (open) {
                    closeModal();
                    reject(new OverlayElement.OverlayCloseError(OverlayElement.ClosingReason.API));
                }
            },
            isOpen: function() {
                return open;
            },
            value: modalValue,
        });
    }

    return {
        openDynamicModal: openDynamicModal,
    };
});