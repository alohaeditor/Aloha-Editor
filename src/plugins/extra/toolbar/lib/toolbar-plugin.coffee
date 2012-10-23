# including "ui/settings" has weird side effects, namely most of the buttons don't load

define [ "aloha", "aloha/plugin", "ui/ui", "i18n!format/nls/i18n", "i18n!aloha/nls/i18n", "aloha/console", "css!toolbar/css/toolbar.css" ], (Aloha, Plugin, Ui, i18n, i18nCore) ->

  CONTAINER_JQUERY = jQuery('.toolbar')
  if CONTAINER_JQUERY.length == 0
    CONTAINER_JQUERY = jQuery('<div></div>').addClass('toolbar-container aloha').appendTo('body')
  
  ###
   register the plugin with unique name
  ###
  Plugin.create "toolbar",
    init: ->

      squirreledEditable = null

      # Initially disable all the buttons and only enable them when events are attached to them
      CONTAINER_JQUERY.find('.action').addClass(
        'disabled missing-a-click-event').on('click',
        (evt) -> evt.preventDefault())
      CONTAINER_JQUERY.find('a.action').parent().addClass(
        'disabled missing-a-click-event').on('click',
        (evt) -> evt.preventDefault())
      
      # Hijack the toolbar buttons so we can customize where they are placed.
      Ui.adopt = (slot, type, settings) ->
        $buttons = CONTAINER_JQUERY.find(".action.#{slot}")
        # Since each button was initially disabled, enable it
        #   also, sine actions in a submenu are an anchor tag, remove the "disabled" in the parent() <li>
        $buttons.add($buttons.parent()).removeClass('disabled missing-a-click-event')
        # This class adapts button functions Aloha expects to functions the appmenu uses
        class ItemRelay
          constructor: (@items) ->
          show: () -> $buttons.removeClass('hidden')
          hide: () -> #$buttons.addClass('hidden')
          setActive: (bool) ->
            $buttons.removeClass('active') if not bool
            $buttons.addClass('active') if bool
          setState: (bool) -> @setActive bool
          enable: (bool=true) ->
            # If it is a button, set the disabled attribute, otherwise find the
            # parent list item and set disabled on that.
            if $buttons.is('.btn')
              $buttons.attr('disabled', 'disabled') if !bool
              $buttons.attr('disabled', null) if bool
            else
              $buttons.parent().addClass('disabled') if !bool
              $buttons.parent().removeClass('disabled') if bool
          disable: () -> @enable(false)
          setActiveButton: (a, b) ->
            console.log "#{slot} TODO:SETACTIVEBUTTON:", a, b
          focus: (a) ->
            console.log "#{slot} TODO:FOCUS:", a
          foreground: (a) ->
            console.log "#{slot} TODO:FOREGROUND:", a

        # Remove any stale click handlers
        $buttons.off('click')
        $buttons.on 'click', (evt) ->
          evt.preventDefault()
          Aloha.activeEditable = Aloha.activeEditable or squirreledEditable
          # The Table plugin requires this.element to work so it can pop open a
          # window that selects the number of rows and columns
          # Also, that's the reason for the bind(@)
          @element = @
          settings.click.bind(@)(evt)

        return new ItemRelay([])

      
      changeHeading = (evt) ->
        $el = jQuery(@)
        hTag = $el.attr('data-tagname')
        rangeObject = Aloha.Selection.getRangeObject()
        GENTICS.Utils.Dom.extendToWord rangeObject  if rangeObject.isCollapsed()

        Aloha.Selection.changeMarkupOnSelection Aloha.jQuery("<#{hTag}></#{hTag}>")
        # Attach the id and classes back onto the new element
        $oldEl = Aloha.jQuery(rangeObject.getCommonAncestorContainer())
        $newEl = Aloha.jQuery(Aloha.Selection.getRangeObject().getCommonAncestorContainer())
        $newEl.addClass($oldEl.attr('class'))
        evt.preventDefault()
        # $newEl.attr('id', $oldEl.attr('id))
        # Setting the id is commented because otherwise collaboration wouldn't register a change in the document

      
      headings = CONTAINER_JQUERY.find(".changeHeading")
      
      headings.on 'click', changeHeading
      headings.add(headings.parent()).removeClass('disabled missing-a-click-event')

      Aloha.bind 'aloha-editable-activated', (event, data) ->
        squirreledEditable = data.editable
      
      # Keep track of the range because Aloha.Selection.obj seems to go {} sometimes
      Aloha.bind "aloha-selection-changed", (event, rangeObject) ->
        # Squirrel away the range because clicking the button changes focus and removed the range
        $el = Aloha.jQuery(rangeObject.startContainer)
        
        # Set the default text (changeit if we're in a heading later in the loop)
        currentHeading = CONTAINER_JQUERY.find('.currentHeading')
        currentHeading.text(headings.first().text())
        currentHeading.on('click', (evt) -> evt.preventDefault())
        
        headings.each () ->
          heading = jQuery(@)
          selector = heading.attr('data-tagname')
          #heading.removeClass('active')
          if selector and $el.parents(selector)[0]
            #heading.addClass('active')
            # Update the toolbar to show the current heading level
            currentHeading.text(heading.text())

    ###
     toString method
    ###
    toString: ->
      "toolbar"
