define([
    'jquery',
    'ui/dynamicForm',
    'i18n!ui/nls/i18n',
], function (
    $,
    DynamicForm,
    i18n
) {
    'use strict';

    function openDynamicModal(config) {
        var modal = $('<div>');
        modal.addClass(['aloha', 'aloha-ui', 'aloha-modal']);
        modal.attr({
            modal: true,
        });

        // Build the header
        var header = $('<div>');
        header.addClass('modal-header');
        header.html('<div class="header-title">' + config.title + '</div>');

        // Build the body
        var body = $('<div>');
        body.addClass('modal-body');
        var container = $('<div>');
        container.addClass('modal-body-container');

        // Build the footer
        var footer = $('<div>');
        footer.addClass('modal-footer');
        var cancelButton = $('<button>');
        cancelButton.text(i18n.t('button.cancel.label'));
        cancelButton.addClass(['footer-button', 'cancel-button']);
        var confirmButton = $('<button>');
        confirmButton.text(i18n.t('button.confirm.label'));
        confirmButton.addClass(['footer-button', 'confirm-button']);
        footer.append(cancelButton, confirmButton);

        var generatedForm;

        function updateFormDOMValidity() {
            if (!generatedForm) {
                return;
            }

            if (!generatedForm.control.valid) {
                confirmButton.attr('disabled', 'disabled');
                generatedForm.$element.addClass('form-invalid')
                .removeClass('form-valid');
            } else {
                confirmButton.removeAttr('disabled');
                generatedForm.$element.addClass('form-valid')
                    .removeClass('form-invalid');
            }
        }

        // Build the form and append it correctly
        generatedForm = DynamicForm.buildDynamicForm(config, updateFormDOMValidity);
        container.append(generatedForm.$element);
        body.append(container);

        // Append all modal parts to the modal
        modal.append(header);
        modal.append(body);
        modal.append(footer);

        modal.appendTo(document.body);

        return new Promise(function (resolve, reject) {
            cancelButton.on('click', function () {
                modal.remove();
                reject(new Error('Canceled'));
            });

            confirmButton.on('click', function () {
                modal.remove();
                resolve(generatedForm.value);
            });
        });
    }

    return {
        openDynamicModal: openDynamicModal,
    };
});