define [ "aloha", "aloha/plugin", 'block/block', "block/blockmanager", 'ui/ui', 'aloha/ephemera', 'jquery', 'css!figure/css/figure.css' ], (Aloha, Plugin, block, BlockManager, Ui, Ephemera, $) ->


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
    @_hideDragHandlesIfDragDropDisabled()
    @_attachDropzoneHighlightEvents()


  # Register ephemerals. Some of these likely belong in the block plugin.
  Ephemera.classes('aloha-block', 'aloha-block-FigureBlock')
  Ephemera.attributes('data-aloha-block-type')

  ###
   register the plugin with unique name
  ###
  Plugin.create "figure",
    init: ->

      Ui.adopt 'insertFigure', {isInstance:()-> false},
        tooltip: 'Create Figure'
        click: (evt) ->
          console.log 'sdkjfh'
          markup = $("<figure><span class='media'><img src='#{Aloha.getPluginUrl('image')}/img/blank.jpg'/></span><figcaption>Enter Caption Here</figcaption></figure>")
          rangeObject = Aloha.Selection.getRangeObject()
          GENTICS.Utils.Dom.insertIntoDOM(markup, rangeObject, $(Aloha.activeEditable.obj))
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
          window.setTimeout (() -> $(this).trigger( 'focus' )), 1


      BlockManager.registerBlockType('FigureBlock', FigureBlock)

      initializeFigures = ($figures) ->
        # $figures.find('figcaption').aloha()

        $figures.on 'click', () ->
          dialog = $('<div class="x-figure"></div>')
          titleRow = $('<div class="title area"><span class="label">Title</span><span class="value"/></div>').appendTo dialog
          imageRow = $('<div class="image area"><span class="label">Image (drop a file to change)</span><span class="value"/></div>').appendTo dialog
          captionRow = $('<div class="caption area"><span class="label">caption</span><span class="value"/></div>').appendTo dialog
          
          figure = $(@)
          
          title = figure.children('.title')
          caption = figure.children('figcaption')
          images = figure.children(':not(.aloha-block-handle)').not(title).not(caption)

          editTitle = titleRow.children('.value')
          editTitle.append title.contents()
          editImage = imageRow.children('.value')
          editImage.append images
          editCaption = captionRow.children('.value')
          editCaption.append caption.contents()
          
          # editTitle.add(editImage).add(editCaption).aloha()
          dialog.find('.value').aloha()
          
          dialog.dialog
            buttons: { 'Close': () -> dialog.dialog('close') }
            close: () ->
              dialog.find('.value').mahalo()
              figure.contents().remove()
              # 4 cases for each element:
              # - It doesn't already exist and we don't need to do anything
              # - It doesn't already exist and we DO    need to ADD it
              # - It DOES    already exist and we DO    need to CHANGE it
              # - It DOES    already exist and we DO    need to REMOVE it
              appender = (parent, contents, elName='', cls='') ->
                if elName
                  el = $("<#{elName}></#{elName}>").appendTo(parent)
                  el.addClass(cls) if cls
                  el.append contents
                else
                  parent.append contents
              
              appender(figure, editTitle.contents(), 'span', 'title') if editTitle.text()
              appender(figure, editImage.contents()) if editImage.children().length
              appender(figure, editCaption.contents(), 'figcaption', '') if editCaption.text()

        # register drop handlers to store the dropped file as a data URI
        $figures.find('img').on 'drop', (dropEvent) ->
          img = $(dropEvent.target)
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
