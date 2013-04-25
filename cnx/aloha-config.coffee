# # Configure Aloha
# This module configures Aloha and runs before Aloha loads.
#
# Aloha is configured by a global `Aloha` object.
# This module creates it and when Aloha finishes loading its shim removes the global

@Aloha = @Aloha or {}
@Aloha.settings =
  jQuery: @jQuery # Use the same version of jQuery
  logLevels:
    error: true
    warn: true
    info: false
    debug: false

  requireConfig:
    paths:
      # Override location of jquery-ui and use our own. Because
      # jquery-ui and bootstrap conflict in a few cases (buttons,
      # tooltip) our copy has those removed.
      jqueryui: '../../oerpub/js/jquery-ui-1.9.0.custom-aloha'

  errorhandling: true
  plugins:
    # All the plugins we use in Aloha
    load: [
      'oer/toolbar'
      'common/ui'
      'common/format'
      'common/paste'
      'common/block'
      'common/list'
      'common/table'
      'extra/draganddropfiles'
      'common/image'
      'oer/popover'
      'oer/math'
      'oer/assorted'
      'oer/note'
    ]

    # This whole thing is what's needed to:
    #
    # - set a custom URL to send files to
    # - register a callback that updates the IMG with the new src
    draganddropfiles:
      upload:
        config:
          method: 'POST'
          url: '/resource'
          fieldName: 'upload'
          send_multipart_form: true
          callback: (resp) ->
            # **TODO:** add xhr to Aloha.trigger('aloha-upload-*') in dropfilesrepository.js

            # dropfilesrepository.js triggers 'aloha-upload-success'
            # and 'aloha-upload-failure' but does not provide the
            # response text (URL).
            # We should probably change dropfilesrepository.js to be:
            #
            #     Aloha.trigger('aloha-upload-success', that, xhr);

            # Then, instead of configuring a callback we could just listen to that event.

            # If the response is a URL then change the Image source to it
            # The URL could be absolute (`/^http/`) or relative (`/\//` or `[a-z]`).
            unless resp.match(/^http/) or resp.match(/^\//) or resp.match(/^[a-z]/)
              alert 'You dropped a file and we sent a message to the server to do something with it.\nIt responded with some gibberish so we are showing you some other file to show it worked'
              resp = 'src/test/AlohaEditorLogo.png'

            # Drag and Drop creates an <img id='{this.id}'> element but the
            #
            # - 'New Image' plugin doesn't have access to the UploadFile object (this)
            #   so all it can do is add a class.
            # - If I combine both then we can set the attribute consistently.
            # - **FIXME:** Don't assume only 1 image can be uploaded at a time

            $img = Aloha.jQuery('.aloha-image-uploading').add('#' + @id)
            $img.attr 'src', resp
            $img.removeClass 'aloha-image-uploading'
            console.log 'Updated Image src as a result of upload'

    block:
      defaults:
        '.default-block': {}
        figure:
          'aloha-block-type': 'EditableImageBlock'

# In case some module wants the config object return it.
return @Aloha
