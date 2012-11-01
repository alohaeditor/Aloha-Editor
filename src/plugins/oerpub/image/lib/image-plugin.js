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

            // Set onerror of preview image
            (function(img, baseurl){
               img.onerror = function(){
                   var errimg = baseurl + '/../plugins/oerpub/image/img/warning.png';
                   if(img.src != errimg){
                       img.src = errimg;
                    }
               };
            })($body.find('.placeholder.preview img')[0], Aloha.settings.baseUrl);

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
                var $uploadform = $body.find('.upload-image-form'),
                    $urlform = $body.find('.upload-url-form'),
                    alt = $body.find('.image-alt textarea').val();

                if($uploadform.is(':visible')){
                    // TODO Upload and insert
                    var range = Aloha.Selection.getRangeObject(),
                        files = $uploadform.find('input[type=file]')[0].files;
                    if(range.isCollapsed() && files.length > 0){
                        plugin._uploadImage(files[0], function(url){
                            $img = $('<img />').attr('src', url).attr('alt', alt);
                            GENTICS.Utils.Dom.insertIntoDOM($img, range, $(Aloha.activeEditable.obj));
                        });
                    }
                } else {
                    // Just insert, url is a remote url
                    var url = $urlform.find('.image-url').val(),
                        $img = $('<img />').attr('src', url).attr('alt', alt);
                    var range = Aloha.Selection.getRangeObject();
                    if (range.isCollapsed()) {
                        GENTICS.Utils.Dom.insertIntoDOM($img, range, $(Aloha.activeEditable.obj));
                    }
                }

                return e.preventDefault();
            });
            $body.find('.upload-image-form .action.preview').on('click', function(e){
                var files = $dialog.find('.upload-image-form input[type=file]')[0].files;
                if(files.length > 0){
                    var $placeholder = $dialog.find('.placeholder.preview'),
                        $img = $placeholder.find('img');
                    plugin._showUploadPreview(files[0], $img);
                    $placeholder.show();
                }
                return e.preventDefault();
            });
            $body.find('.upload-url-form .action.preview').on('click', function(e){
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
        _uploadImage: function(file, callback){
            var xhr = new XMLHttpRequest();
            if(xhr.upload){
                xhr.onload = function(){
                    // TODO, probably make this pluggable
                    var msg = JSON.parse(xhr.response);
                    callback(msg.url);
                };

                // TODO make url and field name configurable
                xhr.open("POST", '/upload_dnd', true);
				xhr.setRequestHeader("Cache-Control", "no-cache");
                var f = new FormData();
                f.append('upload', file, file.name);
                xhr.send(f);
            }
        },
        _createImageButton: undefined
    });
});
