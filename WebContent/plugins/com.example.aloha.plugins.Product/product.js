/**
 * Create the resource object & check for resource namespace
 * @hide
 */
if ( !GENTICS.Aloha.Repositories ) GENTICS.Aloha.Repositories = {};
GENTICS.Aloha.Repositories.Product = new GENTICS.Aloha.Repository('com.gentics.aloha.resources.Product');

/**
 * resource data
 */
GENTICS.Aloha.Repositories.Product.settings.data = [
	{ id: 1, displayName: 'Kuota Kueen K', url:'../plugins/com.example.aloha.plugins.Product/resources/kuota-kueen-k.jpg', objectType: 'product' },
	{ id: 2, displayName: '2XU Wetsuit', url:'../plugins/com.example.aloha.plugins.Product/resources/2xu-wetsuit.jpg', objectType: 'product' },
	{ id: 3, displayName: 'Asics Noosa Tri', url:'../plugins/com.example.aloha.plugins.Product/resources/asics-noosa.jpg', objectType: 'product' },
	{ id: 4, displayName: 'Mizuno Wave Musha 2', url:'../plugins/com.example.aloha.plugins.Product/resources/mizuno-wave-musha2.jpg', objectType: 'product' },
	{ id: 5, displayName: 'Simplon Mr. T', url:'../plugins/com.example.aloha.plugins.Product/resources/simplon-mrt.jpg', objectType: 'product' },
	{ id: 6, displayName: 'Zoggs Predator', url:'../plugins/com.example.aloha.plugins.Product/resources/zoggs-predator.jpg', objectType: 'product' },
	{ id: 7, displayName: 'Fivefingers KSO', url:'../plugins/com.example.aloha.plugins.Product/resources/fivefingers-kso.jpg', objectType: 'product' },
	{ id: 8, displayName: 'Trek Fuel EX', url:'../plugins/com.example.aloha.plugins.Product/resources/trek-fuel-ex.jpg', objectType: 'product' }
];

/**
 * Searches a resource for resource items matching query if objectTypes.
 * If none found it returns null.
 */
GENTICS.Aloha.Repositories.Product.query = function( p, callback) {
	var d = this.settings.data.filter(function(e, i, a) {
		var r = new RegExp(p.queryString, 'i'); 
		return (
			jQuery.inArray(e.objectType, p.objectTypeFilter) > -1 &&
			( e.displayName.match(r) || e.url.match(r) ) 
		);
	});
	callback.call( this, d);
};

/**
 * callback after a product has been selected from the resource
 */
GENTICS.Aloha.Repositories.Product.markObject = function (obj, resourceItem) {
	EXAMPLE.Product.updateProduct(obj, resourceItem);
};