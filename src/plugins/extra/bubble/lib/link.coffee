# Aloha Link Plugin
# * -----------------
# * This plugin provides a bubble next to a link when it is selected
# 
define ['aloha', 'jquery', 'aloha/console'], (Aloha, jQuery, console) ->
  
  showModalDialog = ($a) ->
      root = Aloha.activeEditable.obj
      dialog = jQuery('<div class="link-chooser">')
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

  populator = ($el, $bubble) ->
      that = this
      href = $el.attr('href')
      a = jQuery('<a target="_blank" rel="noreferrer"></a>').appendTo($bubble)
      a.attr 'href', href
      a.append href
      $bubble.append ' - '
      change = jQuery('<a href="javascript:void">Change</a>')
      change.appendTo($bubble).on 'mousedown', ->
        dialog = showModalDialog($el)
        dialog.addClass 'aloha'
        dialog.on 'dialogclose', ->
          a.attr 'href', $el.attr('href')
          a.contents().remove()
          a.append $el.attr('href')


  return {
    selector: selector
    populator: populator
    filter: filter
  }