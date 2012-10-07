define [ "aloha", "jquery", "css!bubble/css/bubble.css" ], (Aloha, jQuery) ->

  ############## Defines 1 type of bubble (popup box) ############
  
  $nodes = jQuery('.document a')
  
  displayer = ($el, $bubble) ->
    # $el is something like the <a href="http://..."></a>
    # $bubble is the div that you can put stuff in like "Change, Remove"
    $bubble.append "ADSKJFH"
  
  
  #############  The bubble pseudo code follows #############
  
  window.makeBubbler = makeBubbler = ($nodes, displayer, placement) ->
    canvas = jQuery('body') # Where these bubbles get appended
    MILLISECS = 1000
    
    $bubble = null # Scoped here because it's used in makeBubble and the 'mouseleave' event
    localBubble = null
    timeoutId = null # Scoped here because it's set in 'mouseenter' and used in 'mouseleave'
    
    makeBubble = (evt, displayer, placement={vertical:'below', horizontal:'start'}) ->
      # placement = {
      #   vertical: 'below/above'    # 'above'  requires rendering the displayer 1st
      #   horizontal: 'start/center' # 'center' requires rendering the displayer 1st
      placement.vertical   = placement.vertical   or 'below'
      placement.horizontal = placement.horizontal or 'start'
      $el = jQuery(evt.currentTarget)
      $bubble = jQuery('<div class="bubble"></div>').appendTo(canvas)
      localBubble = $bubble # HACK to hide it later
      displayer($el, $bubble)
    
      # Move the bubble
      offset = $el.offset()
      offset.position = 'absolute'
      switch placement.vertical
        when 'below' then offset.top = offset.top + $el.outerHeight()
        when 'above' then offset.top = offset.top - $bubble.outerHeight()
        else console.error 'Invalid vertical placement'
      switch placement.horizontal
        when 'start' then
        when 'center'
          if $el.outerWidth() > $bubble.outerWidth()
            offset.left = offset.left + ($el.outerWidth() - $bubble.outerWidth()) / 2
        else console.error 'Invalid horizontal placement'
    
      $bubble.css(offset)
      
      $bubble.on 'mouseleave', () -> $bubble.remove()
    
    $nodes.on 'mouseenter', (evt) ->
      clearTimeout(timeoutId) if timeoutId
      $bubble.remove() if $bubble # TODO: Allow more than one bubble at a time?
      makeBubbleTimeout = () -> makeBubble(evt, displayer, placement)
      timeoutId = setTimeout(makeBubbleTimeout, MILLISECS)
    $nodes.on 'click', () ->
      timeoutId = null
      $bubble = null # HACK so the only thing that can destroy the bubble popup is a selection change
    $nodes.on 'mouseleave', () ->
      clearTimeout(timeoutId)
      timeoutId = null
      #$bubble.remove() if $bubble # TODO: Need to only remove when mouse leaves $nodes _OR_ $bubble
    
    # TODO: Aloha.bind 'selection-changed??', close bubble if tag changed not always
    Aloha.bind 'aloha-selection-changed', (event, rangeObject) ->
      clearTimeout(timeoutId)
      timeoutId = null
      localBubble.remove() if localBubble # TODO: Need to only remove when mouse leaves $nodes _OR_ $bubble

  return makeBubbler