All changes are categorized into one of the following keywords:

- **BUG**: The change fixes a bug.
- **ENHANCEMENT**: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**: The change introduces a new feature, or modifies the function,
               usage, or intent of an existing one.

----

- **BUG**: Editable.getContents(true) doesn't make defensive copies.
		   Invoking Editable.getContents(true) multiple times in a row would
		   return the same object, causing unexpected behaviour when client
		   code modified that object.

- **ENHANCEMENT**: Addition to the API
                   Aloha.Editable.setContentSerializer() was added to the API.
                   Aloha.Editable.getContentSerializer() was implemented and
				   added to the API.

- **BUG**: image-plugin: The reset image button function was fixed.  Previously
           a javascript error occured when the button was pressed.

- **BUG**: wai-lang-plugin: Language annotations were not enhanced.
		   The short name ('de') of language annotations was displayed instead
		   of of the full name from the repository ('German').

- **BUG**: block-plugin: Selection was lost when using the cursor keys to move
           across inline blocks.

- **BUG**: block-plugin: Fixes problem in how droppable containers were being
		   determined while drapping blocks.  The algorithm was miss-identifing
		   any container that had a <br> tags with the "aloha-end-br" class as
		   an "empty" container, even if it contained other content along with
		   the propping <br>.  We now use a stricter check to remove this false
		   positive.

- **ENHANCEMENT**: pubsub/repository-browser: Upgrades the PubSub, and
                   RepositoryBrowser dependencies.
                   
- **BUG**: table-plugin: Fixes a bug that occurred when marking a row or column
		   as a header which contained cells that were already headers (th). If
		   the selected row or column contains any cells that are not headers, 
		   all selected cells will now be marked as headers. If all cells in the
		   selection are already headers, they will all be marked as normal
		   cells (td).

- **BUG**: Fixed block formatting (p, h1, ...)

    To reproduce the error

    * insert two paragraphs into an editable

    "
    Paragraph1
    Paragraph2
    "

    * select both paragraphs and format them as h2
    * click into the second paragraph and format as h3

    The result before this fix would have been that in the last step both
    paragraphs were formatted as h3.