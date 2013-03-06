# Aloha Image Plugin
# * -----------------
# * This plugin handles when the insertImage button is clicked and provides a bubble next to an image when it is selected
#
define ['aloha', 'jquery', 'popover', 'ui/ui', 'css!assorted/css/image.css'], (Aloha, jQuery, Popover, UI) ->

  # This will be prefixed with Aloha.settings.baseUrl
  WARNING_IMAGE_PATH = '/../plugins/oer/image/img/warning.png'

  DIALOG_HTML = '''
    <form class="plugin image modal hide fade" id="linkModal" tabindex="-1" role="dialog" aria-labelledby="linkModalLabel" aria-hidden="true" data-backdrop="false">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
        <h3>Insert image</h3>
      </div>
      <div class="modal-body">
        <div class="image-options">
            <a class="upload-image-link">Choose a file</a> OR <a class="upload-url-link">get file from the Web</a>
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
            <textarea name="alt" type="text" placeholder="Enter description ..."></textarea>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="submit" class="btn btn-primary action insert">Save</button>
        <button class="btn action cancel">Cancel</button>
      </div>
    </form>'''

  showModalDialog = ($el) ->
      settings = Aloha.require('assorted/assorted-plugin').settings
      root = Aloha.activeEditable.obj
      dialog = jQuery(DIALOG_HTML)

      # Find the dynamic modal elements and bind events to the buttons
      $placeholder = dialog.find('.placeholder.preview')
      $uploadImage = dialog.find('.upload-image-input').hide()
      $uploadUrl =   dialog.find('.upload-url-input').hide()
      $submit = dialog.find('.action.insert')

      # If we're editing an image pull in the src.
      # It will be undefined if this is a new image.
      #
      # This variable is updated when one of the following occurs:
      # * selects an image from the filesystem
      # * enters a URL (TODO: Verify it's an image)
      # * drops an image into the drop div

      # $el might not be an image, it might be a placeholder for a future image
      if $el.is('img')
        # On submit $el.attr('src') will point to what is set in this variable
        # preserve the alt text if editing an image
        imageSource = $el.attr('src')
        imageAltText = $el.attr('alt')
      else
        imageSource = ''
        imageAltText = ''

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
          if $img
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
        $uploadImage.click()
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
          if settings.image.preview
            $previewImg = $placeholder.find('img')
            loadLocalFile files[0], $previewImg
            $placeholder.show()
          else
            loadLocalFile files[0]

      $uploadUrl.on 'change', () ->
        $previewImg = $placeholder.find('img')
        url = $uploadUrl.val()
        setImageSource(url)
        if settings.image.preview
          $previewImg.attr 'src', url
          $placeholder.show()

      # On save update the actual img tag. Use the submit event because this
      # allows the use of html5 validation.
      deferred = $.Deferred()
      dialog.on 'submit', (evt) =>
        evt.preventDefault() # Don't submit the form
        if $el.is('img')
          $el.attr 'src', imageSource
          $el.attr 'alt', dialog.find('[name=alt]').val()
        else
          img = jQuery('<img/>')
          img.attr 'src', imageSource
          img.attr 'alt', dialog.find('[name=alt]').val()
          $el.replaceWith(img)
          $el = img
        deferred.resolve(target: $el[0], files: $uploadImage[0].files)
        dialog.modal('hide')

      dialog.on 'click', '.btn.action.cancel', (evt) =>
        evt.preventDefault() # Don't submit the form
        deferred.reject(target: $el[0])
        dialog.modal('hide')

      dialog.on 'hidden', (event) ->
        # If hidden without being confirmed/cancelled, reject
        if deferred.state()=='pending'
          deferred.reject(target: $el[0])
        # Clean up after dialog was hidden
        dialog.remove()

      # Return promise, with an added show method
      jQuery.extend true, deferred.promise(),
        show: (title) ->
            if title
              dialog.find('.modal-header h3').text(title)
            dialog.modal 'show'

  selector = 'img'

  populator = ($el, pover) ->
      # When a click occurs, the activeEditable is cleared so squirrel it
      editable = Aloha.activeEditable
      $bubble = jQuery '''
        <div class="link-popover-details">
            <a class="change">
              <img src="''' + Aloha.settings.baseUrl + '''/../plugins/oer/assorted/img/edit-link-03.png" />
              <span title="Change the image's properties">Edit image...</span>
            </a>
            &nbsp; | &nbsp;
            <a class="remove">
              <img src="''' + Aloha.settings.baseUrl + '''/../plugins/oer/assorted/img/unlink-link-02.png" />
              <span title="Delete the image">Delete</span>
            </a>
        </div>'''

      href = $el.attr('src')
      $bubble.find('.change').on 'click', ->
        # unsquirrel the activeEditable
        Aloha.activeEditable = editable
        promise = showModalDialog($el)
 
        promise.done (data)->
          # Uploading if a local file was chosen
          if data.files.length
            jQuery(data.target).addClass('aloha-image-uploading')
            uploadImage data.files[0], (url) ->
              jQuery(data.target).attr('src', url).removeClass(
                'aloha-image-uploading')
        promise.show('Edit image')

      $bubble.find('.remove').on 'click', ->
        pover.stopOne($el)
        $el.remove()
      $bubble.contents()


  uploadImage = (file, callback) ->
    plugin = @
    settings = Aloha.require('assorted/assorted-plugin').settings
    xhr = new XMLHttpRequest()
    if xhr.upload
      if not settings.image.uploadurl
        throw new Error("uploadurl not defined")

      xhr.onload = () ->
        if settings.image.parseresponse
          url = parseresponse(xhr)
        else
          url = JSON.parse(xhr.response).url
        callback(url)

      xhr.open("POST", settings.image.uploadurl, true)
      xhr.setRequestHeader("Cache-Control", "no-cache")
      f = new FormData()
      f.append(settings.image.uploadfield or 'upload', file, file.name)
      xhr.send(f)


  Aloha.bind 'aloha-image-selected', (event, target) ->
      # Hide other tooltips of the same type
      $el = jQuery(target)
      nodes = jQuery(Aloha.activeEditable.obj).find(selector)
      nodes = nodes.not($el)
      nodes.trigger 'hide'
      $el.trigger 'show'
      $el.data('aloha-bubble-selected', true)
      $el.off('.bubble')


  UI.adopt 'insertImage-oer', null,
    click: () ->
      newEl = jQuery('<span class="aloha-ephemera image-placeholder"> </span>')
      GENTICS.Utils.Dom.insertIntoDOM newEl, Aloha.Selection.getRangeObject(), Aloha.activeEditable.obj
      promise = showModalDialog(newEl)

      promise.done (data)->
        # Uploading if a local file was chosen
        if data.files.length
          newEl.addClass('aloha-image-uploading')
          uploadImage data.files[0], (url) ->
            jQuery(data.target).attr('src', url)
            newEl.removeClass('aloha-image-uploading')

      promise.fail (data) ->
        # Clean up placeholder if needed
        $target = jQuery(data.target)
        if not $target.is('img')
          $target.remove()

      # Finally show the dialog
      promise.show()

  # Return config
  selector: selector
  populator: populator
