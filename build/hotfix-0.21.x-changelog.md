All changes are categorized into one of the following keywords:

- **BUG**: The change fixes a bug.
- **ENHANCEMENT**: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**: The change introduces a new feature, or modifies the function,
               usage, or intent of an existing one.

----

- **BUG**: Rangy Core: Patches Rangy to include a workaround for html5shiv's
        violation of document.createElement().

        As detailed in this discussion:
        https://github.com/aFarkas/html5shiv/issues/64: html5shiv monkey
        patches the native document.createElement() function in browsers like
        IE8 and older, which do no support HTML5.  However, it does in a way
        that seriously deviates from the contract that the native
        document.createElement() function establishes, because it creates
        elements which have non-null siblings and parentNode.

        This violation causes Rangy to throw an exception in IE8 or IE7.

        The workaround prevents this error by detaching the element that was
        created via html4shiv's implementation of document.createElement() from
        its parentNode, near the critical area of code where the exception
        occurs.

- **BUG**: Moved call to execCommand('enableObjectResizing', false, false) to init method of editable.
		Otherwise, FF 15 (and above) will throw a JS error, if execCommand('enableObjectResizing', false, false)
		is called with no contenteditable elements found in the page.

- **ENHANCEMENT**: The Block Plugin now allows you to configure your own root tags for block creation. Every
		time you create a new block, the block plugin will check if its root node is supported. You may
		now change the roots nodes and use your own list root tags. If you want to use Aloha Blocks drag'n drop
		functionalities we strongly suggest that you do not use other root tags than div and span. See the
		guides at http://www.aloha-editor.org/guides/plugin_block.html for further information.

- **ENHANCEMENT**: Aloha Editor will no longer annotate end <br> tags, which
				   are used to prop up empty block-level elements that would be
				   otherwise rendererd invisbly, with the "aloha-end-br" class.
				   This should result in cleaner markup.

- ** BUG**: Fixed Javascript error when doing searches in the repository browser (which caused to search to not be done).

- **ENHANCEMENT**: Aloha Blocks will now publish a message on the channel
                   "aloha.blocks.initialized" when a block is fully initialized.
