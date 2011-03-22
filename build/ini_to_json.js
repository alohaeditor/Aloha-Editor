(function(){

	// Requirements
	var
		sys = require("sys"),
    fs = require("fs"),
    path = require("path"),
		iniparser = require("iniparser"),
		deps = require(__dirname+'/deps.js');

	// Handle
	var
		rootPath = process.argv[2],
		del = (process.argv[3]||false) === '-d';

	// App
	var App = {

		/**
		 * Convert
		 */
		convert: function(parentPath) {
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
					App.convert(filePath);
				}
				else {
					// Check
					var fileExt = path.extname(file);
					if ( /(dict|ini)$/.test(fileExt) ) {
						// Is a ini file, convert to json
						var json = iniparser.parse(filePath,function(err,json){
							// Check
							if ( err ) {
								abort(err);
							}

							// Prepare
							var jsonPath = parentPath+'/'+file.substring(0,file.length-fileExt.length)+'.json';

							// Write
							fs.writeFile(jsonPath,JSON.stringify(json),'utf8',function(){
								if ( del ) {
									fs.unlinkSync(filePath);
								}

								// Output
								console.log("Converted ["+filePath+"] to ["+jsonPath+"]");
							});
						});
					}
				}
			});

			// Done
			return true;
		}
	};

	App.convert(rootPath);

})();
