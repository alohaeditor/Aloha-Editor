/**
 * Create the resource object & check for resource namespace
 * @hide
 */
if ( !GENTICS.Aloha.Resources ) GENTICS.Aloha.Resources = {};
GENTICS.Aloha.Resources.Product = new GENTICS.Aloha.Resource('com.gentics.aloha.resources.Product');

/**
 * resource data
 */
GENTICS.Aloha.Resources.Product.settings.data = [
	{ id: 1, name: 'Kuota Kueen K', url:'../plugins/com.example.aloha.plugins.Product/resources/kuota-kueen-k.jpg', resourceObjectType: 'product' },
	{ id: 2, name: '2XU Wetsuit', url:'../plugins/com.example.aloha.plugins.Product/resources/2xu-wetsuit.jpg', resourceObjectType: 'product' },
	{ id: 3, name: 'Asics Noosa Tri', url:'../plugins/com.example.aloha.plugins.Product/resources/asics-noosa.jpg', resourceObjectType: 'product' },
	{ id: 4, name: 'Mizuno Wave Musha 2', url:'../plugins/com.example.aloha.plugins.Product/resources/mizuno-wave-musha2.jpg', resourceObjectType: 'product' },
	{ id: 5, name: 'Simplon Mr. T', url:'../plugins/com.example.aloha.plugins.Product/resources/simplon-mrt.jpg', resourceObjectType: 'product' },
	{ id: 6, name: 'Zoggs Predator', url:'../plugins/com.example.aloha.plugins.Product/resources/zoggs-predator.jpg', resourceObjectType: 'product' },
	{ id: 7, name: 'Fivefingers KSO', url:'../plugins/com.example.aloha.plugins.Product/resources/fivefingers-kso.jpg', resourceObjectType: 'product' },
	{ id: 8, name: 'Trek Fuel EX', url:'../plugins/com.example.aloha.plugins.Product/resources/trek-fuel-ex.jpg', resourceObjectType: 'product' }
];

/**
 * Searches a resource for resource items matching query if resourceObjectTypes.
 * If none found it returns null.
 */
GENTICS.Aloha.Resources.Product.query = function(searchText, resourceObjectTypes, callback) {
	var d = this.settings.data.filter(function(e, i, a) {
		var r = new RegExp(searchText, 'i'); 
		return (
			jQuery.inArray(e.resourceObjectType, resourceObjectTypes) > -1 &&
			( e.name.match(r) || e.url.match(r) ) 
		);
	});
	callback.call( this, d);
};

/**
 * callback after a product has been selected from the resource
 */
GENTICS.Aloha.Resource.prototype.markObject = function (obj, resourceItem) {
	EXAMPLE.Product.updateProduct(obj, resourceItem);
};