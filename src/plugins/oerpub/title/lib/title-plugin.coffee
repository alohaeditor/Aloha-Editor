define [
  'aloha',
  'aloha/plugin',
  'jquery',
  'block/block',
  'block/blockmanager',
  'aloha/ephemera',
  'util/strings'
], (
  Aloha,
  Plugin,
  $,
  Block,
  BlockManager,
  Ephemera,
  Strings
) ->
  Ephemera.classes('aloha-block', 'aloha-block-handle', 'aloha-block-TitleBlock', 'aloha-block-active', 'aloha-block-highlighted')
  Ephemera.attributes('data-aloha-block-type', 'contenteditable')
  Plugin.create "title",
    init: ->
      TitleBlock = Block.AbstractBlock.extend
        title: 'Title'
        init: ($element, postProcessFn) ->
          $element.wrapInner('<div class="title-editor aloha-editable" />')
          postProcessFn()
        update: ($element, postProcessFn) ->
          postProcessFn()
        renderBlockHandlesIfNeeded: () ->
          # No need to render handles
      BlockManager.registerBlockType('TitleBlock', TitleBlock)

      # Add a prune function that cleans up the title editor
      emap = Ephemera.ephemera().pruneFns.push (node) ->
        $node = $(node)
        if $node.is('div.title')
          $node.text($node.find('.title-editor').text())
          return $node.get(0)
        node

      Aloha.bind 'aloha-editable-created', ($event, editable) ->
        editable.obj.find('div.title:not(.aloha-block)').alohaBlock('aloha-block-type': 'TitleBlock')

    toString: ->
      "title"
