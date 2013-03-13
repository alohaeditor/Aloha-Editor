define(
['aloha', 'aloha/plugin', 'jquery', 'ui/ui', 'ui/button', 'PubSub',
    'css!image/css/image.css'],
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
        // Settings:
        // uploadurl - where to upload to
        // uploadfield - field name to use in multipart/form upload
        // parseresponse - takes the xhr.response from server, return an
        //                 url to be used for the image. Default expects
        //                 a json response with an url member.
        defaultSettings: {
            uploadfield: 'upload',
            parseresponse: function(xhr){ return JSON.parse(xhr.response).url; }
        },
        init: function(){
            this.settings = jQuery.extend(true, this.defaultSettings, this.settings);
            var plugin = this;
            Aloha.bind('aloha-editable-created', function(event, editable){
                editable.obj.find('img').each(function(){
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

                    var range = Aloha.Selection.getRangeObject(),
                        $placeholder = $('<span class="aloha-ephemera image-placeholder"> </span>');
                    if (range.isCollapsed()) {
                        GENTICS.Utils.Dom.insertIntoDOM($placeholder, range, $(Aloha.activeEditable.obj));
                        $('.plugin.image').data('placeholder', $placeholder)
                            .modal({backdrop: false});
                    }
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
                   var errimg = baseurl + '/../plugins/oer/image/img/warning.png';
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
                    var files = $uploadform.find('input[type=file]')[0].files;
                    if(files.length > 0){
                        plugin._uploadImage(files[0], function(url){
                            var $img = $('<img />').attr('src', url).attr('alt', alt);
                            $dialog.data('placeholder').replaceWith($img);
                            plugin._hideModal();
                        });
                    }
                } else {
                    // Just insert, url is a remote url
                    var url = $urlform.find('.image-url').val(),
                        $img = $('<img />').attr('src', url).attr('alt', alt);
                    $dialog.data('placeholder').replaceWith($img);
                    plugin._hideModal();
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
            var plugin = this;
            var xhr = new XMLHttpRequest();
            if(xhr.upload){
                if(!plugin.settings.uploadurl){
                    throw new Error("uploadurl not defined");
                }
                xhr.onload = function(){
                    callback(plugin.settings.parseresponse(xhr));
                };
                xhr.open("POST", plugin.settings.uploadurl, true);
				xhr.setRequestHeader("Cache-Control", "no-cache");
                var f = new FormData();
                f.append(plugin.settings.uploadfield, file, file.name);
                xhr.send(f);
            }
        },
        _hideModal: function(){
            var $modal = $('.plugin.image');
            $modal.find('.placeholder.preview').hide();
            $modal.find('.upload-url-form').hide();
            $modal.find('.upload-image-form').hide();
            $modal.modal('hide');
        },
        _createImageButton: undefined
    });
});
