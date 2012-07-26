// Insert custom HTML into dom tree at the current cursor position of Aloha editor
// used this as template: https://github.com/michaelperrin/sfAlohaPlugin/blob/cc320dcc984bcf7a2b54bb0191276679eb951742/web/js/aloha-plugins/image-upload/lib/image-upload-plugin.js#L106
function AlohaInsertIntoDom(code) {
    var range = Aloha.Selection.getRangeObject();

        GENTICS.Utils.Dom.insertIntoDOM(
            code,
            range,
            Aloha,
            true
        );
        range.select();
}