/*!
 * Ext JS Library 3.2.1
 * Copyright(c) 2006-2010 Ext JS, Inc.
 * licensing@extjs.com
 * http://www.extjs.com/license
 */
/**
 * @class Ext.TabPanel
 * <p>A basic tab container. TabPanels can be used exactly like a standard {@link Ext.Panel}
 * for layout purposes, but also have special support for containing child Components
 * (<tt>{@link Ext.Container#items items}</tt>) that are managed using a
 * {@link Ext.layout.CardLayout CardLayout layout manager}, and displayed as separate tabs.</p>
 *
 * <b>Note:</b> By default, a tab's close tool <i>destroys</i> the child tab Component
 * and all its descendants. This makes the child tab Component, and all its descendants <b>unusable</b>. To enable
 * re-use of a tab, configure the TabPanel with <b><code>{@link #autoDestroy autoDestroy: false}</code></b>.
 *
 * <p><b><u>TabPanel header/footer elements</u></b></p>
 * <p>TabPanels use their {@link Ext.Panel#header header} or {@link Ext.Panel#footer footer} element
 * (depending on the {@link #tabPosition} configuration) to accommodate the tab selector buttons.
 * This means that a TabPanel will not display any configured title, and will not display any
 * configured header {@link Ext.Panel#tools tools}.</p>
 * <p>To display a header, embed the TabPanel in a {@link Ext.Panel Panel} which uses
 * <b><tt>{@link Ext.Container#layout layout:'fit'}</tt></b>.</p>
 *
 * <p><b><u>Tab Events</u></b></p>
 * <p>There is no actual tab class &mdash; each tab is simply a {@link Ext.BoxComponent Component}
 * such as a {@link Ext.Panel Panel}. However, when rendered in a TabPanel, each child Component
 * can fire additional events that only exist for tabs and are not available from other Components.
 * These events are:</p>
 * <div><ul class="mdetail-params">
 * <li><tt><b>{@link Ext.Panel#activate activate}</b></tt> : Fires when this Component becomes
 * the active tab.</li>
 * <li><tt><b>{@link Ext.Panel#deactivate deactivate}</b></tt> : Fires when the Component that
 * was the active tab becomes deactivated.</li>
 * <li><tt><b>{@link Ext.Panel#beforeclose beforeclose}</b></tt> : Fires when the user clicks on the close tool of a closeable tab.
 * May be vetoed by returning <code>false</code> from a handler.</li>
 * <li><tt><b>{@link Ext.Panel#close close}</b></tt> : Fires a closeable tab has been closed by the user.</li>
 * </ul></div>
 * <p><b><u>Creating TabPanels from Code</u></b></p>
 * <p>TabPanels can be created and rendered completely in code, as in this example:</p>
 * <pre><code>
var tabs = new Ext.TabPanel({
    renderTo: Ext.getBody(),
    activeTab: 0,
    items: [{
        title: 'Tab 1',
        html: 'A simple tab'
    },{
        title: 'Tab 2',
        html: 'Another one'
    }]
});
</code></pre>
 * <p><b><u>Creating TabPanels from Existing Markup</u></b></p>
 * <p>TabPanels can also be rendered from pre-existing markup in a couple of ways.</p>
 * <div><ul class="mdetail-params">
 *
 * <li>Pre-Structured Markup</li>
 * <div class="sub-desc">
 * <p>A container div with one or more nested tab divs with class <tt>'x-tab'</tt> can be rendered entirely
 * from existing markup (See the {@link #autoTabs} example).</p>
 * </div>
 *
 * <li>Un-Structured Markup</li>
 * <div class="sub-desc">
 * <p>A TabPanel can also be rendered from markup that is not strictly structured by simply specifying by id
 * which elements should be the container and the tabs. Using this method tab content can be pulled from different
 * elements within the page by id regardless of page structure. For example:</p>
 * <pre><code>
var tabs = new Ext.TabPanel({
    renderTo: 'my-tabs',
    activeTab: 0,
    items:[
        {contentEl:'tab1', title:'Tab 1'},
        {contentEl:'tab2', title:'Tab 2'}
    ]
});

// Note that the tabs do not have to be nested within the container (although they can be)
&lt;div id="my-tabs">&lt;/div>
&lt;div id="tab1" class="x-hide-display">A simple tab&lt;/div>
&lt;div id="tab2" class="x-hide-display">Another one&lt;/div>
</code></pre>
 * Note that the tab divs in this example contain the class <tt>'x-hide-display'</tt> so that they can be rendered
 * deferred without displaying outside the tabs. You could alternately set <tt>{@link #deferredRender} = false </tt>
 * to render all content tabs on page load.
 * </div>
 *
 * </ul></div>
 *
 * @extends Ext.Panel
 * @constructor
 * @param {Object} config The configuration options
 * @xtype tabpanel
 */
Ext.TabPanel = Ext.extend(Ext.Panel,  {
    /**
     * @cfg {Boolean} layoutOnTabChange
     * Set to true to force a layout of the active tab when the tab is changed. Defaults to false.
     * See {@link Ext.layout.CardLayout}.<code>{@link Ext.layout.CardLayout#layoutOnCardChange layoutOnCardChange}</code>.
     */
    /**
     * @cfg {String} tabCls <b>This config option is used on <u>child Components</u> of ths TabPanel.</b> A CSS
     * class name applied to the tab strip item representing the child Component, allowing special
     * styling to be applied.
     */
    /**
     * @cfg {Boolean} deferredRender
     * <p><tt>true</tt> by default to defer the rendering of child <tt>{@link Ext.Container#items items}</tt>
     * to the browsers DOM until a tab is activated. <tt>false</tt> will render all contained
     * <tt>{@link Ext.Container#items items}</tt> as soon as the {@link Ext.layout.CardLayout layout}
     * is rendered. If there is a significant amount of content or a lot of heavy controls being
     * rendered into panels that are not displayed by default, setting this to <tt>true</tt> might
     * improve performance.</p>
     * <br><p>The <tt>deferredRender</tt> property is internally passed to the layout manager for
     * TabPanels ({@link Ext.layout.CardLayout}) as its {@link Ext.layout.CardLayout#deferredRender}
     * configuration value.</p>
     * <br><p><b>Note</b>: leaving <tt>deferredRender</tt> as <tt>true</tt> means that the content
     * within an unactivated tab will not be available. For example, this means that if the TabPanel
     * is within a {@link Ext.form.FormPanel form}, then until a tab is activated, any Fields within
     * unactivated tabs will not be rendered, and will therefore not be submitted and will not be
     * available to either {@link Ext.form.BasicForm#getValues getValues} or
     * {@link Ext.form.BasicForm#setValues setValues}.</p>
     */
    deferredRender : true,
    /**
     * @cfg {Number} tabWidth The initial width in pixels of each new tab (defaults to 120).
     */
    tabWidth : 120,
    /**
     * @cfg {Number} minTabWidth The minimum width in pixels for each tab when {@link #resizeTabs} = true (defaults to 30).
     */
    minTabWidth : 30,
    /**
     * @cfg {Boolean} resizeTabs True to automatically resize each tab so that the tabs will completely fill the
     * tab strip (defaults to false).  Setting this to true may cause specific widths that might be set per tab to
     * be overridden in order to fit them all into view (although {@link #minTabWidth} will always be honored).
     */
    resizeTabs : false,
    /**
     * @cfg {Boolean} enableTabScroll True to enable scrolling to tabs that may be invisible due to overflowing the
     * overall TabPanel width. Only available with tabPosition:'top' (defaults to false).
     */
    enableTabScroll : false,
    /**
     * @cfg {Number} scrollIncrement The number of pixels to scroll each time a tab scroll button is pressed
     * (defaults to <tt>100</tt>, or if <tt>{@link #resizeTabs} = true</tt>, the calculated tab width).  Only
     * applies when <tt>{@link #enableTabScroll} = true</tt>.
     */
    scrollIncrement : 0,
    /**
     * @cfg {Number} scrollRepeatInterval Number of milliseconds between each scroll while a tab scroll button is
     * continuously pressed (defaults to <tt>400</tt>).
     */
    scrollRepeatInterval : 400,
    /**
     * @cfg {Float} scrollDuration The number of milliseconds that each scroll animation should last (defaults
     * to <tt>.35</tt>). Only applies when <tt>{@link #animScroll} = true</tt>.
     */
    scrollDuration : 0.35,
    /**
     * @cfg {Boolean} animScroll True to animate tab scrolling so that hidden tabs slide smoothly into view (defaults
     * to <tt>true</tt>).  Only applies when <tt>{@link #enableTabScroll} = true</tt>.
     */
    animScroll : true,
    /**
     * @cfg {String} tabPosition The position where the tab strip should be rendered (defaults to <tt>'top'</tt>).
     * The only other supported value is <tt>'bottom'</tt>.  <b>Note</b>: tab scrolling is only supported for
     * <tt>tabPosition: 'top'</tt>.
     */
    tabPosition : 'top',
    /**
     * @cfg {String} baseCls The base CSS class applied to the panel (defaults to <tt>'x-tab-panel'</tt>).
     */
    baseCls : 'x-tab-panel',
    /**
     * @cfg {Boolean} autoTabs
     * <p><tt>true</tt> to query the DOM for any divs with a class of 'x-tab' to be automatically converted
     * to tabs and added to this panel (defaults to <tt>false</tt>).  Note that the query will be executed within
     * the scope of the container element only (so that multiple tab panels from markup can be supported via this
     * method).</p>
     * <p>This method is only possible when the markup is structured correctly as a container with nested divs
     * containing the class <tt>'x-tab'</tt>. To create TabPanels without these limitations, or to pull tab content
     * from other elements on the page, see the example at the top of the class for generating tabs from markup.</p>
     * <p>There are a couple of things to note when using this method:<ul>
     * <li>When using the <tt>autoTabs</tt> config (as opposed to passing individual tab configs in the TabPanel's
     * {@link #items} collection), you must use <tt>{@link #applyTo}</tt> to correctly use the specified <tt>id</tt>
     * as the tab container. The <tt>autoTabs</tt> method <em>replaces</em> existing content with the TabPanel
     * components.</li>
     * <li>Make sure that you set <tt>{@link #deferredRender}: false</tt> so that the content elements for each
     * tab will be rendered into the TabPanel immediately upon page load, otherwise they will not be transformed
     * until each tab is activated and will be visible outside the TabPanel.</li>
     * </ul>Example usage:</p>
     * <pre><code>
var tabs = new Ext.TabPanel({
    applyTo: 'my-tabs',
    activeTab: 0,
    deferredRender: false,
    autoTabs: true
});

// This markup will be converted to a TabPanel from the code above
&lt;div id="my-tabs">
    &lt;div class="x-tab" title="Tab 1">A simple tab&lt;/div>
    &lt;div class="x-tab" title="Tab 2">Another one&lt;/div>
&lt;/div>
</code></pre>
     */
    autoTabs : false,
    /**
     * @cfg {String} autoTabSelector The CSS selector used to search for tabs in existing markup when
     * <tt>{@link #autoTabs} = true</tt> (defaults to <tt>'div.x-tab'</tt>).  This can be any valid selector
     * supported by {@link Ext.DomQuery#select}. Note that the query will be executed within the scope of this
     * tab panel only (so that multiple tab panels from markup can be supported on a page).
     */
    autoTabSelector : 'div.x-tab',
    /**
     * @cfg {String/Number} activeTab A string id or the numeric index of the tab that should be initially
     * activated on render (defaults to undefined).
     */
    activeTab : undefined,
    /**
     * @cfg {Number} tabMargin The number of pixels of space to calculate into the sizing and scrolling of
     * tabs. If you change the margin in CSS, you will need to update this value so calculations are correct
     * with either <tt>{@link #resizeTabs}</tt> or scrolling tabs. (defaults to <tt>2</tt>)
     */
    tabMargin : 2,
    /**
     * @cfg {Boolean} plain </tt>true</tt> to render the tab strip without a background container image
     * (defaults to <tt>false</tt>).
     */
    plain : false,
    /**
     * @cfg {Number} wheelIncrement For scrolling tabs, the number of pixels to increment on mouse wheel
     * scrolling (defaults to <tt>20</tt>).
     */
    wheelIncrement : 20,

    /*
     * This is a protected property used when concatenating tab ids to the TabPanel id for internal uniqueness.
     * It does not generally need to be changed, but can be if external code also uses an id scheme that can
     * potentially clash with this one.
     */
    idDelimiter : '__',

    // private
    itemCls : 'x-tab-item',

    // private config overrides
    elements : 'body',
    headerAsText : false,
    frame : false,
    hideBorders :true,

    // private
    initComponent : function(){
        this.frame = false;
        Ext.TabPanel.superclass.initComponent.call(this);
        this.addEvents(
            /**
             * @event beforetabchange
             * Fires before the active tab changes. Handlers can <tt>return false</tt> to cancel the tab change.
             * @param {TabPanel} this
             * @param {Panel} newTab The tab being activated
             * @param {Panel} currentTab The current active tab
             */
            'beforetabchange',
            /**
             * @event tabchange
             * Fires after the active tab has changed.
             * @param {TabPanel} this
             * @param {Panel} tab The new active tab
             */
            'tabchange',
            /**
             * @event contextmenu
             * Relays the contextmenu event from a tab selector element in the tab strip.
             * @param {TabPanel} this
             * @param {Panel} tab The target tab
             * @param {EventObject} e
             */
            'contextmenu'
        );
        /**
         * @cfg {Object} layoutConfig
         * TabPanel implicitly uses {@link Ext.layout.CardLayout} as its layout manager.
         * <code>layoutConfig</code> may be used to configure this layout manager.
         * <code>{@link #deferredRender}</code> and <code>{@link #layoutOnTabChange}</code>
         * configured on the TabPanel will be applied as configs to the layout manager.
         */
        this.setLayout(new Ext.layout.CardLayout(Ext.apply({
            layoutOnCardChange: this.layoutOnTabChange,
            deferredRender: this.deferredRender
        }, this.layoutConfig)));

        if(this.tabPosition == 'top'){
            this.elements += ',header';
            this.stripTarget = 'header';
        }else {
            this.elements += ',footer';
            this.stripTarget = 'footer';
        }
        if(!this.stack){
            this.stack = Ext.TabPanel.AccessStack();
        }
        this.initItems();
    },

    // private
    onRender : function(ct, position){
        Ext.TabPanel.superclass.onRender.call(this, ct, position);

        if(this.plain){
            var pos = this.tabPosition == 'top' ? 'header' : 'footer';
            this[pos].addClass('x-tab-panel-'+pos+'-plain');
        }

        var st = this[this.stripTarget];

        this.stripWrap = st.createChild({cls:'x-tab-strip-wrap', cn:{
            tag:'ul', cls:'x-tab-strip x-tab-strip-'+this.tabPosition}});

        var beforeEl = (this.tabPosition=='bottom' ? this.stripWrap : null);
        st.createChild({cls:'x-tab-strip-spacer'}, beforeEl);
        this.strip = new Ext.Element(this.stripWrap.dom.firstChild);

        // create an empty span with class x-tab-strip-text to force the height of the header element when there's no tabs.
        this.edge = this.strip.createChild({tag:'li', cls:'x-tab-edge', cn: [{tag: 'span', cls: 'x-tab-strip-text', cn: '&#160;'}]});
        this.strip.createChild({cls:'x-clear'});

        this.body.addClass('x-tab-panel-body-'+this.tabPosition);

        /**
         * @cfg {Template/XTemplate} itemTpl <p>(Optional) A {@link Ext.Template Template} or
         * {@link Ext.XTemplate XTemplate} which may be provided to process the data object returned from
         * <tt>{@link #getTemplateArgs}</tt> to produce a clickable selector element in the tab strip.</p>
         * <p>The main element created should be a <tt>&lt;li></tt> element. In order for a click event on
         * a selector element to be connected to its item, it must take its <i>id</i> from the TabPanel's
         * native <tt>{@link #getTemplateArgs}</tt>.</p>
         * <p>The child element which contains the title text must be marked by the CSS class
         * <tt>x-tab-strip-inner</tt>.</p>
         * <p>To enable closability, the created element should contain an element marked by the CSS class
         * <tt>x-tab-strip-close</tt>.</p>
         * <p>If a custom <tt>itemTpl</tt> is supplied, it is the developer's responsibility to create CSS
         * style rules to create the desired appearance.</p>
         * Below is an example of how to create customized tab selector items:<pre><code>
new Ext.TabPanel({
    renderTo: document.body,
    minTabWidth: 115,
    tabWidth: 135,
    enableTabScroll: true,
    width: 600,
    height: 250,
    defaults: {autoScroll:true},
    itemTpl: new Ext.XTemplate(
    '&lt;li class="{cls}" id="{id}" style="overflow:hidden">',
         '&lt;tpl if="closable">',
            '&lt;a class="x-tab-strip-close">&lt;/a>',
         '&lt;/tpl>',
         '&lt;a class="x-tab-right" href="#" style="padding-left:6px">',
            '&lt;em class="x-tab-left">',
                '&lt;span class="x-tab-strip-inner">',
                    '&lt;img src="{src}" style="float:left;margin:3px 3px 0 0">',
                    '&lt;span style="margin-left:20px" class="x-tab-strip-text {iconCls}">{text} {extra}&lt;/span>',
                '&lt;/span>',
            '&lt;/em>',
        '&lt;/a>',
    '&lt;/li>'
    ),
    getTemplateArgs: function(item) {
//      Call the native method to collect the base data. Like the ID!
        var result = Ext.TabPanel.prototype.getTemplateArgs.call(this, item);

//      Add stuff used in our template
        return Ext.apply(result, {
            closable: item.closable,
            src: item.iconSrc,
            extra: item.extraText || ''
        });
    },
    items: [{
        title: 'New Tab 1',
        iconSrc: '../shared/icons/fam/grid.png',
        html: 'Tab Body 1',
        closable: true
    }, {
        title: 'New Tab 2',
        iconSrc: '../shared/icons/fam/grid.png',
        html: 'Tab Body 2',
        extraText: 'Extra stuff in the tab button'
    }]
});
</code></pre>
         */
        if(!this.itemTpl){
            var tt = new Ext.Template(
                 '<li class="{cls}" id="{id}"><a class="x-tab-strip-close"></a>',
                 '<a class="x-tab-right" href="#"><em class="x-tab-left">',
                 '<span class="x-tab-strip-inner"><span class="x-tab-strip-text {iconCls}">{text}</span></span>',
                 '</em></a></li>'
            );
            tt.disableFormats = true;
            tt.compile();
            Ext.TabPanel.prototype.itemTpl = tt;
        }

        this.items.each(this.initTab, this);
    },

    // private
    afterRender : function(){
        Ext.TabPanel.superclass.afterRender.call(this);
        if(this.autoTabs){
            this.readTabs(false);
        }
        if(this.activeTab !== undefined){
            var item = Ext.isObject(this.activeTab) ? this.activeTab : this.items.get(this.activeTab);
            delete this.activeTab;
            this.setActiveTab(item);
        }
    },

    // private
    initEvents : function(){
        Ext.TabPanel.superclass.initEvents.call(this);
        this.mon(this.strip, {
            scope: this,
            mousedown: this.onStripMouseDown,
            contextmenu: this.onStripContextMenu
        });
        if(this.enableTabScroll){
            this.mon(this.strip, 'mousewheel', this.onWheel, this);
        }
    },

    // private
    findTargets : function(e){
        var item = null,
            itemEl = e.getTarget('li:not(.x-tab-edge)', this.strip);

        if(itemEl){
            item = this.getComponent(itemEl.id.split(this.idDelimiter)[1]);
            if(item.disabled){
                return {
                    close : null,
                    item : null,
                    el : null
                };
            }
        }
        return {
            close : e.getTarget('.x-tab-strip-close', this.strip),
            item : item,
            el : itemEl
        };
    },

    // private
    onStripMouseDown : function(e){
        if(e.button !== 0){
            return;
        }
        e.preventDefault();
        var t = this.findTargets(e);
        if(t.close){
            if (t.item.fireEvent('beforeclose', t.item) !== false) {
                t.item.fireEvent('close', t.item);
                this.remove(t.item);
            }
            return;
        }
        if(t.item && t.item != this.activeTab){
            this.setActiveTab(t.item);
        }
    },

    // private
    onStripContextMenu : function(e){
        e.preventDefault();
        var t = this.findTargets(e);
        if(t.item){
            this.fireEvent('contextmenu', this, t.item, e);
        }
    },

    /**
     * True to scan the markup in this tab panel for <tt>{@link #autoTabs}</tt> using the
     * <tt>{@link #autoTabSelector}</tt>
     * @param {Boolean} removeExisting True to remove existing tabs
     */
    readTabs : function(removeExisting){
        if(removeExisting === true){
            this.items.each(function(item){
                this.remove(item);
            }, this);
        }
        var tabs = this.el.query(this.autoTabSelector);
        for(var i = 0, len = tabs.length; i < len; i++){
            var tab = tabs[i],
                title = tab.getAttribute('title');
            tab.removeAttribute('title');
            this.add({
                title: title,
                contentEl: tab
            });
        }
    },

    // private
    initTab : function(item, index){
        var before = this.strip.dom.childNodes[index],
            p = this.getTemplateArgs(item),
            el = before ?
                 this.itemTpl.insertBefore(before, p) :
                 this.itemTpl.append(this.strip, p),
            cls = 'x-tab-strip-over',
            tabEl = Ext.get(el);

        tabEl.hover(function(){
            if(!item.disabled){
                tabEl.addClass(cls);
            }
        }, function(){
            tabEl.removeClass(cls);
        });

        if(item.tabTip){
            tabEl.child('span.x-tab-strip-text', true).qtip = item.tabTip;
        }
        item.tabEl = el;

        // Route *keyboard triggered* click events to the tab strip mouse handler.
        tabEl.select('a').on('click', function(e){
            if(!e.getPageX()){
                this.onStripMouseDown(e);
            }
        }, this, {preventDefault: true});

        item.on({
            scope: this,
            disable: this.onItemDisabled,
            enable: this.onItemEnabled,
            titlechange: this.onItemTitleChanged,
            iconchange: this.onItemIconChanged,
            beforeshow: this.onBeforeShowItem
        });
    },



    /**
     * <p>Provides template arguments for rendering a tab selector item in the tab strip.</p>
     * <p>This method returns an object hash containing properties used by the TabPanel's <tt>{@link #itemTpl}</tt>
     * to create a formatted, clickable tab selector element. The properties which must be returned
     * are:</p><div class="mdetail-params"><ul>
     * <li><b>id</b> : String<div class="sub-desc">A unique identifier which links to the item</div></li>
     * <li><b>text</b> : String<div class="sub-desc">The text to display</div></li>
     * <li><b>cls</b> : String<div class="sub-desc">The CSS class name</div></li>
     * <li><b>iconCls</b> : String<div class="sub-desc">A CSS class to provide appearance for an icon.</div></li>
     * </ul></div>
     * @param {Ext.BoxComponent} item The {@link Ext.BoxComponent BoxComponent} for which to create a selector element in the tab strip.
     * @return {Object} An object hash containing the properties required to render the selector element.
     */
    getTemplateArgs : function(item) {
        var cls = item.closable ? 'x-tab-strip-closable' : '';
        if(item.disabled){
            cls += ' x-item-disabled';
        }
        if(item.iconCls){
            cls += ' x-tab-with-icon';
        }
        if(item.tabCls){
            cls += ' ' + item.tabCls;
        }

        return {
            id: this.id + this.idDelimiter + item.getItemId(),
            text: item.title,
            cls: cls,
            iconCls: item.iconCls || ''
        };
    },

    // private
    onAdd : function(c){
        Ext.TabPanel.superclass.onAdd.call(this, c);
        if(this.rendered){
            var items = this.items;
            this.initTab(c, items.indexOf(c));
            this.delegateUpdates();
        }
    },

    // private
    onBeforeAdd : function(item){
        var existing = item.events ? (this.items.containsKey(item.getItemId()) ? item : null) : this.items.get(item);
        if(existing){
            this.setActiveTab(item);
            return false;
        }
        Ext.TabPanel.superclass.onBeforeAdd.apply(this, arguments);
        var es = item.elements;
        item.elements = es ? es.replace(',header', '') : es;
        item.border = (item.border === true);
    },

    // private
    onRemove : function(c){
        var te = Ext.get(c.tabEl);
        // check if the tabEl exists, it won't if the tab isn't rendered
        if(te){
            te.select('a').removeAllListeners();
            Ext.destroy(te);
        }
        Ext.TabPanel.superclass.onRemove.call(this, c);
        this.stack.remove(c);
        delete c.tabEl;
        c.un('disable', this.onItemDisabled, this);
        c.un('enable', this.onItemEnabled, this);
        c.un('titlechange', this.onItemTitleChanged, this);
        c.un('iconchange', this.onItemIconChanged, this);
        c.un('beforeshow', this.onBeforeShowItem, this);
        if(c == this.activeTab){
            var next = this.stack.next();
            if(next){
                this.setActiveTab(next);
            }else if(this.items.getCount() > 0){
                this.setActiveTab(0);
            }else{
                this.setActiveTab(null);
            }
        }
        if(!this.destroying){
            this.delegateUpdates();
        }
    },

    // private
    onBeforeShowItem : function(item){
        if(item != this.activeTab){
            this.setActiveTab(item);
            return false;
        }
    },

    // private
    onItemDisabled : function(item){
        var el = this.getTabEl(item);
        if(el){
            Ext.fly(el).addClass('x-item-disabled');
        }
        this.stack.remove(item);
    },

    // private
    onItemEnabled : function(item){
        var el = this.getTabEl(item);
        if(el){
            Ext.fly(el).removeClass('x-item-disabled');
        }
    },

    // private
    onItemTitleChanged : function(item){
        var el = this.getTabEl(item);
        if(el){
            Ext.fly(el).child('span.x-tab-strip-text', true).innerHTML = item.title;
        }
    },

    //private
    onItemIconChanged : function(item, iconCls, oldCls){
        var el = this.getTabEl(item);
        if(el){
            el = Ext.get(el);
            el.child('span.x-tab-strip-text').replaceClass(oldCls, iconCls);
            el[Ext.isEmpty(iconCls) ? 'removeClass' : 'addClass']('x-tab-with-icon');
        }
    },

    /**
     * Gets the DOM element for the tab strip item which activates the child panel with the specified
     * ID. Access this to change the visual treatment of the item, for example by changing the CSS class name.
     * @param {Panel/Number/String} tab The tab component, or the tab's index, or the tabs id or itemId.
     * @return {HTMLElement} The DOM node
     */
    getTabEl : function(item){
        var c = this.getComponent(item);
        return c ? c.tabEl : null;
    },

    // private
    onResize : function(){
        Ext.TabPanel.superclass.onResize.apply(this, arguments);
        this.delegateUpdates();
    },

    /**
     * Suspends any internal calculations or scrolling while doing a bulk operation. See {@link #endUpdate}
     */
    beginUpdate : function(){
        this.suspendUpdates = true;
    },

    /**
     * Resumes calculations and scrolling at the end of a bulk operation. See {@link #beginUpdate}
     */
    endUpdate : function(){
        this.suspendUpdates = false;
        this.delegateUpdates();
    },

    /**
     * Hides the tab strip item for the passed tab
     * @param {Number/String/Panel} item The tab index, id or item
     */
    hideTabStripItem : function(item){
        item = this.getComponent(item);
        var el = this.getTabEl(item);
        if(el){
            el.style.display = 'none';
            this.delegateUpdates();
        }
        this.stack.remove(item);
    },

    /**
     * Unhides the tab strip item for the passed tab
     * @param {Number/String/Panel} item The tab index, id or item
     */
    unhideTabStripItem : function(item){
        item = this.getComponent(item);
        var el = this.getTabEl(item);
        if(el){
            el.style.display = '';
            this.delegateUpdates();
        }
    },

    // private
    delegateUpdates : function(){
        if(this.suspendUpdates){
            return;
        }
        if(this.resizeTabs && this.rendered){
            this.autoSizeTabs();
        }
        if(this.enableTabScroll && this.rendered){
            this.autoScrollTabs();
        }
    },

    // private
    autoSizeTabs : function(){
        var count = this.items.length,
            ce = this.tabPosition != 'bottom' ? 'header' : 'footer',
            ow = this[ce].dom.offsetWidth,
            aw = this[ce].dom.clientWidth;

        if(!this.resizeTabs || count < 1 || !aw){ // !aw for display:none
            return;
        }

        var each = Math.max(Math.min(Math.floor((aw-4) / count) - this.tabMargin, this.tabWidth), this.minTabWidth); // -4 for float errors in IE
        this.lastTabWidth = each;
        var lis = this.strip.query('li:not(.x-tab-edge)');
        for(var i = 0, len = lis.length; i < len; i++) {
            var li = lis[i],
                inner = Ext.fly(li).child('.x-tab-strip-inner', true),
                tw = li.offsetWidth,
                iw = inner.offsetWidth;
            inner.style.width = (each - (tw-iw)) + 'px';
        }
    },

    // private
    adjustBodyWidth : function(w){
        if(this.header){
            this.header.setWidth(w);
        }
        if(this.footer){
            this.footer.setWidth(w);
        }
        return w;
    },

    /**
     * Sets the specified tab as the active tab. This method fires the {@link #beforetabchange} event which
     * can <tt>return false</tt> to cancel the tab change.
     * @param {String/Number} item
     * The id or tab Panel to activate. This parameter may be any of the following:
     * <div><ul class="mdetail-params">
     * <li>a <b><tt>String</tt></b> : representing the <code>{@link Ext.Component#itemId itemId}</code>
     * or <code>{@link Ext.Component#id id}</code> of the child component </li>
     * <li>a <b><tt>Number</tt></b> : representing the position of the child component
     * within the <code>{@link Ext.Container#items items}</code> <b>property</b></li>
     * </ul></div>
     * <p>For additional information see {@link Ext.util.MixedCollection#get}.
     */
    setActiveTab : function(item){
        item = this.getComponent(item);
        if(this.fireEvent('beforetabchange', this, item, this.activeTab) === false){
            return;
        }
        if(!this.rendered){
            this.activeTab = item;
            return;
        }
        if(this.activeTab != item){
            if(this.activeTab){
                var oldEl = this.getTabEl(this.activeTab);
                if(oldEl){
                    Ext.fly(oldEl).removeClass('x-tab-strip-active');
                }
            }
            this.activeTab = item;
            if(item){
                var el = this.getTabEl(item);
                Ext.fly(el).addClass('x-tab-strip-active');
                this.stack.add(item);

                this.layout.setActiveItem(item);
                if(this.scrolling){
                    this.scrollToTab(item, this.animScroll);
                }
            }
            this.fireEvent('tabchange', this, item);
        }
    },

    /**
     * Returns the Component which is the currently active tab. <b>Note that before the TabPanel
     * first activates a child Component, this method will return whatever was configured in the
     * {@link #activeTab} config option.</b>
     * @return {BoxComponent} The currently active child Component if one <i>is</i> active, or the {@link #activeTab} config value.
     */
    getActiveTab : function(){
        return this.activeTab || null;
    },

    /**
     * Gets the specified tab by id.
     * @param {String} id The tab id
     * @return {Panel} The tab
     */
    getItem : function(item){
        return this.getComponent(item);
    },

    // private
    autoScrollTabs : function(){
        this.pos = this.tabPosition=='bottom' ? this.footer : this.header;
        var count = this.items.length,
            ow = this.pos.dom.offsetWidth,
            tw = this.pos.dom.clientWidth,
            wrap = this.stripWrap,
            wd = wrap.dom,
            cw = wd.offsetWidth,
            pos = this.getScrollPos(),
            l = this.edge.getOffsetsTo(this.stripWrap)[0] + pos;

        if(!this.enableTabScroll || count < 1 || cw < 20){ // 20 to prevent display:none issues
            return;
        }
        if(l <= tw){
            wd.scrollLeft = 0;
            wrap.setWidth(tw);
            if(this.scrolling){
                this.scrolling = false;
                this.pos.removeClass('x-tab-scrolling');
                this.scrollLeft.hide();
                this.scrollRight.hide();
                // See here: http://extjs.com/forum/showthread.php?t=49308&highlight=isSafari
                if(Ext.isAir || Ext.isWebKit){
                    wd.style.marginLeft = '';
                    wd.style.marginRight = '';
                }
            }
        }else{
            if(!this.scrolling){
                this.pos.addClass('x-tab-scrolling');
                // See here: http://extjs.com/forum/showthread.php?t=49308&highlight=isSafari
                if(Ext.isAir || Ext.isWebKit){
                    wd.style.marginLeft = '18px';
                    wd.style.marginRight = '18px';
                }
            }
            tw -= wrap.getMargins('lr');
            wrap.setWidth(tw > 20 ? tw : 20);
            if(!this.scrolling){
                if(!this.scrollLeft){
                    this.createScrollers();
                }else{
                    this.scrollLeft.show();
                    this.scrollRight.show();
                }
            }
            this.scrolling = true;
            if(pos > (l-tw)){ // ensure it stays within bounds
                wd.scrollLeft = l-tw;
            }else{ // otherwise, make sure the active tab is still visible
                this.scrollToTab(this.activeTab, false);
            }
            this.updateScrollButtons();
        }
    },

    // private
    createScrollers : function(){
        this.pos.addClass('x-tab-scrolling-' + this.tabPosition);
        var h = this.stripWrap.dom.offsetHeight;

        // left
        var sl = this.pos.insertFirst({
            cls:'x-tab-scroller-left'
        });
        sl.setHeight(h);
        sl.addClassOnOver('x-tab-scroller-left-over');
        this.leftRepeater = new Ext.util.ClickRepeater(sl, {
            interval : this.scrollRepeatInterval,
            handler: this.onScrollLeft,
            scope: this
        });
        this.scrollLeft = sl;

        // right
        var sr = this.pos.insertFirst({
            cls:'x-tab-scroller-right'
        });
        sr.setHeight(h);
        sr.addClassOnOver('x-tab-scroller-right-over');
        this.rightRepeater = new Ext.util.ClickRepeater(sr, {
            interval : this.scrollRepeatInterval,
            handler: this.onScrollRight,
            scope: this
        });
        this.scrollRight = sr;
    },

    // private
    getScrollWidth : function(){
        return this.edge.getOffsetsTo(this.stripWrap)[0] + this.getScrollPos();
    },

    // private
    getScrollPos : function(){
        return parseInt(this.stripWrap.dom.scrollLeft, 10) || 0;
    },

    // private
    getScrollArea : function(){
        return parseInt(this.stripWrap.dom.clientWidth, 10) || 0;
    },

    // private
    getScrollAnim : function(){
        return {duration:this.scrollDuration, callback: this.updateScrollButtons, scope: this};
    },

    // private
    getScrollIncrement : function(){
        return this.scrollIncrement || (this.resizeTabs ? this.lastTabWidth+2 : 100);
    },

    /**
     * Scrolls to a particular tab if tab scrolling is enabled
     * @param {Panel} item The item to scroll to
     * @param {Boolean} animate True to enable animations
     */

    scrollToTab : function(item, animate){
        if(!item){
            return;
        }
        var el = this.getTabEl(item),
            pos = this.getScrollPos(),
            area = this.getScrollArea(),
            left = Ext.fly(el).getOffsetsTo(this.stripWrap)[0] + pos,
            right = left + el.offsetWidth;
        if(left < pos){
            this.scrollTo(left, animate);
        }else if(right > (pos + area)){
            this.scrollTo(right - area, animate);
        }
    },

    // private
    scrollTo : function(pos, animate){
        this.stripWrap.scrollTo('left', pos, animate ? this.getScrollAnim() : false);
        if(!animate){
            this.updateScrollButtons();
        }
    },

    onWheel : function(e){
        var d = e.getWheelDelta()*this.wheelIncrement*-1;
        e.stopEvent();

        var pos = this.getScrollPos(),
            newpos = pos + d,
            sw = this.getScrollWidth()-this.getScrollArea();

        var s = Math.max(0, Math.min(sw, newpos));
        if(s != pos){
            this.scrollTo(s, false);
        }
    },

    // private
    onScrollRight : function(){
        var sw = this.getScrollWidth()-this.getScrollArea(),
            pos = this.getScrollPos(),
            s = Math.min(sw, pos + this.getScrollIncrement());
        if(s != pos){
            this.scrollTo(s, this.animScroll);
        }
    },

    // private
    onScrollLeft : function(){
        var pos = this.getScrollPos(),
            s = Math.max(0, pos - this.getScrollIncrement());
        if(s != pos){
            this.scrollTo(s, this.animScroll);
        }
    },

    // private
    updateScrollButtons : function(){
        var pos = this.getScrollPos();
        this.scrollLeft[pos === 0 ? 'addClass' : 'removeClass']('x-tab-scroller-left-disabled');
        this.scrollRight[pos >= (this.getScrollWidth()-this.getScrollArea()) ? 'addClass' : 'removeClass']('x-tab-scroller-right-disabled');
    },

    // private
    beforeDestroy : function() {
        Ext.destroy(this.leftRepeater, this.rightRepeater);
        this.deleteMembers('strip', 'edge', 'scrollLeft', 'scrollRight', 'stripWrap');
        this.activeTab = null;
        Ext.TabPanel.superclass.beforeDestroy.apply(this);
    }

    /**
     * @cfg {Boolean} collapsible
     * @hide
     */
    /**
     * @cfg {String} header
     * @hide
     */
    /**
     * @cfg {Boolean} headerAsText
     * @hide
     */
    /**
     * @property header
     * @hide
     */
    /**
     * @cfg title
     * @hide
     */
    /**
     * @cfg {Array} tools
     * @hide
     */
    /**
     * @cfg {Array} toolTemplate
     * @hide
     */
    /**
     * @cfg {Boolean} hideCollapseTool
     * @hide
     */
    /**
     * @cfg {Boolean} titleCollapse
     * @hide
     */
    /**
     * @cfg {Boolean} collapsed
     * @hide
     */
    /**
     * @cfg {String} layout
     * @hide
     */
    /**
     * @cfg {Boolean} preventBodyReset
     * @hide
     */
});
Ext.reg('tabpanel', Ext.TabPanel);

/**
 * See {@link #setActiveTab}. Sets the specified tab as the active tab. This method fires
 * the {@link #beforetabchange} event which can <tt>return false</tt> to cancel the tab change.
 * @param {String/Panel} tab The id or tab Panel to activate
 * @method activate
 */
Ext.TabPanel.prototype.activate = Ext.TabPanel.prototype.setActiveTab;

// private utility class used by TabPanel
Ext.TabPanel.AccessStack = function(){
    var items = [];
    return {
        add : function(item){
            items.push(item);
            if(items.length > 10){
                items.shift();
            }
        },

        remove : function(item){
            var s = [];
            for(var i = 0, len = items.length; i < len; i++) {
                if(items[i] != item){
                    s.push(items[i]);
                }
            }
            items = s;
        },

        next : function(){
            return items.pop();
        }
    };
};
