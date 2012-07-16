({
    //The top level directory that contains your app. If this option is used
    //then it assumed your scripts are in a subdirectory under this path.
    //This option is not required. If it is not specified, then baseUrl
    //below is the anchor point for finding things. If this option is specified,
    //then all the files from the app directory will be copied to the dir:
    //output area, and baseUrl will assume to be a relative path under
    //this directory.
    appDir: "../../src/",

    //By default, all modules are located relative to this path. If baseUrl
    //is not explicitly set, then all modules are loaded relative to
    //the directory that holds the build file.
    baseUrl: "lib/",

    //Set paths for modules. If relative paths, set relative to baseUrl above.
    //If a special value of "empty:" is used for the path value, then that
    //acts like mapping the path to an empty file. It allows the optimizer to
    //resolve the dependency to path, but then does not include it in the output.
    //Useful to map module names that are to resources on a CDN or other
    //http: URL when running in the browser and during an optimization that
    //file should be skipped because it has no dependencies.
    paths: {
		// These paths are the same setup as in aloha.js.
		// r.js doesn't process dynamic configuration and calls to
		// require() that don't list modules literally, so we need to
		// maintain this duplicate list

		// We don't include Aloha's patched jquery by default, the user
		// should do it himself.
		"jquery": "empty:",
    	//"jquery": 'vendor/jquery-1.7.2',
		// We do include Aloha's patche jquery-ui by default, but the
		// user can override it if he is adventurous.
		"jqueryui": 'vendor/jquery-ui-1.9m6',

		// For the repository browser
		'PubSub': 'vendor/pubsub/js/pubsub-unminified',
		'Class': 'vendor/class',
		'RepositoryBrowser': 'vendor/repository-browser/js/repository-browser-unminified',
		'jstree': 'vendor/jquery.jstree',              // Mutates jquery
		'jqgrid': 'vendor/jquery.jqgrid',              // Mutates jquery
		'jquery-layout': 'vendor/jquery.layout',     // Mutates jquery
		'jqgrid-locale-en': 'vendor/grid.locale.en', // Mutates jqgrid
		'jqgrid-locale-de': 'vendor/grid.locale.de', // Mutates jqgrid
		'repository-browser-i18n-de': 'vendor/repository-browser/js/repository-browser-unminified',
		'repository-browser-i18n-en': 'vendor/repository-browser/js/repository-browser-unminified',

		// Shortcuts for all common plugins
		"ui": "../plugins/common/ui/lib",
		"ui/vendor": "../plugins/common/ui/vendor",
		"ui/css": "../plugins/common/ui/css",
		"ui/nls": "../plugins/common/ui/nls",
		"ui/res": "../plugins/common/ui/res",
		"link": "../plugins/common/link/lib",
		"link/vendor": "../plugins/common/link/vendor",
		"link/css": "../plugins/common/link/css",
		"link/nls": "../plugins/common/link/nls",
		"link/res": "../plugins/common/link/res",
		"table": "../plugins/common/table/lib",
		"table/vendor": "../plugins/common/table/vendor",
		"table/css": "../plugins/common/table/css",
		"table/nls": "../plugins/common/table/nls",
		"table/res": "../plugins/common/table/res",
		"list": "../plugins/common/list/lib",
		"list/vendor": "../plugins/common/list/vendor",
		"list/css": "../plugins/common/list/css",
		"list/nls": "../plugins/common/list/nls",
		"list/res": "../plugins/common/list/res",
		"image": "../plugins/common/image/lib",
		"image/vendor": "../plugins/common/image/vendor",
		"image/css": "../plugins/common/image/css",
		"image/nls": "../plugins/common/image/nls",
		"image/res": "../plugins/common/image/res",
		"highlighteditables": "../plugins/common/highlighteditables/lib",
		"highlighteditables/vendor": "../plugins/common/highlighteditables/vendor",
		"highlighteditables/css": "../plugins/common/highlighteditables/css",
		"highlighteditables/nls": "../plugins/common/highlighteditables/nls",
		"highlighteditables/res": "../plugins/common/highlighteditables/res",
		"format": "../plugins/common/format/lib",
		"format/vendor": "../plugins/common/format/vendor",
		"format/css": "../plugins/common/format/css",
		"format/nls": "../plugins/common/format/nls",
		"format/res": "../plugins/common/format/res",
		"dom-to-xhtml": "../plugins/common/dom-to-xhtml/lib",
		"dom-to-xhtml/vendor": "../plugins/common/dom-to-xhtml/vendor",
		"dom-to-xhtml/css": "../plugins/common/dom-to-xhtml/css",
		"dom-to-xhtml/nls": "../plugins/common/dom-to-xhtml/nls",
		"dom-to-xhtml/res": "../plugins/common/dom-to-xhtml/res",
		"contenthandler": "../plugins/common/contenthandler/lib",
		"contenthandler/vendor": "../plugins/common/contenthandler/vendor",
		"contenthandler/css": "../plugins/common/contenthandler/css",
		"contenthandler/nls": "../plugins/common/contenthandler/nls",
		"contenthandler/res": "../plugins/common/contenthandler/res",
		"characterpicker": "../plugins/common/characterpicker/lib",
		"characterpicker/vendor": "../plugins/common/characterpicker/vendor",
		"characterpicker/css": "../plugins/common/characterpicker/css",
		"characterpicker/nls": "../plugins/common/characterpicker/nls",
		"characterpicker/res": "../plugins/common/characterpicker/res",
		"commands": "../plugins/common/commands/lib",
		"commands/vendor": "../plugins/common/commands/vendor",
		"commands/css": "../plugins/common/commands/css",
		"commands/nls": "../plugins/common/commands/nls",
		"commands/res": "../plugins/common/commands/res",
		"align": "../plugins/common/align/lib",
		"align/vendor": "../plugins/common/align/vendor",
		"align/css": "../plugins/common/align/css",
		"align/nls": "../plugins/common/align/nls",
		"align/res": "../plugins/common/align/res",
		"abbr": "../plugins/common/abbr/lib",
		"abbr/vendor": "../plugins/common/abbr/vendor",
		"abbr/css": "../plugins/common/abbr/css",
		"abbr/nls": "../plugins/common/abbr/nls",
		"abbr/res": "../plugins/common/abbr/res",
		"block": "../plugins/common/block/lib",
		"block/vendor": "../plugins/common/block/vendor",
		"block/css": "../plugins/common/block/css",
		"block/nls": "../plugins/common/block/nls",
		"block/res": "../plugins/common/block/res",
		"horizontalruler": "../plugins/common/horizontalruler/lib",
		"horizontalruler/vendor": "../plugins/common/horizontalruler/vendor",
		"horizontalruler/css": "../plugins/common/horizontalruler/css",
		"horizontalruler/nls": "../plugins/common/horizontalruler/nls",
		"horizontalruler/res": "../plugins/common/horizontalruler/res",
		"undo": "../plugins/common/undo/lib",
		"undo/vendor": "../plugins/common/undo/vendor",
		"undo/css": "../plugins/common/undo/css",
		"undo/nls": "../plugins/common/undo/nls",
		"undo/res": "../plugins/common/undo/res",
		"paste": "../plugins/common/paste/lib",
		"paste/vendor": "../plugins/common/paste/vendor",
		"paste/css": "../plugins/common/paste/css",
		"paste/nls": "../plugins/common/paste/nls",
		"paste/res": "../plugins/common/paste/res",
    },
//    paths: {
//        "foo.bar": "../scripts/foo/bar",
//        "baz": "../another/path/baz"
//    },

    //Configure CommonJS packages. See http://requirejs.org/docs/api.html#packages
    //for more information.
//    packagePaths: [],
//    packages: [],

    //The directory path to save the output. If not specified, then
    //the path will default to be a directory called "build" as a sibling
    //to the build file. All relative paths are relative to the build file.
    dir: "../../target/build-with-plugins/aloha",

    //Used to inline i18n resources into the built file. If no locale
    //is specified, i18n resources will not be inlined. Only one locale
    //can be inlined for a build. Root bundles referenced by a build layer
    //will be included in a build layer regardless of locale being set.
//    locale: "en",

    //How to optimize all the JS files in the build output directory.
    //Right now only the following values
    //are supported:
    //- "uglify": (default) uses UglifyJS to minify the code.
    //- "closure": uses Google's Closure Compiler in simple optimization
    //mode to minify the code. Only available if running the optimizer using
    //Java.
    //- "closure.keepLines": Same as closure option, but keeps line returns
    //in the minified files.
    //- "none": no minification will be done.
	optimize: "none",

    //If using UglifyJS for script optimization, these config options can be
    //used to pass configuration values to UglifyJS.
    //See https://github.com/mishoo/UglifyJS for the possible values.
    uglify: {
        gen_codeOptions: {},
        strict_semicolons: {},
        do_toplevel: {},
        ast_squeezeOptions: {}
    },

    //If using Closure Compiler for script optimization, these config options
    //can be used to configure Closure Compiler. See the documentation for
    //Closure compiler for more information.
    closure: {
        CompilerOptions: {},
        CompilationLevel: 'SIMPLE_OPTIMIZATIONS',
        loggingLevel: 'WARNING'
    },

    //Allow CSS optimizations. Allowed values:
    //- "standard": @import inlining, comment removal and line returns.
    //Removing line returns may have problems in IE, depending on the type
    //of CSS.
    //- "standard.keepLines": like "standard" but keeps line returns.
    //- "none": skip CSS optimizations.
    optimizeCss: "none",

    //Inlines the text for any text! dependencies, to avoid the separate
    //async XMLHttpRequest calls to load those dependencies.
    inlineText: true,

    //Allow "use strict"; be included in the RequireJS files.
    //Default is false because there are not many browsers that can properly
    //process and give errors on code for ES5 strict mode,
    //and there is a lot of legacy code that will not work in strict mode.
    useStrict: false,

    //Specify build pragmas. If the source files contain comments like so:
    //>>excludeStart("fooExclude", pragmas.fooExclude);
    //>>excludeEnd("fooExclude");
    //Then the comments that start with //>> are the build pragmas.
    //excludeStart/excludeEnd and includeStart/includeEnd work, and the
    //the pragmas value to the includeStart or excludeStart lines
    //is evaluated to see if the code between the Start and End pragma
    //lines should be included or excluded. If you have a choice to use
    //"has" code or pragmas, use "has" code instead. Pragmas are harder
    //to read, but they can be a bit more flexible on code removal vs.
    //has-based code, which must follow JavaScript language rules.
    //Pragmas also remove code in non-minified source, where has branch
    //trimming is only done if the code is minified via UglifyJS or
    //Closure Compiler.
    pragmas: {
    	loadDynamicCss: true
    },

    //Allows trimming of code branches that use has.js-based feature detection:
    //https://github.com/phiggins42/has.js
    //The code branch trimming only happens if minification with UglifyJS or
    //Closure Compiler is done. For more information, see:
    //http://requirejs.org/docs/optimization.html#hasjs
    has: {
        'loadDynamicCss': true,
    },

    //Allows namespacing requirejs, require and define calls to a new name.
    //This allows stronger assurances of getting a module space that will
    //not interfere with others using a define/require AMD-based module
    //system. The example below will rename define() calls to foo.define().
    //See http://requirejs.org/docs/faq-advanced.html#rename for a more
    //complete example.
//    namespace: 'Aloha',

    //Skip processing for pragmas.
    skipPragmas: false,

    //If skipModuleInsertion is false, then files that do not use define()
    //to define modules will get a define() placeholder inserted for them.
    //Also, require.pause/resume calls will be inserted.
    //Set it to true to avoid this. This is useful if you are building code that
    //does not use require() in the built project or in the JS files, but you
    //still want to use the optimization tool from RequireJS to concatenate modules
    //together.
    skipModuleInsertion: true,

    //If it is not a one file optimization, scan through all .js files in the
    //output directory for any plugin resource dependencies, and if the plugin
    //supports optimizing them as separate files, optimize them. Can be a
    //slower optimization. Only use if there are some plugins that use things
    //like XMLHttpRequest that do not work across domains, but the built code
    //will be placed on another domain.
    optimizeAllPluginResources: true,

    //List the modules that will be optimized. All their immediate and deep
    //dependencies will be included in the module's file when the build is
    //done. If that module or any of its dependencies includes i18n bundles,
    //only the root bundles will be included unless the locale: section is set above.
    modules: [

        //Just specifying a module name means that module will be converted into
        //a built file that contains all of its dependencies. If that module or any
        //of its dependencies includes i18n bundles, they may not be included in the
        //built file unless the locale: section is set above.
        {
            name: "aloha",

            //For build profiles that contain more than one modules entry,
            //allow overrides for the properties that set for the whole build,
            //for example a different set of pragmas for this module.
            //The override's value is an object that can
            //contain any of the other build options in this file.
            override: {
                pragmas: {
                	loadDynamicCss: false
                },
                has: {
                    'loadDynamicCss': false,
                },

            },

			include: [
				"ui/ui-plugin",
				"link/link-plugin",
				"table/table-plugin",
				"format/format-plugin",
				"list/list-plugin",
				"image/image-plugin",
				"highlighteditables/highlighteditables-plugin",
				"dom-to-xhtml/dom-to-xhtml-plugin",
				"contenthandler/contenthandler-plugin",
				"characterpicker/characterpicker-plugin",
				"commands/commands-plugin",
				"block/block-plugin",
				"align/align-plugin",
				"abbr/abbr-plugin",
				"horizontalruler/horizontalruler-plugin",
				"undo/undo-plugin",
				"paste/paste-plugin"
			],
        },
    ],

    //Another way to use wrap, but uses file paths. This makes it easier
    //to have the start text contain license information and the end text
    //to contain the global variable exports, like
    //window.myGlobal = requirejs('myModule');
    //File paths are relative to the build file, or if running a commmand
    //line build, the current directory.
    wrap: {
        startFile: "closure-start.frag",
        endFile: "closure-end.frag"
    }
})
