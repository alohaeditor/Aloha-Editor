# &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Aloha Editor

Aloha Editor is a JavaScript library to simplify editing in HTML.

### &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [Website](http://aloha-editor.org)&nbsp;&nbsp;&nbsp;[Getting Started](http://aloha-editor.org/getting-started)&nbsp;&nbsp;&nbsp;[Documentation](http://aloha0editor.org/documentation)

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
[![Aloha Editor](http://aloha-editor.org/contact-logo-howling-mad.png)](http://aloha-editor.org)

## Usage

	<div class="aloha-editable" contentEditable="true">
		<p>Lorem ipsum dolor sit amet, <b>consec<i>tet</i>ur</b> adipiscing..</p>
	</div>
	<script src="aloha-editor-1.0.1.min.js"></script>
	<script>
		require(['aloha'], function (Aloha) {
			'use strict';
			var range = Aloha.Ranges.create(
				document.getElementsByTagName('b')[0], 1,
				document.getElementsByTagName('b')[0], 2
			);
			Aloha.Ranges.select(Aloha.Ranges.extendToWord(range));
			range = Aloha.Ranges.get();
			Aloha.Editing.wrap(range, 'u');
			Aloha.Ranges.select(range);
		});
	</script>

## Become a contributor

Thank for looking to contribute! Yay! If you want to contribute read the [contribution rules](contributing.txt). You need to sign a [CLA](http://aloha-editor.org/contribution.php) before we can merge your pull request. Remember to provide *tests and documention* for all your pull requests. Go ahead we are happy to merge your contribution!

## Build

We use Google closure compiler to build. Check out [Grunt Closure Compiler](https://github.com/gmarty/grunt-closure-compiler#closure-compiler-installation-from-source) how to setup Google closure compiler for grunt.

	npm install
	grunt

### Test

	grunt jshint
	grunt qunit

You can use 
	grunt watch
to continously proof your code during developement.

## Contributors
Meet the "A" Team

[![Petro Salema](http://www.gravatar.com/avatar/2087327e79d09b56ce8572e6f363abff.jpg?s=70)](http://aloha-editor.org) | [![Deliminator](http://www.gravatar.com/avatar/dbc8cd8da5024eba7ffc2f5713e833f7.jpg?s=70)](http://aloha-editor.org) | [![Haymo Meran](http://www.gravatar.com/avatar/7f3f1e000b09a2314b5261de53de0733.jpg?s=70)](https://aloha-editor.org/foo-bar) | [![Clemens Prerovsky](http://www.gravatar.com/avatar/c84901471a3d6c401c37239dda64c6ff.jpg?s=70)](http://aloha-editor.org)
:---:|:---:|:---:|:---:
[One](http://aloha-editor.org) | [Two](http://aloha-editor.org) | [Three](http://aloha-editor.org) | [Four](http://aloha-editor.org)

## Contact

We welcome your feedback, questions, and contributions!

---

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
❤ Team Aloha
