/*!
 * Ext JS Library 3.2.1
 * Copyright(c) 2006-2010 Ext JS, Inc.
 * licensing@extjs.com
 * http://www.extjs.com/license
 */
/**
 * @class Ext.Button
 * @extends Ext.BoxComponent
 * Simple Button class
 * @cfg {String} text The button text to be used as innerHTML (html tags are accepted)
 * @cfg {String} icon The path to an image to display in the button (the image will be set as the background-image
 * CSS property of the button by default, so if you want a mixed icon/text button, set cls:'x-btn-text-icon')
 * @cfg {Function} handler A function called when the button is clicked (can be used instead of click event).
 * The handler is passed the following parameters:<div class="mdetail-params"><ul>
 * <li><code>b</code> : Button<div class="sub-desc">This Button.</div></li>
 * <li><code>e</code> : EventObject<div class="sub-desc">The click event.</div></li>
 * </ul></div>
 * @cfg {Number} minWidth The minimum width for this button (used to give a set of buttons a common width).
 * See also {@link Ext.Panel}.<tt>{@link Ext.Panel#minButtonWidth minButtonWidth}</tt>.
 * @cfg {String/Object} tooltip The tooltip for the button - can be a string to be used as innerHTML (html tags are accepted) or QuickTips config object
 * @cfg {Boolean} hidden True to start hidden (defaults to false)
 * @cfg {Boolean} disabled True to start disabled (defaults to false)
 * @cfg {Boolean} pressed True to start pressed (only if enableToggle = true)
 * @cfg {String} toggleGroup The group this toggle button is a member of (only 1 per group can be pressed)
 * @cfg {Boolean/Object} repeat True to repeat fire the click event while the mouse is down. This can also be
 * a {@link Ext.util.ClickRepeater ClickRepeater} config object (defaults to false).
 * @constructor
 * Create a new button
 * @param {Object} config The config object
 * @xtype button
 */
Ext.Button = Ext.extend(Ext.BoxComponent, {
    /**
     * Read-only. True if this button is hidden
     * @type Boolean
     */
    hidden : false,
    /**
     * Read-only. True if this button is disabled
     * @type Boolean
     */
    disabled : false,
    /**
     * Read-only. True if this button is pressed (only if enableToggle = true)
     * @type Boolean
     */
    pressed : false,

    /**
     * @cfg {Number} tabIndex Set a DOM tabIndex for this button (defaults to undefined)
     */

    /**
     * @cfg {Boolean} allowDepress
     * False to not allow a pressed Button to be depressed (defaults to undefined). Only valid when {@link #enableToggle} is true.
     */

    /**
     * @cfg {Boolean} enableToggle
     * True to enable pressed/not pressed toggling (defaults to false)
     */
    enableToggle : false,
    /**
     * @cfg {Function} toggleHandler
     * Function called when a Button with {@link #enableToggle} set to true is clicked. Two arguments are passed:<ul class="mdetail-params">
     * <li><b>button</b> : Ext.Button<div class="sub-desc">this Button object</div></li>
     * <li><b>state</b> : Boolean<div class="sub-desc">The next state of the Button, true means pressed.</div></li>
     * </ul>
     */
    /**
     * @cfg {Mixed} menu
     * Standard menu attribute consisting of a reference to a menu object, a menu id or a menu config blob (defaults to undefined).
     */
    /**
     * @cfg {String} menuAlign
     * The position to align the menu to (see {@link Ext.Element#alignTo} for more details, defaults to 'tl-bl?').
     */
    menuAlign : 'tl-bl?',

    /**
     * @cfg {String} overflowText If used in a {@link Ext.Toolbar Toolbar}, the
     * text to be used if this item is shown in the overflow menu. See also
     * {@link Ext.Toolbar.Item}.<code>{@link Ext.Toolbar.Item#overflowText overflowText}</code>.
     */
    /**
     * @cfg {String} iconCls
     * A css class which sets a background image to be used as the icon for this button
     */
    /**
     * @cfg {String} type
     * submit, reset or button - defaults to 'button'
     */
    type : 'button',

    // private
    menuClassTarget : 'tr:nth(2)',

    /**
     * @cfg {String} clickEvent
     * The DOM event that will fire the handler of the button. This can be any valid event name (dblclick, contextmenu).
     * Defaults to <tt>'click'</tt>.
     */
    clickEvent : 'click',

    /**
     * @cfg {Boolean} handleMouseEvents
     * False to disable visual cues on mouseover, mouseout and mousedown (defaults to true)
     */
    handleMouseEvents : true,

    /**
     * @cfg {String} tooltipType
     * The type of tooltip to use. Either 'qtip' (default) for QuickTips or 'title' for title attribute.
     */
    tooltipType : 'qtip',

    /**
     * @cfg {String} buttonSelector
     * <p>(Optional) A {@link Ext.DomQuery DomQuery} selector which is used to extract the active, clickable element from the
     * DOM structure created.</p>
     * <p>When a custom {@link #template} is used, you  must ensure that this selector results in the selection of
     * a focussable element.</p>
     * <p>Defaults to <b><tt>'button:first-child'</tt></b>.</p>
     */
    buttonSelector : 'button:first-child',

    /**
     * @cfg {String} scale
     * <p>(Optional) The size of the Button. Three values are allowed:</p>
     * <ul class="mdetail-params">
     * <li>'small'<div class="sub-desc">Results in the button element being 16px high.</div></li>
     * <li>'medium'<div class="sub-desc">Results in the button element being 24px high.</div></li>
     * <li>'large'<div class="sub-desc">Results in the button element being 32px high.</div></li>
     * </ul>
     * <p>Defaults to <b><tt>'small'</tt></b>.</p>
     */
    scale : 'small',

    /**
     * @cfg {Object} scope The scope (<tt><b>this</b></tt> reference) in which the
     * <code>{@link #handler}</code> and <code>{@link #toggleHandler}</code> is
     * executed. Defaults to this Button.
     */

    /**
     * @cfg {String} iconAlign
     * <p>(Optional) The side of the Button box to render the icon. Four values are allowed:</p>
     * <ul class="mdetail-params">
     * <li>'top'<div class="sub-desc"></div></li>
     * <li>'right'<div class="sub-desc"></div></li>
     * <li>'bottom'<div class="sub-desc"></div></li>
     * <li>'left'<div class="sub-desc"></div></li>
     * </ul>
     * <p>Defaults to <b><tt>'left'</tt></b>.</p>
     */
    iconAlign : 'left',

    /**
     * @cfg {String} arrowAlign
     * <p>(Optional) The side of the Button box to render the arrow if the button has an associated {@link #menu}.
     * Two values are allowed:</p>
     * <ul class="mdetail-params">
     * <li>'right'<div class="sub-desc"></div></li>
     * <li>'bottom'<div class="sub-desc"></div></li>
     * </ul>
     * <p>Defaults to <b><tt>'right'</tt></b>.</p>
     */
    arrowAlign : 'right',

    /**
     * @cfg {Ext.Template} template (Optional)
     * <p>A {@link Ext.Template Template} used to create the Button's DOM structure.</p>
     * Instances, or subclasses which need a different DOM structure may provide a different
     * template layout in conjunction with an implementation of {@link #getTemplateArgs}.
     * @type Ext.Template
     * @property template
     */
    /**
     * @cfg {String} cls
     * A CSS class string to apply to the button's main element.
     */
    /**
     * @property menu
     * @type Menu
     * The {@link Ext.menu.Menu Menu} object associated with this Button when configured with the {@link #menu} config option.
     */
    /**
     * @cfg {Boolean} autoWidth
     * By default, if a width is not specified the button will attempt to stretch horizontally to fit its content.
     * If the button is being managed by a width sizing layout (hbox, fit, anchor), set this to false to prevent
     * the button from doing this automatic sizing.
     * Defaults to <tt>undefined</tt>.
     */

    initComponent : function(){
        Ext.Button.superclass.initComponent.call(this);

        this.addEvents(
            /**
             * @event click
             * Fires when this button is clicked
             * @param {Button} this
             * @param {EventObject} e The click event
             */
            'click',
            /**
             * @event toggle
             * Fires when the 'pressed' state of this button changes (only if enableToggle = true)
             * @param {Button} this
             * @param {Boolean} pressed
             */
            'toggle',
            /**
             * @event mouseover
             * Fires when the mouse hovers over the button
             * @param {Button} this
             * @param {Event} e The event object
             */
            'mouseover',
            /**
             * @event mouseout
             * Fires when the mouse exits the button
             * @param {Button} this
             * @param {Event} e The event object
             */
            'mouseout',
            /**
             * @event menushow
             * If this button has a menu, this event fires when it is shown
             * @param {Button} this
             * @param {Menu} menu
             */
            'menushow',
            /**
             * @event menuhide
             * If this button has a menu, this event fires when it is hidden
             * @param {Button} this
             * @param {Menu} menu
             */
            'menuhide',
            /**
             * @event menutriggerover
             * If this button has a menu, this event fires when the mouse enters the menu triggering element
             * @param {Button} this
             * @param {Menu} menu
             * @param {EventObject} e
             */
            'menutriggerover',
            /**
             * @event menutriggerout
             * If this button has a menu, this event fires when the mouse leaves the menu triggering element
             * @param {Button} this
             * @param {Menu} menu
             * @param {EventObject} e
             */
            'menutriggerout'
        );
        if(this.menu){
            this.menu = Ext.menu.MenuMgr.get(this.menu);
        }
        if(Ext.isString(this.toggleGroup)){
            this.enableToggle = true;
        }
    },

/**
  * <p>This method returns an Array which provides substitution parameters for the {@link #template Template} used
  * to create this Button's DOM structure.</p>
  * <p>Instances or subclasses which use a different Template to create a different DOM structure may need to provide their
  * own implementation of this method.</p>
  * <p>The default implementation which provides data for the default {@link #template} returns an Array containing the
  * following items:</p><div class="mdetail-params"><ul>
  * <li>The &lt;button&gt;'s {@link #type}</li>
  * <li>A CSS class name applied to the Button's main &lt;tbody&gt; element which determines the button's scale and icon alignment.</li>
  * <li>A CSS class to determine the presence and position of an arrow icon. (<code>'x-btn-arrow'</code> or <code>'x-btn-arrow-bottom'</code> or <code>''</code>)</li>
  * <li>The {@link #cls} CSS class name applied to the button's wrapping &lt;table&gt; element.</li>
  * <li>The Component id which is applied to the button's wrapping &lt;table&gt; element.</li>
  * </ul></div>
  * @return {Array} Substitution data for a Template.
 */
    getTemplateArgs : function(){
        return [this.type, 'x-btn-' + this.scale + ' x-btn-icon-' + this.scale + '-' + this.iconAlign, this.getMenuClass(), this.cls, this.id];
    },

    // private
    setButtonClass : function(){
        if(this.useSetClass){
            if(!Ext.isEmpty(this.oldCls)){
                this.el.removeClass([this.oldCls, 'x-btn-pressed']);
            }
            this.oldCls = (this.iconCls || this.icon) ? (this.text ? 'x-btn-text-icon' : 'x-btn-icon') : 'x-btn-noicon';
            this.el.addClass([this.oldCls, this.pressed ? 'x-btn-pressed' : null]);
        }
    },

    // protected
    getMenuClass : function(){
        return this.menu ? (this.arrowAlign != 'bottom' ? 'x-btn-arrow' : 'x-btn-arrow-bottom') : '';
    },

    // private
    onRender : function(ct, position){
        if(!this.template){
            if(!Ext.Button.buttonTemplate){
                // hideous table template
                Ext.Button.buttonTemplate = new Ext.Template(
                    '<table id="{4}" cellspacing="0" class="x-btn {3}"><tbody class="{1}">',
                    '<tr><td class="x-btn-tl"><i>&#160;</i></td><td class="x-btn-tc"></td><td class="x-btn-tr"><i>&#160;</i></td></tr>',
                    '<tr><td class="x-btn-ml"><i>&#160;</i></td><td class="x-btn-mc"><em class="{2}" unselectable="on"><button type="{0}"></button></em></td><td class="x-btn-mr"><i>&#160;</i></td></tr>',
                    '<tr><td class="x-btn-bl"><i>&#160;</i></td><td class="x-btn-bc"></td><td class="x-btn-br"><i>&#160;</i></td></tr>',
                    '</tbody></table>');
                Ext.Button.buttonTemplate.compile();
            }
            this.template = Ext.Button.buttonTemplate;
        }

        var btn, targs = this.getTemplateArgs();

        if(position){
            btn = this.template.insertBefore(position, targs, true);
        }else{
            btn = this.template.append(ct, targs, true);
        }
        /**
         * An {@link Ext.Element Element} encapsulating the Button's clickable element. By default,
         * this references a <tt>&lt;button&gt;</tt> element. Read only.
         * @type Ext.Element
         * @property btnEl
         */
        this.btnEl = btn.child(this.buttonSelector);
        this.mon(this.btnEl, {
            scope: this,
            focus: this.onFocus,
            blur: this.onBlur
        });

        this.initButtonEl(btn, this.btnEl);

        Ext.ButtonToggleMgr.register(this);
    },

    // private
    initButtonEl : function(btn, btnEl){
        this.el = btn;
        this.setIcon(this.icon);
        this.setText(this.text);
        this.setIconClass(this.iconCls);
        if(Ext.isDefined(this.tabIndex)){
            btnEl.dom.tabIndex = this.tabIndex;
        }
        if(this.tooltip){
            this.setTooltip(this.tooltip, true);
        }

        if(this.handleMouseEvents){
            this.mon(btn, {
                scope: this,
                mouseover: this.onMouseOver,
                mousedown: this.onMouseDown
            });

            // new functionality for monitoring on the document level
            //this.mon(btn, 'mouseout', this.onMouseOut, this);
        }

        if(this.menu){
            this.mon(this.menu, {
                scope: this,
                show: this.onMenuShow,
                hide: this.onMenuHide
            });
        }

        if(this.repeat){
            var repeater = new Ext.util.ClickRepeater(btn, Ext.isObject(this.repeat) ? this.repeat : {});
            this.mon(repeater, 'click', this.onClick, this);
        }
        this.mon(btn, this.clickEvent, this.onClick, this);
    },

    // private
    afterRender : function(){
        Ext.Button.superclass.afterRender.call(this);
        this.useSetClass = true;
        this.setButtonClass();
        this.doc = Ext.getDoc();
        this.doAutoWidth();
    },

    /**
     * Sets the CSS class that provides a background image to use as the button's icon.  This method also changes
     * the value of the {@link iconCls} config internally.
     * @param {String} cls The CSS class providing the icon image
     * @return {Ext.Button} this
     */
    setIconClass : function(cls){
        this.iconCls = cls;
        if(this.el){
            this.btnEl.dom.className = '';
            this.btnEl.addClass(['x-btn-text', cls || '']);
            this.setButtonClass();
        }
        return this;
    },

    /**
     * Sets the tooltip for this Button.
     * @param {String/Object} tooltip. This may be:<div class="mdesc-details"><ul>
     * <li><b>String</b> : A string to be used as innerHTML (html tags are accepted) to show in a tooltip</li>
     * <li><b>Object</b> : A configuration object for {@link Ext.QuickTips#register}.</li>
     * </ul></div>
     * @return {Ext.Button} this
     */
    setTooltip : function(tooltip, /* private */ initial){
        if(this.rendered){
            if(!initial){
                this.clearTip();
            }
            if(Ext.isObject(tooltip)){
                Ext.QuickTips.register(Ext.apply({
                      target: this.btnEl.id
                }, tooltip));
                this.tooltip = tooltip;
            }else{
                this.btnEl.dom[this.tooltipType] = tooltip;
            }
        }else{
            this.tooltip = tooltip;
        }
        return this;
    },

    // private
    clearTip : function(){
        if(Ext.isObject(this.tooltip)){
            Ext.QuickTips.unregister(this.btnEl);
        }
    },

    // private
    beforeDestroy : function(){
        if(this.rendered){
            this.clearTip();
        }
        if(this.menu && this.destroyMenu !== false) {
            Ext.destroy(this.menu);
        }
        Ext.destroy(this.repeater);
    },

    // private
    onDestroy : function(){
        if(this.rendered){
            this.doc.un('mouseover', this.monitorMouseOver, this);
            this.doc.un('mouseup', this.onMouseUp, this);
            delete this.doc;
            delete this.btnEl;
            Ext.ButtonToggleMgr.unregister(this);
        }
        Ext.Button.superclass.onDestroy.call(this);
    },

    // private
    doAutoWidth : function(){
        if(this.autoWidth !== false && this.el && this.text && this.width === undefined){
            this.el.setWidth('auto');
            if(Ext.isIE7 && Ext.isStrict){
                var ib = this.btnEl;
                if(ib && ib.getWidth() > 20){
                    ib.clip();
                    ib.setWidth(Ext.util.TextMetrics.measure(ib, this.text).width+ib.getFrameWidth('lr'));
                }
            }
            if(this.minWidth){
                if(this.el.getWidth() < this.minWidth){
                    this.el.setWidth(this.minWidth);
                }
            }
        }
    },

    /**
     * Assigns this Button's click handler
     * @param {Function} handler The function to call when the button is clicked
     * @param {Object} scope (optional) The scope (<code>this</code> reference) in which the handler function is executed.
     * Defaults to this Button.
     * @return {Ext.Button} this
     */
    setHandler : function(handler, scope){
        this.handler = handler;
        this.scope = scope;
        return this;
    },

    /**
     * Sets this Button's text
     * @param {String} text The button text
     * @return {Ext.Button} this
     */
    setText : function(text){
        this.text = text;
        if(this.el){
            this.btnEl.update(text || '&#160;');
            this.setButtonClass();
        }
        this.doAutoWidth();
        return this;
    },

    /**
     * Sets the background image (inline style) of the button.  This method also changes
     * the value of the {@link icon} config internally.
     * @param {String} icon The path to an image to display in the button
     * @return {Ext.Button} this
     */
    setIcon : function(icon){
        this.icon = icon;
        if(this.el){
            this.btnEl.setStyle('background-image', icon ? 'url(' + icon + ')' : '');
            this.setButtonClass();
        }
        return this;
    },

    /**
     * Gets the text for this Button
     * @return {String} The button text
     */
    getText : function(){
        return this.text;
    },

    /**
     * If a state it passed, it becomes the pressed state otherwise the current state is toggled.
     * @param {Boolean} state (optional) Force a particular state
     * @param {Boolean} supressEvent (optional) True to stop events being fired when calling this method.
     * @return {Ext.Button} this
     */
    toggle : function(state, suppressEvent){
        state = state === undefined ? !this.pressed : !!state;
        if(state != this.pressed){
            if(this.rendered){
                this.el[state ? 'addClass' : 'removeClass']('x-btn-pressed');
            }
            this.pressed = state;
            if(!suppressEvent){
                this.fireEvent('toggle', this, state);
                if(this.toggleHandler){
                    this.toggleHandler.call(this.scope || this, this, state);
                }
            }
        }
        return this;
    },

    // private
    onDisable : function(){
        this.onDisableChange(true);
    },

    // private
    onEnable : function(){
        this.onDisableChange(false);
    },

    onDisableChange : function(disabled){
        if(this.el){
            if(!Ext.isIE6 || !this.text){
                this.el[disabled ? 'addClass' : 'removeClass'](this.disabledClass);
            }
            this.el.dom.disabled = disabled;
        }
        this.disabled = disabled;
    },

    /**
     * Show this button's menu (if it has one)
     */
    showMenu : function(){
        if(this.rendered && this.menu){
            if(this.tooltip){
                Ext.QuickTips.getQuickTip().cancelShow(this.btnEl);
            }
            if(this.menu.isVisible()){
                this.menu.hide();
            }
            this.menu.ownerCt = this;
            this.menu.show(this.el, this.menuAlign);
        }
        return this;
    },

    /**
     * Hide this button's menu (if it has one)
     */
    hideMenu : function(){
        if(this.hasVisibleMenu()){
            this.menu.hide();
        }
        return this;
    },

    /**
     * Returns true if the button has a menu and it is visible
     * @return {Boolean}
     */
    hasVisibleMenu : function(){
        return this.menu && this.menu.ownerCt == this && this.menu.isVisible();
    },

    // private
    onClick : function(e){
        if(e){
            e.preventDefault();
        }
        if(e.button !== 0){
            return;
        }
        if(!this.disabled){
            if(this.enableToggle && (this.allowDepress !== false || !this.pressed)){
                this.toggle();
            }
            if(this.menu && !this.hasVisibleMenu() && !this.ignoreNextClick){
                this.showMenu();
            }
            this.fireEvent('click', this, e);
            if(this.handler){
                //this.el.removeClass('x-btn-over');
                this.handler.call(this.scope || this, this, e);
            }
        }
    },

    // private
    isMenuTriggerOver : function(e, internal){
        return this.menu && !internal;
    },

    // private
    isMenuTriggerOut : function(e, internal){
        return this.menu && !internal;
    },

    // private
    onMouseOver : function(e){
        if(!this.disabled){
            var internal = e.within(this.el,  true);
            if(!internal){
                this.el.addClass('x-btn-over');
                if(!this.monitoringMouseOver){
                    this.doc.on('mouseover', this.monitorMouseOver, this);
                    this.monitoringMouseOver = true;
                }
                this.fireEvent('mouseover', this, e);
            }
            if(this.isMenuTriggerOver(e, internal)){
                this.fireEvent('menutriggerover', this, this.menu, e);
            }
        }
    },

    // private
    monitorMouseOver : function(e){
        if(e.target != this.el.dom && !e.within(this.el)){
            if(this.monitoringMouseOver){
                this.doc.un('mouseover', this.monitorMouseOver, this);
                this.monitoringMouseOver = false;
            }
            this.onMouseOut(e);
        }
    },

    // private
    onMouseOut : function(e){
        var internal = e.within(this.el) && e.target != this.el.dom;
        this.el.removeClass('x-btn-over');
        this.fireEvent('mouseout', this, e);
        if(this.isMenuTriggerOut(e, internal)){
            this.fireEvent('menutriggerout', this, this.menu, e);
        }
    },

    focus : function() {
        this.btnEl.focus();
    },

    blur : function() {
        this.btnEl.blur();
    },

    // private
    onFocus : function(e){
        if(!this.disabled){
            this.el.addClass('x-btn-focus');
        }
    },
    // private
    onBlur : function(e){
        this.el.removeClass('x-btn-focus');
    },

    // private
    getClickEl : function(e, isUp){
       return this.el;
    },

    // private
    onMouseDown : function(e){
        if(!this.disabled && e.button === 0){
            this.getClickEl(e).addClass('x-btn-click');
            this.doc.on('mouseup', this.onMouseUp, this);
        }
    },
    // private
    onMouseUp : function(e){
        if(e.button === 0){
            this.getClickEl(e, true).removeClass('x-btn-click');
            this.doc.un('mouseup', this.onMouseUp, this);
        }
    },
    // private
    onMenuShow : function(e){
        if(this.menu.ownerCt == this){
            this.menu.ownerCt = this;
            this.ignoreNextClick = 0;
            this.el.addClass('x-btn-menu-active');
            this.fireEvent('menushow', this, this.menu);
        }
    },
    // private
    onMenuHide : function(e){
        if(this.menu.ownerCt == this){
            this.el.removeClass('x-btn-menu-active');
            this.ignoreNextClick = this.restoreClick.defer(250, this);
            this.fireEvent('menuhide', this, this.menu);
            delete this.menu.ownerCt;
        }
    },

    // private
    restoreClick : function(){
        this.ignoreNextClick = 0;
    }

    /**
     * @cfg {String} autoEl @hide
     */
    /**
     * @cfg {String/Object} html @hide
     */
    /**
     * @cfg {String} contentEl  @hide
     */
    /**
     * @cfg {Mixed} data  @hide
     */
    /**
     * @cfg {Mixed} tpl  @hide
     */
    /**
     * @cfg {String} tplWriteMode  @hide
     */
});
Ext.reg('button', Ext.Button);

// Private utility class used by Button
Ext.ButtonToggleMgr = function(){
   var groups = {};

   function toggleGroup(btn, state){
       if(state){
           var g = groups[btn.toggleGroup];
           for(var i = 0, l = g.length; i < l; i++){
               if(g[i] != btn){
                   g[i].toggle(false);
               }
           }
       }
   }

   return {
       register : function(btn){
           if(!btn.toggleGroup){
               return;
           }
           var g = groups[btn.toggleGroup];
           if(!g){
               g = groups[btn.toggleGroup] = [];
           }
           g.push(btn);
           btn.on('toggle', toggleGroup);
       },

       unregister : function(btn){
           if(!btn.toggleGroup){
               return;
           }
           var g = groups[btn.toggleGroup];
           if(g){
               g.remove(btn);
               btn.un('toggle', toggleGroup);
           }
       },

       /**
        * Gets the pressed button in the passed group or null
        * @param {String} group
        * @return Button
        */
       getPressed : function(group){
           var g = groups[group];
           if(g){
               for(var i = 0, len = g.length; i < len; i++){
                   if(g[i].pressed === true){
                       return g[i];
                   }
               }
           }
           return null;
       }
   };
}();
/**
 * @class Ext.SplitButton
 * @extends Ext.Button
 * A split button that provides a built-in dropdown arrow that can fire an event separately from the default
 * click event of the button.  Typically this would be used to display a dropdown menu that provides additional
 * options to the primary button action, but any custom handler can provide the arrowclick implementation.  Example usage:
 * <pre><code>
// display a dropdown menu:
new Ext.SplitButton({
	renderTo: 'button-ct', // the container id
   	text: 'Options',
   	handler: optionsHandler, // handle a click on the button itself
   	menu: new Ext.menu.Menu({
        items: [
        	// these items will render as dropdown menu items when the arrow is clicked:
	        {text: 'Item 1', handler: item1Handler},
	        {text: 'Item 2', handler: item2Handler}
        ]
   	})
});

// Instead of showing a menu, you provide any type of custom
// functionality you want when the dropdown arrow is clicked:
new Ext.SplitButton({
	renderTo: 'button-ct',
   	text: 'Options',
   	handler: optionsHandler,
   	arrowHandler: myCustomHandler
});
</code></pre>
 * @cfg {Function} arrowHandler A function called when the arrow button is clicked (can be used instead of click event)
 * @cfg {String} arrowTooltip The title attribute of the arrow
 * @constructor
 * Create a new menu button
 * @param {Object} config The config object
 * @xtype splitbutton
 */
Ext.SplitButton = Ext.extend(Ext.Button, {
	// private
    arrowSelector : 'em',
    split: true,

    // private
    initComponent : function(){
        Ext.SplitButton.superclass.initComponent.call(this);
        /**
         * @event arrowclick
         * Fires when this button's arrow is clicked
         * @param {MenuButton} this
         * @param {EventObject} e The click event
         */
        this.addEvents("arrowclick");
    },

    // private
    onRender : function(){
        Ext.SplitButton.superclass.onRender.apply(this, arguments);
        if(this.arrowTooltip){
            this.el.child(this.arrowSelector).dom[this.tooltipType] = this.arrowTooltip;
        }
    },

    /**
     * Sets this button's arrow click handler.
     * @param {Function} handler The function to call when the arrow is clicked
     * @param {Object} scope (optional) Scope for the function passed above
     */
    setArrowHandler : function(handler, scope){
        this.arrowHandler = handler;
        this.scope = scope;
    },

    getMenuClass : function(){
        return 'x-btn-split' + (this.arrowAlign == 'bottom' ? '-bottom' : '');
    },

    isClickOnArrow : function(e){
	if (this.arrowAlign != 'bottom') {
	    var visBtn = this.el.child('em.x-btn-split');
	    var right = visBtn.getRegion().right - visBtn.getPadding('r');
	    return e.getPageX() > right;
	} else {
	    return e.getPageY() > this.btnEl.getRegion().bottom;
	}
    },

    // private
    onClick : function(e, t){
        e.preventDefault();
        if(!this.disabled){
            if(this.isClickOnArrow(e)){
                if(this.menu && !this.menu.isVisible() && !this.ignoreNextClick){
                    this.showMenu();
                }
                this.fireEvent("arrowclick", this, e);
                if(this.arrowHandler){
                    this.arrowHandler.call(this.scope || this, this, e);
                }
            }else{
                if(this.enableToggle){
                    this.toggle();
                }
                this.fireEvent("click", this, e);
                if(this.handler){
                    this.handler.call(this.scope || this, this, e);
                }
            }
        }
    },

    // private
    isMenuTriggerOver : function(e){
        return this.menu && e.target.tagName == this.arrowSelector;
    },

    // private
    isMenuTriggerOut : function(e, internal){
        return this.menu && e.target.tagName != this.arrowSelector;
    }
});

Ext.reg('splitbutton', Ext.SplitButton);/**
 * @class Ext.CycleButton
 * @extends Ext.SplitButton
 * A specialized SplitButton that contains a menu of {@link Ext.menu.CheckItem} elements.  The button automatically
 * cycles through each menu item on click, raising the button's {@link #change} event (or calling the button's
 * {@link #changeHandler} function, if supplied) for the active menu item. Clicking on the arrow section of the
 * button displays the dropdown menu just like a normal SplitButton.  Example usage:
 * <pre><code>
var btn = new Ext.CycleButton({
    showText: true,
    prependText: 'View as ',
    items: [{
        text:'text only',
        iconCls:'view-text',
        checked:true
    },{
        text:'HTML',
        iconCls:'view-html'
    }],
    changeHandler:function(btn, item){
        Ext.Msg.alert('Change View', item.text);
    }
});
</code></pre>
 * @constructor
 * Create a new split button
 * @param {Object} config The config object
 * @xtype cycle
 */
Ext.CycleButton = Ext.extend(Ext.SplitButton, {
    /**
     * @cfg {Array} items An array of {@link Ext.menu.CheckItem} <b>config</b> objects to be used when creating the
     * button's menu items (e.g., {text:'Foo', iconCls:'foo-icon'})
     */
    /**
     * @cfg {Boolean} showText True to display the active item's text as the button text (defaults to false)
     */
    /**
     * @cfg {String} prependText A static string to prepend before the active item's text when displayed as the
     * button's text (only applies when showText = true, defaults to '')
     */
    /**
     * @cfg {Function} changeHandler A callback function that will be invoked each time the active menu
     * item in the button's menu has changed.  If this callback is not supplied, the SplitButton will instead
     * fire the {@link #change} event on active item change.  The changeHandler function will be called with the
     * following argument list: (SplitButton this, Ext.menu.CheckItem item)
     */
    /**
     * @cfg {String} forceIcon A css class which sets an image to be used as the static icon for this button.  This
     * icon will always be displayed regardless of which item is selected in the dropdown list.  This overrides the 
     * default behavior of changing the button's icon to match the selected item's icon on change.
     */
    /**
     * @property menu
     * @type Menu
     * The {@link Ext.menu.Menu Menu} object used to display the {@link Ext.menu.CheckItem CheckItems} representing the available choices.
     */

    // private
    getItemText : function(item){
        if(item && this.showText === true){
            var text = '';
            if(this.prependText){
                text += this.prependText;
            }
            text += item.text;
            return text;
        }
        return undefined;
    },

    /**
     * Sets the button's active menu item.
     * @param {Ext.menu.CheckItem} item The item to activate
     * @param {Boolean} suppressEvent True to prevent the button's change event from firing (defaults to false)
     */
    setActiveItem : function(item, suppressEvent){
        if(!Ext.isObject(item)){
            item = this.menu.getComponent(item);
        }
        if(item){
            if(!this.rendered){
                this.text = this.getItemText(item);
                this.iconCls = item.iconCls;
            }else{
                var t = this.getItemText(item);
                if(t){
                    this.setText(t);
                }
                this.setIconClass(item.iconCls);
            }
            this.activeItem = item;
            if(!item.checked){
                item.setChecked(true, false);
            }
            if(this.forceIcon){
                this.setIconClass(this.forceIcon);
            }
            if(!suppressEvent){
                this.fireEvent('change', this, item);
            }
        }
    },

    /**
     * Gets the currently active menu item.
     * @return {Ext.menu.CheckItem} The active item
     */
    getActiveItem : function(){
        return this.activeItem;
    },

    // private
    initComponent : function(){
        this.addEvents(
            /**
             * @event change
             * Fires after the button's active menu item has changed.  Note that if a {@link #changeHandler} function
             * is set on this CycleButton, it will be called instead on active item change and this change event will
             * not be fired.
             * @param {Ext.CycleButton} this
             * @param {Ext.menu.CheckItem} item The menu item that was selected
             */
            "change"
        );

        if(this.changeHandler){
            this.on('change', this.changeHandler, this.scope||this);
            delete this.changeHandler;
        }

        this.itemCount = this.items.length;

        this.menu = {cls:'x-cycle-menu', items:[]};
        var checked = 0;
        Ext.each(this.items, function(item, i){
            Ext.apply(item, {
                group: item.group || this.id,
                itemIndex: i,
                checkHandler: this.checkHandler,
                scope: this,
                checked: item.checked || false
            });
            this.menu.items.push(item);
            if(item.checked){
                checked = i;
            }
        }, this);
        Ext.CycleButton.superclass.initComponent.call(this);
        this.on('click', this.toggleSelected, this);
        this.setActiveItem(checked, true);
    },

    // private
    checkHandler : function(item, pressed){
        if(pressed){
            this.setActiveItem(item);
        }
    },

    /**
     * This is normally called internally on button click, but can be called externally to advance the button's
     * active item programmatically to the next one in the menu.  If the current item is the last one in the menu
     * the active item will be set to the first item in the menu.
     */
    toggleSelected : function(){
        var m = this.menu;
        m.render();
        // layout if we haven't before so the items are active
        if(!m.hasLayout){
            m.doLayout();
        }
        
        var nextIdx, checkItem;
        for (var i = 1; i < this.itemCount; i++) {
            nextIdx = (this.activeItem.itemIndex + i) % this.itemCount;
            // check the potential item
            checkItem = m.items.itemAt(nextIdx);
            // if its not disabled then check it.
            if (!checkItem.disabled) {
                checkItem.setChecked(true);
                break;
            }
        }
    }
});
Ext.reg('cycle', Ext.CycleButton);