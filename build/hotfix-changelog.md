All changes are categorized into one of the following keywords:

- **BUG**: The change fixes a bug.
- **ENHANCEMENT**: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**: The change introduces a new feature, or modifies the function,
               usage, or intent of an existing one.

- **BUG** image plugin: fixes distorted images when in portrait format
- **BUG** table plugin: fixes bug in IE7 that second click on table cell was not activating the table
- **ENHANCEMENT** link plugin: removed linklist (and slowlinklist) which where loaded by default (we should not force everyone to have them active by default)
- **BUG**: browser-plugin: In some cases a javascript error would be thrown when using the browser plugin with Internet Explorer. IE does not support 'new Image' calls within popups.
- **BUG**: browser-plugin: In some cases a javascript error would be thrown when using the browser plugin with Internet Explorer. IE does not support 'new Image' calls within popups. 
- **ENHANCEMENT**: browser-plugin: The browser plugin will now calculate the browser width automatically.
- **BUG**: IE7 - #516 navigate with arrow keys through several paragraphs
- **BUG**: IE7 - #515 gray text after list
- **ENHANCEMENT**: Removed unwanted behaviour from the block plugin's sidebarattributeedtior, which will clear out the whole sidebar when loaded
- **BUT**: floatingmenu: Fixed regeneration of ext components for floatingmenu, when buttons are added after the floatingmenu was initialized