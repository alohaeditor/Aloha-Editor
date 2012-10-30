# How this plugin is structured:
# link.coffee (and eventually others like image, figure, exercise, etc) provides the following config:
# - selector: css selector for determining which elements to attach bubble events to
# - populator: Javscript function that gets (a) the element and (b) the div that represents the bubble.
#               This function will populate the bubble with buttons like "Add Title", "Change", etc

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

###
----------------------
 State Machine
----------------------

(*) Denotes the initial State
(S) Denotes the "selected" State (when the cursor is in the element)
$el is the element (link, figure, title)
$tip is the popover element (tooltip)

There are 3 variables that are stored on each element;
[ isOpened, null/timer, isSelected ]


(*) [closed, _, _]
    |   |
    |   | (select via keyboard (left/right/up/down))
    |   |
    |   \----> (S) [opened, _, selected]
    |           |   |
    |           |   | (click elsewhere (not $el/$tip)
    |           |   |
    |           |   \----> [closed, _, _]
    |           |
    |           | ($el/$tip.mouseenter)
    |           |
    |           \----> Nothing happens (unlike the other mouseenter case)
    |
    | ($el.mouseenter)
    |
    \----> [closed, timer, _] (waiting to show the popoup)
            |   |
            |   | ($el.mouseleave)
            |   |
            |   \----> (*)
            |
            | (... wait some time)
            |
            \----> [opened, _, _] (hover popup displayed)
                    |   |
                    |   | (select via click or keyboard)
                    |   |
                    |   \---> (S) [opened, _, selected]
                    |
                    | ($el.mouseleave)
                    |
                    \----> [opened, timer, _] (mouse has moved away from $el but the popup hasn't disappeared yet) (POSFDGUOFDIGU)
                            |   |
                            |   | (... wait some time)
                            |   |
                            |   \---> (*) [closed, _, _]
                            |
                            | ($tip.mouseenter)
                            |
                            \---> (TIP) [opened, _, _]
                                    |
                                    | ($tip.mouseleave)
                                    |
                                    \---> [opened, timer, _]
                                            |   |
                                            |   | (... wait some time)
                                            |   |
                                            |   \----> (*) [closed, _, _]
                                            |
                                            \---> (TIP)

###

define [ 'aloha', 'jquery', 'bubble/link', 'bubble/figure', 'bubble/title-figcaption' ], (Aloha, jQuery, linkConfig, figureConfig, figcaptionConfig) ->

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
              top: pos.top - actualHeight - 10 # minus 10px for the arrow
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

        ### Trigger the shown event ###
        @$element.trigger('shown-popover')
    
    Bootstrap_Popover_hide = (originalHide) -> () ->
        originalHide.bind(this)()
        @$element.trigger('hidden-popover')
    
    # Apply the monkey patch 
    monkeyPatch = () ->
      console && console.warn('Monkey patching Bootstrap popovers so the buttons in them are clickable')
      proto = jQuery('<div></div>').popover({}).data('popover').constructor.prototype
      proto.show = Bootstrap_Popover_show
      proto.hide = Bootstrap_Popover_hide(proto.hide)
    monkeyPatch()
  

  helpers = []
  class Helper
    constructor: (cfg) ->
        # @selector
        # @populator
        # @placement
        # @noHover
        jQuery.extend(@, cfg)
        if @focus or @blur
          console and console.warn 'Popover.focus and Popover.blur are deprecated in favor of listening to the "shown-popover" or "hidden-popover" events on the original DOM element'

    _makePopover: ($node) ->
        that = @
        # Make sure we don't create more than one popover for an element.
        if not $node.data('popover')
            $node.popover
                placement: that.placement or 'bottom'
                trigger: 'manual'
                content: () ->
                    that.populator.bind($node)($node) # Can't quite decide whether the populator code should use @ or the 1st arg.

    start: (editable) ->
        that = @
        $el = jQuery(editable.obj)

        afterShow = ($n) ->
          clearTimeout($n.data('aloha-bubble-openTimer'))
          
        afterHide = ($n) ->
          $n.data('aloha-bubble-selected', false)

        MILLISECS = 2000
        delayTimeout = ($self, eventName, ms=MILLISECS, after=null) ->
          return setTimeout(() ->
            $self.popover(eventName)
            $self.removeData('aloha-bubble-openTimer')
            $self.removeData('aloha-bubble-closeTimer')
            if after
                after.bind($self)($self)
          , ms)

        makePopovers = ($nodes, placement) ->
            $nodes.each () ->
                $node = jQuery(@)
                if that.focus
                    $node.on 'shown-popover', () ->
                        that.focus.bind($node[0])($node.data('popover').$tip)
                if that.blur
                    $node.on 'hidden-popover', () ->
                        that.blur.bind($node[0])()
                that._makePopover($node)
        
        makePopovers($el.find(@selector), @placement)
        that = this

        # The only reason I map mouseenter is so I can catch new elements that are added to the DOM
        $el.on 'mouseenter.bubble', @selector, () ->
            $node = jQuery(@)
            clearTimeout($node.data('aloha-bubble-closeTimer'))
            if not $node.data('popover')
                makePopovers($node, that.placement)

            if not that.noHover
                $node.data('aloha-bubble-openTimer', delayTimeout($node, 'show', MILLISECS, afterShow)) # true=hovered
                $node.one 'mouseleave.bubble', () ->
                  clearTimeout($node.data('aloha-bubble-openTimer'))
                  if not $node.data('aloha-bubble-selected')
                    # You have 500ms to move from the tag in the DOM to the popover.
                    # If the mouse enters the popover then cancel the 'hide'
                    $tip = $node.data('popover').$tip
                    if $tip
                      $tip.on 'mouseenter', () ->
                        clearTimeout($node.data('aloha-bubble-closeTimer'))
                      $tip.on 'mouseleave', () ->
                        $node.data('aloha-bubble-closeTimer', delayTimeout($node, 'hide', MILLISECS / 2, afterHide)) if not $node.data('aloha-bubble-closeTimer')
    
                    $node.data('aloha-bubble-closeTimer', delayTimeout($node, 'hide', MILLISECS / 2, afterHide)) if not $node.data('aloha-bubble-closeTimer')
    stop: (editable) ->
      # Remove all events and close all bubbles
      jQuery(editable.obj).undelegate(@selector, '.bubble')
      $nodes = jQuery(editable.obj).find(@selector)
      $nodes.removeData('aloha-bubble-openTimer', 0)
      $nodes.removeData('aloha-bubble-closeTimer', 0)
      $nodes.removeData('aloha-bubble-selected', false)
      $nodes.popover('destroy')
	
  findMarkup = (range=Aloha.Selection.getRangeObject(), selector) ->
    if Aloha.activeEditable
      filter = () ->
        $el = jQuery(@)
        $el.is(selector) or $el.parents(selector)[0]
      range.findMarkup filter, Aloha.activeEditable.obj
    else
      null

  # Validate and save the href if something is selected.
  selectionChangeHandler = (rangeObject, selector) ->
    enteredLinkScope = false
    
    # Check if we need to ignore this selection changed event for
    # now and check whether the selection was placed within a
    # editable area.
    if Aloha.activeEditable? #HACK things like math aren't SelectionEditable but we still want a popup: Aloha.Selection.isSelectionEditable() and Aloha.activeEditable?
      foundMarkup = findMarkup(rangeObject, selector)
      enteredLinkScope = foundMarkup
    enteredLinkScope

  bindHelper = (cfg) ->
    helper = new Helper(cfg)

    afterShow = ($n) ->
      clearTimeout($n.data('aloha-bubble-openTimer'))
      
    afterHide = ($n) ->
      $n.data('aloha-bubble-selected', false)

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
      # Hide all popovers except for the current one maybe?
      $el = jQuery(rangeObject.getCommonAncestorContainer())
      $el = $el.parents(helper.selector) if not $el.is(helper.selector)

      # Hide other tooltips of the same type
      nodes = jQuery(Aloha.activeEditable.obj).find(helper.selector)
      nodes = nodes.not($el)
      nodes.popover 'hide'
      afterHide(nodes)
      
      if Aloha.activeEditable
        enteredLinkScope = selectionChangeHandler(rangeObject, helper.selector)
        if insideScope isnt enteredLinkScope
          insideScope = enteredLinkScope
          if not $el.is(helper.selector)
            $el = $el.parents(helper.selector)
          if enteredLinkScope
            $el.data('aloha-bubble-selected', true)
            helper._makePopover($el)
            $el.popover 'show'
            $el.data('aloha-bubble-selected', true)
            afterShow($el)
            $el.off('.bubble')
            event.stopPropagation()

  bindHelper linkConfig
  bindHelper figureConfig
  bindHelper figcaptionConfig

  return {
    register: (cfg) ->
      bindHelper(new Helper(cfg))
  }
