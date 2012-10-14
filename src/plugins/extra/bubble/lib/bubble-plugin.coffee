# How this plugin is structured:
# link.coffee (and eventually others like image, figure, exercise, etc) provides the following config:
# - selector: css selector for determining which elements to attach bubble events to
# - populator: Javscript function that gets (a) the element and (b) the div that represents the bubble.
#               This function will populate the bubble with buttons like "Add Title", "Change", etc
# - filter: Javascript function that determines whether the @ element is an anchor (used when cursor moves around the doc)

# bubble.coffee contains the code to attach all the correct listeners (like mouse events)
#      moves the bubble to the correct spot, and triggers when the bubble should be populated

# This file manages all the Aloha events and removes/adds all the bubble listeners when an editable is enabled/disabled.
define [ 'aloha', 'jquery', 'aloha/plugin', './bubble', './link', './figure' ], (Aloha, jQuery, Plugin, Bubbler, linkConfig, figureConfig) ->

  
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
	
  for cfg in [linkConfig, figureConfig]
    helpers.push(new Helper(cfg.selector, cfg.populator, cfg.filter))

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
          setTimeout(() ->
            helper.stop(data.editable)
          , 100)
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
