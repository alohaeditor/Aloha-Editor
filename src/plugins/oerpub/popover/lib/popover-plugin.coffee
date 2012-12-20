# How this plugin is structured:
# link.coffee (and eventually others like image, figure, exercise, etc) provides the following config:
# - selector: css selector for determining which elements to attach bubble events to
# - populator: Javscript function that gets (a) the element and (b) the div that represents the bubble.
#               This function will populate the bubble with buttons like "Add Title", "Change", etc
# - helper: This member will be set when you register your bubble with
#           register/bindHelper. Don't use it for something else.

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

(STATE_*) Denotes the initial State
(STATE_S) Denotes the "selected" State (when the cursor is in the element)
$el is the element (link, figure, title)
$tip is the popover element (tooltip)

There are 3 variables that are stored on each element;
[ isOpened, null/timer, isSelected ]


(STATE_*) [closed, _, _]
    |   |
    |   | (select via keyboard (left/right/up/down))
    |   |
    |   \----> (STATE_S) [opened, _, selected]
    |           |   |
    |           |   | (click elsewhere (not $el/$tip)
    |           |   |
    |           |   \----> (STATE_C) [closed, _, _]
    |           |
    |           | ($el/$tip.mouseenter)
    |           |
    |           \----> Nothing happens (unlike the other mouseenter case)
    |
    | ($el.mouseenter)
    |
    \----> (STATE_WC) [closed, timer, _] (waiting to show the popoup)
            |   |
            |   | ($el.mouseleave)
            |   |
            |   \----> (STATE_*)
            |
            | (... wait some time)
            |
            \----> (STATE_O) [opened, _, _] (hover popup displayed)
                    |   |
                    |   | (select via click or keyboard)
                    |   |
                    |   \---> (STATE_S) [opened, _, selected]
                    |
                    | ($el.mouseleave)
                    |
                    \----> (STATE_WO) [opened, timer, _] (mouse has moved away from $el but the popup hasn't disappeared yet) (POSFDGUOFDIGU)
                            |   |
                            |   | (... wait some time)
                            |   |
                            |   \---> (STATE_*) [closed, _, _]
                            |
                            | ($tip.mouseenter)
                            |
                            \---> (STATE_TIP) [opened, _, _]
                                    |
                                    | ($tip.mouseleave)
                                    |
                                    \---> (STATE_WO) [opened, timer, _]
                                            |   |
                                            |   | (... wait some time)
                                            |   |
                                            |   \----> (STATE_*) [closed, _, _]
                                            |
                                            \---> (STATE_TIP) [opened, _, _]

###

define 'popover', [ 'aloha', 'jquery' ], (Aloha, jQuery) ->


  # This position code was refactored out because it is also used to move the
  # Popover when the document changes
  # Assumes @ is the Popover
  Bootstrap_Popover__position = ($tip) ->
      placement = (if typeof @options.placement is "function" then @options.placement.call(@, $tip[0], @$element[0]) else @options.placement)
      inside = /in/.test(placement)
      # Start: Don't remove because then you lose all the events attached to the content of the tip
      #$tip.remove()
      # End: changes
      if not $tip.parents()[0]
        $tip.appendTo (if inside then @$element else document.body)
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

      if tp.top < 0 or tp.left < 0
        placement = 'bottom'
        tp.top = pos.top + pos.height

      if tp.left < 0
        tp.left = 10 # so it's not right at the edge of the page

      $tip.css(tp).addClass(placement)

  # Monkeypatch the bootstrap Popover so we can inject clickable buttons
  Bootstrap_Popover_show = () ->
    if @hasContent() and @enabled
      $tip = @tip()
      @setContent()
      $tip.addClass "fade"  if @options.animation

      $tip.css(
        top: 0
        left: 0
        display: "block"
      )

      Bootstrap_Popover__position.bind(@)($tip)
      # TODO move the arrow if placement='top/bottom'

      $tip.addClass "in"

      ### Trigger the shown event ###
      @$element.trigger('shown-popover')

  Bootstrap_Popover_hide = (originalHide) -> () ->
      @$element.trigger('hide-popover')
      originalHide.bind(@)()
      @$element.trigger('hidden-popover')

  # There's a bug in bootstrap's destroy(). It says this.hide().$element.off(...)
  # But it should be this.hide().off(...)
  Bootstrap_Popover_destroy = () ->
    @hide().off('.' + @type).removeData(@type)

  # Apply the monkey patch
  monkeyPatch = () ->
    console && console.warn('Monkey patching Bootstrap popovers so the buttons in them are clickable')
    proto = jQuery.fn.popover.Constructor.prototype
    proto.show = Bootstrap_Popover_show
    proto.hide = Bootstrap_Popover_hide(proto.hide)
    proto.destroy = Bootstrap_Popover_destroy
  monkeyPatch()


  Popover =
    MILLISECS: 2000
    MOVE_INTERVAL: 100
    register: (cfg) -> bindHelper(new Helper(cfg))

  class Helper
    constructor: (cfg) ->
      # @selector
      # @populator
      # @placement
      # @hover - Show the popover when the user hovers over an element
      @hover = false
      jQuery.extend(@, cfg)
      if @focus or @blur
        console and console.warn 'Popover.focus and Popover.blur are deprecated in favor of listening to the "shown-popover" or "hide-popover" events on the original DOM element'

    startAll: (editable) ->
      $el = jQuery(editable.obj)

      delayTimeout = ($self, eventName, ms) ->
        return setTimeout(() ->
          $self.trigger eventName
        , ms)

      makePopovers = ($nodes) =>
        $nodes.each (i, node) =>
          $node = jQuery(node)
          if @focus
            $node.on 'shown-popover', =>
              @focus.bind($node[0])($node.data('popover').$tip)
          if @blur
            $node.on 'hide-popover', =>
              @blur.bind($node[0])($node.data('popover').$tip)

          # Make sure we don't create more than one popover for an element.
          if not $node.data('popover')
            $node.popover
              html: true # bootstrap changed the default for this config option so set it to HTML
              placement: @placement or 'bottom'
              trigger: 'manual'
              content: =>
                @populator.bind($node)($node, @) # Can't quite decide whether the populator code should use @ or the 1st arg.

      $el.on 'show', @selector, (evt) =>
        $node = jQuery(evt.target)
        movePopover = () ->
          that = $node.data('popover')
          if that and that.$tip
            Bootstrap_Popover__position.bind(that)(that.$tip)

        clearTimeout($node.data('aloha-bubble-timer'))
        $node.removeData('aloha-bubble-timer')
        if not $node.data('aloha-bubble-visible')
          # If the popover data hasn't been configured yet then configure it
          makePopovers($node)
          $node.popover 'show'
          if @markerclass
            $node.data('popover').$tip.addClass(@markerclass)
          $node.data('aloha-bubble-visible', true)
        # As long as the popover is open  move it around if the document changes ($el updates)
        clearInterval($node.data('aloha-bubble-move-timer'))
        $node.data('aloha-bubble-move-timer', setInterval(movePopover, Popover.MOVE_INTERVAL))
      $el.on 'hide', @selector, (evt) =>
        $node = jQuery(evt.target)
        clearTimeout($node.data('aloha-bubble-timer'))
        clearInterval($node.data('aloha-bubble-move-timer'))
        $node.removeData('aloha-bubble-timer')
        $node.data('aloha-bubble-selected', false)
        if $node.data('aloha-bubble-visible')
          $node.popover 'hide'
          $node.removeData('aloha-bubble-visible')

      # The only reason I map mouseenter is so I can catch new elements that are added to the DOM
      $el.on 'mouseenter.bubble', @selector, (evt) =>
        $node = jQuery(evt.target)
        clearInterval($node.data('aloha-bubble-timer'))

        if @hover
          ## (STATE_*) -> (STATE_WC)
          $node.data('aloha-bubble-timer', delayTimeout($node, 'show', Popover.MILLISECS)) ## (STATE_WC) -> (STATE_O)
          $node.on 'mouseleave.bubble', =>
            if not $node.data('aloha-bubble-selected')
              # You have 500ms to move from the tag in the DOM to the popover.
              # If the mouse enters the popover then cancel the 'hide'
              try
                $tip = $node.data('popover').$tip
              catch err
                $tip = null
              if $tip
                $tip.on 'mouseenter', =>
                  ## (STATE_WO) -> (STATE_TIP)
                  clearTimeout($node.data('aloha-bubble-timer'))
                $tip.on 'mouseleave', =>
                  clearTimeout($node.data('aloha-bubble-timer'))
                  if not $node.data('aloha-bubble-selected')
                    $node.data('aloha-bubble-timer', delayTimeout($node, 'hide', Popover.MILLISECS / 2)) ## (STATE_WO) -> (STATE_*)

              $node.data('aloha-bubble-timer', delayTimeout($node, 'hide', Popover.MILLISECS / 2)) if not $node.data('aloha-bubble-timer')
    stopAll: (editable) ->
      # Remove all events and close all bubbles
      jQuery(editable.obj).undelegate(@selector, '.bubble')
      $nodes = jQuery(editable.obj).find(@selector)
      $nodes.removeData('aloha-bubble-timer')
      $nodes.removeData('aloha-bubble-selected')
      $nodes.popover('destroy')

    stopOne: ($nodes) ->
      $nodes.removeData('aloha-bubble-timer')
      $nodes.removeData('aloha-bubble-selected')
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
    # Place the created helper back onto the registering module, so we might
    # locate it later
    $.extend(cfg, helper: helper)

    # These are reset when the editor is deactivated
    insideScope = false
    enteredLinkScope = false

    Aloha.bind 'aloha-editable-activated', (event, data) ->
      helper.startAll(data.editable)
    Aloha.bind 'aloha-editable-deactivated', (event, data) ->
      helper.stopAll(data.editable)
      insideScope = false
      enteredLinkScope = false

    Aloha.bind 'aloha-selection-changed', (event, rangeObject) ->
      # Hide all popovers except for the current one maybe?
      $el = jQuery(rangeObject.getCommonAncestorContainer())
      $el = $el.parents(helper.selector) if not $el.is(helper.selector)

      # Hide other tooltips of the same type
      nodes = jQuery(Aloha.activeEditable.obj).find(helper.selector)
      nodes = nodes.not($el)
      nodes.trigger 'hide'

      if Aloha.activeEditable
        enteredLinkScope = selectionChangeHandler(rangeObject, helper.selector)
        if insideScope isnt enteredLinkScope
          insideScope = enteredLinkScope
          if not $el.is(helper.selector)
            $el = $el.parents(helper.selector)
          if enteredLinkScope
            $el.trigger 'show'
            $el.data('aloha-bubble-selected', true)
            $el.off('.bubble')
            event.stopPropagation()

    return helper

  return Popover
