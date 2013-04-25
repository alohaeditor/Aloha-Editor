define ['aloha', 'jquery', 'ui/ui', 'PubSub'], (Aloha, $, Ui, PubSub) ->
  Aloha.require ['list/list-plugin'], (ListPlugin) ->
    Aloha.bind 'aloha-editable-created', () ->
      # Start out as disabled
      ListPlugin._indentListButton.enable(false)
      ListPlugin._outdentListButton.enable(false)

    PubSub.sub 'aloha.selection.context-change', (message) ->
      rangeObject = message.range
      for effectiveMarkup in rangeObject.markupEffectiveAtStart
        if Aloha.Selection.standardTagNameComparator(effectiveMarkup, jQuery('<ul></ul>')) or Aloha.Selection.standardTagNameComparator(effectiveMarkup, jQuery('<ol></ol>'))
          depth = $(rangeObject.commonAncestorContainer).parentsUntil(
            Aloha.activeEditable.obj, 'li').andSelf().length

          $item = jQuery(rangeObject.commonAncestorContainer)

          # Top most list, you can only indent if you're not the top-most
          # item in the top-most list
          if $item.is('li') and $item.index() > 0
            ListPlugin._indentListButton.enable(true)

          # If this item is nested deeper than top, we can outdent
          if depth > 1
            ListPlugin._outdentListButton.enable(true)
        else
          ListPlugin._indentListButton.enable(false)
          ListPlugin._outdentListButton.enable(false)
