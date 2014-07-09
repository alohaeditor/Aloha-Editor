# &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Aloha Editor

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
Aloha Editor is a JavaScript library to simplify editing in HTML.

### &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [Website](http://aloha-editor.org)&nbsp;&bull;&nbsp;[Getting Started](http://aloha-editor.org/getting-started)&nbsp;&bull;&nbsp;[Documentation](http://aloha-editor.org/documentation)

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
[![Aloha Editor](http://aloha-editor.org/contact-logo-howling-mad.png)](http://aloha-editor.org)

### Usage

	<div class="aloha-editable">
		<p>Aloha Editor has all the power of contentEditable, plus more control,
		minus contentEditable and it's hassle.</p>
	</div>
	<script src="aloha.js"></script>
	<script>
		require(['aloha'], function (aloha) {
			'use strict';
			[].forEach.call(document.querySelectorAll('.aloha-editable'), aloha);
		});
	</script>

### Become a contributor

Thank for looking to contribute! Yay! If you want to contribute read the [contribution rules](contributing.txt). You need to sign a [CLA](http://aloha-editor.org/contribution.php) before we can merge your pull request. Remember to provide *tests and documention* for all your pull requests. Go ahead we are happy to merge your contribution!

### Build

We use Google closure compiler to build. Check out [Grunt Closure Compiler](https://github.com/gmarty/grunt-closure-compiler#closure-compiler-installation-from-source) how to setup Google closure compiler for grunt.

	npm install
	grunt

### Test

	grunt jshint
	grunt qunit

You can use 
	grunt watch
to continously proof your code during developement.

### Contributors
Meet the "A" Team

[![Petro Salema](http://www.gravatar.com/avatar/2087327e79d09b56ce8572e6f363abff.jpg?s=70)](https://github.com/petro065) | [![Deliminator](http://www.gravatar.com/avatar/dbc8cd8da5024eba7ffc2f5713e833f7.jpg?s=70)](https://github.com/deliminator) | [![Haymo Meran](http://www.gravatar.com/avatar/7f3f1e000b09a2314b5261de53de0733.jpg?s=70)](https://github.com/draftkraft) | [![Clemens Prerovsky](http://www.gravatar.com/avatar/c84901471a3d6c401c37239dda64c6ff.jpg?s=70)](https://github.com/cprerovsky) | [![Najor Pedro Cruz Cruz](https://avatars2.githubusercontent.com/u/5479033?s=70)](https://github.com/najor) | [![Arseny Zarechnev](https://avatars0.githubusercontent.com/u/822951?s=70)](https://github.com/evindor) | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;?&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
:---:|:---:|:---:|:---:|:---:|:---:|:---:
[Petro Salema](https://github.com/petro065) | [Deliminator](https://github.com/deliminator) | [Haymo Meran](https://github.com/draftkraft) | [Clemens Prerovsky](https://github.com/cprerovsky) | [Najor Pedro Cruz Cruz] (https://github.com/najor) | [Arseny Zarechnev] (https://github.com/evindor) | [You?](https://github.com/alohaeditor/Aloha-Editor/blob/howling-mad/contributing.txt)

### ✎ ❤ ★ ☺
We welcome your feedback, questions, and contributions!

---

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
❤ Team Aloha
