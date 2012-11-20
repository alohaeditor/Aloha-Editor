# Aloha Image Plugin
# * -----------------
# * This plugin handles when the insertImage button is clicked and provides a bubble next to an image when it is selected
#
define ['aloha', 'jquery', 'popover', 'ui/ui', 'aloha/console'], (Aloha, jQuery, Popover, UI, console) ->

  # This will be prefixed with Aloha.settings.baseUrl
  WARNING_IMAGE_PATH = '/../plugins/oerpub/image/img/warning.png'

  DIALOG_HTML = '''
    <form class="plugin image modal hide fade" id="linkModal" tabindex="-1" role="dialog" aria-labelledby="linkModalLabel" aria-hidden="true">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
        <h3>Edit Image</h3>
      </div>
      <div class="image-options">
          <button class="btn btn-link upload-image-link">Choose a file</button> OR <button class="btn btn-link upload-url-link">get file from the Web</button>
          <div class="placeholder preview hide">
            <h4>Preview</h4>
            <img class="preview-image"/>
          </div>
          <input type="file" class="upload-image-input" />
          <input type="url" class="upload-url-input" placeholder="Enter URL of image ..."/>
      </div>
      <div class="image-alt">
        <div class="forminfo">
          Please provide a description of this image for the visually impaired.
        </div>
        <div>
          <textarea name="alt" type="text" required placeholder="Enter description ..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button type="submit" class="btn btn-primary action insert">Save</button>
        <button class="btn" data-dismiss="modal">Cancel</button>
      </div>
    </form>'''

  showModalDialog = ($el) ->
      root = Aloha.activeEditable.obj
      dialog = jQuery(DIALOG_HTML)

      # Find the dynamic modal elements and bind events to the buttons
      $placeholder = dialog.find('.placeholder.preview')
      $uploadImage = dialog.find('.upload-image-input').hide()
      $uploadUrl =   dialog.find('.upload-url-input').hide()
      $submit = dialog.find('.submit')

      # If we're editing an image pull in the src.
      # It will be undefined if this is a new image.
      #
      # This variable is updated when one of the following occurs:
      # * selects an image from the filesystem
      # * enters a URL (TODO: Verify it's an image)
      # * drops an image into the drop div
      #
      # On submit $el.attr('src') will point to what is set in this variable
      imageSource = $el.attr('src')
      # Set the alt text if editing an image
      imageAltText = $el.attr('alt')
      dialog.find('[name=alt]').val(imageAltText)

      if /^https?:\/\//.test(imageSource)
        $uploadUrl.val(imageSource)
        $uploadUrl.show()

      # Set onerror of preview image
      ((img, baseurl) ->
        img.onerror = ->
          errimg = baseurl + WARNING_IMAGE_PATH
          img.src = errimg unless img.src is errimg
      ) dialog.find('.placeholder.preview img')[0], Aloha.settings.baseUrl

      setImageSource = (href) ->
        imageSource = href
        $submit.removeClass('disabled')

      # Uses the File API to render a preview of the image
      # and updates the modal's imageSource
      loadLocalFile = (file, $img, callback) ->
        reader = new FileReader()
        reader.onloadend = () ->
          $img.attr('src', reader.result)
          # If we get an image then update the modal's imageSource
          setImageSource(reader.result)
          callback(reader.result) if callback
        reader.readAsDataURL(file)

      # Add click handlers
      dialog.find('.upload-image-link').on 'click', (evt) ->
        evt.preventDefault()
        $placeholder.hide()
        $uploadUrl.hide()
        $uploadImage.show()

      dialog.find('.upload-url-link').on 'click', (evt) ->
        evt.preventDefault()
        $placeholder.hide()
        $uploadImage.hide()
        $uploadUrl.show()

      $uploadImage.on 'change', () ->
        files = $uploadImage[0].files
        # Parse the file and if it's an image set the imageSource
        if files.length > 0
          $previewImg = $placeholder.find('img')
          loadLocalFile files[0], $previewImg
          $placeholder.show()

      $uploadUrl.on 'change', () ->
        $previewImg = $placeholder.find('img')
        url = $uploadUrl.val()
        setImageSource(url)
        $previewImg.attr 'src', url
        $placeholder.show()

      # On save update the actual img tag
      dialog.on 'submit', (evt) =>
        evt.preventDefault() # Don't submit the form

        # Set the image source if one is set
        $el.attr 'src', imageSource

        # Set the alt text
        $el.attr('alt', dialog.find('[name=alt]').val())

        dialog.modal('hide')

        # Wait until the dialog is closed before inserting it into the DOM
        # That way if it is cancelled nothing is inserted
        if not $el.parent()[0]

          # Either insert a new span around the cursor and open the box or just open the box
          range = Aloha.Selection.getRangeObject()
          # Insert the img into the DOM
          #GENTICS.Utils.Dom.addMarkup(range, newEl, false)
          $el.addClass('aloha-new-image')
          GENTICS.Utils.Dom.insertIntoDOM $el,
            range,
            Aloha.activeEditable.obj
          $el = Aloha.jQuery('.aloha-new-image')
          $el.removeClass('aloha-new-image')

        # Start uploading if a local file was chosen
        if $uploadImage[0].files.length
          # Add a class so we can style the image while it's being uploaded
          # Also, it's required because the DnD mechanism doesn't have a way
          # of identifying which <img> was uploaded when the callback occurs.
          $el.addClass('aloha-image-uploading')
          Aloha.trigger 'aloha-upload-file',
            target: $el[0], files: $uploadImage[0].files

      dialog.on 'hidden', () ->
        dialog.remove()
      dialog

  selector = 'img'

  populator = ($el, pover) ->
      # When a click occurs, the activeEditable is cleared so squirrel it
      editable = Aloha.activeEditable
      $bubble = jQuery '''
        <div class="link-popover">
          <button class="btn change">Change...</button>
          <button class="btn btn-danger remove">Remove</button>
        </div>'''

      href = $el.attr('src')
      $bubble.find('.change').on 'click', ->
        # unsquirrel the activeEditable
        Aloha.activeEditable = editable
        dialog = showModalDialog($el)
        dialog.modal('show')
      $bubble.find('.remove').on 'click', ->
        pover.stopOne($el)
        $el.remove()
      $bubble.contents()


  UI.adopt 'insertImage-oer', null,
    click: () ->
      newEl = jQuery('<img/>')
      dialog = showModalDialog(newEl)

      # Finally show the dialog
      dialog.modal('show')

  Popover.register
    hover: true
    selector: selector
    populator: populator
