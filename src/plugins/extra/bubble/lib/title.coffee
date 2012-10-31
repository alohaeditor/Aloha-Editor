# Aloha Link Plugin
# * -----------------
# * This plugin provides a bubble next to a link when it is selected
# 
define ['aloha', 'jquery', 'aloha/console', 'css!./title.css'], (Aloha, jQuery, console) ->

  buildTitle = ($el, content=null) ->
    $el.text('')
    if content and content[0]
      $el.append(content)
    else
      $el.addClass('empty')
  
  selector = '.title,figcaption'

  populator = () ->
      $el = @
      # When a click occurs, the activeEditable is cleared so squirrel it
      editable = Aloha.activeEditable
      $bubble = jQuery '<button class="btn btn-danger action-delete"><i class="icon-ban-circle icon-white"></i> Remove</button>'
      
      deleteBtn = $bubble.on 'click', () ->
        $el.text('')
        $el.removeClass('focus')
        $el.addClass('empty')
      $bubble


  return {
    selector: selector
    populator: populator
    placement: 'right'
    focus: () ->
      $el = jQuery(@)
      $el.addClass('focus')
      $el.removeClass('empty')
    blur:  () ->
      $el = jQuery(@)
      $el.removeClass('focus')
      if not $el.text()
        $el.addClass('empty')
  }