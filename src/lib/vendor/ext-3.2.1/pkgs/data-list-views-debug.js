/*!
 * Ext JS Library 3.2.1
 * Copyright(c) 2006-2010 Ext JS, Inc.
 * licensing@extjs.com
 * http://www.extjs.com/license
 */
/**
 * @class Ext.DataView
 * @extends Ext.BoxComponent
 * A mechanism for displaying data using custom layout templates and formatting. DataView uses an {@link Ext.XTemplate}
 * as its internal templating mechanism, and is bound to an {@link Ext.data.Store}
 * so that as the data in the store changes the view is automatically updated to reflect the changes.  The view also
 * provides built-in behavior for many common events that can occur for its contained items including click, doubleclick,
 * mouseover, mouseout, etc. as well as a built-in selection model. <b>In order to use these features, an {@link #itemSelector}
 * config must be provided for the DataView to determine what nodes it will be working with.</b>
 *
 * <p>The example below binds a DataView to a {@link Ext.data.Store} and renders it into an {@link Ext.Panel}.</p>
 * <pre><code>
var store = new Ext.data.JsonStore({
    url: 'get-images.php',
    root: 'images',
    fields: [
        'name', 'url',
        {name:'size', type: 'float'},
        {name:'lastmod', type:'date', dateFormat:'timestamp'}
    ]
});
store.load();

var tpl = new Ext.XTemplate(
    '&lt;tpl for="."&gt;',
        '&lt;div class="thumb-wrap" id="{name}"&gt;',
        '&lt;div class="thumb"&gt;&lt;img src="{url}" title="{name}"&gt;&lt;/div&gt;',
        '&lt;span class="x-editable"&gt;{shortName}&lt;/span&gt;&lt;/div&gt;',
    '&lt;/tpl&gt;',
    '&lt;div class="x-clear"&gt;&lt;/div&gt;'
);

var panel = new Ext.Panel({
    id:'images-view',
    frame:true,
    width:535,
    autoHeight:true,
    collapsible:true,
    layout:'fit',
    title:'Simple DataView',

    items: new Ext.DataView({
        store: store,
        tpl: tpl,
        autoHeight:true,
        multiSelect: true,
        overClass:'x-view-over',
        itemSelector:'div.thumb-wrap',
        emptyText: 'No images to display'
    })
});
panel.render(document.body);
</code></pre>
 * @constructor
 * Create a new DataView
 * @param {Object} config The config object
 * @xtype dataview
 */
Ext.DataView = Ext.extend(Ext.BoxComponent, {
    /**
     * @cfg {String/Array} tpl
     * The HTML fragment or an array of fragments that will make up the template used by this DataView.  This should
     * be specified in the same format expected by the constructor of {@link Ext.XTemplate}.
     */
    /**
     * @cfg {Ext.data.Store} store
     * The {@link Ext.data.Store} to bind this DataView to.
     */
    /**
     * @cfg {String} itemSelector
     * <b>This is a required setting</b>. A simple CSS selector (e.g. <tt>div.some-class</tt> or 
     * <tt>span:first-child</tt>) that will be used to determine what nodes this DataView will be
     * working with.
     */
    /**
     * @cfg {Boolean} multiSelect
     * True to allow selection of more than one item at a time, false to allow selection of only a single item
     * at a time or no selection at all, depending on the value of {@link #singleSelect} (defaults to false).
     */
    /**
     * @cfg {Boolean} singleSelect
     * True to allow selection of exactly one item at a time, false to allow no selection at all (defaults to false).
     * Note that if {@link #multiSelect} = true, this value will be ignored.
     */
    /**
     * @cfg {Boolean} simpleSelect
     * True to enable multiselection by clicking on multiple items without requiring the user to hold Shift or Ctrl,
     * false to force the user to hold Ctrl or Shift to select more than on item (defaults to false).
     */
    /**
     * @cfg {String} overClass
     * A CSS class to apply to each item in the view on mouseover (defaults to undefined).
     */
    /**
     * @cfg {String} loadingText
     * A string to display during data load operations (defaults to undefined).  If specified, this text will be
     * displayed in a loading div and the view's contents will be cleared while loading, otherwise the view's
     * contents will continue to display normally until the new data is loaded and the contents are replaced.
     */
    /**
     * @cfg {String} selectedClass
     * A CSS class to apply to each selected item in the view (defaults to 'x-view-selected').
     */
    selectedClass : "x-view-selected",
    /**
     * @cfg {String} emptyText
     * The text to display in the view when there is no data to display (defaults to '').
     */
    emptyText : "",

    /**
     * @cfg {Boolean} deferEmptyText True to defer emptyText being applied until the store's first load
     */
    deferEmptyText: true,
    /**
     * @cfg {Boolean} trackOver True to enable mouseenter and mouseleave events
     */
    trackOver: false,
    
    /**
     * @cfg {Boolean} blockRefresh Set this to true to ignore datachanged events on the bound store. This is useful if
     * you wish to provide custom transition animations via a plugin (defaults to false)
     */
    blockRefresh: false,

    //private
    last: false,

    // private
    initComponent : function(){
        Ext.DataView.superclass.initComponent.call(this);
        if(Ext.isString(this.tpl) || Ext.isArray(this.tpl)){
            this.tpl = new Ext.XTemplate(this.tpl);
        }

        this.addEvents(
            /**
             * @event beforeclick
             * Fires before a click is processed. Returns false to cancel the default action.
             * @param {Ext.DataView} this
             * @param {Number} index The index of the target node
             * @param {HTMLElement} node The target node
             * @param {Ext.EventObject} e The raw event object
             */
            "beforeclick",
            /**
             * @event click
             * Fires when a template node is clicked.
             * @param {Ext.DataView} this
             * @param {Number} index The index of the target node
             * @param {HTMLElement} node The target node
             * @param {Ext.EventObject} e The raw event object
             */
            "click",
            /**
             * @event mouseenter
             * Fires when the mouse enters a template node. trackOver:true or an overClass must be set to enable this event.
             * @param {Ext.DataView} this
             * @param {Number} index The index of the target node
             * @param {HTMLElement} node The target node
             * @param {Ext.EventObject} e The raw event object
             */
            "mouseenter",
            /**
             * @event mouseleave
             * Fires when the mouse leaves a template node. trackOver:true or an overClass must be set to enable this event.
             * @param {Ext.DataView} this
             * @param {Number} index The index of the target node
             * @param {HTMLElement} node The target node
             * @param {Ext.EventObject} e The raw event object
             */
            "mouseleave",
            /**
             * @event containerclick
             * Fires when a click occurs and it is not on a template node.
             * @param {Ext.DataView} this
             * @param {Ext.EventObject} e The raw event object
             */
            "containerclick",
            /**
             * @event dblclick
             * Fires when a template node is double clicked.
             * @param {Ext.DataView} this
             * @param {Number} index The index of the target node
             * @param {HTMLElement} node The target node
             * @param {Ext.EventObject} e The raw event object
             */
            "dblclick",
            /**
             * @event contextmenu
             * Fires when a template node is right clicked.
             * @param {Ext.DataView} this
             * @param {Number} index The index of the target node
             * @param {HTMLElement} node The target node
             * @param {Ext.EventObject} e The raw event object
             */
            "contextmenu",
            /**
             * @event containercontextmenu
             * Fires when a right click occurs that is not on a template node.
             * @param {Ext.DataView} this
             * @param {Ext.EventObject} e The raw event object
             */
            "containercontextmenu",
            /**
             * @event selectionchange
             * Fires when the selected nodes change.
             * @param {Ext.DataView} this
             * @param {Array} selections Array of the selected nodes
             */
            "selectionchange",

            /**
             * @event beforeselect
             * Fires before a selection is made. If any handlers return false, the selection is cancelled.
             * @param {Ext.DataView} this
             * @param {HTMLElement} node The node to be selected
             * @param {Array} selections Array of currently selected nodes
             */
            "beforeselect"
        );

        this.store = Ext.StoreMgr.lookup(this.store);
        this.all = new Ext.CompositeElementLite();
        this.selected = new Ext.CompositeElementLite();
    },

    // private
    afterRender : function(){
        Ext.DataView.superclass.afterRender.call(this);

		this.mon(this.getTemplateTarget(), {
            "click": this.onClick,
            "dblclick": this.onDblClick,
            "contextmenu": this.onContextMenu,
            scope:this
        });

        if(this.overClass || this.trackOver){
            this.mon(this.getTemplateTarget(), {
                "mouseover": this.onMouseOver,
                "mouseout": this.onMouseOut,
                scope:this
            });
        }

        if(this.store){
            this.bindStore(this.store, true);
        }
    },

    /**
     * Refreshes the view by reloading the data from the store and re-rendering the template.
     */
    refresh : function() {
        this.clearSelections(false, true);
        var el = this.getTemplateTarget();
        el.update("");
        var records = this.store.getRange();
        if(records.length < 1){
            if(!this.deferEmptyText || this.hasSkippedEmptyText){
                el.update(this.emptyText);
            }
            this.all.clear();
        }else{
            this.tpl.overwrite(el, this.collectData(records, 0));
            this.all.fill(Ext.query(this.itemSelector, el.dom));
            this.updateIndexes(0);
        }
        this.hasSkippedEmptyText = true;
    },

    getTemplateTarget: function(){
        return this.el;
    },

    /**
     * Function which can be overridden to provide custom formatting for each Record that is used by this
     * DataView's {@link #tpl template} to render each node.
     * @param {Array/Object} data The raw data object that was used to create the Record.
     * @param {Number} recordIndex the index number of the Record being prepared for rendering.
     * @param {Record} record The Record being prepared for rendering.
     * @return {Array/Object} The formatted data in a format expected by the internal {@link #tpl template}'s overwrite() method.
     * (either an array if your params are numeric (i.e. {0}) or an object (i.e. {foo: 'bar'}))
     */
    prepareData : function(data){
        return data;
    },

    /**
     * <p>Function which can be overridden which returns the data object passed to this
     * DataView's {@link #tpl template} to render the whole DataView.</p>
     * <p>This is usually an Array of data objects, each element of which is processed by an
     * {@link Ext.XTemplate XTemplate} which uses <tt>'&lt;tpl for="."&gt;'</tt> to iterate over its supplied
     * data object as an Array. However, <i>named</i> properties may be placed into the data object to
     * provide non-repeating data such as headings, totals etc.</p>
     * @param {Array} records An Array of {@link Ext.data.Record}s to be rendered into the DataView.
     * @param {Number} startIndex the index number of the Record being prepared for rendering.
     * @return {Array} An Array of data objects to be processed by a repeating XTemplate. May also
     * contain <i>named</i> properties.
     */
    collectData : function(records, startIndex){
        var r = [];
        for(var i = 0, len = records.length; i < len; i++){
            r[r.length] = this.prepareData(records[i].data, startIndex+i, records[i]);
        }
        return r;
    },

    // private
    bufferRender : function(records){
        var div = document.createElement('div');
        this.tpl.overwrite(div, this.collectData(records));
        return Ext.query(this.itemSelector, div);
    },

    // private
    onUpdate : function(ds, record){
        var index = this.store.indexOf(record);
        if(index > -1){
            var sel = this.isSelected(index);
            var original = this.all.elements[index];
            var node = this.bufferRender([record], index)[0];

            this.all.replaceElement(index, node, true);
            if(sel){
                this.selected.replaceElement(original, node);
                this.all.item(index).addClass(this.selectedClass);
            }
            this.updateIndexes(index, index);
        }
    },

    // private
    onAdd : function(ds, records, index){
        if(this.all.getCount() === 0){
            this.refresh();
            return;
        }
        var nodes = this.bufferRender(records, index), n, a = this.all.elements;
        if(index < this.all.getCount()){
            n = this.all.item(index).insertSibling(nodes, 'before', true);
            a.splice.apply(a, [index, 0].concat(nodes));
        }else{
            n = this.all.last().insertSibling(nodes, 'after', true);
            a.push.apply(a, nodes);
        }
        this.updateIndexes(index);
    },

    // private
    onRemove : function(ds, record, index){
        this.deselect(index);
        this.all.removeElement(index, true);
        this.updateIndexes(index);
        if (this.store.getCount() === 0){
            this.refresh();
        }
    },

    /**
     * Refreshes an individual node's data from the store.
     * @param {Number} index The item's data index in the store
     */
    refreshNode : function(index){
        this.onUpdate(this.store, this.store.getAt(index));
    },

    // private
    updateIndexes : function(startIndex, endIndex){
        var ns = this.all.elements;
        startIndex = startIndex || 0;
        endIndex = endIndex || ((endIndex === 0) ? 0 : (ns.length - 1));
        for(var i = startIndex; i <= endIndex; i++){
            ns[i].viewIndex = i;
        }
    },
    
    /**
     * Returns the store associated with this DataView.
     * @return {Ext.data.Store} The store
     */
    getStore : function(){
        return this.store;
    },

    /**
     * Changes the data store bound to this view and refreshes it.
     * @param {Store} store The store to bind to this view
     */
    bindStore : function(store, initial){
        if(!initial && this.store){
            if(store !== this.store && this.store.autoDestroy){
                this.store.destroy();
            }else{
                this.store.un("beforeload", this.onBeforeLoad, this);
                this.store.un("datachanged", this.onDataChanged, this);
                this.store.un("add", this.onAdd, this);
                this.store.un("remove", this.onRemove, this);
                this.store.un("update", this.onUpdate, this);
                this.store.un("clear", this.refresh, this);
            }
            if(!store){
                this.store = null;
            }
        }
        if(store){
            store = Ext.StoreMgr.lookup(store);
            store.on({
                scope: this,
                beforeload: this.onBeforeLoad,
                datachanged: this.onDataChanged,
                add: this.onAdd,
                remove: this.onRemove,
                update: this.onUpdate,
                clear: this.refresh
            });
        }
        this.store = store;
        if(store){
            this.refresh();
        }
    },
    
    /**
     * @private
     * Calls this.refresh if this.blockRefresh is not true
     */
    onDataChanged: function() {
        if (this.blockRefresh !== true) {
            this.refresh.apply(this, arguments);
        }
    },

    /**
     * Returns the template node the passed child belongs to, or null if it doesn't belong to one.
     * @param {HTMLElement} node
     * @return {HTMLElement} The template node
     */
    findItemFromChild : function(node){
        return Ext.fly(node).findParent(this.itemSelector, this.getTemplateTarget());
    },

    // private
    onClick : function(e){
        var item = e.getTarget(this.itemSelector, this.getTemplateTarget());
        if(item){
            var index = this.indexOf(item);
            if(this.onItemClick(item, index, e) !== false){
                this.fireEvent("click", this, index, item, e);
            }
        }else{
            if(this.fireEvent("containerclick", this, e) !== false){
                this.onContainerClick(e);
            }
        }
    },

    onContainerClick : function(e){
        this.clearSelections();
    },

    // private
    onContextMenu : function(e){
        var item = e.getTarget(this.itemSelector, this.getTemplateTarget());
        if(item){
            this.fireEvent("contextmenu", this, this.indexOf(item), item, e);
        }else{
            this.fireEvent("containercontextmenu", this, e);
        }
    },

    // private
    onDblClick : function(e){
        var item = e.getTarget(this.itemSelector, this.getTemplateTarget());
        if(item){
            this.fireEvent("dblclick", this, this.indexOf(item), item, e);
        }
    },

    // private
    onMouseOver : function(e){
        var item = e.getTarget(this.itemSelector, this.getTemplateTarget());
        if(item && item !== this.lastItem){
            this.lastItem = item;
            Ext.fly(item).addClass(this.overClass);
            this.fireEvent("mouseenter", this, this.indexOf(item), item, e);
        }
    },

    // private
    onMouseOut : function(e){
        if(this.lastItem){
            if(!e.within(this.lastItem, true, true)){
                Ext.fly(this.lastItem).removeClass(this.overClass);
                this.fireEvent("mouseleave", this, this.indexOf(this.lastItem), this.lastItem, e);
                delete this.lastItem;
            }
        }
    },

    // private
    onItemClick : function(item, index, e){
        if(this.fireEvent("beforeclick", this, index, item, e) === false){
            return false;
        }
        if(this.multiSelect){
            this.doMultiSelection(item, index, e);
            e.preventDefault();
        }else if(this.singleSelect){
            this.doSingleSelection(item, index, e);
            e.preventDefault();
        }
        return true;
    },

    // private
    doSingleSelection : function(item, index, e){
        if(e.ctrlKey && this.isSelected(index)){
            this.deselect(index);
        }else{
            this.select(index, false);
        }
    },

    // private
    doMultiSelection : function(item, index, e){
        if(e.shiftKey && this.last !== false){
            var last = this.last;
            this.selectRange(last, index, e.ctrlKey);
            this.last = last; // reset the last
        }else{
            if((e.ctrlKey||this.simpleSelect) && this.isSelected(index)){
                this.deselect(index);
            }else{
                this.select(index, e.ctrlKey || e.shiftKey || this.simpleSelect);
            }
        }
    },

    /**
     * Gets the number of selected nodes.
     * @return {Number} The node count
     */
    getSelectionCount : function(){
        return this.selected.getCount();
    },

    /**
     * Gets the currently selected nodes.
     * @return {Array} An array of HTMLElements
     */
    getSelectedNodes : function(){
        return this.selected.elements;
    },

    /**
     * Gets the indexes of the selected nodes.
     * @return {Array} An array of numeric indexes
     */
    getSelectedIndexes : function(){
        var indexes = [], s = this.selected.elements;
        for(var i = 0, len = s.length; i < len; i++){
            indexes.push(s[i].viewIndex);
        }
        return indexes;
    },

    /**
     * Gets an array of the selected records
     * @return {Array} An array of {@link Ext.data.Record} objects
     */
    getSelectedRecords : function(){
        var r = [], s = this.selected.elements;
        for(var i = 0, len = s.length; i < len; i++){
            r[r.length] = this.store.getAt(s[i].viewIndex);
        }
        return r;
    },

    /**
     * Gets an array of the records from an array of nodes
     * @param {Array} nodes The nodes to evaluate
     * @return {Array} records The {@link Ext.data.Record} objects
     */
    getRecords : function(nodes){
        var r = [], s = nodes;
        for(var i = 0, len = s.length; i < len; i++){
            r[r.length] = this.store.getAt(s[i].viewIndex);
        }
        return r;
    },

    /**
     * Gets a record from a node
     * @param {HTMLElement} node The node to evaluate
     * @return {Record} record The {@link Ext.data.Record} object
     */
    getRecord : function(node){
        return this.store.getAt(node.viewIndex);
    },

    /**
     * Clears all selections.
     * @param {Boolean} suppressEvent (optional) True to skip firing of the selectionchange event
     */
    clearSelections : function(suppressEvent, skipUpdate){
        if((this.multiSelect || this.singleSelect) && this.selected.getCount() > 0){
            if(!skipUpdate){
                this.selected.removeClass(this.selectedClass);
            }
            this.selected.clear();
            this.last = false;
            if(!suppressEvent){
                this.fireEvent("selectionchange", this, this.selected.elements);
            }
        }
    },

    /**
     * Returns true if the passed node is selected, else false.
     * @param {HTMLElement/Number/Ext.data.Record} node The node, node index or record to check
     * @return {Boolean} True if selected, else false
     */
    isSelected : function(node){
        return this.selected.contains(this.getNode(node));
    },

    /**
     * Deselects a node.
     * @param {HTMLElement/Number/Record} node The node, node index or record to deselect
     */
    deselect : function(node){
        if(this.isSelected(node)){
            node = this.getNode(node);
            this.selected.removeElement(node);
            if(this.last == node.viewIndex){
                this.last = false;
            }
            Ext.fly(node).removeClass(this.selectedClass);
            this.fireEvent("selectionchange", this, this.selected.elements);
        }
    },

    /**
     * Selects a set of nodes.
     * @param {Array/HTMLElement/String/Number/Ext.data.Record} nodeInfo An HTMLElement template node, index of a template node,
     * id of a template node, record associated with a node or an array of any of those to select
     * @param {Boolean} keepExisting (optional) true to keep existing selections
     * @param {Boolean} suppressEvent (optional) true to skip firing of the selectionchange vent
     */
    select : function(nodeInfo, keepExisting, suppressEvent){
        if(Ext.isArray(nodeInfo)){
            if(!keepExisting){
                this.clearSelections(true);
            }
            for(var i = 0, len = nodeInfo.length; i < len; i++){
                this.select(nodeInfo[i], true, true);
            }
            if(!suppressEvent){
                this.fireEvent("selectionchange", this, this.selected.elements);
            }
        } else{
            var node = this.getNode(nodeInfo);
            if(!keepExisting){
                this.clearSelections(true);
            }
            if(node && !this.isSelected(node)){
                if(this.fireEvent("beforeselect", this, node, this.selected.elements) !== false){
                    Ext.fly(node).addClass(this.selectedClass);
                    this.selected.add(node);
                    this.last = node.viewIndex;
                    if(!suppressEvent){
                        this.fireEvent("selectionchange", this, this.selected.elements);
                    }
                }
            }
        }
    },

    /**
     * Selects a range of nodes. All nodes between start and end are selected.
     * @param {Number} start The index of the first node in the range
     * @param {Number} end The index of the last node in the range
     * @param {Boolean} keepExisting (optional) True to retain existing selections
     */
    selectRange : function(start, end, keepExisting){
        if(!keepExisting){
            this.clearSelections(true);
        }
        this.select(this.getNodes(start, end), true);
    },

    /**
     * Gets a template node.
     * @param {HTMLElement/String/Number/Ext.data.Record} nodeInfo An HTMLElement template node, index of a template node, 
     * the id of a template node or the record associated with the node.
     * @return {HTMLElement} The node or null if it wasn't found
     */
    getNode : function(nodeInfo){
        if(Ext.isString(nodeInfo)){
            return document.getElementById(nodeInfo);
        }else if(Ext.isNumber(nodeInfo)){
            return this.all.elements[nodeInfo];
        }else if(nodeInfo instanceof Ext.data.Record){
            var idx = this.store.indexOf(nodeInfo);
            return this.all.elements[idx];
        }
        return nodeInfo;
    },

    /**
     * Gets a range nodes.
     * @param {Number} start (optional) The index of the first node in the range
     * @param {Number} end (optional) The index of the last node in the range
     * @return {Array} An array of nodes
     */
    getNodes : function(start, end){
        var ns = this.all.elements;
        start = start || 0;
        end = !Ext.isDefined(end) ? Math.max(ns.length - 1, 0) : end;
        var nodes = [], i;
        if(start <= end){
            for(i = start; i <= end && ns[i]; i++){
                nodes.push(ns[i]);
            }
        } else{
            for(i = start; i >= end && ns[i]; i--){
                nodes.push(ns[i]);
            }
        }
        return nodes;
    },

    /**
     * Finds the index of the passed node.
     * @param {HTMLElement/String/Number/Record} nodeInfo An HTMLElement template node, index of a template node, the id of a template node
     * or a record associated with a node.
     * @return {Number} The index of the node or -1
     */
    indexOf : function(node){
        node = this.getNode(node);
        if(Ext.isNumber(node.viewIndex)){
            return node.viewIndex;
        }
        return this.all.indexOf(node);
    },

    // private
    onBeforeLoad : function(){
        if(this.loadingText){
            this.clearSelections(false, true);
            this.getTemplateTarget().update('<div class="loading-indicator">'+this.loadingText+'</div>');
            this.all.clear();
        }
    },

    onDestroy : function(){
        this.all.clear();
        this.selected.clear();
        Ext.DataView.superclass.onDestroy.call(this);
        this.bindStore(null);
    }
});

/**
 * Changes the data store bound to this view and refreshes it. (deprecated in favor of bindStore)
 * @param {Store} store The store to bind to this view
 */
Ext.DataView.prototype.setStore = Ext.DataView.prototype.bindStore;

Ext.reg('dataview', Ext.DataView);
/**
 * @class Ext.list.ListView
 * @extends Ext.DataView
 * <p>Ext.list.ListView is a fast and light-weight implentation of a
 * {@link Ext.grid.GridPanel Grid} like view with the following characteristics:</p>
 * <div class="mdetail-params"><ul>
 * <li>resizable columns</li>
 * <li>selectable</li>
 * <li>column widths are initially proportioned by percentage based on the container
 * width and number of columns</li>
 * <li>uses templates to render the data in any required format</li>
 * <li>no horizontal scrolling</li>
 * <li>no editing</li>
 * </ul></div>
 * <p>Example usage:</p>
 * <pre><code>
// consume JSON of this form:
{
   "images":[
      {
         "name":"dance_fever.jpg",
         "size":2067,
         "lastmod":1236974993000,
         "url":"images\/thumbs\/dance_fever.jpg"
      },
      {
         "name":"zack_sink.jpg",
         "size":2303,
         "lastmod":1236974993000,
         "url":"images\/thumbs\/zack_sink.jpg"
      }
   ]
}
var store = new Ext.data.JsonStore({
    url: 'get-images.php',
    root: 'images',
    fields: [
        'name', 'url',
        {name:'size', type: 'float'},
        {name:'lastmod', type:'date', dateFormat:'timestamp'}
    ]
});
store.load();

var listView = new Ext.list.ListView({
    store: store,
    multiSelect: true,
    emptyText: 'No images to display',
    reserveScrollOffset: true,
    columns: [{
        header: 'File',
        width: .5,
        dataIndex: 'name'
    },{
        header: 'Last Modified',
        width: .35,
        dataIndex: 'lastmod',
        tpl: '{lastmod:date("m-d h:i a")}'
    },{
        header: 'Size',
        dataIndex: 'size',
        tpl: '{size:fileSize}', // format using Ext.util.Format.fileSize()
        align: 'right'
    }]
});

// put it in a Panel so it looks pretty
var panel = new Ext.Panel({
    id:'images-view',
    width:425,
    height:250,
    collapsible:true,
    layout:'fit',
    title:'Simple ListView <i>(0 items selected)</i>',
    items: listView
});
panel.render(document.body);

// little bit of feedback
listView.on('selectionchange', function(view, nodes){
    var l = nodes.length;
    var s = l != 1 ? 's' : '';
    panel.setTitle('Simple ListView <i>('+l+' item'+s+' selected)</i>');
});
 * </code></pre>
 * @constructor
 * @param {Object} config
 * @xtype listview
 */
Ext.list.ListView = Ext.extend(Ext.DataView, {
    /**
     * Set this property to <tt>true</tt> to disable the header click handler disabling sort
     * (defaults to <tt>false</tt>).
     * @type Boolean
     * @property disableHeaders
     */
    /**
     * @cfg {Boolean} hideHeaders
     * <tt>true</tt> to hide the {@link #internalTpl header row} (defaults to <tt>false</tt> so
     * the {@link #internalTpl header row} will be shown).
     */
    /**
     * @cfg {String} itemSelector
     * Defaults to <tt>'dl'</tt> to work with the preconfigured <b><tt>{@link Ext.DataView#tpl tpl}</tt></b>.
     * This setting specifies the CSS selector (e.g. <tt>div.some-class</tt> or <tt>span:first-child</tt>)
     * that will be used to determine what nodes the ListView will be working with.
     */
    itemSelector: 'dl',
    /**
     * @cfg {String} selectedClass The CSS class applied to a selected row (defaults to
     * <tt>'x-list-selected'</tt>). An example overriding the default styling:
    <pre><code>
    .x-list-selected {background-color: yellow;}
    </code></pre>
     * @type String
     */
    selectedClass:'x-list-selected',
    /**
     * @cfg {String} overClass The CSS class applied when over a row (defaults to
     * <tt>'x-list-over'</tt>). An example overriding the default styling:
    <pre><code>
    .x-list-over {background-color: orange;}
    </code></pre>
     * @type String
     */
    overClass:'x-list-over',
    /**
     * @cfg {Boolean} reserveScrollOffset
     * By default will defer accounting for the configured <b><tt>{@link #scrollOffset}</tt></b>
     * for 10 milliseconds.  Specify <tt>true</tt> to account for the configured
     * <b><tt>{@link #scrollOffset}</tt></b> immediately.
     */
    /**
     * @cfg {Number} scrollOffset The amount of space to reserve for the scrollbar (defaults to
     * <tt>undefined</tt>). If an explicit value isn't specified, this will be automatically
     * calculated.
     */
    scrollOffset : undefined,
    /**
     * @cfg {Boolean/Object} columnResize
     * Specify <tt>true</tt> or specify a configuration object for {@link Ext.list.ListView.ColumnResizer}
     * to enable the columns to be resizable (defaults to <tt>true</tt>).
     */
    columnResize: true,
    /**
     * @cfg {Array} columns An array of column configuration objects, for example:
     * <pre><code>
{
    align: 'right',
    dataIndex: 'size',
    header: 'Size',
    tpl: '{size:fileSize}',
    width: .35
}
     * </code></pre>
     * Acceptable properties for each column configuration object are:
     * <div class="mdetail-params"><ul>
     * <li><b><tt>align</tt></b> : String<div class="sub-desc">Set the CSS text-align property
     * of the column. Defaults to <tt>'left'</tt>.</div></li>
     * <li><b><tt>dataIndex</tt></b> : String<div class="sub-desc">See {@link Ext.grid.Column}.
     * {@link Ext.grid.Column#dataIndex dataIndex} for details.</div></li>
     * <li><b><tt>header</tt></b> : String<div class="sub-desc">See {@link Ext.grid.Column}.
     * {@link Ext.grid.Column#header header} for details.</div></li>
     * <li><b><tt>tpl</tt></b> : String<div class="sub-desc">Specify a string to pass as the
     * configuration string for {@link Ext.XTemplate}.  By default an {@link Ext.XTemplate}
     * will be implicitly created using the <tt>dataIndex</tt>.</div></li>
     * <li><b><tt>width</tt></b> : Number<div class="sub-desc">Percentage of the container width
     * this column should be allocated.  Columns that have no width specified will be
     * allocated with an equal percentage to fill 100% of the container width.  To easily take
     * advantage of the full container width, leave the width of at least one column undefined.
     * Note that if you do not want to take up the full width of the container, the width of
     * every column needs to be explicitly defined.</div></li>
     * </ul></div>
     */
    /**
     * @cfg {Boolean/Object} columnSort
     * Specify <tt>true</tt> or specify a configuration object for {@link Ext.list.ListView.Sorter}
     * to enable the columns to be sortable (defaults to <tt>true</tt>).
     */
    columnSort: true,
    /**
     * @cfg {String/Array} internalTpl
     * The template to be used for the header row.  See {@link #tpl} for more details.
     */

    /*
     * IE has issues when setting percentage based widths to 100%. Default to 99.
     */
    maxWidth: Ext.isIE ? 99 : 100,

    initComponent : function(){
        if(this.columnResize){
            this.colResizer = new Ext.list.ColumnResizer(this.colResizer);
            this.colResizer.init(this);
        }
        if(this.columnSort){
            this.colSorter = new Ext.list.Sorter(this.columnSort);
            this.colSorter.init(this);
        }
        if(!this.internalTpl){
            this.internalTpl = new Ext.XTemplate(
                '<div class="x-list-header"><div class="x-list-header-inner">',
                    '<tpl for="columns">',
                    '<div style="width:{[values.width*100]}%;text-align:{align};"><em unselectable="on" id="',this.id, '-xlhd-{#}">',
                        '{header}',
                    '</em></div>',
                    '</tpl>',
                    '<div class="x-clear"></div>',
                '</div></div>',
                '<div class="x-list-body"><div class="x-list-body-inner">',
                '</div></div>'
            );
        }
        if(!this.tpl){
            this.tpl = new Ext.XTemplate(
                '<tpl for="rows">',
                    '<dl>',
                        '<tpl for="parent.columns">',
                        '<dt style="width:{[values.width*100]}%;text-align:{align};">',
                        '<em unselectable="on"<tpl if="cls"> class="{cls}</tpl>">',
                            '{[values.tpl.apply(parent)]}',
                        '</em></dt>',
                        '</tpl>',
                        '<div class="x-clear"></div>',
                    '</dl>',
                '</tpl>'
            );
        };

        var cs = this.columns,
            allocatedWidth = 0,
            colsWithWidth = 0,
            len = cs.length,
            columns = [];

        for(var i = 0; i < len; i++){
            var c = cs[i];
            if(!c.isColumn) {
                c.xtype = c.xtype ? (/^lv/.test(c.xtype) ? c.xtype : 'lv' + c.xtype) : 'lvcolumn';
                c = Ext.create(c);
            }
            if(c.width) {
                allocatedWidth += c.width*100;
                colsWithWidth++;
            }
            columns.push(c);
        }

        cs = this.columns = columns;

        // auto calculate missing column widths
        if(colsWithWidth < len){
            var remaining = len - colsWithWidth;
            if(allocatedWidth < this.maxWidth){
                var perCol = ((this.maxWidth-allocatedWidth) / remaining)/100;
                for(var j = 0; j < len; j++){
                    var c = cs[j];
                    if(!c.width){
                        c.width = perCol;
                    }
                }
            }
        }
        Ext.list.ListView.superclass.initComponent.call(this);
    },

    onRender : function(){
        this.autoEl = {
            cls: 'x-list-wrap'
        };
        Ext.list.ListView.superclass.onRender.apply(this, arguments);

        this.internalTpl.overwrite(this.el, {columns: this.columns});

        this.innerBody = Ext.get(this.el.dom.childNodes[1].firstChild);
        this.innerHd = Ext.get(this.el.dom.firstChild.firstChild);

        if(this.hideHeaders){
            this.el.dom.firstChild.style.display = 'none';
        }
    },

    getTemplateTarget : function(){
        return this.innerBody;
    },

    /**
     * <p>Function which can be overridden which returns the data object passed to this
     * view's {@link #tpl template} to render the whole ListView. The returned object
     * shall contain the following properties:</p>
     * <div class="mdetail-params"><ul>
     * <li><b>columns</b> : String<div class="sub-desc">See <tt>{@link #columns}</tt></div></li>
     * <li><b>rows</b> : String<div class="sub-desc">See
     * <tt>{@link Ext.DataView}.{@link Ext.DataView#collectData collectData}</div></li>
     * </ul></div>
     * @param {Array} records An Array of {@link Ext.data.Record}s to be rendered into the DataView.
     * @param {Number} startIndex the index number of the Record being prepared for rendering.
     * @return {Object} A data object containing properties to be processed by a repeating
     * XTemplate as described above.
     */
    collectData : function(){
        var rs = Ext.list.ListView.superclass.collectData.apply(this, arguments);
        return {
            columns: this.columns,
            rows: rs
        }
    },

    verifyInternalSize : function(){
        if(this.lastSize){
            this.onResize(this.lastSize.width, this.lastSize.height);
        }
    },

    // private
    onResize : function(w, h){
        var bd = this.innerBody.dom;
        var hd = this.innerHd.dom;
        if(!bd){
            return;
        }
        var bdp = bd.parentNode;
        if(Ext.isNumber(w)){
            var sw = w - Ext.num(this.scrollOffset, Ext.getScrollBarWidth());
            if(this.reserveScrollOffset || ((bdp.offsetWidth - bdp.clientWidth) > 10)){
                bd.style.width = sw + 'px';
                hd.style.width = sw + 'px';
            }else{
                bd.style.width = w + 'px';
                hd.style.width = w + 'px';
                setTimeout(function(){
                    if((bdp.offsetWidth - bdp.clientWidth) > 10){
                        bd.style.width = sw + 'px';
                        hd.style.width = sw + 'px';
                    }
                }, 10);
            }
        }
        if(Ext.isNumber(h)){
            bdp.style.height = (h - hd.parentNode.offsetHeight) + 'px';
        }
    },

    updateIndexes : function(){
        Ext.list.ListView.superclass.updateIndexes.apply(this, arguments);
        this.verifyInternalSize();
    },

    findHeaderIndex : function(hd){
        hd = hd.dom || hd;
        var pn = hd.parentNode, cs = pn.parentNode.childNodes;
        for(var i = 0, c; c = cs[i]; i++){
            if(c == pn){
                return i;
            }
        }
        return -1;
    },

    setHdWidths : function(){
        var els = this.innerHd.dom.getElementsByTagName('div');
        for(var i = 0, cs = this.columns, len = cs.length; i < len; i++){
            els[i].style.width = (cs[i].width*100) + '%';
        }
    }
});

Ext.reg('listview', Ext.list.ListView);

// Backwards compatibility alias
Ext.ListView = Ext.list.ListView;/**
 * @class Ext.list.Column
 * <p>This class encapsulates column configuration data to be used in the initialization of a
 * {@link Ext.list.ListView ListView}.</p>
 * <p>While subclasses are provided to render data in different ways, this class renders a passed
 * data field unchanged and is usually used for textual columns.</p>
 */
Ext.list.Column = Ext.extend(Object, {
    /**
     * @private
     * @cfg {Boolean} isColumn
     * Used by ListView constructor method to avoid reprocessing a Column
     * if <code>isColumn</code> is not set ListView will recreate a new Ext.list.Column
     * Defaults to true.
     */
    isColumn: true,
    
    /**
     * @cfg {String} align
     * Set the CSS text-align property of the column. Defaults to <tt>'left'</tt>.
     */        
    align: 'left',
    /**
     * @cfg {String} header Optional. The header text to be used as innerHTML
     * (html tags are accepted) to display in the ListView.  <b>Note</b>: to
     * have a clickable header with no text displayed use <tt>'&#160;'</tt>.
     */    
    header: '',
    
    /**
     * @cfg {Number} width Optional. Percentage of the container width
     * this column should be allocated.  Columns that have no width specified will be
     * allocated with an equal percentage to fill 100% of the container width.  To easily take
     * advantage of the full container width, leave the width of at least one column undefined.
     * Note that if you do not want to take up the full width of the container, the width of
     * every column needs to be explicitly defined.
     */    
    width: null,

    /**
     * @cfg {String} cls Optional. This option can be used to add a CSS class to the cell of each
     * row for this column.
     */
    cls: '',
    
    /**
     * @cfg {String} tpl Optional. Specify a string to pass as the
     * configuration string for {@link Ext.XTemplate}.  By default an {@link Ext.XTemplate}
     * will be implicitly created using the <tt>dataIndex</tt>.
     */

    /**
     * @cfg {String} dataIndex <p><b>Required</b>. The name of the field in the
     * ListViews's {@link Ext.data.Store}'s {@link Ext.data.Record} definition from
     * which to draw the column's value.</p>
     */
    
    constructor : function(c){
        if(!c.tpl){
            c.tpl = new Ext.XTemplate('{' + c.dataIndex + '}');
        }
        else if(Ext.isString(c.tpl)){
            c.tpl = new Ext.XTemplate(c.tpl);
        }
        
        Ext.apply(this, c);
    }
});

Ext.reg('lvcolumn', Ext.list.Column);

/**
 * @class Ext.list.NumberColumn
 * @extends Ext.list.Column
 * <p>A Column definition class which renders a numeric data field according to a {@link #format} string.  See the
 * {@link Ext.list.Column#xtype xtype} config option of {@link Ext.list.Column} for more details.</p>
 */
Ext.list.NumberColumn = Ext.extend(Ext.list.Column, {
    /**
     * @cfg {String} format
     * A formatting string as used by {@link Ext.util.Format#number} to format a numeric value for this Column
     * (defaults to <tt>'0,000.00'</tt>).
     */    
    format: '0,000.00',
    
    constructor : function(c) {
        c.tpl = c.tpl || new Ext.XTemplate('{' + c.dataIndex + ':number("' + (c.format || this.format) + '")}');       
        Ext.list.NumberColumn.superclass.constructor.call(this, c);
    }
});

Ext.reg('lvnumbercolumn', Ext.list.NumberColumn);

/**
 * @class Ext.list.DateColumn
 * @extends Ext.list.Column
 * <p>A Column definition class which renders a passed date according to the default locale, or a configured
 * {@link #format}. See the {@link Ext.list.Column#xtype xtype} config option of {@link Ext.list.Column}
 * for more details.</p>
 */
Ext.list.DateColumn = Ext.extend(Ext.list.Column, {
    format: 'm/d/Y',
    constructor : function(c) {
        c.tpl = c.tpl || new Ext.XTemplate('{' + c.dataIndex + ':date("' + (c.format || this.format) + '")}');      
        Ext.list.DateColumn.superclass.constructor.call(this, c);
    }
});
Ext.reg('lvdatecolumn', Ext.list.DateColumn);

/**
 * @class Ext.list.BooleanColumn
 * @extends Ext.list.Column
 * <p>A Column definition class which renders boolean data fields.  See the {@link Ext.list.Column#xtype xtype}
 * config option of {@link Ext.list.Column} for more details.</p>
 */
Ext.list.BooleanColumn = Ext.extend(Ext.list.Column, {
    /**
     * @cfg {String} trueText
     * The string returned by the renderer when the column value is not falsey (defaults to <tt>'true'</tt>).
     */
    trueText: 'true',
    /**
     * @cfg {String} falseText
     * The string returned by the renderer when the column value is falsey (but not undefined) (defaults to
     * <tt>'false'</tt>).
     */
    falseText: 'false',
    /**
     * @cfg {String} undefinedText
     * The string returned by the renderer when the column value is undefined (defaults to <tt>'&#160;'</tt>).
     */
    undefinedText: '&#160;',
    
    constructor : function(c) {
        c.tpl = c.tpl || new Ext.XTemplate('{' + c.dataIndex + ':this.format}');
        
        var t = this.trueText, f = this.falseText, u = this.undefinedText;
        c.tpl.format = function(v){
            if(v === undefined){
                return u;
            }
            if(!v || v === 'false'){
                return f;
            }
            return t;
        };
        
        Ext.list.DateColumn.superclass.constructor.call(this, c);
    }
});

Ext.reg('lvbooleancolumn', Ext.list.BooleanColumn);/**
 * @class Ext.list.ColumnResizer
 * @extends Ext.util.Observable
 * <p>Supporting Class for Ext.list.ListView</p>
 * @constructor
 * @param {Object} config
 */
Ext.list.ColumnResizer = Ext.extend(Ext.util.Observable, {
    /**
     * @cfg {Number} minPct The minimum percentage to allot for any column (defaults to <tt>.05</tt>)
     */
    minPct: .05,

    constructor: function(config){
        Ext.apply(this, config);
        Ext.list.ColumnResizer.superclass.constructor.call(this);
    },
    init : function(listView){
        this.view = listView;
        listView.on('render', this.initEvents, this);
    },

    initEvents : function(view){
        view.mon(view.innerHd, 'mousemove', this.handleHdMove, this);
        this.tracker = new Ext.dd.DragTracker({
            onBeforeStart: this.onBeforeStart.createDelegate(this),
            onStart: this.onStart.createDelegate(this),
            onDrag: this.onDrag.createDelegate(this),
            onEnd: this.onEnd.createDelegate(this),
            tolerance: 3,
            autoStart: 300
        });
        this.tracker.initEl(view.innerHd);
        view.on('beforedestroy', this.tracker.destroy, this.tracker);
    },

    handleHdMove : function(e, t){
        var hw = 5,
            x = e.getPageX(),
            hd = e.getTarget('em', 3, true);
        if(hd){
            var r = hd.getRegion(),
                ss = hd.dom.style,
                pn = hd.dom.parentNode;

            if(x - r.left <= hw && pn != pn.parentNode.firstChild){
                this.activeHd = Ext.get(pn.previousSibling.firstChild);
                ss.cursor = Ext.isWebKit ? 'e-resize' : 'col-resize';
            } else if(r.right - x <= hw && pn != pn.parentNode.lastChild.previousSibling){
                this.activeHd = hd;
                ss.cursor = Ext.isWebKit ? 'w-resize' : 'col-resize';
            } else{
                delete this.activeHd;
                ss.cursor = '';
            }
        }
    },

    onBeforeStart : function(e){
        this.dragHd = this.activeHd;
        return !!this.dragHd;
    },

    onStart: function(e){
        this.view.disableHeaders = true;
        this.proxy = this.view.el.createChild({cls:'x-list-resizer'});
        this.proxy.setHeight(this.view.el.getHeight());

        var x = this.tracker.getXY()[0],
            w = this.view.innerHd.getWidth();

        this.hdX = this.dragHd.getX();
        this.hdIndex = this.view.findHeaderIndex(this.dragHd);

        this.proxy.setX(this.hdX);
        this.proxy.setWidth(x-this.hdX);

        this.minWidth = w*this.minPct;
        this.maxWidth = w - (this.minWidth*(this.view.columns.length-1-this.hdIndex));
    },

    onDrag: function(e){
        var cursorX = this.tracker.getXY()[0];
        this.proxy.setWidth((cursorX-this.hdX).constrain(this.minWidth, this.maxWidth));
    },

    onEnd: function(e){
        /* calculate desired width by measuring proxy and then remove it */
        var nw = this.proxy.getWidth();
        this.proxy.remove();

        var index = this.hdIndex,
            vw = this.view,
            cs = vw.columns,
            len = cs.length,
            w = this.view.innerHd.getWidth(),
            minPct = this.minPct * 100,
            pct = Math.ceil((nw * vw.maxWidth) / w),
            diff = (cs[index].width * 100) - pct,
            eachItem = Math.floor(diff / (len-1-index)),
            mod = diff - (eachItem * (len-1-index));

        for(var i = index+1; i < len; i++){
            var cw = (cs[i].width * 100) + eachItem,
                ncw = Math.max(minPct, cw);
            if(cw != ncw){
                mod += cw - ncw;
            }
            cs[i].width = ncw / 100;
        }
        cs[index].width = pct / 100;
        cs[index+1].width += (mod / 100);
        delete this.dragHd;
        vw.setHdWidths();
        vw.refresh();
        setTimeout(function(){
            vw.disableHeaders = false;
        }, 100);
    }
});

// Backwards compatibility alias
Ext.ListView.ColumnResizer = Ext.list.ColumnResizer;/**
 * @class Ext.list.Sorter
 * @extends Ext.util.Observable
 * <p>Supporting Class for Ext.list.ListView</p>
 * @constructor
 * @param {Object} config
 */
Ext.list.Sorter = Ext.extend(Ext.util.Observable, {
    /**
     * @cfg {Array} sortClasses
     * The CSS classes applied to a header when it is sorted. (defaults to <tt>["sort-asc", "sort-desc"]</tt>)
     */
    sortClasses : ["sort-asc", "sort-desc"],

    constructor: function(config){
        Ext.apply(this, config);
        Ext.list.Sorter.superclass.constructor.call(this);
    },

    init : function(listView){
        this.view = listView;
        listView.on('render', this.initEvents, this);
    },

    initEvents : function(view){
        view.mon(view.innerHd, 'click', this.onHdClick, this);
        view.innerHd.setStyle('cursor', 'pointer');
        view.mon(view.store, 'datachanged', this.updateSortState, this);
        this.updateSortState.defer(10, this, [view.store]);
    },

    updateSortState : function(store){
        var state = store.getSortState();
        if(!state){
            return;
        }
        this.sortState = state;
        var cs = this.view.columns, sortColumn = -1;
        for(var i = 0, len = cs.length; i < len; i++){
            if(cs[i].dataIndex == state.field){
                sortColumn = i;
                break;
            }
        }
        if(sortColumn != -1){
            var sortDir = state.direction;
            this.updateSortIcon(sortColumn, sortDir);
        }
    },

    updateSortIcon : function(col, dir){
        var sc = this.sortClasses;
        var hds = this.view.innerHd.select('em').removeClass(sc);
        hds.item(col).addClass(sc[dir == "DESC" ? 1 : 0]);
    },

    onHdClick : function(e){
        var hd = e.getTarget('em', 3);
        if(hd && !this.view.disableHeaders){
            var index = this.view.findHeaderIndex(hd);
            this.view.store.sort(this.view.columns[index].dataIndex);
        }
    }
});

// Backwards compatibility alias
Ext.ListView.Sorter = Ext.list.Sorter;