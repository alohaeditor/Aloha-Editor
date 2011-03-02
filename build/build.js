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
		"js": [],
		"css": [],
		"i18n": []
	}.extend(
		JSON.parse(
			fs.readFileSync(
				process.argv[2]||"package.json"
			)
			.toString()
		)
	);

	// App Functions
	var app = {
		/**
		 * Initialise
		 */
		init: function(){
			// ----------------------------------------------------------------------
			// Normalise

			// Dirs
			config.dir.each(function(key,value){
				config.dir[key] = fs.realpathSync(value);
			});

			// Templates
			config.template.each(function(key,value){
				config.template[key] = config.dir.template+'/'+value;
			});

			// Done
			return true;
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
		 * Get Relative Path
		 * @param {Path} path
		 * @return {Path} relativePath
		 */
		getRelativePath: function(path){
			var relativePath = path.replace(config.dir.out+'/','').replace(config.dir.src+'/','');
			return relativePath;
		},

		/**
		 * Get Plugin Path
		 * @param {String} plugin
		 * @return {Path} pluginPath
		 */
		getPluginPath: function(plugin){
			var pluginPath = config.subdir.plugin+'/'+plugin;
			return pluginPath;
		},

		/**
		 * Get Plugin Meta Path
		 * @param {String} plugin
		 * @return {Path} pluginMetaPath
		 */
		getPluginMetaPath: function(plugin){
			var pluginMetaPath = config.subdir.plugin+'/'+plugin+'/'+config.files.meta;
			return pluginMetaPath;
		},

		/**
		 * Read Plugin Meta Data
		 * @param {Path} plugin
		 * @return {Object} pluginMetaData
		 */
		getPluginMetaData: function(pluginName) {
			// Prepare
			var
				pluginPath = config.dir.out+'/'+app.getPluginPath(pluginName),
				pluginMetaPath = config.dir.out+'/'+app.getPluginMetaPath(pluginName),
				pluginMetaData = {
					"js": [],
					"css": [],
					"i18n": []
				};

			// Check if the meta data exists
			if ( path.exists(pluginMetaPath) ) {
				// There is already meta data
				pluginMetaData.extend(JSON.parse(fs.readFileSync(pluginMetaPath).toString()));
			}

			// Ensure the meta data
			if ( !pluginMetaData.js.length )
				pluginMetaData.js = app.findFilesWithExtension(pluginPath+'/'+config.subdir.src, ".js");

			if ( !pluginMetaData.css.length )
				pluginMetaData.css = app.findFilesWithExtension(pluginPath+'/'+config.subdir.src, ".css");

			if ( !pluginMetaData.i18n.length )
				pluginMetaData.i18n = app.findFilesWithExtension(pluginPath+'/'+config.subdir.i18n, ".dict");

			// Return the meta data
			return pluginMetaData;
		},

		/**
		 * Merge the Plugin Meta Data
		 * @param {Path} pluginMetaPath
		 * @return {Object} pluginMetaData
		 */
		mergePluginMetaData: function(pluginName) {
			// Prepare
			var pluginMetaData = app.getPluginMetaData(pluginName);

			// Merge into Global Data
			config.js = config.js.concat(pluginMetaData.js);
			config.css = config.css.concat(pluginMetaData.css);
			config.i18n = config.i18n.concat(pluginMetaData.i18n);

			// Done
			return true;
		},

		/**
		 * Merge the Selected PLugins into the Config
		 */
		mergePlugins: function() {
			// Merge in Plugin Data
			config.plugin.each(function(key,pluginName){
				app.mergePluginMetaData(pluginName);
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
				fileSrcPath, fileOutPath,
				bundleSrcText, bundleOutText, bundleSrcPath, bundleOutPath;

			// Templates
			templateBundleText = fs.readFileSync(config.template.bundle).toString();
			templateReplaceText = fs.readFileSync(config.template.replace).toString();
			templateHeaderText = fs.readFileSync(config.template.header).toString();
			templateFooterText = fs.readFileSync(config.template.footer).toString();


			// ----------------------------------------------------------------------
			// Javascript

			// Prepare
			bundleSrcText = ''; bundleSrcPath = config.dir.src+'/'+config.name+'.js';
			bundleOutText = ''; bundleOutPath = config.dir.out+'/'+config.name+'.js';

			// Adjust
			bundleSrcText += templateHeaderText;

			// Plugins
			config.plugin.each(function(i,pluginName){
				// Amend Src Text
				bundleSrcText += templateBundleText.replace('%NAME%',pluginName);
				bundleOutText += templateBundleText.replace('%NAME%',pluginName);
			});

			// Bundle
			config.js.each(function(i,filePath){
				// Prepare
				filePath = app.getRelativePath(filePath);
				fileSrcPath = config.dir.src+'/'+filePath;
				fileOutPath = config.dir.out+'/'+filePath;

				// Amend Out Text
				bundleOutText += fs.readFileSync(fileOutPath).toString();
				fs.unlinkSync(fileOutPath);

				// Amend Src Text
				bundleSrcText += templateReplaceText.replace('%PATH%',filePath);
			});

			// Adjust
			bundleSrcText += templateFooterText;

			// Write
			fs.writeFileSync(bundleSrcPath,bundleSrcText);
			fs.writeFileSync(bundleOutPath,bundleOutText);


			// ----------------------------------------------------------------------
			// CSS

			// Prepare
			bundleSrcText = ''; bundleSrcPath = config.dir.src+'/'+config.name+'.css';
			bundleOutText = ''; bundleOutPath = config.dir.out+'/'+config.name+'.css';

			// Bundle
			var parentOutPath;
			config.css.each(function(i,filePath){
				// Prepare
				filePath = app.getRelativePath(filePath);
				fileSrcPath = config.dir.src+'/'+filePath;
				fileOutPath = config.dir.out+'/'+filePath;
				parentOutPath = fileOutPath.replace(/[\/\\][^\/\\]+$/,'');

				// Amend Out Text
				bundleOutText += fs
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
				bundleSrcText += '@import url("'+filePath+'");\n';
			});

			// Write
			fs.writeFileSync(bundleSrcPath,bundleSrcText);
			fs.writeFileSync(bundleOutPath,bundleOutText);

			// Done
			return true;
		},

		/**
		 * Compile
		 */
		compile: function() {
			// Prepare
			var
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
			var data = fs.readFileSync(cssPath).toString();
			new(less.Parser)({
					paths: [config.dir.out],
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
			if ( false )
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
