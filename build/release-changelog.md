
- **BUG**: table-plugin: Fixed the removal of the aloha-table-cell_active once a table gets deactivated.
- **BUG**: wai-lang-plugin: The key combination ctrl+i caused a javascript error in IE8 when using the wai-lang-plugin together with the link plugin. This javascript error was now fixed.
- **BUG**: core: A basic content handler was added to the core that will cleanup the dom and html that gets processed by the getContents method. Currently this basic contenthandler is used to remove attributes (tabindex, hidefocus, contenteditable) that were added when using the Internet Explorer.
- **BUG**: cite-plugin: The css animations for the cite plugin were removed because they were poluting the dom with style attributes.
