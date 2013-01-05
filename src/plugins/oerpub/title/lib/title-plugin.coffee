define [
  'aloha',
  'aloha/plugin',
  'jquery',
  'block/block',
  'block/blockmanager',
  'aloha/ephemera'
], (
  Aloha,
  Plugin,
  $,
  Block,
  BlockManager,
  Ephemera
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
        if editable.obj.is('.title-editor')
          # Glue key handler to title editor. Remove the old handler, this
          # editor does not care for all those other handlers
          editable.obj.off('keydown').on 'keydown', null, 'return', (e) ->
            e.preventDefault()
            $p = $('<p><br /></p>')
            # our parent is the title div
            editable.obj.parent().after($p)

            # Focus new paragraph
            range = document.createRange();
            range.setStart($p[0], 0);
            range.setEnd($p[0], 0);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);

            # Let aloha know what we've done
            r = new GENTICS.Utils.RangeObject()
            r.update()
            Aloha.Selection.rangeObject = r
            false

    toString: ->
      "title"
