(function(){

	// Requirements
	var
    path = require("path"),
    fs = require("fs"),
		deps = require(__dirname+'/dep.js');

	/**
	 * Util
	 **/
	var util = {
		/**
		 * Copy a file
		 * @param {Path} src
		 * @param {Path} dst
		 */
		cpSync: function(src,dst){
			var txt = fs.readFileSync(src).toString();
			fs.writeFileSync(dst,txt);
			return true;
		},

		/**
		 * Get the parent path
		 * @param {Path} p
		 * @return {Path} parentPath
		 */
		getParentPath: function(p){
			var parentPath = p.replace(/[\/\\][^\/\\]+$/,'');
			return parentPath;
		},

		/**
		 * Check if a file exists in sync
		 * @param {Path} p
		 */
		fileExistsSync: function(p){
			try {
				fs.statSync(p);
				return true;
			}
			catch ( e ) {
				return false;
			}
		},

		/**
		 * Ensure Path Exists
		 * @param {Path} p
		 */
		ensurePathSync: function(p){
			p = p.replace(/[\/\\]$/,'');
			try {
				fs.statSync(p);
				return true;
			}
			catch ( e ) {
				var parentPath = this.getParentPath(p);
				this.ensurePathSync(parentPath);
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
		findFilesWithExtensionSync: function(parentPath, ext){
			// Prepare
			var foundFiles = [], me = this;

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
					foundFiles = foundFiles.concat(me.findFilesWithExtensionSync(filePath,ext));
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
		getRelativePath: function(path,parentPath){
			// Prepare
			var relativePath = path, me = this;

			// Handle
			if ( parentPath instanceof Array ) {
				parentPath.each(function(i,v){
					relativePath = me.getRelativePath(relativePath,v);
				});
			}
			else if ( typeof parentPath === 'string' ) {
				relativePath = relativePath.replace(parentPath.strip('/')+'/','');
			}

			// Return relativePath
			return relativePath;
		}

	};

	// Export
	module.exports.extend(util);

})();
