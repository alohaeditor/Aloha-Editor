# Aloha Title and figcaption Plugin
# * -----------------
# * This plugin provides a bubble next to a title and figcaption when it is selected
#
define ['aloha', 'jquery', 'aloha/console', 'css!./title-figcaption.css'], (Aloha, jQuery, console) ->

  buildTitle = ($el, content=null) ->
    $el.text('')
    if content and content[0]
      $el.append(content)
    else
      $el.addClass('empty')

  selector = '.title,figcaption'

  populator = ($el) ->
      # When a click occurs, the activeEditable is cleared so squirrel it
      editable = Aloha.activeEditable
      $bubble = jQuery '<button class="btn btn-danger"><i class="icon-remove icon-white"></i> Remove</button>'

      deleteBtn = $bubble.on 'click', () ->
        $el.text('')
        $el.removeClass('focus')
        $el.addClass('empty')
      $bubble


  return {
    hover: true
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
