# Aloha Link Plugin
# * -----------------
# * This plugin provides a bubble next to a link when it is selected
# 
define ['aloha', 'jquery', 'aloha/console'], (Aloha, jQuery, console) ->
  
  selector = 'figure'
  filter = ->
    @nodeName.toLowerCase() is 'figure' or jQuery(@).parents('figure')[0]

  # TODO: Convert the mousedown to a click. To do that the aloha-deactivated event need to not hide the bubbles yet and instead fire a 'hide' event
  populator = ($bubble) ->
      $el = @
      $bubble = jQuery('<div class="figure-popover"></div>')
      # Buttons to add/remove a title/caption
      if $el.children('.title')[0]
        $button = jQuery('<a href="javascript:void">Remove Title</a>')
        $button.on 'mousedown', () -> $el.children('.title').remove()
        $bubble.append($button)
      else
        $button = jQuery('<a href="javascript:void">Add Title</a>')
        $button.on 'mousedown', () ->
          newTitle = jQuery('<div class="title aloha-optional aloha-empty">Insert Title Here</div>')
          $el.prepend(newTitle)
        $bubble.append($button)
      
      separator = jQuery('<span class="separator"> | </span>')
      $bubble.append(separator)
      
      if $el.children('figcaption')[0]
        $button = jQuery('<a href="javascript:void">Remove Caption</a>')
        $button.on 'mousedown', () -> $el.children('figcaption').remove()
        $bubble.append($button)
      else
        $button = jQuery('<a href="javascript:void">Add Caption</a>')
        $button.on 'mousedown', () ->
          newCaption = jQuery('<figcaption class="aloha-optional aloha-empty">Insert Caption Here</figcaption>')
          $el.append(newCaption)
        $bubble.append($button)
      
      $bubble.contents()



  return {
    selector: selector
    populator: populator
    filter: filter
  }