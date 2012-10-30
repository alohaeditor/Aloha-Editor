# Aloha Link Plugin
# * -----------------
# * This plugin provides a bubble next to a link when it is selected
# 
define ['aloha', 'jquery', 'aloha/console'], (Aloha, jQuery, console) ->
  
  showModalDialog = ($a) ->
      root = Aloha.activeEditable.obj
      dialog = jQuery '''
      <div class="modal" id="linkModal" tabindex="-1" role="dialog" aria-labelledby="linkModalLabel" aria-hidden="true">
        <div class="modal-header">
          <button type="button" class="close" data-dismiss="modal" aria-hidden="true">x</button>
          <h3 id="linkModalLabel">Edit link</h3>
        </div>
        <div class="modal-body">
          <div id="link-text">
            <h4>Text to display</h4>
            <div>
              <input id="link-contents" class="input-xlarge" type="text" style="width: 90%;" placeholder="Enter a phrase here"/>
            </div>
          </div>
          <h4 style="display: none">Link Destination</h4>
          <div class="tabbable tabs-left"> <!-- Only required for left/right tabs -->
            <ul class="nav nav-tabs" style="display: none">
              <li><a href="#link-tab-external" data-toggle="tab">External</a></li>
              <li><a href="#link-tab-internal" data-toggle="tab">Internal</a></li>
            </ul>
            <div class="tab-content">
              <div class="tab-pane" id="link-tab-external">
                <h4 for="link-external">Link to webpage</h4>
                <input class="link-external" id="link-external" type="text" style="width: 90%;" placeholder="http://"/>
              </div>
              <div class="tab-pane" id="link-tab-internal" style="display: none">
                <label for="link-internal">Link to a part in this document</label>
                <select class="link-internal" id="link-internal" size="5" multiple="multiple"></select>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary link-save">Submit</button>
          <button class="btn" data-dismiss="modal" aria-hidden="true">Cancel</button>
        </div>
      </div>'''
      
      if not $a.children()[0]
        linkContents = dialog.find('#link-contents')
        linkContents.val($a.text())
      
      # Build the link options and then populate one of them.
      linkExternal = dialog.find('.link-external')
      linkInternal = dialog.find('.link-internal')
      linkSave     = dialog.find('.link-save')


      appendOption = (id, contentsToClone) ->
        clone = contentsToClone[0].cloneNode(true)
        contents = jQuery(clone).contents()
        option = jQuery('<option></option>')
        option.attr 'value', '#' + id
        option.append contents
        option.appendTo linkInternal

      orgElements = root.find('h1,h2,h3,h4,h5,h6')
      figuresAndTables = root.find('figure,table')
      orgElements.filter(':not([id])').each ->
        jQuery(this).attr 'id', GENTICS.Utils.guid()

      orgElements.each ->
        item = jQuery(this)
        id = item.attr('id')
        appendOption id, item

      figuresAndTables.each ->
        item = jQuery(this)
        id = item.attr('id')
        caption = item.find('caption,figcaption')
        appendOption id, caption if caption[0]

      href = null
      
      dialog.find('.link-tab-external').on 'shown', () -> href = linkExternal.val()
      dialog.find('.link-tab-internal').on 'shown', () -> href = linkInternal.val()
      
      linkExternal.add(linkInternal).on 'change', () -> href = jQuery(@).val()
      
      # Activate the current tab
      href = $a.attr('href')

      # Clear up the active tabs
      dialog.find('.active').removeClass('active')

      if href.match(/^#/)
        linkInternal.val(href)
        #dialog.find('#link-tab-internal').tab('show')
        dialog.find('#link-tab-internal').addClass('active')
        dialog.find('a[href=#link-tab-internal]').parent().addClass('active')
      else # if href.match(/^https?:\/\//)
        linkExternal.val(href)
        #dialog.find('#link-tab-external').tab('show')
        dialog.find('#link-tab-external').addClass('active')
        dialog.find('a[href=#link-tab-external]').parent().addClass('active')


      linkSave.on 'click', () ->
        if linkContents.val() and linkContents.val().trim()
          $a.contents().remove()
          $a.append(linkContents.val())

        # Set the href based on the active tab
        $a.attr 'href', href
        dialog.modal('hide')

      dialog.modal('show')
      dialog.on 'hidden', () ->
        dialog.remove()
      dialog

  selector = 'a'
  filter = ->
    @nodeName.toLowerCase() is 'a'

  populator = () ->
      $el = @
      # When a click occurs, the activeEditable is cleared so squirrel it
      editable = Aloha.activeEditable
      $bubble = jQuery('<div class="link-popover"></div>')
      
      href = $el.attr('href')
      a = jQuery('<a target="_blank" rel="noreferrer"></a>').appendTo($bubble)
      a.attr 'href', href
      a.append href
      $bubble.append ' - '
      change = jQuery('<button class="btn">Change...</div>')
      # TODO: Convert the mousedown to a click. To do that the aloha-deactivated event need to not hide the bubbles yet and instead fire a 'hide' event
      change.appendTo($bubble)
      change.on 'click', ->
        # unquirrel the activeEditable
        Aloha.activeEditable = editable
        dialog = showModalDialog($el)
      $bubble.contents()


  return {
    selector: selector
    populator: populator
    filter: filter
  }