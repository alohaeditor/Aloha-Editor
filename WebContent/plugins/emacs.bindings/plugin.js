/**
 * register the plugin with unique name
 */
emacs = {};
emacs.bindings = new GENTICS.Aloha.Plugin('emacs.bindings');

emacs.advanceWordly = function(currContainer, currPos, left){
	var text = jQuery(currContainer).text();
	var tokens = text.split(/[^\w]/);
    if (left) {
        tokens = tokens.reverse();
        currPos = text.length - currPos;
    }
	var off = 0;
	for (var i = 0; i < tokens.length; i++) {
		var token_len = tokens[i].length;
		off += token_len;
		if (off > currPos && token_len) {
            if (left) {
                off = text.length - off;
            }
            return [currContainer, off];
		}
		off += 1;
	}
    var nextContainer = GENTICS.Utils.Dom.searchAdjacentTextNode(
        currContainer.parentNode,
        GENTICS.Utils.Dom.getIndexInParent(currContainer) + (left ? 0 : 1),
        left,
        {}
    );
    var nextPos = 0;
    if (left) {
        nextPos = jQuery(nextContainer).text().length;
    }
    return emacs.advanceWordly(nextContainer, nextPos, left);
};

emacs.moveCursor = function(advanceFunc){
	var selection = GENTICS.Aloha.Selection.getRangeObject();
    var advanced = advanceFunc(
        selection.startContainer,
        selection.startOffset
    );
    selection.startContainer = advanced[0];
    selection.endContainer = selection.startContainer;
	selection.startOffset = advanced[1];
	selection.endOffset = selection.startOffset;
	selection.select();
	// GENTICS.Aloha.Selection.updateSelection();
};

/**
 * Initialize the plugin and set initialize flag on true
 */
emacs.bindings.init = function(){
	var that = this;
	// Add plugin initialization code here
	var editables = GENTICS.Aloha.editables;
	for (var i = 0; i < editables.length; i++) {
		editables[i].obj.bind('keydown', 'Alt+f', function (event){
			if (event.data.combi != 'Alt+f') return;
            emacs.moveCursor(function(container, offset){
                return emacs.advanceWordly(container, offset, false);
            });
            return false;
		});
		editables[i].obj.bind('keydown', 'Alt+b', function (event){
			if (event.data.combi != 'Alt+b') return;
            emacs.moveCursor(function(container, offset){
                return emacs.advanceWordly(container, offset, true);
            });
            return false;
		});
	}
};
