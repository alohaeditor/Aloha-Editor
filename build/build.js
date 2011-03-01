(function(){

	// Requirements
	var
		sys = require("sys"),
    fs = require("fs"),
    path = require("path"),
		less = require("less"),
		yaml = require("yaml"),
		jsp = require("uglify-js"),
		deps = require('./deps.js');

	// Configure
	var config = {
		"files": {
			"meta": "package.json"
		},
		"js": {
			"dep": [],
			"core": [],
			"plugin": []
		},
		"css": {
			"dep": [],
			"core": [],
			"plugin": []
		},
		"i18n": {
			"dep": [],
			"core": [],
			"plugin": []
		},
		"img": {
			"dep": [],
			"core": [],
			"plugin": []
		}
	}.extend(JSON.parse(fs.readFileSync("package.json").toString()));

	// Normalize Paths
	config.paths.each(function(key,value){
		config.paths[key] = fs.realpathSync(value);
	});

	// App Functions
	var app = {

		/**
		 * Find all files with a particular extension
		 * @param {Path} parentPath
		 * @param {String} ext
		 * @return {Array} foundFiles
		 */
		findFilesWithExtension: function(parentPath, ext){
			// Prepare
			var foundFiles = [];

			// Cycle
			fs.readdirSync(parentPath).each(function(key,file){
				// Prepare
				var
					filePath = parentPath+'/'+file,
					stat = fs.statSync(filePath);

				// Check
				if ( !stat ) return;

				// Handle
				if ( stat.isDirectory() ) {
					// Recurse
					foundFiles = foundFiles.concat(app.findFilesWithExtension(filePath,ext));
				}
				else {
					// Check
					var fileExt = path.extname(file);
					if (
						(typeof ext === 'string' && ext === fileExt) ||
						(typeof ext === 'function' && ext.test(fileExt))
					){
						// Add
						foundFiles.push(filePath);
					}
				}
			});

			// Done
			return foundFiles;
		},

		/**
		 * Get Plugin Path
		 * @param {String} plugin
		 * @return {Path} pluginPath
		 */
		getPluginPath: function(plugin){
			var pluginPath = config.paths.plugin+'/'+plugin;
			return pluginPath;
		},

		/**
		 * Get Plugin Meta Path
		 * @param {String} plugin
		 * @return {Path} pluginMetaPath
		 */
		getPluginMetaPath: function(plugin){
			var pluginMetaPath = config.paths.plugin+'/'+plugin+'/'+config.files.meta;
			return pluginMetaPath;
		},

		/**
		 * Read Plugin Meta Data
		 * @param {Path} plugin
		 * @return {Object} pluginMetaData
		 */
		getPluginMetaData: function(plugin) {
			// Prepare
			var
				pluginPath = app.getPluginPath(plugin),
				pluginMetaPath = app.getPluginMetaPath(plugin),
				pluginMetaData = {
					"js": [],
					"css": [],
					"img": [],
					"i18n": []
				};

			// Check if the meta data exists
			if ( !path.exists(plugin) ) {
				// Create the meta data
				pluginMetaData.js = app.findFilesWithExtension(pluginPath, ".js");
				pluginMetaData.css = app.findFilesWithExtension(pluginPath, ".css");
				pluginMetaData.i18n = app.findFilesWithExtension(pluginPath, ".dict");
				pluginMetaData.img = app.findFilesWithExtension(pluginPath, /^\.(jpe?g|gif|png|tiff?|w?bmp)$/);
			}
			else {
				// There is already meta data
				pluginMetaData.extend(JSON.parse(fs.readFileSync(pluginMetaPath).toString()));
			}

			// Absolute the Paths
			console.log(pluginMetaData);

			// Return the meta data
			return pluginMetaData;
		},

		/**
		 * Merge the Plugin Meta Data
		 * @param {Path} pluginMetaPath
		 * @return {Object} pluginMetaData
		 */
		mergePluginMetaData: function(plugin) {
			// Prepare
			var
				pluginMetaData = app.getPluginMetaData(plugin);

			// Merge into Global Data
			config.js.plugin = config.js.plugin.concat(pluginMetaData.js);
			config.css.plugin = config.css.plugin.concat(pluginMetaData.css);
			config.i18n.plugin = config.i18n.plugin.concat(pluginMetaData.i18n);
			config.img.plugin = config.js.plugin.concat(pluginMetaData.img);

			// Done
			return true;
		},

		/**
		 * Merge the Selected PLugins into the Config
		 */
		mergePlugins: function() {
			config.plugins.each(function(key,plugin){
				app.mergePluginMetaData(plugin);
			});
			return true;
		},


		/**
		 * Bundle the Files
		 */
		bundle: function() {
			console.log(config);

			// Bundle JavaScript
			config.js.each(function(key,files){

			});


			return true;
		},

		/**
		 * Run the Application
		 */
		run: function() {
			app.mergePlugins();
			app.bundle();
			return true;
		}
	};

	// Run the Application
	app.run();

	// Done
})();


/*


// Compress CSS
less.render(".class { width: 1 + 1 }", function (e, css) {
    console.log(css);
});

// Compress JavaScript
var jsp = require("uglifyjs/parse-js");
var pro = require("uglifyjs/process");

var orig_code = "... JS code here";
var ast = jsp.parse(orig_code); // parse code and get the initial AST
ast = pro.ast_mangle(ast); // get a new AST with mangled names
ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
var final_code = pro.gen_code(ast); // compressed code here
*/
