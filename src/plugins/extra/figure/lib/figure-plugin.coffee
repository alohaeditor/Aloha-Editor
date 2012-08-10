define [ "aloha", "aloha/plugin", 'block/block', "block/blockmanager", 'ui/ui' ], (Aloha, Plugin, block, BlockManager, Ui, i18n, i18nCore) -> 


  ###
   Monkey patch a couple of things in Aloha so figures can be draggable blocks
  ###
  block.AbstractBlock.prototype._postProcessElementIfNeeded = () ->
    @createEditablesIfNeeded()
    @_checkThatNestedBlocksAreStillConsistent()
    @_makeNestedBlockCollectionsSortable()

    @renderBlockHandlesIfNeeded();
    if (@isDraggable() and @$element[0].tagName.toLowerCase() == 'span')
      @_setupDragDropForInlineElements()
      @_disableUglyInternetExplorerDragHandles()
    #  PHIL Hack so figures are treated like DIV's (the next line is changed)
    else if (@isDraggable())
      this._setupDragDropForBlockElements()
      this._disableUglyInternetExplorerDragHandles()

  BlockManager._blockify = (element, instanceDefaults) ->
    $element = jQuery(element)

    tagName = $element[0].tagName.toLowerCase()
    #if (tagName != 'span' and tagName != 'div')
      # PHIL Aloha.Log.error('block/blockmanager', 'Blocks can only be created from <div> or <span> element. You passed ' + tagName + '.');
      # PHIL return;

    attributes = @getConfig($element, instanceDefaults)

    if (not @blockTypes.has(attributes['aloha-block-type']))
      Aloha.Log.error('block/blockmanager', 'Block Type ' + attributes['aloha-block-type'] + ' not found!')
      return

    block = new (@blockTypes.get(attributes['aloha-block-type']))($element)
    block.$element.addClass('aloha-block-' + attributes['aloha-block-type'])
    jQuery.each(attributes, (k, v) ->
      block._setAttribute(k, v)
    )

    # Register block
    @blocks.register(block.getId(), block)


  ###
   register the plugin with unique name
  ###
  Plugin.create "figure",
    init: ->

      Ui.adopt 'insertFigure', {isInstance:()-> false},
        tooltip: 'Create Figure'
        click: (evt) ->
          console.log 'sdkjfh'
          markup = jQuery("<figure><span class='media'><img src='#{Aloha.getPluginUrl('image')}/img/blank.jpg'/></span><figcaption>Enter Caption Here</figcaption></figure>")
          rangeObject = Aloha.Selection.getRangeObject()
          GENTICS.Utils.Dom.insertIntoDOM(markup, rangeObject, jQuery(Aloha.activeEditable.obj))
          markup.alohaBlock({'aloha-block-type': 'FigureBlock'})
          initializeFigures markup

      FigureBlock = block.AbstractBlock.extend
        title: 'Image'
        init: ($element, postProcessFn) ->
          # By default blocks are not editable
          $element.contentEditable(true)
          this.attr('image', $element.find('img').attr('src'))
          postProcessFn()
        update: ($element, postProcessFn) ->
          if this.attr('position') == 'right'
            $element.css 'float', 'right'
          else if this.attr('position') == 'left'
            $element.css 'float', 'left'
          else
            $element.css 'float', ''
    
          $element.find('img').attr('src', this.attr('image'))
          postProcessFn()
        _onElementClickHandler: () ->
          console.log 'Ignoring figure click'
        
        _preventSelectionChangedEventHandler: (evt) ->
          console.log 'Ignoring figure mousedown/focus/something'
          window.setTimeout (() -> jQuery(this).trigger( 'focus' )), 1


      BlockManager.registerBlockType('FigureBlock', FigureBlock)

      initializeFigures = ($figures) ->
        # $figures.find('figcaption').aloha()

        $figures.find('figcaption').on 'dblclick', () ->
          dialog = $('<div></div>')
          captionArea = $('<div></div>').appendTo(dialog)
          captionArea[0].innerHTML = @.innerHTML
          caption = $(@)
          figure = caption.parent()
          dialog.dialog
            close: () ->
              captionArea.mahalo()
              caption[0].innerHTML = captionArea[0].innerHTML
              
          captionArea.aloha()

        # register drop handlers to store the dropped file as a data URI
        $figures.find('img').on 'drop', (dropEvent) ->
          img = jQuery(dropEvent.target)
          dropEvent.preventDefault()
          
          readFile = (file) ->
            if file?
              [majorType, minorType] = file.type.split("/")
              reader = new FileReader()
              if majorType == "image"
                reader.onload = (loadEvent) ->
                  img.attr 'src', loadEvent.target.result
                reader.readAsDataURL(file)

          if (dt = dropEvent.originalEvent.dataTransfer)?
            if 'Files' in dt.types
              readFile dt.files[0]

      initializeEditable = ($editable) ->
        initializeFigures $editable.find('figure:not(.aloha-block)').alohaBlock({'aloha-block-type': 'FigureBlock'})

      for editable in Aloha.editables
        initializeEditable editable.obj

      Aloha.bind 'aloha-editable-created', ($event, editable) ->
        initializeEditable editable.obj

      #Aloha.bind 'aloha-editable-destroyed', ($event, editable) ->
      #  block.$element

    ###
     toString method
    ###
    toString: ->
      "figure"