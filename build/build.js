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
		deps = require(__dirname+'/dep.js'),
		util = require(__dirname+'/util.js');

	// Buildr Constructor
	var Buildr = function(config){
		this.config = {}.extend(this.config);
		this.init.apply(this,arguments);
	};

	// Buildr Definition
	Buildr.prototype.extend({
		/**
		 * Configuration
		 **/
		"config": {
			"dir": {
				// Exists in root path
				"src": "src",
				"out": "out",
				"template": "template"
			},
			"subdir": {
				// Exists in src and out paths
				"src": "src",
   			"demo": "demo",
				"plugin": "plugin",
				"i18n": "i18n"
			},
			"template": {
				// Exists in template path
				"footer": "footer.js",
				"header": "header.js",
				"replace": "replace.js",
				"bundle": "bundle.js",
				"prefix": "prefix.js"
			},
			"js": [],
			"css": [],
			"template": [],
			"plugin": []
		},

		/**
		 * Initialise the Builder
		 * @param {Path} rootPath
		 **/
		init: function(rootPath){
			// Normalise Configuration
			this.parseConfig(rootPath);
		},

		/**
		 * Parse the Configuration
		 * @param {Path} rootPath
		 **/
		parseConfig: function(rootPath){
			// Prepare
			var config = this.config;

			// Path
			config.rootPath = fs.realpathSync(rootPath.strip('package.json'));
			config.metaPath = config.rootPath+'/package.json';
			var exists = util.fileExistsSync(config.metaPath);

			// Check if the meta data exists
			if ( exists ) {
				// There is already meta data
				config.extend(JSON.parse(fs.readFileSync(config.metaPath).toString()));
			}
			else {
				// Set auto as true
				config.auto = true;
			}

			// Directories
			config.dir.each(function(key,value){
				try {
					config.dir[key] = fs.realpathSync(config.rootPath+'/'+value);
				}
				catch ( e ) {
					config.dir[key] = false;
				}
			});

			// Templates
			config.template.each(function(key,value){
				config.template[key] = config.dir.template+'/'+value;
			});

			// Name
			config.name = config.name || path.basename(config.rootPath);

			// Handle Auto
			if ( (config.auto||false) === true ) {
				// Prepare
				var sourcePath = config.rootPath+'/'+config.subdir.src;

				// Ensure the meta data
				config.js = util.findFilesWithExtensionSync(sourcePath, ".js");
				config.css = util.findFilesWithExtensionSync(sourcePath, ".css");

				// Create autoConfig
				var autoConfig = {
					auto: true,
					js: [],
					css: []
				};

				// Add Files
				config.js.each(function(i,v){
					autoConfig.js.push(util.getRelativePath(v,config.rootPath));
				});
				config.css.each(function(i,v){
					autoConfig.css.push(util.getRelativePath(v,config.rootPath));
				});

				// Update plugin meta data
				fs.writeFileSync(config.metaPath,JSON.stringify(autoConfig));
			}


			// Done
			return true;
		},

		/**
		 * Get Plugin Path
		 * @param {String} plugin
		 * @return {Path} pluginPath
		 */
		getPluginPath: function(plugin){
			// Prepare
			var config = this.config;

			// Handle
			var pluginPath = config.dir.src+'/'+config.subdir.plugin+'/'+plugin;

			// Return
			return pluginPath;
		},

		/**
		 * Read Plugin Meta Data
		 * @param {Path} plugin
		 * @return {Object} pluginMetaData
		 */
		getPluginMetaData: function(pluginName) {
			// Prepare
			var pluginPath = this.getPluginPath(pluginName);

			// Create Buildr
			var pluginBuildr = new Buildr(pluginPath);

			// Return Meta Data
			return pluginBuildr.config;
		},

		/**
		 * Merge the Plugin Meta Data
		 * @param {Path} pluginMetaPath
		 * @return {Object} pluginMetaData
		 */
		mergePluginMetaData: function(pluginName) {
			// Prepare
			var
				config = this.config,
				pluginMetaData = this.getPluginMetaData(pluginName);

			// Merge into Global Data
			config.js = config.js.concat(pluginMetaData.js);
			config.css = config.css.concat(pluginMetaData.css);

			// Done
			return true;
		},

		/**
		 * Merge the Selected PLugins into the Config
		 */
		mergePlugins: function() {
			// Prepare
			var config = this.config, me = this;

			// Merge in Plugin Data
			config.plugin.each(function(key,pluginName){
				me.mergePluginMetaData(pluginName);
			});

			// Done
			return true;
		},

		/**
		 * Bundle the Files
		 */
		bundle: function() {
			// Prepare
			var
				me = this,
				config = this.config,
				fileSrcPath, fileOutPath,
				bundleSrcData, bundleOutData, bundleSrcPath, bundleOutPath;

			// Templates
			templateBundleText = fs.readFileSync(config.template.bundle).toString();
			templateReplaceText = fs.readFileSync(config.template.replace).toString();
			templateHeaderText = fs.readFileSync(config.template.header).toString();
			templateFooterText = fs.readFileSync(config.template.footer).toString();
			templatePrefixText = fs.readFileSync(config.template.prefix).toString();


			// ----------------------------------------------------------------------
			// Javascript

			// Prepare
			bundleSrcData = ''; bundleSrcPath = config.dir.src+'/'+config.name+'.js';
			bundleOutData = ''; bundleOutPath = config.dir.out+'/'+config.name+'.js';

			// Adjust
			bundleSrcData += templatePrefixText+templateHeaderText;
			bundleOutData += templatePrefixText;

			// Plugins
			config.plugin.each(function(i,pluginName){
				// Amend Src Text
				bundleSrcData += templateBundleText.replace('%NAME%',pluginName);
				bundleOutData += templateBundleText.replace('%NAME%',pluginName);
			});

			// Bundle
			config.js.each(function(i,filePath){
				// Prepare
				filePath = util.getRelativePath(filePath,[config.dir.src,config.dir.out]);
				fileSrcPath = config.dir.src+'/'+filePath;
				fileOutPath = config.dir.out+'/'+filePath;

				// Amend Out Text
				bundleOutData += fs.readFileSync(fileOutPath).toString();
				fs.unlinkSync(fileOutPath);

				// Amend Src Text
				bundleSrcData += templateReplaceText.replace('%PATH%',filePath);
			});

			// Adjust
			bundleSrcData += templateFooterText;

			// Write
			fs.writeFileSync(bundleSrcPath,bundleSrcData);
			fs.writeFileSync(bundleOutPath,bundleOutData);


			// ----------------------------------------------------------------------
			// CSS

			// Prepare
			bundleSrcData = ''; bundleSrcPath = config.dir.src+'/'+config.name+'.css';
			bundleOutData = ''; bundleOutPath = config.dir.out+'/'+config.name+'.css';

			// Bundle
			config.css.each(function(i,filePath){
				// Prepare
				filePath = util.getRelativePath(filePath,[config.dir.src,config.dir.out]);
				fileSrcPath = config.dir.src+'/'+filePath;
				fileOutPath = config.dir.out+'/'+filePath;
				parentOutPath = fileOutPath.replace(/[\/\\][^\/\\]+$/,'');

				// Amend Out Text
				bundleOutData += fs
					.readFileSync(fileOutPath)
					.toString()
					.replace(
						/url\(([^\)]+)\)/g,
						function(str, p1, offset){
							// Trim quotes
							var url = p1.replace(/[\'\"]/g,'');

							// Update url
							if ( url[0] !== '/' && !/\:/.test(url) ) {
								url = fs.realpathSync(parentOutPath+'/'+url).replace(config.dir.out+'/','');
							}

							// Replace with new url
							return 'url(\''+url+'\')';
						}
					);
				fs.unlinkSync(fileOutPath);

				// Amend Src Text
				bundleSrcData += '@import url("'+filePath+'");\n';
			});

			// Write
			fs.writeFileSync(bundleSrcPath,bundleSrcData);
			fs.writeFileSync(bundleOutPath,bundleOutData);

			// Done
			return true;
		},

		/**
		 * Compile
		 */
		compile: function() {
			// Prepare
			var
				config = this.config,
				jsPath = config.dir.out+'/'+config.name+'.js',
				cssPath = config.dir.out+'/'+config.name+'.css';

			// JavaScript
			var orig_code = fs.readFileSync(jsPath).toString();
			var ast = jsp.parse(orig_code); // parse code and get the initial AST
			ast = pro.ast_mangle(ast); // get a new AST with mangled names
			ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
			var final_code = pro.gen_code(ast); // compressed code here
			fs.writeFileSync(jsPath,final_code);

			// CSS
			var
				data = fs.readFileSync(cssPath).toString(),
				options = {
					paths: [config.dir.out],
					optimization: 1,
					filename: cssPath
				};
			new(less.Parser)(options).parse(data, function (err, tree) {
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
			if ( false ) {
				exec(
					"java -Xms64m -Xmx256m -Djava.ext.dirs=./vendor/smartsprites/lib org.carrot2.labs.smartsprites.SmartSprites dist/aloha.css",
					function (error, stdout, stderr) {
						console.log('stdout: ' + stdout);
						console.log('stderr: ' + stderr);
						if (error !== null) {
							console.log('exec error: ' + error);
						}
					}
				);
			}

		},

		/**
		 * Run the Application
		 */
		run: function() {
			// Merge
			this.mergePlugins();

			// Bundle
			this.bundle();

			// Compile
			this.compile();

			// Done
			return true;
		}

	});

	// Run the Application
	var myBuildr = new Buildr(process.argv[2]||__dirname);
	myBuildr.run();

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
