# Aloha Link Plugin
# * -----------------
# * This plugin provides a bubble next to a link when it is selected
# 
define ['aloha', 'aloha/plugin', 'jquery', 'ui/port-helper-attribute-field', 'ui/ui', 'ui/scopes', 'ui/surface', 'ui/button', 'ui/toggleButton', '../../bubble/lib/bubble-plugin', 'i18n!link/nls/i18n', 'i18n!aloha/nls/i18n', 'aloha/console', 'link/../extra/linklist'], (Aloha, Plugin, jQuery, AttributeField, Ui, Scopes, Surface, Button, ToggleButton, Bubbler, i18n, i18nCore, console) ->
  
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

  
  helpers = []
  class Helper
    constructor: (@selector, @populator, @filter) ->
    start: (editable) -> new Bubbler(@populator, jQuery(editable.obj), @selector)
    stop: (editable) ->
      # Remove all events and close all bubbles
      jQuery(editable.obj).undelegate(@selector, '.bubble')
      $nodes = jQuery(editable.obj).find(@selector)
      $nodes.data('aloha-bubble-el', null)
      $nodes.data('aloha-bubble-openTimer', 0)
      $nodes.data('aloha-bubble-closeTimer', 0)
      $nodes.data('aloha-bubble-hovered', false)
      
      # TODO: bubbles are attached to a canvas. clear the canvas, not all bubbles
      jQuery('body').find('.bubble').remove()
	
  helpers.push(new Helper(selector, populator, filter))

  findMarkup = (range=Aloha.Selection.getRangeObject(), filter) ->
    if Aloha.activeEditable
      range.findMarkup filter, Aloha.activeEditable.obj
    else
      null

  # Validate and save the href if something is selected.
  selectionChangeHandler = (rangeObject, filter) ->
    enteredLinkScope = false
    
    # Check if we need to ignore this selection changed event for
    # now and check whether the selection was placed within a
    # editable area.
    if Aloha.Selection.isSelectionEditable() and Aloha.activeEditable?
      foundMarkup = findMarkup(rangeObject, filter)
      enteredLinkScope = foundMarkup
    enteredLinkScope

  GENTICS = window.GENTICS
  pluginNamespace = 'aloha-bubble-link'
  oldValue = ''
  newValue = undefined
  return Plugin.create('bubble-link',
    init: ->
      that = this
      jQuery.each helpers, (i, helper) ->
        
        # These are reset when the editor is deactivated
        insideScope = false
        enteredLinkScope = false

        Aloha.bind 'aloha-editable-activated', (event, data) ->
          helper.start(data.editable)  
        Aloha.bind 'aloha-editable-deactivated', (event, data) ->
          helper.stop(data.editable)
          insideScope = false
          enteredLinkScope = false
  
        Aloha.bind 'aloha-selection-changed', (event, rangeObject) ->
          if Aloha.activeEditable
            enteredLinkScope = selectionChangeHandler(rangeObject, helper.filter)
            if insideScope isnt enteredLinkScope
              link = rangeObject.getCommonAncestorContainer()
              if enteredLinkScope
                jQuery(link).trigger 'open.bubble'
              else
                jQuery(Aloha.activeEditable.obj).find(helper.selector).trigger 'close.bubble'
          insideScope = enteredLinkScope
  )
