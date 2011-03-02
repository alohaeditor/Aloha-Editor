(function(){

	// Requirements
	var
		sys = require("sys"),
    fs = require("fs"),
    path = require("path"),
		less = require("less"),
		uglify = require("uglify-js"),
    	jsp = uglify.parser,
    	pro = uglify.uglify,
    util = require('util'),
    exec = require('child_process').exec,
		deps = require(__dirname+'/deps.js');

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
	}.extend(JSON.parse(fs.readFileSync(process.argv[2]||"package.json").toString()));

	// App Functions
	var app = {
		/**
		 * Initialise
		 */
		init: function(){
			// Normalize Paths
			config.paths.each(function(key,value){
				config.paths[key] = fs.realpathSync(value);
			});
			config.js.each(function(group,files){
				files.each(function(key,value){
					config.js[group][key] = fs.realpathSync(config.paths.src+'/'+value);
				});
			});
			config.css.each(function(group,files){
				files.each(function(key,value){
					config.css[group][key] = fs.realpathSync(config.paths.src+'/'+value);
				});
			});
			config.i18n.each(function(group,files){
				files.each(function(key,value){
					config.i18n[group][key] = fs.realpathSync(config.paths.src+'/'+value);
				});
			});

			// Others
			config.out = config.paths.dist+'/'+config.name;
		},

		/**
		 * Copy a file
		 * @param {Path} src
		 * @param {Path} dst
		 */
		cp: function(src,dst){
			var txt = fs.readFileSync(src).toString();
			fs.writeFileSync(dst,txt);
			return true;
		},

		/**
		 * Ensure Path Exists
		 * @param {Path} p
		 */
		ensurePath: function(p){
			p = p.replace(/[\/\\]$/,'');
			try {
				fs.statSync(p);
				return true;
			}
			catch ( e ) {
				var parent = p.replace(/[\/\\][^\/\\]+$/,'');
				app.ensurePath(parent);
				fs.mkdirSync(p,0700);
				return true;
			}
		},

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
					"i18n": []
					//"img": []
				};

			// Check if the meta data exists
			if ( !path.exists(plugin) ) {
				// Create the meta data
				pluginMetaData.js = app.findFilesWithExtension(pluginPath, ".js");
				pluginMetaData.css = app.findFilesWithExtension(pluginPath, ".css");
				pluginMetaData.i18n = app.findFilesWithExtension(pluginPath, ".dict");
				//pluginMetaData.img = app.findFilesWithExtension(pluginPath, /^\.(jpe?g|gif|png|tiff?|w?bmp)$/);
			}
			else {
				// There is already meta data
				pluginMetaData.extend(JSON.parse(fs.readFileSync(pluginMetaPath).toString()));
			}

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
			//config.img.plugin = config.js.plugin.concat(pluginMetaData.img);

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
			// Prepare
			var outPath, outText, bothPath, bothText;

			// Bundle JavaScript
			bothText = '';
			bothPath = config.out+'.js';
			config.js.each(function(group,files){
				// Prepare
				outPath = config.out+'.'+group+'.js';
				outText = '';

				// Cycle
				files.each(function(i,filePath){
					outText += fs.readFileSync(filePath).toString();
				});

				// Render
				// fs.writeFileSync(outPath,outText);

				// Amend
				bothText += outText;
			});
			fs.writeFileSync(bothPath,bothText);

			// Bundle CSS
			bothText = '';
			bothPath = config.out+'.css';
			config.css.each(function(group,files){
				// Prepare
				outPath = config.out+'.'+group+'.css';
				outText = '';

				// Cycle
				files.each(function(i,filePath){
					var parentPath = filePath.replace(/[\/\\][^\/\\]+$/,'');

					outText += fs.readFileSync(filePath).toString().replace(/url\(([^\)]+)\)/g,function(str, p1, offset){
						var url = p1.replace(/[\'\"]/g,'');
						if ( url[0] !== '/' && !/\:/.test(url) ) {
							url = fs.realpathSync(parentPath+'/'+url).replace(config.paths.dist+'/','');
						}
						return 'url(\''+url+'\')';
					});
				});

				// Render
				// fs.writeFileSync(outPath,outText);

				// Amend
				bothText += outText;
			});
			fs.writeFileSync(bothPath,bothText);

			// Done
			return true;
		},

		/**
		 * Compile
		 */
		compile: function() {
			// Prepare
			var
				jsPath = config.paths.dist+'/'+config.name+'.js',
				cssPath = config.paths.dist+'/'+config.name+'.css';

			// JavaScript
			var orig_code = fs.readFileSync(jsPath).toString();
			var ast = jsp.parse(orig_code); // parse code and get the initial AST
			ast = pro.ast_mangle(ast); // get a new AST with mangled names
			ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
			var final_code = pro.gen_code(ast); // compressed code here
			fs.writeFileSync(jsPath,final_code);

			// CSS
			var data = fs.readFileSync(cssPath).toString();
			new(less.Parser)({
					paths: [config.paths.dist],
					optimization: 1,
					filename: cssPath
			}).parse(data, function (err, tree) {
					if (err) {
							less.writeError(err, options);
							process.exit(1);
					} else {
							try {
									css = tree.toCSS({ compress: 1 });
									fs.writeFileSync(cssPath,css);
							} catch (e) {
									less.writeError(e, options);
									process.exit(2);
							}
					}
			});

			// Sprites
			if ( false ) exec(
				"java -Xms64m -Xmx256m -Djava.ext.dirs=./vendor/smartsprites/lib org.carrot2.labs.smartsprites.SmartSprites dist/aloha.css",
				function (error, stdout, stderr) {
					console.log('stdout: ' + stdout);
					console.log('stderr: ' + stderr);
					if (error !== null) {
						console.log('exec error: ' + error);
					}
				}
			);

		},

		/**
		 * Run the Application
		 */
		run: function() {
			// Init
			app.init();

			// Merge
			app.mergePlugins();

			// Bundle
			app.bundle();

			// Compile
			app.compile();

			// Done
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
