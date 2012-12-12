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
          ListPlugin._indentListButton.enable(true)
          ListPlugin._outdentListButton.enable(true)
        else
          ListPlugin._indentListButton.enable(false)
          ListPlugin._outdentListButton.enable(false)
