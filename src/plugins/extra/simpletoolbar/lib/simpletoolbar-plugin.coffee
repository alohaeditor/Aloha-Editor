define [
    "aloha", "aloha/plugin", "ui/ui", '../../appmenu/appmenu',
    "i18n!format/nls/i18n", "i18n!aloha/nls/i18n", "aloha/console",
    "css!simpletoolbar/css/simpletoolbar.css" ], (
    Aloha, Plugin, Ui, appmenu, i18n, i18nCore) ->

  CONTAINER_JQUERY = jQuery('.toolbar')
  if CONTAINER_JQUERY.length == 0
    CONTAINER_JQUERY = jQuery('<div></div>').addClass('toolbar-container').appendTo('body')
  
  ###
   register the plugin with unique name
  ###
  Plugin.create "simpletoolbar",
    defaults: {
        'initfloat': false, # Whether to also initialise aloha default toolbar
        'menu': [
             'undo', 'redo', '', 'bold', 'italic', 'underline', 'superscript',
             'subscript', '', 'unorderedList', 'orderedList', '',
             { text: 'Table', icon: 'aloha-table-insert', subMenu: [ 'createTable', 'addrowbefore', 'addrowafter', 'addcolumnbefore', 'addcolumnafter', '', 'deleterow', 'deletecolumn'] },
             { text: 'insertImage', icon: 'aloha-image-insert' }
        ]
    },
    init: ->
      window.toolbar = toolbar = new appmenu.ToolBar()
      toolbar.el.appendTo CONTAINER_JQUERY
      toolbar.el.addClass 'aloha'

      toolbarLookup = {}

      recurse = (item, lookupMap) ->
        if 'string' == $.type item
          if '' == item
            return new appmenu.Separator()
          menuItem = new appmenu.ToolButton item
          lookupMap[item] = menuItem
          return menuItem
        else
          subItems = for subItem in item.subMenu or []
            recurse subItem, lookupMap
          icon = item.icon or null
          if subItems.length
            subMenu = new appmenu.Menu subItems
            menuItem = new appmenu.ToolButton item.text,
              subMenu: subMenu, iconCls: icon
          else
            menuItem = new appmenu.ToolButton item.text,
              iconCls: icon
            lookupMap[item.text] = menuItem
          return menuItem

      for item in @settings.menu
          toolbar.append (recurse item, toolbarLookup)

      # Keep a reference to our old ui
      Ui.__old_adopt = Ui.adopt

      # Hijack the toolbar buttons so we can customize where they are placed.
      plugin = @
      Ui.adopt = (slot, type, settings) ->
        if plugin.settings.initfloat
            # Pass through initialisation to old toolbar. Sometimes useful
            # to use both.
            try
                Ui.__old_adopt(slot, type, settings)
            catch err
              # pass

        #console and console.log(type)
        # This class adapts button functions Aloha expects to functions the appmenu uses
        class ItemRelay
          constructor: (@items) ->
          show: () -> item.setHidden false for item in @items
          hide: () -> item.setHidden true for item in @items
          setActive: (bool) -> item.setChecked bool for item in @items
          setState: (bool) -> @setActive bool
          enable: (bool=true) -> item.setDisabled !bool for item in @items
          disable: () -> item.setDisabled true for item in @items
          setActiveButton: (a, b) ->
            console.log "#{slot} TODO:SETACTIVEBUTTON:", a, b
          focus: (a) ->
            console.log "#{slot} TODO:FOCUS:", a
          foreground: (a) ->
            console.log "#{slot} TODO:FOREGROUND:", a

        if slot of toolbarLookup
          item = toolbarLookup[slot]
        else
          item = new appmenu.ToolButton 'DUMMY_ITEM_THAT_SQUASHES_STATE_CHANGES'
                    
        item.setText(settings.tooltip)
        item.setIcon(settings.icon)
        item.setAction(settings.click)
        item.element = item.el # CreateTable and some others do onclick () -> this.element

        return new ItemRelay([item])

      
      applyHeading = () ->
        rangeObject = Aloha.Selection.getRangeObject()
        GENTICS.Utils.Dom.extendToWord rangeObject  if rangeObject.isCollapsed()

        Aloha.Selection.changeMarkupOnSelection Aloha.jQuery(@markup)
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

      # Keep track of the range because Aloha.Selection.obj seems to go {} sometimes
      Aloha.bind "aloha-selection-changed", (event, rangeObject) ->
        # Squirrel away the range because clicking the button changes focus and removed the range
        $el = Aloha.jQuery(rangeObject.startContainer)
        for h, i in order
          isActive = $el.parents(h).length > 0

    ###
     toString method
    ###
    toString: ->
      "simpletoolbar"
