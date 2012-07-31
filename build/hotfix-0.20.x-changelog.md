- **MANUAL CHANGE**: Changed the aloha-smart-content-changed event

    The snapshotContent property provided bythe
    aloha-smart-content-changed event was replaced with the
    getSnapshotContent property which is a function that must be
    called to retrieve the value that was provided by snapshotContent.

    This was done to make snapshotting of the editable contents
    optional, since it is a very expensive operation.

- **BUG**: Fixed IE7 mode paragraph margin

    The problem is that with a DOM like the following:
```html
    <style>p { margin-top: 2em; }</style>
    <p><br class='aloha-end-br'/></p>
    <p></p>
```
    The margin between the paragraphs will not take effect because
    IE8 in compatibility mode considers the paragraph with the <br>
    in it empty. Normal IE8 will render the margin.

    To make IE8 in compatibility mode render the margin, some content
    must be put into the ```<p>```. That is not a big problem, since there
    usually should be no reason to have empty paragraphs in your
    content.

    However, if the content is entered by hand (if it is not there to
    begin with) then the margin will not be immediately updated. Only
    when, after entering some content into the first paragraph, the
    selection is put into the second paragraph, will the margin be
    updated.

    Although I don't see an easy workaround for the first problem
    (that the margin is not displayed when the paragraph is empty)
    there is an easy workaround for the second problem (that the
    margin isn't updated even after some content has been
    entered). The workaround is simply, when some content is entered,
    to insert and remove an arbitrary DOM node into the second
    paragraph, which will force IE to re-render the paragraph.

    Problem was verified to exist on IE7 and IE8 in compatibility
    mode with IE7 document type. May also exist in other IE7 modes.
