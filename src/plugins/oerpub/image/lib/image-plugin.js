define(
['aloha', 'aloha/plugin', 'jquery', 'ui/ui', 'ui/button', 'PubSub',
    'css!table/css/table.css'],
function(Aloha, plugin, $, Ui, Button, PubSub) {
    "use strict";

	var GENTICS = window.GENTICS;

    var DIALOG = 
    '<div class="image-options">' +
    '    <a class="upload-image-link" href="javascript:;">Choose a file</a> OR <a class="upload-url-link" href="javascript:;">get file from the Web</a>' +
    '    <div class="placeholder preview hide">' +
    '      <h4>Preview</h4>' +
    '      <img />' +
    '    </div>' +
    '    <div class="upload-image-form hide">' +
    '      <input type="file" />' +
    '      <input type="submit" class="action preview" value="Preview image">' +
    '    </div>' +
    '    <div class="upload-url-form hide">' +
    '      <input type="text" class="image-url" placeholder="Enter URL of image ...">' +
    '      <input type="submit" class="action preview" value="Preview image">' +
    '    </div>' +
    '</div>' +
    '<div class="image-alt">' +
    '  <div class="forminfo">' +
    '    Please provide a description of this image for the visually impaired.' +
    '  </div>' +
    '  <div>' +
    '    <textarea name="alt" placeholder="Enter description ..." type="text"></textarea>' +
    '  </div>' +
    '</div>';

    function prepareImage(plugin, img){
    }

    return plugin.create('image', {
        defaults: {
        },
        init: function(){
            var plugin = this;
            Aloha.bind('aloha-editable-created', function(event, editable){
                editable.obj.find('table').each(function(){
                    prepareImage(plugin, $(this));
                });
            });
            PubSub.sub('aloha.selection.context-change', function(m){
                if ($(m.range.markupEffectiveAtStart).parent('img')
                        .length > 0) {
                    // We're inside an image
                } else {
                    // We're outside an image
                }
            });
            this._createDialog();
            this._createImageButton = Ui.adopt("insertImage", Button, {
                tooltip: "Insert Image",
                icon: "aloha-button aloha-image-insert",
                scope: 'Aloha.continuoustext',
                click: function(e){
                    $('.plugin.image').modal({backdrop: false});
                }
            });
        },
        _createDialog: function(){
            var plugin = this,
                $dialog = $('<div class="plugin image modal hide fade">'),
                $body = $('<div class="modal-body"></div>');
            $dialog.append('<div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button><h3>Image</h3></div>');
            $dialog.append($body);
            $dialog.append('<div class="modal-footer"><a href="#" class="btn action insert">Insert</a><a href="#" class="btn" data-dismiss="modal">Cancel</a></div>');
            $body.append(DIALOG);

            // Add click handlers
            $body.find('.upload-image-link').on('click', function(e){
                $body.find('.upload-url-form').hide();
                $body.find('.placeholder.preview').hide();
                $body.find('.upload-image-form').show();
                return e.preventDefault();
            });
            $body.find('.upload-url-link').on('click', function(e){
                $body.find('.upload-image-form').hide();
                $body.find('.placeholder.preview').hide();
                $body.find('.upload-url-form').show();
                return e.preventDefault();
            });
            $dialog.find('.action.insert').on('click', function(e){
                var $img = $('<img src="/static/images/connexions.png" />');
                var range = Aloha.Selection.getRangeObject();
                if (range.isCollapsed()) {
                    GENTICS.Utils.Dom.insertIntoDOM($img, range, $(Aloha.activeEditable.obj));
                }
                return e.preventDefault();
            });
            $dialog.find('.upload-image-form .action.preview').on('click', function(e){
                var files = $dialog.find('.upload-image-form input[type=file]')[0].files;
                if(files.length > 0){
                    var $placeholder = $dialog.find('.placeholder.preview'),
                        $img = $placeholder.find('img');
                    plugin._showUploadPreview(files[0], $img);
                    $placeholder.show();
                }
                return e.preventDefault();
            });
            $dialog.find('.upload-url-form .action.preview').on('click', function(e){
                    var $placeholder = $dialog.find('.placeholder.preview'),
                        $img = $placeholder.find('img'),
                        url = $dialog.find('.upload-url-form .image-url').val();
                    $img.attr('src', url);
                    $placeholder.show();
                return e.preventDefault();
            });

            $('body').append($dialog);
        },
        _showUploadPreview: function(file, $img){
			var reader = new FileReader(),
				that = this;
			reader.file = file;
            reader.onloadend = function() {
                $img.attr('src', reader.result);
            };
            reader.readAsDataURL(file);
        },
        _createImageButton: undefined
    });
});
