// Compress CSS
var less = require('less');

less.render('.class { width: 1 + 1 }', function (e, css) {
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
