module.exports = function(grunt) {
	'use strict';
	var gruntConfig = {

		pkg: grunt.file.readJSON('Package.json'),

		distFileName: '<%= pkg.name %>-<%= pkg.version %>',
		distDir: './dist/<%= distFileName %>',
		dest: '<%= distDir %>/<%= distFileName %>.js',
		src: ['./src/*.js'],

		'closure-compiler': {
			frontend: {
				cwd: './src',
				js: './*.js',
				jsOutputFile: '<%= dest %>',
				options: {
					common_js_entry_module: 'api.js',
					//common_js_module_path_prefix: './src/',
					transform_amd_modules: undefined,
					process_common_js_modules: undefined,
					// compilation_level: 'ADVANCED_OPTIMIZATIONS',
					language_in: 'ECMASCRIPT5_STRICT'
				}
			}
		},
		jshint: {
			files: ['<%= src %>'],
			options: {
				eqnull: true,
				smarttabs: true,
				laxbreak: true,
				// very bad, but needed for mandox
				evil: true,
				globals: {
					jQuery: true,
					console: true,
					module: true,
					document: true
				}
			}
		},
		watch: {
			jshint: {
				files: ['src/**'],
				tasks: ['jshint']
			}
		},
		qunit: {
			all: ['tests/index.html']
		}
	};

	grunt.initConfig(gruntConfig);
	grunt.loadNpmTasks('grunt-install-dependencies');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-closure-compiler');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	
	grunt.registerTask('default', ['install-dependencies', 'jshint', 'qunit', 'closure-compiler']);
};
