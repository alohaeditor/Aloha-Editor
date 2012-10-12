# Note: appmenu will register itself if the define() function exists (so it can be loaded as a RequireJS package) and falls back to attaching to the window object otherwise

###
The 2 base classes are Menu and MenuItem.
For a MenuBar the children can be MenuButtons (MenuItem w/ just text)
For a ToolBar the children can be ToolButtons (optional tooltip)

Menus:

MenuBar > ToolBar = [ MenuButton ] # changes the class of the bar
MenuButton > MenuItem # Only contains text and submenu

Menu = [ MenuItem | MenuGroup ]
MenuItem = { iconCls+, text, accel+, disabled?, checked?, visible?, submenu+, action() }

MenuGroup > Menu # Used for visually grouping MenuItems so they can scroll
Separator > MenuItem

# One-off cases: (for custom rendering)
Heading > MenuItem # Uses a different class so the text is different
MakeTable > Menu # Offers a 5*5 grid to create a new table

# Unused but worth noting (for completeness)
ColorPicker > Menu



Toolbars:

ToolBar > Menu = [ ToolButton ]

ToolButton > MenuItem = [ tooltop+, (checked means pressed) ]

###
define [ "jquery", "css!./appmenu.css" ], ($) ->

  appmenu = {}
  
  class appmenu.MenuBase
    constructor: () ->
    
    # Helper function
    _newDiv: (cls='', markup='<div></div>') ->
      $el = $(markup)
      $el.addClass(cls)
      
      # Don't propagate the mousedown so we don't lose focus from the editable area
      $el.on 'mousedown', (evt) ->
        evt.stopPropagation()
        evt.preventDefault()
      
      $el
  
  
  class appmenu.Menu extends appmenu.MenuBase
    constructor: (@items=[]) ->
      @el = @_newDiv('menu')
  
      for item in @items
        @_closeEverythingBut(item)
        item.parent = @
        @el.append(item.el)
  
    _closeEverythingBut: (item) ->
      that = @
      item.el.on 'mouseenter', () ->
        for child in that.items
          if child.subMenu and child != item
            child.subMenu._closeSubMenu()
  
    prepend: (item) ->
      item.parent = @
      @items.unshift(item)
      item.el.prependTo(@el)

    append: (item) ->
      item.parent = @
      @items.push(item)
      item.el.appendTo(@el)
    
    _setSelectedBubbledUp: (child, dir) ->
      that = @
      child.setSelected(false)
      ariaParent = () ->
        that.setSelected(false)
        that.parent.setSelected(that)
      ariaUp = () ->
        i = that.items.indexOf child
        newSelection = that.items[(i+that.items.length - 1) % that.items.length]
        newSelection._setSelected(true)
      ariaDown = () ->
        i = that.items.indexOf child
        newSelection = that.items[(i+that.items.length + 1) % that.items.length]
        newSelection._setSelected(true)
      ariaLeft = () ->
        that.parent._setSelectedBubbledUp(true, false) # ,false == left
      ariaRight = () ->
        that.setSelected(false)
        that.parent._setSelectedBubbledUp(true, true) # ,true == right

      switch dir
        when 'up' then ariaUp()
        when 'down' then ariaDown()
        when 'left' then ariaLeft()
        when 'right' then ariaRight()
  
    _openSubMenuAt: (position) ->
      # Since we're appending to 'body' we need to shift the menu by how much the body has scrolled
      $canvas = $('body')
      position.top -= $canvas.scrollTop()
      position.left -= $canvas.scrollLeft()
      @el.css(position).appendTo($canvas)
      @el.show()
      @isOpened = true
      # Close the menu when someone clicks outside the menu (locally mousedowns's are already squashed)
      # Add a handler for when someone clicks outside the menu
      that = @
      $('body').one 'mousedown', () ->
        setTimeout(that._closeSubMenu.bind(that), 10)
    
    _closeSubMenu: () ->
      # Close the submenus
      for item in @items
        if item.subMenu
          item.subMenu._closeSubMenu()
      @el.hide()
      @isOpened = false
    
    setAccelContainer: (@$keyBinder) ->
      for item in @items
        item.setAccelContainer(@$keyBinder)
  
  class appmenu.MenuItem extends appmenu.MenuBase
    constructor: (@text, conf = {}) ->
      super 'menu-item'
      @action = conf.action || null
      @iconCls = conf.iconCls || null
      @accel = conf.accel || null
      @accel = @accel.toLowerCase() if @accel
      @isDisabled = conf.disabled || false
      @isChecked = conf.checked || false
      @isHidden = conf.hidden || false
      @subMenu = conf.subMenu || null
      # By default it's a right arrow, but the toolbar buttons use a down arrow
      @subMenuChar = conf.subMenuChar || '\u25B6'
      
      # Create the element
      @el = @_newDiv('menu-item')
  
      # Add all the classes and child elements (ie icon, accelerator key)
      @setIcon(@iconCls)
      # @accel must go before @text otherwise shows up on next line
      if @accel?
        translated = @accel.replace('Shift+', '⇧').replace('Meta+', '⌘')
        @_newDiv('accel').append(translated).appendTo(@el)
        # Also, make it the tooltip for now
        @el.attr 'title', "#{ @text } (#{ translated })"
      @setDisabled(@isDisabled)
      @setHidden(@isHidden)
      @setChecked(@isChecked)
      if @text? then @_newDiv('text').append(@text).appendTo(@el)
      if @subMenu?
        @el.addClass('submenu')
        @_newDiv('submenu').appendTo(@el).append(@subMenuChar)
      
      # Add some event handlers
      that = @
      
      @setAction(@action)
      @setAccelContainer($(document))
  
      # Add hover/selection
      @el.on 'mouseenter', (evt) -> that.setSelected(true)
      @el.on 'mouseleave', (evt) -> that.setSelected(false)
  
      @_addEvents()
  
    
    _addEvents: () ->
      if @subMenu?
        that = @
        @el.on 'mouseenter', () ->
          that._openSubMenu(true) # true == open-to-the-right
  
    _openSubMenu: (toTheRight = false) ->
      if @subMenu?
        # TODO: calculate the position of the submenu
        offset = @el.offset()
        $parent = @el.offsetParent()
        parentOffset = $parent.offset()
        top = offset.top - parentOffset.top + $parent.position().top
        left = offset.left - parentOffset.left + $parent.position().left
        if toTheRight
          left += @el.outerWidth()
        else # below
          top += @el.outerHeight()
        position = { top: top, left: left }
        @subMenu._openSubMenuAt(position)
  
    _closeSubMenu: () ->
      @subMenu._closeSubMenu() if @subMenu
  
  
    _cssToggler: (val, cls) ->
      @el.addClass(cls) if val
      @el.removeClass(cls) if not val
  
    setIcon: (@iconCls) ->
      if @iconCls?
        @el.removeClass('no-icon').addClass('icon')
        if @el.children('.menu-icon').length
          @el.children('.menu-icon').addClass(@iconCls)
        else
          @_newDiv('menu-icon').addClass(@iconCls).prependTo(@el)
      else
        @el.removeClass('icon')
        @el.children('.menu-icon').remove()
  
    setAction: (@action) ->
      that = @
      # Unbind any old events
      @el.off 'click'
      # Bind a handler that hides the old menu, and prevents default action
      @el.on 'click', (evt) ->
        evt.preventDefault()
        # TODO: Hide all menus
        $('.menu').hide()

      # If an action was provided, set click handler, but namespace it for
      # easy removal
      if @action
        @el.on 'click.appmenu.action', that.action
  
    setChecked: (@isChecked) ->
      @_cssToggler @isChecked, 'checked'
      @el.children('.checked-icon').remove() # Always remove
      if @isChecked
        # Insert a div the the checkbox character
        @_newDiv('checked-icon').append('\u2713').appendTo(@el)
  
    setDisabled: (@isDisabled) ->
      @_cssToggler @isDisabled, 'disabled'
      if @isDisabled and @action
        @el.off 'click.appmenu.action'
        if @accel
          @el.off 'keydown.appmenu', @accel, @action
      else if not @isDisabled and @action
        @el.off('click.appmenu.action').on('click.appmenu.action', @action)
        if @accel
          @el.on 'keydown.appmenu', @accel, @action
  
    setHidden: (@isHidden) ->
      @_cssToggler @isHidden, 'hidden'
  
    setText: (@text) ->
      @el.children('.text')[0].innerHTML = @text
    
    _setSelected: (@isSelected) ->
      @_cssToggler @isSelected, 'selected'
    setSelected: (isSelected) ->
      @_setSelected isSelected
      that = @
      ariaParent = (direction) ->
        that.setSelected(false)
        that._closeSubMenu()
        that.parent._setSelectedBubbledUp(that, direction)
      ariaUp = () -> ariaParent('up')
      ariaDown = () -> ariaParent('down')
      ariaLeft = () -> ariaParent('left')
      ariaRight = () -> ariaParent('right')
      ariaEnter = () ->
        that.action()
      if isSelected
        # Add key binders
        @$keyBinder.on 'keydown.appmenuaria', 'up', ariaUp
        @$keyBinder.on 'keydown.appmenuaria', 'down', ariaDown
        @$keyBinder.on 'keydown.appmenuaria', 'left', ariaLeft
        @$keyBinder.on 'keydown.appmenuaria', 'right', ariaRight
        @$keyBinder.on 'keydown.appmenuaria', 'enter', ariaEnter
      else
        # Remove key binders
        @$keyBinder.off 'keydown.appmenuaria'
    
    # Handling keydown events are not bubbled up to the body handler so
    # As the editable region changes we have to rebind the key handler
    setAccelContainer: ($keyBinder) ->
      if @$keyBinder
        @$keyBinder.off 'keydown.appmenu'
      @$keyBinder = $keyBinder

      if @accel? and @$keyBinder
        that = @
        if @action
          @$keyBinder.on 'keydown.appmenu', @accel, @action
      if @subMenu
        @subMenu.setAccelContainer($keyBinder)
  
  class appmenu.Separator extends appmenu.MenuItem
    constructor: () ->
      super(null, { disabled: true })
      @el.addClass 'separator'
  
    _addEvents: () ->
  
  # ---- Specific to ToolBar ---
  
  class appmenu.ToolBar extends appmenu.Menu
    constructor: (items=[]) ->
      super items
      @el.addClass 'tool-bar' # Don't add it to 'menu'
      @el.removeClass 'menu'
    
    _closeSubMenu: () ->
      # Never close a toolbar
  
  class appmenu.ToolButton extends appmenu.MenuItem
    constructor: (text, conf = {}) ->
      # By default it's a right arrow, but the toolbar buttons use a down arrow
      conf.subMenuChar = conf.subMenuChar || '\u25BC'
      super(text, conf)
      @el.addClass 'tool-button'
      @el.addClass 'no-icon'
      @toolTip = conf.toolTip || null
    
    _addEvents: () ->
      tip = @_newDiv('tool-tip').appendTo(@el)
      if @toolTip?
        tip.append(@toolTip)
      else
        tip.append(@text)
        if @accel
          tip.append(" (#{ @accel })")
  
      if @subMenu?
        that = @
        @el.on 'click', () ->
          that._openSubMenu(false) # false == open-below
  
  # ---- Specific to MenuBar ---
  
  class appmenu.MenuBar extends appmenu.Menu
    constructor: (items) ->
      super(items)
      @el.addClass 'menu-bar'
      @el.removeClass 'menu' # Don't treat the menubar as a menu

      that = @
      @el.on 'click', (evt) ->
        # Open the currect menu (if one exists)
        # And start trapping key strokes
        for item in that.items
          if $(evt.target).parent('.menu-item')[0] == item.el[0]
            item._openSubMenu(false) # false == open-below
      
            
    
    _closeSubMenu: () ->
      # Cannot be closed
      # But close the children
      for item in @items
        item._closeSubMenu()
    
  
  class appmenu.MenuButton extends appmenu.MenuItem
    constructor: (text, subMenu) ->
      super(text, { subMenu: subMenu })
      @el.addClass 'menu-button'
  
    _addEvents: () ->
      that = @
      # On mouseover close all other menus (except submenu)
      @el.on 'mouseenter', (evt) ->
        for openMenu in $('.menu')
          if openMenu != that.el[0]
            $(openMenu).hide()
  
  
  # ---- Custom MenuItems and Menus ---
  appmenu.custom = {}
  class appmenu.custom.Heading extends appmenu.MenuItem
    constructor: (@markup, text, conf) ->
      super(text, conf)
    
    _newDiv: (cls) ->
      # HACK: Only override the text div
      if cls == 'text'
        $el = super(cls, @markup)
        $el.addClass('custom-heading')
        $el
      else
        super(cls)
  # Return the appmenu object to require
  appmenu
