# Aloha Link Plugin
# * -----------------
# * This plugin provides a bubble next to a link when it is selected
# 
define ['aloha', 'jquery', 'aloha/console'], (Aloha, jQuery, console) ->
  
  showModalDialog = ($a) ->
      root = Aloha.activeEditable.obj
      dialog = jQuery('<div class="link-chooser"></div>')
      
      if not $a.children()[0]
        jQuery('<label>Text to display</label>').appendTo(dialog)
        linkContents = jQuery('<input class="contents"></input>').appendTo(dialog)
        linkContents.val($a.text())
      
      # Build the link options and then populate one of them.
      externalDiv = jQuery('''<div class="link-location">
        <div class="link-radio">
          <input type="radio" name="link-to-where" id="ltw-external"/>
        </div>
        <label for="ltw-external">Link to webpage</label>
      </div>''').appendTo(dialog)
      externalHref = jQuery('<input class="href external"></input>').appendTo(externalDiv)


      externalDiv.find('input[name=link-to-where]').on 'change', () ->
        checked = jQuery(@).attr('checked')
        externalHref.addClass('disabled') if not checked
        externalHref.removeClass('disabled') if checked
        
      
      href = $a.attr('href')
      
      if href.match(/^https?:\/\//)
        externalHref.val(href)
        externalHref.removeClass('disabled')

      
      select = jQuery('<select class="link-list" size="5"></select>')
      select.appendTo dialog
      appendOption = (id, contentsToClone) ->
        clone = contentsToClone[0].cloneNode(true)
        contents = jQuery(clone).contents()
        option = jQuery('<option></option>')
        option.attr 'value', '#' + id
        option.append contents
        option.appendTo select

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
        appendOption id, caption

      select.val $a.attr('href')
      onOk = ->
        if linkContents.val() and linkContents.val().trim()
          $a.contents().remove()
          $a.append(linkContents.val())

        if select.val()
          $a.attr 'href', select.val()
        jQuery(this).dialog 'close'

      onCancel = ->
        jQuery(this).dialog 'close'

      dialog.dialog
        dialogClass: 'aloha link-editor' # Need aloha because jquery-ui styles are prefixed with it
        modal: true
        buttons:
          OK: onOk
          Cancel: onCancel

      dialog

  selector = 'a'
  filter = ->
    @nodeName.toLowerCase() is 'a'

  populator = () ->
      $el = @
      $bubble = jQuery('<div class="link-popover"></div>')
      href = $el.attr('href')
      a = jQuery('<a target="_blank" rel="noreferrer"></a>').appendTo($bubble)
      a.attr 'href', href
      a.append href
      $bubble.append ' - '
      change = jQuery('<button class="btn">Change...</div>')
      # TODO: Convert the mousedown to a click. To do that the aloha-deactivated event need to not hide the bubbles yet and instead fire a 'hide' event
      change.appendTo($bubble)
      change.on 'mousedown', ->
        dialog = showModalDialog($el)
        dialog.addClass 'aloha'
        dialog.on 'dialogclose', ->
          a.attr 'href', $el.attr('href')
          a.contents().remove()
          a.append $el.attr('href')
      $bubble.contents()


  return {
    selector: selector
    populator: populator
    filter: filter
  }