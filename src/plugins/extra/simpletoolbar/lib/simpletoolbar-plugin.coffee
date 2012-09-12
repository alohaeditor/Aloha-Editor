# including "ui/settings" has weird side effects, namely most of the buttons don't load
menuSettings = [
  text: "Format"
  subMenu: [ "bold", "italic", "underline", "subscript", "superscript" ]
,
  text: "Insert"
  subMenu: [ "insertImage", 'insertFigure' ]
,
  text: "Table"
  subMenu: [ "createTable", '', {text: "Cell", subMenu: ["mergecells", "splitcells", "tableCaption", "tableSummary", "formatTable"]}, { text: "Row", subMenu: ["addrowbefore", "addrowafter", "deleterows", "rowheader", "mergecellsRow", "splitcellsRow", "formatRow"]}, '', { text: "Column", subMenu: ["addcolumnleft", "addcolumnright", "deletecolumns", "columnheader", "mergecellsColumn", "splitcellsColumn", "formatColumn"] } ]
]

toolbarSettings = [
 'bold', 'italic', 'underline', '', 'insertImage', 'insertFigure'
]

define [ "aloha", "aloha/plugin", "ui/ui", 'ribbon/ribbon-plugin', '../../appmenu/appmenu', "i18n!format/nls/i18n", "i18n!aloha/nls/i18n", "aloha/console", "css!simpletoolbar/css/simpletoolbar.css" ], (Aloha, Plugin, Ui, Ribbon, appmenu, i18n, i18nCore) ->

  CONTAINER_JQUERY = jQuery('.toolbar')
  if CONTAINER_JQUERY.length == 0
    CONTAINER_JQUERY = jQuery('<div></div>').addClass('toolbar-container').appendTo('body')
  
  ###
   register the plugin with unique name
  ###
  Plugin.create "simpletoolbar",
    init: ->

      # Remove toolbar at first.
      # TODO: This needs to be a dynamic option!!!
      window.menubar = menubar = new appmenu.MenuBar []
      # menubar.el.appendTo CONTAINER_JQUERY

      window.toolbar = toolbar = new appmenu.ToolBar()
      toolbar.el.appendTo CONTAINER_JQUERY
      toolbar.el.addClass 'aloha'

      menuLookup = {}
      toolbarLookup = {}

      recurse = (item, lookupMap) ->
        if 'string' == $.type item
          if '' == item
            return new appmenu.Separator()
          menuItem = new appmenu.MenuItem 'EMPTY_LABEL'
          lookupMap[item] = menuItem
          return menuItem
        else
          subItems = for subItem in item.subMenu or []
            recurse subItem, lookupMap
          subMenu = new appmenu.Menu subItems
          subMenu.el.addClass 'aloha' # Hack to get the Aloha icons working
          menuItem = new appmenu.MenuItem item.text,
            subMenu: subMenu
          return menuItem

      
      for tab in menuSettings
        subMenuItems = for item in tab.subMenu
          recurse item, menuLookup

        menu = new appmenu.Menu subMenuItems
        menu.el.addClass 'aloha' # Added so the CSS for aloha icons gets matched
        
        menubar.append(new appmenu.MenuButton tab.text, menu)

      for item in toolbarSettings
          toolbar.append (recurse item, toolbarLookup)

        

      # Hijack the toolbar buttons so we can customize where they are placed.
      
      Ui.adopt = (slot, type, settings) ->
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

        if slot of menuLookup and slot of toolbarLookup
          item = menuLookup[slot]
          item2 = toolbarLookup[slot]
          item.element = item.el # CreateTable and some others do onclick () -> this.element
          item2.element = item2.el # CreateTable and some others do onclick () -> this.element

          item.setText(settings.tooltip)
          item.setIcon(settings.icon)
          item.setAction(settings.click)

          item2.setText(settings.tooltip)
          item2.setIcon(settings.icon)
          item2.setAction(settings.click)

          return new ItemRelay([item, item2])
          
        else if slot of menuLookup or slot of toolbarLookup
          item = menuLookup[slot] or toolbarLookup[slot]
        else
          item = new appmenu.MenuItem 'DUMMY_ITEM_THAT_SQUASHES_STATE_CHANGES'
                    
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

      ###
      headingButtons = (new appmenu.custom.Heading("<#{ h } />", labels[h], {accel: "Ctrl+#{ h.charAt(1) }", action: applyHeading }) for h in order)
      
      headingsButton = new appmenu.ToolButton("Heading 1", {subMenu: new appmenu.Menu(headingButtons)})
      toolbar.append(headingsButton)
      toolbar.append(new appmenu.Separator())
      ###

      # Keep track of the range because Aloha.Selection.obj seems to go {} sometimes
      Aloha.bind "aloha-selection-changed", (event, rangeObject) ->
        # Squirrel away the range because clicking the button changes focus and removed the range
        $el = Aloha.jQuery(rangeObject.startContainer)
        for h, i in order
          isActive = $el.parents(h).length > 0
          #headingButtons[i].setChecked(isActive)
          # Update the toolbar to show the current heading level
          #if isActive
          #  headingsButton.setText labels[h]

    ###
     toString method
    ###
    toString: ->
      "simpletoolbar"