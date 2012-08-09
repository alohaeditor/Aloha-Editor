/**
 * This file contains hacks for IE7 or IE8 and IE9 in either compatibility mode or IE7 mode.
 */
define(['aloha/core', 'aloha/jquery'], function(Aloha, $){

	/**
	 * The problem is that with a DOM like the following:
	 *
	 * <style>p { margin-top: 2em; }</style>
	 * <p><br class='aloha-end-br'/></p>
	 * <p></p>
	 *
	 * The margin between the paragraphs will not take effect because
	 * IE8 in compatibility mode considers the paragraph with the <br>
	 * in it empty. Normal IE8 will render the margin.
	 *
	 * To make IE8 in compatibility mode render the margin, some content
	 * must be put into the <p>. That is not a big problem, since there
	 * usually should be no reason to have empty paragraphs in your
	 * content.
	 *
	 * However, if the content is entered by hand (if it is not there to
	 * begin with) then the margin will not be immediately updated. Only
	 * when, after entering some content into the first paragraph, the
	 * selection is put into the second paragraph, will the margin be
	 * updated.
	 *
	 * Although I don't see an easy workaround for the first problem
	 * (that the margin is not displayed when the paragraph is empty)
	 * there is an easy workaround for the second problem (that the
	 * margin isn't updated even after some content has been
	 * entered). The workaround is simply, when some content is entered,
	 * to insert and remove an arbitrary DOM node into the second
	 * paragraph, which will force IE to re-render the paragraph.
	 *
	 * Problem was verified to exist on IE7 and IE8 in compatibility
	 * mode with IE7 document type. May also exist in other IE7 modes.
	 */
	Aloha.bind('aloha-selection-changed', function(event, rangeObject){
		var container = rangeObject.startContainer;
		// Only apply the hack on IE7 (and IE8 in compatibility mode) and
		// only to a collapsed selection.
		if (!($.browser.msie && $.browser.version <= 7
			  && container && container === rangeObject.endContainer
			  && rangeObject.startOffset === rangeObject.endOffset)) {
			return;
		}
		// Ignore text nodes
		if (3 === container.nodeType) {
			container = container.parentNode;
		}
		var nextSibling = container.nextSibling;
		var firstChild = container.firstChild;
		// For safety, limit the hack to the following DOM structure where the
		// first <P> is the container.
		// <P><!-- possibly an empty text node here --><BR.../></P><P></P>
		if ('P' === container.nodeName
			&& nextSibling && 'P' === nextSibling.nodeName
			&& firstChild
			&& (   ('BR' === firstChild.nodeName && !firstChild.nextSibling)
				|| (   3 === firstChild.nodeType && !firstChild.length
					&& firstChild.nextSibling && 'BR' === firstChild.nextSibling.nodeName && !firstChild.nextSibling.nextSibling))) {
			// \ufeff should be invisible
			nextSibling.insertBefore(document.createTextNode("\ufeff"), nextSibling.firstChild);
			nextSibling.removeChild(nextSibling.firstChild);
		}
	});
});
