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
appmenu = {}

class appmenu.MenuBase
  constructor: () ->
  
  # Helper function
  _newDiv: (cls='', markup='<div></div>') ->
    $el = $(markup)
    $el.addClass(cls)
    
    # Don't propagate the mousedown so we don't lose focus from the editable area
    $el.bind 'mousedown', (evt) ->
      evt.stopPropagation()
      evt.preventDefault()
    
    $el


class appmenu.Menu extends appmenu.MenuBase
  constructor: (@items=[]) ->
    @el = @_newDiv('menu')

    for item in @items
      @_closeEverythingBut(item)
      @el.append(item.el)

  _closeEverythingBut: (item) ->
    that = @
    item.el.bind 'mouseenter', () ->
      for child in that.items
        if child.subMenu and child != item
          child.subMenu.close()

  append: (item) ->
    @items.push(item)
    item.el.appendTo(@el)

  open: (position) ->
    # Since we're appending to 'body' we need to shift the menu by how much the body has scrolled
    $canvas = $('body')
    position.top -= $canvas.scrollTop()
    position.left -= $canvas.scrollLeft()
    @el.css(position).appendTo($canvas)
    @el.show()
    # Close the menu when someone clicks outside the menu (locally mousedowns's are already squashed)
    # Add a handler for when someone clicks outside the menu
    that = @
    $('body').one 'mousedown', () ->
      setTimeout(that.close.bind(that), 10)
  
  close: () ->
    # Close the submenus
    for item in @items
      if item.subMenu
        item.subMenu.close()
    @el.hide()

class appmenu.MenuItem extends appmenu.MenuBase
  constructor: (@text, conf = {}) ->
    super 'menu-item'
    @action = conf.action || null
    @iconCls = conf.iconCls || null
    @accel = conf.accel || null
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
    if @accel?
      $('body').bind 'keydown', @accel.toLowerCase(), (evt) ->
        if not that.isDisabled and that.action
          that.action evt

    @setAction(@action)

    # Add hover/selection
    @el.bind 'mouseenter', () ->
      that.el.addClass('selected')
    @el.bind 'mouseleave', () ->
      that.el.removeClass('selected')

    @_addEvents()

  
  _addEvents: () ->
    if @subMenu?
      that = @
      @el.bind 'mouseenter', () ->
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
      @subMenu.open(position)

  _closeSubMenu: () ->
    @subMenu.close()


  _cssToggler: (val, cls) ->
    @el.addClass(cls) if val
    @el.removeClass(cls) if not val

  setIcon: (@iconCls) ->
    if @iconCls?
      @el.addClass('icon')
      if @el.children('.menu-icon').length
        @el.children('.menu-icon').addClass(@iconCls)
      else
        @_newDiv('menu-icon').addClass(@iconCls).prependTo(@el)
    else
      @el.removeClass('icon')
      @el.children('.menu-icon').remove()

  setAction: (@action) ->
    that = @
    @el.off 'click' # Unbind if an event was set
    @el.bind 'click', (evt) ->
      if not that.disabled and that.action
        evt.preventDefault()
        # TODO: Hide all menus
        $('.menu').hide()
        that.action(evt)

  setChecked: (@isChecked) ->
    @_cssToggler @isChecked, 'checked'
    @el.children('.checked-icon').remove() # Always remove
    if @isChecked
      # Insert a div the the checkbox character
      @_newDiv('checked-icon').append('\u2713').appendTo(@el)

  setDisabled: (@isDisabled) ->
    @_cssToggler @isDisabled, 'disabled'

  setHidden: (@isHidden) ->
    @_cssToggler @isHidden, 'hidden'

  setText: (@text) ->
    @el.children('.text')[0].innerHTML = @text

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
  
  close: () ->
    # Never close a toolbar

class appmenu.ToolButton extends appmenu.MenuItem
  constructor: (text, conf) ->
    # By default it's a right arrow, but the toolbar buttons use a down arrow
    conf.subMenuChar = '\u25BC'
    super(text, conf)
    @el.addClass 'tool-button'
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
      @el.bind 'click', () ->
        that._openSubMenu(false) # false == open-below

# ---- Specific to MenuBar ---

class appmenu.MenuBar extends appmenu.Menu
  constructor: (items) ->
    super(items)
    @el.addClass 'menu-bar'
    @el.removeClass 'menu' # Don't treat the menubar as a menu
  
  close: () ->
    # Cannot be closed
  

class appmenu.MenuButton extends appmenu.MenuItem
  constructor: (text, subMenu) ->
    super(text, { subMenu: subMenu })
    @el.addClass 'menu-button'

  _addEvents: () ->
    that = @
    # Open the menu on click
    @el.bind 'click', (evt) ->
      that._openSubMenu(false) # false == open-below

    # On mouseover close all other menus (except submenu)
    @el.bind 'mouseenter', (evt) ->
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

if define?
  define ["css!./appmenu.css"], () ->
    appmenu
else if window?
  window.appmenu = appmenu