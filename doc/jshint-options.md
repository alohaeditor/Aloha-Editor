############################# JSHINT #############################
```javascript
var hintOptions = {
    adsafe: false,
    bitwise: false,
    browser: false,
    cap: false,
    css: false,
    debug: false,
    devel: false,
    eqeqeq: true,
    evil: false,
    forin: false,
    fragment: false,
    immed: true,
    indent: 4,
    laxbreak: false,
    maxerr: 100,
    maxlen: 80,
    newcap: true,
    nomen: false,
    on: true,
    onevar: false,
    passfail: false,
    plusplus: false,
    predef: ['window'],
    regexp: false,
    rhino: false,
    safe: false,
    sidebar: false,
    strict: false,
    sub: false,
    undef: true,
    white: false,
    widget: false
};
```

Or, in a form for attaching to the top of an individual file:
```javascript
/* global window */

/* jshint adsafe: false, bitwise: false, browser: false, cap: false, css: false, debug: false, devel: false, eqeqeq: true, evil: false, forin: false, fragment: false, immed: true, indent: 4, laxbreak: false, maxerr: 100, maxlen: 80, newcap: true, nomen: false, on: true, onevar: false, passfail: false, plusplus: false, regexp: false, rhino: false, safe: false, sidebar: false, strict: false, sub: false, undef: true, white: false, widget: false */
```



############################# JSLINT ############################# 
aloha.js --> require.js

/*jslint strict: false, plusplus: false */
/*global window: false, navigator: false, document: false, importScripts: false,
  jQuery: false, clearInterval: false, setInterval: false, self: false,
  setTimeout: false, opera: false */
