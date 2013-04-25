# Aloha Link Plugin
# * -----------------
# * This plugin provides a bubble next to a link when it is selected
#
define [
  'aloha',
  'jquery',
  'popover',
  'ui/ui',
  'aloha/console',
  'css!assorted/css/link.css'
], (
  Aloha,
  jQuery,
  Popover,
  UI,
  console
) ->

  DIALOG_HTML = '''
    <form class="modal" id="linkModal" tabindex="-1" role="dialog" aria-labelledby="linkModalLabel" aria-hidden="true">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">x</button>
        <h3 id="linkModalLabel">Edit link</h3>
      </div>
      <div class="modal-body">
        <div id="link-text">
          <span>Text to display</span>
          <div>
            <input id="link-contents" class="input-xlarge" type="text" placeholder="Enter a phrase here" required />
          </div>
        </div>
        <h4 id="link-destination">Link Destination</h4>
        <div class="tabbable tabs-left"> <!-- Only required for left/right tabs -->
          <ul class="nav nav-tabs">
            <li><a href="#link-tab-external" data-toggle="tab">External</a></li>
            <li><a href="#link-tab-internal" data-toggle="tab">Internal</a></li>
          </ul>
          <div class="tab-content">
            <div class="tab-pane" id="link-tab-external">
              <span for="link-external">Link to webpage</span>
              <input class="link-input link-external" id="link-external" type="url" pattern="https?://.+"/>
            </div>
            <div class="tab-pane" id="link-tab-internal">
              <label for="link-internal">Link to a part in this document</label>
              <select class="link-input link-internal" id="link-internal" size="5" multiple="multiple"></select>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary link-save">Submit</button>
        <button class="btn" data-dismiss="modal" aria-hidden="true">Cancel</button>
      </div>
    </form>'''

  # The HTML for the little popover when a link is selected
  DETAILS_HTML = '''
      <span class="link-popover-details">
        <button class="btn-link edit-link" title="Change the link's text, location, or other properties">
          <i class="icon-edit-link"></i>
          <span>Edit link...</span>
        </button>
        <button class="btn-link delete-link">
          <i class="icon-delete-link"></i>
          <span title="Remove the link, leaving just the text">Unlink</span>
        </button>
        <a class="visit-link" target="_blank" title="Visit the link in a new window or tab">
          <i class="icon-external-link"></i>
          <span class="title"></span>
        </a>
      </span>
      <br/>
  '''


  showModalDialog = ($el) ->
      root = Aloha.activeEditable.obj
      dialog = jQuery(DIALOG_HTML)

      # not going to change the backdrop when displaying the modal dialog box
      dialog.attr 'data-backdrop', false

      a = $el.get(0)
      linkContents = dialog.find('#link-contents')
      if a.childNodes.length > 0
        linkContents.val($el.text())

      # Build the link options and then populate one of them.
      linkExternal = dialog.find('.link-external')
      linkInternal = dialog.find('.link-internal')
      linkSave     = dialog.find('.link-save')

      # Combination of linkExternal and linkInternal
      linkInput    = dialog.find('.link-input')

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
        jQuery(@).attr 'id', GENTICS.Utils.guid()

      orgElements.each ->
        item = jQuery(@)
        id = item.attr('id')
        appendOption id, item

      figuresAndTables.each ->
        item = jQuery(@)
        id = item.attr('id')
        caption = item.find('caption,figcaption')
        appendOption id, caption if caption[0]

      dialog.find('a[data-toggle=tab]').on 'shown', (evt) ->
        prevTab = jQuery(jQuery(evt.relatedTarget).attr('href'))
        newTab  = jQuery(jQuery(evt.target).attr('href'))
        prevTab.find('.link-input').removeAttr('required')
        newTab.find('.link-input').attr('required', true)

      # Activate the current tab
      href = $el.attr('href')

      # Clear up the active tabs
      dialog.find('.active').removeClass('active')

      linkInputId = '#link-tab-external'
      linkInputId = '#link-tab-internal' if $el.attr('href').match(/^#/)

      #dialog.find('#link-tab-internal').tab('show')
      dialog.find(linkInputId)
      .addClass('active')
      .find('.link-input')
      .attr('required', true)
      .val(href)
      dialog.find("a[href=#{linkInputId}]").parent().addClass('active')

      massageUrlInput = ($input) ->
        url = $input.val()
        if /^http/.test(url) or /^htp/.test(url) or /^htt/.test(url)
          # not missing.  if not valid, form validation will notify
          # and do not want to add http below in this case
        else
          if not /^https?:\/\//.test(url)
            $input.val 'http://' + url

      linkExternal.on 'blur', (evt) ->
        massageUrlInput linkExternal

      linkExternal.bind 'keydown', 'return', (evt) ->
        massageUrlInput linkExternal

      dialog.on 'submit', (evt) =>
        evt.preventDefault()

        if linkContents.val() and linkContents.val().trim()
          $el.contents().remove()
          $el.append linkContents.val()

        # Set the href based on the active tab
        active = dialog.find('.link-input[required]')
        href = active.val()
        $el.attr 'href', href
        dialog.modal('hide')

      dialog.modal('show')
      dialog.on 'hidden', () ->
        dialog.remove()
      dialog


  unlink = ($a) ->
      a = $a.get(0)

      # remove the link's popover HTML et al, before unwrapping the link/anchor
      # see popover-plugin soptOne() method:
      $a.removeData('aloha-bubble-openTimer', 0)
      $a.removeData('aloha-bubble-closeTimer', 0)
      $a.removeData('aloha-bubble-selected', false)
      $a.popover('destroy')

      # create a range based on the anchor node and select it, see GENTICS.Utils.Dom.selectDomNode
      newRange = new GENTICS.Utils.RangeObject()
      newRange.startContainer = newRange.endContainer = a.parentNode
      newRange.startOffset = GENTICS.Utils.Dom.getIndexInParent a
      newRange.endOffset = newRange.startOffset + 1
      newRange.select()

      # remove the anchor but preserve its contents
      preserveContents = true
      GENTICS.Utils.Dom.removeFromDOM a, newRange, preserveContents

      # select the new, colapsed range
      newRange.startContainer = newRange.endContainer
      newRange.startOffset = newRange.endOffset
      newRange.select()
      newRange

  selector = 'a'


  # see http://stackoverflow.com/questions/10903002/shorten-url-for-display-with-beginning-and-end-preserved-firebug-net-panel-st
  shortUrl = (linkurl, l) ->
    l = (if typeof (l) isnt "undefined" then l else 50)
    chunk_l = (l / 2)
    linkurl = linkurl.replace("http://", "")
    linkurl = linkurl.replace("https://", "")
    return linkurl  if linkurl.length <= l
    start_chunk = shortString(linkurl, chunk_l, false)
    end_chunk   = shortString(linkurl, chunk_l, true)
    start_chunk + ".." + end_chunk


  shortString = (s, l, reverse) ->
    stop_chars = [" ", "/", "&"]
    acceptable_shortness = l * 0.80 # When to start looking for stop characters
    reverse = (if typeof (reverse) isnt "undefined" then reverse else false)
    s = (if reverse then s.split("").reverse().join("") else s)
    short_s = ""
    i = 0

    while i < l - 1
      short_s += s[i]
      break  if i >= acceptable_shortness and stop_chars.indexOf(s[i]) >= 0
      i++
    return short_s.split("").reverse().join("")  if reverse
    short_s


  populator = ($el) ->
      # When a click occurs, the activeEditable is cleared so squirrel it
      editable = Aloha.activeEditable
      $bubble = jQuery('<div class="link-popover"></div>')

      href = $el.attr('href')

      details = jQuery DETAILS_HTML
      $bubble.append details

      $edit = details.find '.edit-link'
      $edit.on 'click', ->
          # unsquirrel the activeEditable
          Aloha.activeEditable = editable
          dialog = showModalDialog($el)

      $remove = details.find '.delete-link'
      $remove.on 'click', ->
          # unsquirrel the activeEditable
          Aloha.activeEditable = editable
          unlink($el)

      details.find('.visit-link').attr 'href', href
      details.find('.visit-link .title').text shortUrl(href,30)


      $bubble.contents()


  getContainerAnchor = (a) ->
    el = a
    while el
      return el if el.nodeName.toLowerCase() is "a"
      el = el.parentNode
    false


  UI.adopt 'insertLink', null,
    click: () ->
      editable = Aloha.activeEditable

      # if range => selection is an anchor / link
      #   do not create a new link, use existing link in call to showModalDialog()
      # else
      #   create a new link
      #   extend selection to word boundaries, range.select()
      #   get text from range/selection
      #   call showModalDialog with text and empty link
      # endif

      range = Aloha.Selection.getRangeObject()
      if range.startContainer is range.endContainer
        a = getContainerAnchor range.startContainer
        if a
          # want to prevent creating links within links so if the selection
          # is contained within a link we edit that link
          $a = jQuery a
          range.startContainer = range.endContainer = a
          range.startOffset = 0
          range.endOffset = a.childNodes.length
          dialog = showModalDialog $a
        else
          # creating a new link aka inserting a new link
          GENTICS.Utils.Dom.extendToWord range
          range.select()
          $a = jQuery '<a href="" class="aloha-new-link"></a>'
          linkText = if range.isCollapsed() then "" else range.getText()
          $a.append linkText
          dialog = showModalDialog $a
      else
        # link must be within a single container.
        # user needs to modify their selection and try again
        return

      # Wait until the dialog is closed before inserting it into the DOM
      # That way if it is cancelled nothing is inserted
      dialog.on 'hidden', =>

        Aloha.activeEditable = editable

        # link is now populated with dialog box values.
        # Case 1: link is an existing link and we are good to go
        # Case 2: link is a new link and needs to replace the selected text

        if $a.hasClass 'aloha-new-link'
          # this is a new link

          # If the user cancelled then don't create the link
          if not $a.attr 'href'
            return

          # Either insert a new span around the cursor and open the box
          # or just open the box
          range = Aloha.Selection.getRangeObject()

          if range.isCollapsed()
            # insert a link with text here
            GENTICS.Utils.Dom.insertIntoDOM $a,
              range,
              Aloha.activeEditable.obj
            range.startContainer = range.endContainer = $a.contents()[0]
            range.startOffset = 0
            range.endOffset = $a.text().length
          else
            GENTICS.Utils.Dom.removeRange range
            GENTICS.Utils.Dom.insertIntoDOM $a, range, Aloha.activeEditable.obj

          # addMarkup takes a template so we need to look up the inserted object
          #   and remove the marker class
          newLink = Aloha.activeEditable.obj.find '.aloha-new-link'
          newLink.removeClass 'aloha-new-link'


  # Return config
  selector: selector
  populator: populator
  markerclass: 'link-popover'
