define [
  'jquery'
  'aloha'
  'aloha/plugin'
  'PubSub'
  'ui/settings'
  'ui/ui'
  'ui/floating'
  'ribbon/ribbon-plugin'
  'jqueryui'
], ($, Aloha, Plugin, PubSub, Settings, Ui, Floating, Ribbon) ->

  getToolbarSettings = () ->
    userSettings = Aloha.settings.toolbar
    defaultSettings = Settings.defaultToolbarSettings
    if not userSettings
      defaultSettings.tabs
    else
      Settings.combineToolbarSettings(
        userSettings.tabs || [],
        defaultSettings.tabs,
        userSettings.exclude || []
      )

  ###
   Aloha.settings.toolbar uses the following format:
   
   label: "Tab Title"
   components: [ [ 'bold', 'strong', italic' ] ]


   While the ribbon expects the following:
   
   Ribbon.addButton
     text: 'Button Title'
     menu: [
       {
         text: 'Subitem title'
         menu: [] # Optional
         click: () -> alert 'hello!'
       }
     ]

    So, we construct the ribbon with hollow actions and then as plugins
    provide their actions we add them to a lookup map.
  ###
  
  # Slowly construct the ribbon menu. can't actually create the ribbon until
  # All plugins have loaded so keep pusing off the creation of it as long as plugins
  # Keep calling adopt
  ribbonMenu = []
  for tab in getToolbarSettings()
    slots = []
    for c in tab.components
      for slot in c
        slots.push slot
    ribbonMenu.push
      text: tab.label
      menu: slots

  # Used later...
  ribbonCreateTimeout = 0

  squirreledEditable = null
  squirreledRange = null
  
  # HACK: clicking causes the editor to lose focus. Squirrel away the last aloha editor and selection
  PubSub.sub 'aloha.selection.context-change', (message) ->
    squirreledEditable = Aloha.activeEditable or squirreledEditable
    squirreledRange = message.range or squirreledRange
  
  $.extend Ui,
    # Then, as actions are registered add them to the correct tab dropdown
    ###
     * This module is part of the Aloha API.
     * It is valid to override this module via requirejs to provide a
     * custom behaviour. An overriding module must implement all API
     * methods. Every member must have an api annotation. No private
     * members are allowed.
     * @api
    ###
    ###
     * Adopts a component instance into the UI.
     *
     * Usually, the implementation of this method will display the
     * component, at a position in the UI given by the slot
     * argument.
     *
     * @param slot
     *        A position argument that is interpreted by the UI however it likes.
     * @param component
     *        An instance of a component to adopt into the given slot.
     * @api
    ###
    adopt: (slot, type, settings) ->
      clearTimeout ribbonCreateTimeout # We're not ready to make the toolbar yet!
      
      for tab in ribbonMenu
        i = tab.menu.indexOf(slot)
        if i >= 0
          tab.menu[i] =
            text: settings.tooltip
            click: () ->
              Aloha.activeEditable = Aloha.activeEditable or squirreledEditable
              settings.click()
          
      # Delay creating the ribbon hoping other plugins will call adapt (register buttons) soon
      ribbonCreateTimeout = setTimeout () ->
        for r in ribbonMenu
          Ribbon.addButton r
        Ribbon.show()
      , 1000

      return {
        show: () ->
        hide: () ->
        setActive: (bool) ->
        setState: (bool) ->
        setActiveButton: (a, b) ->
        enable: () ->
        disable: () ->
        focus: (a) ->
        foreground: (a) ->
      }
