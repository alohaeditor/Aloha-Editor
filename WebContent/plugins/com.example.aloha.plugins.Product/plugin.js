/**
 * Aloha Product Example Plugin
 */
if (typeof EXAMPLE == 'undefined' || !EXAMPLE) {
	var EXAMPLE = {};
}
EXAMPLE.Product = new GENTICS.Aloha.Plugin('com.example.aloha.plugins.Product');

/**
 * Configure the available languages
 */
EXAMPLE.Product.languages = ['en', 'de'];

/**
 * Reference to our product attribute field 
 */
EXAMPLE.Product.productField = null;

/**
 * Initialize the plugin and set initialize flag on true
 */
EXAMPLE.Product.init = function () {
	var that = this; 
	
	// floating menu "Insert product"-button
	var insertButton = new GENTICS.Aloha.ui.Button({
        'iconClass' : 'GENTICS_button GENTICS_button_product',
        'size' : 'small',
        'onclick' : function () { 
	 		that.insertProduct();
	 	},
        'tooltip' : this.i18n('button.insertproduct'),
        'toggle' : false
    });
    GENTICS.Aloha.FloatingMenu.addButton(
        'GENTICS.Aloha.continuoustext',
        insertButton,
        GENTICS.Aloha.i18n(GENTICS.Aloha, 'floatingmenu.tab.insert'),
        1
    );
    
    // product scope & product attribute field
    GENTICS.Aloha.FloatingMenu.createScope(this.getUID('product'), 'GENTICS.Aloha.global');
	this.productField = new GENTICS.Aloha.ui.AttributeField();
	this.productField.setTemplate('<span><b>{displayName}</b>' +
			'<span class="product-preview" style="background-image: url({url});"></span>' +
			'<br class="clear" /><i>{objectType}</i></span>');
    this.productField.setObjectTypeFilter(['product']);
    this.productField.setDisplayField('displayName');
    GENTICS.Aloha.FloatingMenu.addButton(
        this.getUID('product'),
        this.productField,
        this.i18n('floatingmenu.tab.product'),
        1
    );
    
    // handle event as soon as a product block is clicked
    GENTICS.Aloha.EventRegistry.subscribe(GENTICS.Aloha, 'selectionChanged', function(event, rangeObject) {
        var foundMarkup = that.findProduct( rangeObject );
        jQuery('.product-selected').removeClass('product-selected');
        
        if ( foundMarkup.length != 0 ) {
            GENTICS.Aloha.FloatingMenu.setScope(that.getUID('product'));
            that.productField.setTargetObject(foundMarkup, 'data-product-name');
            
            foundMarkup.addClass('product-selected');
        }
        // re-layout the Floating Menu
        GENTICS.Aloha.FloatingMenu.doLayout();
    });
	
    GENTICS.Aloha.EventRegistry.subscribe(
			GENTICS.Aloha, 
			"editableDeactivated", 
			function (jEvent, aEvent) {
		        jQuery('.product-selected').removeClass('product-selected');
			}
	);
    
};

/**
 * search the dom upwards until a product block is found
 */
EXAMPLE.Product.findProduct = function (range) {
	return jQuery(range.commonAncestorContainer).closest('.GENTICS_block.product');
};

/**
 * insert a product at the cursor position
 */
EXAMPLE.Product.insertProduct = function () {
    // activate floating menu tab
    GENTICS.Aloha.FloatingMenu.userActivatedTab = this.i18n('floatingmenu.tab.product');

    // current selection or cursor position
    var range = GENTICS.Aloha.Selection.getRangeObject();

    // insert a product
    var newProduct = jQuery('<div class="GENTICS_block product" contenteditable="false">' +
    		'<div class="image"></div>' +
    		'<div class="name">' + this.i18n('newproductname') + '</div></div>');
    
    // insert the product into the dom and focus it
    GENTICS.Utils.Dom.insertIntoDOM(newProduct, range, jQuery(GENTICS.Aloha.activeEditable.obj));
    range.startContainer = range.endContainer = newProduct.contents().get(0);
    range.select();
    this.productField.focus();
};

/**
 * update a selected product
 */
EXAMPLE.Product.updateProduct = function (obj, resourceItem) {
	obj.find('.name').text(resourceItem.displayName);
	obj.find('.image').css('backgroundImage', 'url(' + resourceItem.url + ')');
};