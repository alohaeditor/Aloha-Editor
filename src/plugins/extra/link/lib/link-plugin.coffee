# Aloha Link Plugin
# * -----------------
# * This plugin provides a bubble next to a link when it is selected
# 
define ['aloha', 'aloha/plugin', 'jquery', 'ui/port-helper-attribute-field', 'ui/ui', 'ui/scopes', 'ui/surface', 'ui/button', 'ui/toggleButton', '../../bubble/lib/bubble-plugin', 'i18n!link/nls/i18n', 'i18n!aloha/nls/i18n', 'aloha/console', 'link/../extra/linklist'], (Aloha, Plugin, jQuery, AttributeField, Ui, Scopes, Surface, Button, ToggleButton, Bubbler, i18n, i18nCore, console) ->
  
  # Validate and save the href if something is selected.
  selectionChangeHandler = (that, rangeObject) ->
    enteredLinkScope = false
    
    # Check if we need to ignore this selection changed event for
    # now and check whether the selection was placed within a
    # editable area.
    if not that.ignoreNextSelectionChangedEvent and Aloha.Selection.isSelectionEditable() and Aloha.activeEditable?
      foundMarkup = that.findLinkMarkup(rangeObject)
      enteredLinkScope = foundMarkup
    enteredLinkScope
  'use strict'
  GENTICS = window.GENTICS
  pluginNamespace = 'aloha-bubble-link'
  oldValue = ''
  newValue = undefined
  return Plugin.create('bubble-link',
    init: ->
      that = this
      Aloha.bind 'aloha-editable-activated', (event, data) ->
        new Bubbler(that._createDisplayer.bind(that), jQuery(data.editable.obj), 'a')

      insideLinkScope = false
      Aloha.bind 'aloha-selection-changed', (event, rangeObject) ->
        enteredLinkScope = false
        if Aloha.activeEditable
          enteredLinkScope = selectionChangeHandler(that, rangeObject)
          if insideLinkScope isnt enteredLinkScope
            link = rangeObject.getCommonAncestorContainer()
            if enteredLinkScope
              jQuery(link).trigger 'open.bubble'
            else
              jQuery(Aloha.activeEditable.obj).find('a').trigger 'close.bubble'
        insideLinkScope = enteredLinkScope


    addLinkEventHandlers: (link) ->
      new Bubbler(@_createDisplayer.bind(this), jQuery(link))

    _createDisplayer: ($el, $bubble) ->
      that = this
      href = $el.attr('href')
      a = jQuery('<a target="_blank" rel="noreferrer"></a>').appendTo($bubble)
      a.attr 'href', href
      a.append href
      $bubble.append ' - '
      change = jQuery('<a href="javascript:void">Change</a>')
      change.appendTo($bubble).on 'mousedown', ->
        dialog = that.showModalDialog($el)
        dialog.addClass 'aloha'
        dialog.on 'dialogclose', ->
          a.attr 'href', $el.attr('href')
          a.contents().remove()
          a.append $el.attr('href')

    findLinkMarkup: (range=Aloha.Selection.getRangeObject()) ->
      if Aloha.activeEditable
        range.findMarkup (->
          @nodeName.toLowerCase() is 'a'
        ), Aloha.activeEditable.obj
      else
        null

    showModalDialog: ($a) ->
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
      cancelled = null
      onOk = ->
        if select.val()
          $a.attr 'href', select.val()
          jQuery(this).dialog 'close'

      onCancel = ->
        jQuery(this).dialog 'close'

      onClose = ->

      dialog.dialog
        modal: true
        buttons:
          OK: onOk
          Cancel: onCancel

      dialog
  )
