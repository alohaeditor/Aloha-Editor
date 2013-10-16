module.exports = function (grunt) {
	'use strict';
	var gruntConfig = {

		pkg: grunt.file.readJSON('package.json'),

		distFileName: '<%= pkg.name %>-<%= pkg.version %>',
		distDir: './dist/<%= distFileName %>',
		dest: '<%= distDir %>/<%= distFileName %>.js',
		src: ['./src/*.js'],

		banner: '/* Aloha Editor <%= pkg.version %>'
		      + ' | Copyright 2011-<%= grunt.template.today("yyyy") %> Gentics Software GmbH'
		      + ' | http://aloha-editor.org/license'
		      + ' */\n',

		'closure-compiler': {
			frontend: {
				cwd: './src',
				js: './*.js',
				jsOutputFile: '<%= dest %>',
				options: {
					common_js_entry_module: 'aloha.js',
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
				jshintrc: './.jshintrc'
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
		},
		docular: {
			docular_partial_home: 'docs/home.html',
			docular_webapp_target : "build/docs",
				groups: [
					{
						groupTitle: 'Aloha Editor',
						groupId: 'alohaeditor',
						groupIcon: 'icon-book',
							sections: [
								{
									id: "dom",
									title: "Aloha Editor DOM API",
									showSource: false,
									scripts: [
										"src/dom.js"
										],
									rank: {}
								},
							]
					},
					{
						groupTitle: 'Aloha Editor Guides',
						groupId: 'guides',
						groupIcon: 'icon-file',
							sections: [
								{
									id: "repositories",
									title: "Using Repositories",
									showSource: false,
									docs: [
										"docs/guides/repositories.doc"
										],
									rank: {}
								},
							]
					}
				],
				//showDocularDocs: true
		}
	};

	grunt.initConfig(gruntConfig);
	grunt.loadNpmTasks('grunt-install-dependencies');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-closure-compiler');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-docular');

	grunt.registerTask(
		'banner',
		'Prepends a license banner to the built file',
		function () {
			var filename = grunt.config('dest');
			grunt.file.write(
				filename,
				grunt.config('banner') + grunt.file.read(filename)
			);
		}
	);

	grunt.registerTask('default', [
		'install-dependencies',
		'jshint',
		'qunit',
		'docular',
		'closure-compiler',
		'banner'
	]);
};
