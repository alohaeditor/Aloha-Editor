# including "ui/settings" has weird side effects, namely most of the buttons don't load

define [ "aloha", "aloha/plugin", "ui/ui", '../../appmenu/appmenu', "i18n!format/nls/i18n", "i18n!aloha/nls/i18n", "aloha/console", "css!toolbar/css/toolbar.css" ], (Aloha, Plugin, Ui, appmenu, i18n, i18nCore) ->

  CONTAINER_JQUERY = jQuery('.toolbar')
  if CONTAINER_JQUERY.length == 0
    CONTAINER_JQUERY = jQuery('<div></div>').addClass('toolbar-container aloha').appendTo('body')
  
  ###
   register the plugin with unique name
  ###
  Plugin.create "toolbar",
    init: ->

      # Initially disable all the buttons and only enable them when events are attached to them
      CONTAINER_JQUERY.find('.action').addClass('disabled missing-a-click-event')
      CONTAINER_JQUERY.find('a.action').parent().addClass('disabled missing-a-click-event')
      
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
            $buttons.addClass('disabled') if !bool
            $buttons.removeClass('disabled') if bool
          disable: () -> @enable(false)
          setActiveButton: (a, b) ->
            console.log "#{slot} TODO:SETACTIVEBUTTON:", a, b
          focus: (a) ->
            console.log "#{slot} TODO:FOCUS:", a
          foreground: (a) ->
            console.log "#{slot} TODO:FOREGROUND:", a

        squirreledEditable = null
        $buttons.on 'mousedown', (evt) ->
          squirreledEditable = Aloha.activeEditable
          evt.preventDefault()

        $buttons.on 'click', (evt) ->
          evt.preventDefault()
          Aloha.activeEditable = squirreledEditable
          settings.click evt

        return new ItemRelay([])

      
      applyHeading = (hTag) -> () ->
        rangeObject = Aloha.Selection.getRangeObject()
        GENTICS.Utils.Dom.extendToWord rangeObject  if rangeObject.isCollapsed()

        Aloha.Selection.changeMarkupOnSelection Aloha.jQuery("<#{hTag}></#{hTag}>")
        # Attach the id and classes back onto the new element
        $oldEl = Aloha.jQuery(rangeObject.getCommonAncestorContainer())
        $newEl = Aloha.jQuery(Aloha.Selection.getRangeObject().getCommonAncestorContainer())
        $newEl.addClass($oldEl.attr('class'))
        # $newEl.attr('id', $oldEl.attr('id))
        # Setting the id is commented because otherwise collaboration wouldn't register a change in the document

      
      order = [ 'p', 'h1', 'h2', 'h3' ]
      labels =
        'p':  'Normal Text'
        'h1': 'Heading 1'
        'h2': 'Heading 2'
        'h3': 'Heading 3'

      headingButtons = (new appmenu.custom.Heading("<#{ h } />", labels[h], {accel: "Ctrl+#{ h.charAt(1) or 0 }", action: applyHeading(h) }) for h in order)
      
      headingsButton = new appmenu.ToolButton("Heading 1", {subMenu: new appmenu.Menu(headingButtons, 'custom-headings')})
      #toolbar.prepend(new appmenu.Separator())
      #toolbar.prepend(headingsButton)

      #Aloha.bind 'aloha-editable-activated', (e, params) ->
      #  menubar.setAccelContainer(params.editable.obj)
      #  toolbar.setAccelContainer(params.editable.obj)

      #Aloha.bind 'aloha-editable-deactivated', (e, params) ->
      #  menubar.setAccelContainer()
      #  toolbar.setAccelContainer()
      
      # Keep track of the range because Aloha.Selection.obj seems to go {} sometimes
      Aloha.bind "aloha-selection-changed", (event, rangeObject) ->
        # Squirrel away the range because clicking the button changes focus and removed the range
        $el = Aloha.jQuery(rangeObject.startContainer)
        for h, i in order
          isActive = $el.parents(h).length > 0
          headingButtons[i].setChecked(isActive)
          # Update the toolbar to show the current heading level
          if isActive
            headingsButton.setText labels[h]

    ###
     toString method
    ###
    toString: ->
      "toolbar"
