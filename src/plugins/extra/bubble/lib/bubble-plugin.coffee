# How this plugin is structured:
# link.coffee (and eventually others like image, figure, exercise, etc) provides the following config:
# - selector: css selector for determining which elements to attach bubble events to
# - populator: Javscript function that gets (a) the element and (b) the div that represents the bubble.
#               This function will populate the bubble with buttons like "Add Title", "Change", etc
# - filter: Javascript function that determines whether the @ element is an anchor (used when cursor moves around the doc)

# bubble.coffee contains the code to attach all the correct listeners (like mouse events)
#      moves the bubble to the correct spot, and triggers when the bubble should be populated


# This file manages all the Aloha events and removes/adds all the bubble listeners when an editable is enabled/disabled.

#############  The popover pseudo code: #############
# Here's the flow cases to consider:
# - User moves over a link and then moves it away (no popup)
# - User hovers over a link causing a bubble and then moves it away (delayed close to handle next case)
# - User hovers over a link causing a bubble and then moves it over the bubble (the bubble should not disappear)
# - User moves over a link and then clicks inside it (bubble shows up immediately and should not disappear)
# - User clicks on a link (or moves into it with the cursor) and then clicks/moves elsewhere (bubble should pop up immediately and close immediately)

define [ 'aloha', 'jquery', './link', './figure', './title-figcaption' ], (Aloha, jQuery, linkConfig, figureConfig, figcaptionConfig) ->

  # Monkeypatch the bootstrap Popover so we can inject clickable buttons
  if true  
    Bootstrap_Popover_show = () ->
      if @hasContent() and @enabled
        $tip = @tip()
        @setContent()
        $tip.addClass "fade"  if @options.animation
        placement = (if typeof @options.placement is "function" then @options.placement.call(this, $tip[0], @$element[0]) else @options.placement)
        inside = /in/.test(placement)
        # Start: Don't remove because then you lose all the events attached to the content of the tip
        #$tip.remove()
        # End: changes
        $tip.css(
          top: 0
          left: 0
          display: "block"
        ).appendTo (if inside then @$element else document.body)
        pos = @getPosition(inside)
        actualWidth = $tip[0].offsetWidth
        actualHeight = $tip[0].offsetHeight
        switch (if inside then placement.split(" ")[1] else placement)
          when "bottom"
            tp =
              top: pos.top + pos.height
              left: pos.left + pos.width / 2 - actualWidth / 2
          when "top"
            tp =
              top: pos.top - actualHeight
              left: pos.left + pos.width / 2 - actualWidth / 2
          when "left"
            tp =
              top: pos.top + pos.height / 2 - actualHeight / 2
              left: pos.left - actualWidth
          when "right"
            tp =
              top: pos.top + pos.height / 2 - actualHeight / 2
              left: pos.left + pos.width
        $tip.css(tp).addClass(placement).addClass "in"
    
    # Apply the monkey patch 
    monkeyPatch = () ->
      console && console.warn('Monkey patching Bootstrap popovers so the buttons in them are clickable')
      proto = jQuery('<div></div>').popover({}).data('popover').constructor.prototype
      proto.show = Bootstrap_Popover_show
    monkeyPatch()
  

  helpers = []
  class Helper
    constructor: (cfg) ->
        # @selector
        # @populator
        # @filter
        # @placement
        # @noHover
        jQuery.extend(@, cfg)
    start: (editable) ->
        that = @
        $el = jQuery(editable.obj)

        MILLISECS = 1200
        delayTimeout = ($self, eventName, ms=MILLISECS, hovered) ->
          return setTimeout(() ->
            if hovered?
              $self.data('aloha-bubble-hovered', hovered)
            $self.popover(eventName)
          , ms)

        makePopover = ($node, placement) ->
            $node.popover
                placement: placement or 'bottom'
                trigger: 'manual'
                content: () ->
                    that.populator.bind(jQuery(@))()
            # Custom event to open the bubble used by setTimeout below
            $node.on 'shown', @selector, (evt) ->
              $n = jQuery(@)
              clearTimeout($n.data('aloha-bubble-openTimer'))
            
            $node.on 'hidden', @selector, () ->
              $n = jQuery(@)
              $n.data('aloha-bubble-hovered', false)
        
        makePopover($el.find(@selector), @placement)
        that = this

        # The only reason I map mouseenter is so I can catch new elements that are added to the DOM
        $el.on 'mouseenter.bubble', @selector, () ->
            $node = jQuery(@)
            if not $node.data('popover')
                makePopover($node, that.placement)

            if not that.noHover
                $node.data('aloha-bubble-openTimer', delayTimeout($node, 'show', MILLISECS, true, afterShow)) # true=hovered
                $node.one 'mouseleave.bubble', () ->
                  clearTimeout($node.data('aloha-bubble-openTimer'))
                  if $node.data('aloha-bubble-hovered')
                    # You have 500ms to move from the tag in the DOM to the popover.
                    # If the mouse enters the popover then cancel the 'hide'
                    $tip = $node.data('popover').$tip
                    if $tip
                      $tip.on 'mouseenter', () ->
                        clearTimeout($node.data('aloha-bubble-closeTimer'))
                      $tip.on 'mouseleave', () ->
                        $node.data('aloha-bubble-closeTimer', delayTimeout($node, 'hide', MILLISECS / 2, false, afterHide))
    
                    $node.data('aloha-bubble-closeTimer', delayTimeout($node, 'hide', MILLISECS / 2, false, afterHide))
    stop: (editable) ->
      # Remove all events and close all bubbles
      jQuery(editable.obj).undelegate(@selector, '.bubble')
      $nodes = jQuery(editable.obj).find(@selector)
      $nodes.data('aloha-bubble-el', null)
      $nodes.data('aloha-bubble-openTimer', 0)
      $nodes.data('aloha-bubble-closeTimer', 0)
      $nodes.data('aloha-bubble-hovered', false)
      $nodes.popover('destroy')
	
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
    if Aloha.activeEditable? #HACK things like math aren't SelectionEditable but we still want a popup: Aloha.Selection.isSelectionEditable() and Aloha.activeEditable?
      foundMarkup = findMarkup(rangeObject, filter)
      enteredLinkScope = foundMarkup
    enteredLinkScope

  bindHelper = (cfg) ->
    helper = new Helper(cfg)
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
          insideScope = enteredLinkScope
          $el = jQuery(rangeObject.getCommonAncestorContainer())
          if enteredLinkScope
            $el.data('aloha-bubble-hovered', false)
            $el.popover 'show'
            afterShow($el)
            $el.off('.bubble')
            helper.focus.bind($el[0])($el.data('popover').$tip) if helper.focus
          if $el[0] # HACK: not sure why, but selectionChanged occurs twice on uneditable math
            nodes = jQuery(Aloha.activeEditable.obj).find(helper.selector)
            nodes = nodes.not($el)
            helper.blur.bind(nodes)($el.data('popover').$tip) if helper.blur
            nodes.popover 'hide'
            afterHide(nodes)

  bindHelper linkConfig
  bindHelper figureConfig
  bindHelper figcaptionConfig

  return {
    register: (cfg) ->
      bindHelper(new Helper(cfg))
  }
