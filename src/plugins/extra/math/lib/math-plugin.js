define([ 'aloha/plugin', 'jquery', 'ui/ui', 'ui/button', 'ui/port-helper-attribute-field', 'ui/scopes' ],
        function( plugin, $, ui, button, attributeField, scopes, floatingMenu ) 
        {
        "use strict";

        var cntEq = 0;

        return plugin.create( 'mathedit', 
            {
defaults: 
{
wrapPrefix: 'eqprefix-'
},
hotKey: { insertTexMath: 'ctrl+m', insertAsciiMath: 'ctrl+j', insertMLMath: 'ctrl+k' },
init: function() 
{
var editableObj = null;
var self = this,
wrapPrefix = this.settings.wrapPrefix;

// MathJax init
var script0 = document.createElement("script");
script0.type = "text/x-mathjax-config";
$(script0).html( 'MathJax.Hub.Config({'
        + 'jax: ["input/MathML", "input/TeX", "input/AsciiMath", "output/NativeMML"],'
        + 'extensions: ["asciimath2jax.js", "tex2jax.js","mml2jax.js","MathMenu.js","MathZoom.js"],'
        + 'tex2jax: { inlineMath: [["$","$"]] },'
        + 'asciimath2jax: { inlineMath: [["`", "`"]], delimiters: [["`","`"]] },'
        + 'TeX: {'
        + 'extensions: ["AMSmath.js","AMSsymbols.js","noErrors.js","noUndefined.js"], noErrors: { disabled: true }'
        + '},'
        + 'AsciiMath: { noErrors: { disabled: true } }'
        + '});');

var script = document.createElement("script");
script.type = "text/javascript";
script.src  = "http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=default";
var config = 'MathJax.Hub.Startup.onload();';
$(script).html(config);

document.getElementsByTagName("head")[0].appendChild(script0);
document.getElementsByTagName("head")[0].appendChild(script);

var inChange = false;

var FuncInserted = [];
var Inserted = [];
var currentEditor = null;
var currentLength = -1;
var editorToOffset = { };


function convertToConcrete(character, ele, leVal, currentOffset) {
    var i = 0;
    var currentNode = window.getSelection().focusNode;
    while(i < Inserted.length) {
        if(currentNode.nextSibling == Inserted[i].close && currentNode.nextSibling.childNodes[0].textContent == character) {
            break;
        }
        i = i + 1;
    }

    if(i != Inserted.length) {
        Inserted.splice(i, 1);
        currentNode.parentNode.removeChild(currentNode.nextSibling);
    }
}


//function insertFunc(ele, leVal, offset) {
//    generateInserted(offset+1, "func", "");
//    FuncInserted.push({ start: offset+1 });
//}


function insertBraces(ele, leVal, offset) {
    generateInserted(offset+1, '}', '{');
}

function insertAfter(newChild, refChild) { 
    refChild.parentNode.insertBefore(newChild,refChild.nextSibling); 
} 


function generateInserted(offset, character, additionalCharacter) {
    var currentNode = window.getSelection().focusNode;
    var completeStr = currentNode.textContent;

    // happens if first character typed generates a virtual character
    if(currentNode.tagName == "DIV") {
        currentNode = currentNode.childNodes[0];
    }

    //var preEle = document.createTextNode(completeStr.slice(0,offset+1));
    var replacement = null;
    if(additionalCharacter.length == 0) {
        replacement = document.createTextNode(completeStr.slice(0, offset));
    } else {
        replacement = document.createTextNode(completeStr.slice(0, offset+1));
    }
    var openSpan = document.createElement('span');
    openSpan.style.display="inline";
    var openText = null;
    if(additionalCharacter.length == 0) {
        openText = document.createTextNode(completeStr.slice(offset, offset+1));
    } else {
        openText = document.createTextNode(additionalCharacter);
    }
    openSpan.appendChild(openText);

    var postEle = null;
    if(completeStr.slice(offset+1).length > 0) {
        postEle = document.createTextNode(completeStr.slice(offset+1));
    }
    var closeSpan = document.createElement('span');
    var closeText = document.createTextNode(character);
    //closeSpan.style.background="#BBBBBB";
    closeSpan.style.color="#999999";
    closeSpan.style.display="inline";
    closeSpan.appendChild(closeText);

    var emptyText = document.createTextNode('');

    insertAfter(replacement, currentNode);
    insertAfter(openSpan, replacement);
    insertAfter(emptyText, openSpan);
    insertAfter(closeSpan, emptyText);
    
    if(postEle != null) {
        insertAfter(postEle, closeSpan);
    }

    currentNode.parentNode.removeChild(currentNode);

    GENTICS.Utils.Dom.setCursorInto( emptyText );
    window.getSelection().getRangeAt(0).setStart(emptyText, 0);
    window.getSelection().getRangeAt(0).setEnd(emptyText, 0);

    Inserted.push({open: openSpan, close: closeSpan });

    //Inserted.push({ start: offset, loc: offset+1, character: character, span: newSpan, text: replacement });
}

function isBeforeOther(testNode, searchFor) {
    var curr = testNode;
    while(curr != null) {
        if(curr == searchFor) return true;
        curr = curr.nextSibling;
    }
    return false;
}

function isAfterOther(testNode, searchFor) {
    var curr = testNode;
    while(curr != null) {
        if(curr == searchFor) return true;
        curr = curr.prevSibling;
    }
    return false;
}

function getTextBetweenElements(start, finish) {
    var curr = start.nextSibling;
    var acc = '';
    while(curr != finish) {
        switch(curr.nodeType) {
            case(3):
                acc+=curr.textContent;
                break;
            case(1):
                if(curr.tagName=='SPAN') {
                    acc+=curr.childNodes[0].textContent;
                }
                break;
            default:
                break;
        }
        curr = curr.nextSibling;
    }
    return acc;
}

function onTexCharChange(evt) {
    if(inChange) return;
    inChange = true;

    var currentNode = window.getSelection().focusNode;
    if(currentNode.tagName == "DIV") {
        currentNode = currentNode.childNodes[0];
    }

    var range = window.getSelection().getRangeAt(0);
    var offset = range.startOffset;
    var eqId = evt.currentTarget.id.substring(5);
    var ele = $('#'+evt.currentTarget.id);
    var leVal = getFullStr(ele[0].childNodes);
    var ch = currentNode.textContent[offset];
    var diff = leVal.length - currentLength;
/*
    // bulk delete
    if(leVal.length < currentLength && currentLength - leVal.length > 1) {
        var i = 0;
        while(i < Inserted.length) {
            if(Inserted[i].loc >= offset && Inserted[i].loc < offset + (currentLength - leVal.length)) {
                // if closing virtual is in the range of deleted characters, remove it from Inserted
                Inserted.splice(i, 1);
            } else if(Inserted[i].start >= offset && Inserted[i].start < offset + (currentLength - leVal.length)) {
                // if opening for a closing virtual is in the range of deleted characters (but not the closing), make it concrete
                Inserted.splice(i, 1);
            } else {
                i = i + 1;
            }
        }
    }
*/
    if(leVal.length < currentLength && currentLength - leVal.length == 1) {
        for(var i = 0; i < Inserted.length; i++) {

            // if this delete was on the opening character of a virtual closing character and there is no content in between
            if(currentNode.parentNode == Inserted[i].open && getTextBetweenElements(Inserted[i].open, Inserted[i].close).length == 0 ) {
                diff = diff - 1;

                var prev = Inserted[i].open.previousSibling;
                var next = Inserted[i].close.nextSibling;
                var parentNode = Inserted[i].open.parentNode;
                var curr = Inserted[i].open;

                while(curr != Inserted[i].close) {
                    var next = curr.nextSibling;
                    parentNode.removeChild(curr);
                    curr = next;
                }
                parentNode.removeChild(Inserted[i].close);
                
                if(prev != null && prev.tagName != 'SPAN') {
                    GENTICS.Utils.Dom.setCursorInto( prev );
                    window.getSelection().getRangeAt(0).setStart(prev, prev.textContent.length);
                } else if(next != null && next.tagName != 'SPAN') {
                    GENTICS.Utils.Dom.setCursorInto( next );
                    window.getSelection().getRangeAt(0).setStart(next, 0);
                } else {
                    var newText = document.createTextNode('');
                    parentNode.insertBefore(newText, next);
                    GENTICS.Utils.Dom.setCursorInto( newText );
                    window.getSelection().getRangeAt(0).setStart(newText, 0);
                }
                Inserted.splice(i, 1);


                leVal = getFullStr(ele[0].childNodes);
                MathJax.Hub.queue.Push(["Text", MathJax.Hub.getAllJax(eqId)[0],"\\displaystyle{"+leVal+"}"]);
                inChange = false;
                currentLength = leVal.length;
                return;
            }
        }

/*
        for(var i = 0; i < FuncInserted.length; i++) {
            if(FuncInserted[i].start <= offset && FuncInserted[i].start+4 > offset) {
                FuncInserted.splice(i, 1);
                break;
            }
        }
*/
    }

    // moved beyond the scope of a parens or braces
//    var i = 0;
//    while(i < Inserted.length) {
//        if(window.getSelection().focusNode == Inserted[i].span.childNodes[0] || 
//            (window.getSelection().focusNode == Inserted[i].text && offset > Inserted[i].loc || offset <= Inserted[i].start) ||
//            isAfterOther(window.getSelection().focusNode, Inserted[i].span) || isBeforeOther(window.getSelection().focusNode, Inserted[i].text)) {
//
//            var cur = Inserted[i];
//            var c = Inserted[i].span.childNodes[0].textContent;
//            var prev = Inserted[i].span.previousSibling;
//            prev.textContent += c;
//            Inserted[i].span.parentNode.removeChild(Inserted[i].span);
//            if(window.getSelection().focusNode == Inserted[i].span) {
//                GENTICS.Utils.Dom.setCursorInto( prev );
//                window.getSelection().getRangeAt(0).setStart(prev, prev.textContent.length);
//                window.getSelection().getRangeAt(0).setEnd(prev, prev.textContent.length);
//            }
//            Inserted.splice(i, 1);
//        } else {
//            i = i + 1;
//        }
//    }
/*
    i = 0;
    while(i < FuncInserted.length) {
        if(FuncInserted[i].start <= offset && FuncInserted[i].start+4 > offset) {
            diff = diff - 4;
            if(ele.val() == leVal) {
                ele.val(leVal.slice(0, FuncInserted[i].start)+ch+leVal.slice(FuncInserted[i].start+5));
                leVal = ele.val();
            } else {
                ele.text(leVal.slice(0, FuncInserted[i].start)+ch+leVal.slice(FuncInserted[i].start+5));
                leVal = ele.text();
            }
            window.getSelection().getRangeAt(0).setStart(window.getSelection().focusNode.childNodes[0], FuncInserted[i].start+1);
            FuncInserted.splice(i, 1);
            break;
        }
        i = i + 1;
    }
*/



//    if(leVal.length - currentLength > 0) {
//        switch(ch) {
//            case('}'):
//            case(')'):
//                var i = 0;
//                for(i = 0; i < Inserted.length; i++) {
//                    if(window.getSelection().focusNode.textContent.length == offset && window.getSelection().focusNode.nextSibling == Inserted[i].span && ch == Inserted[i].character) {
//                        diff = 0;
//                        break;
//                    }
//                }
//
//                break;
//            case('{'):
//            case('('):
//                diff = diff + 1;
//                break;
//            case('^'):
//            case('_'):
//                diff = diff + 2;
//                break;
//            case('\\'):
//                diff = diff + 4;
//                break;
//        }
//    }

    // update the offsets of the remaining virtual parens
//    for(var i = 0; i < Inserted.length; i++) {
//
//        if(Inserted[i].start >= offset) {
//            Inserted[i].start = Inserted[i].start + diff;
//        }
//
//        if(Inserted[i].loc >= offset) {
//            Inserted[i].loc = Inserted[i].loc + diff;
//        }
//    }

    if(leVal.length - currentLength > 0) {
        switch(ch) {
            case(')'):
            case('}'):
                convertToConcrete(ch, ele, leVal, offset);
                break;
            case('{'):
                generateInserted(offset, '}', '');
                break;
            case('('):
                generateInserted(offset, ')', '');
                break;
            case('^'):
            case('_'):
                insertBraces(ele, leVal, offset);
                break;
                /*
            case('\\'):
                insertFunc(ele, leVal, offset);
                break;
                */
        }
    }
    leVal = getFullStr(ele[0].childNodes);
    MathJax.Hub.queue.Push(["Text", MathJax.Hub.getAllJax(eqId)[0],"\\displaystyle{"+leVal+"}"]);
    inChange = false;
    currentLength = leVal.length;
}

function getFullStr(children) {
    var str = '';
    for(var i = 0; i < children.length; i++) {
        var ele = children[i];
        switch(ele.nodeType) {
            case(3):
                str = str + ele.textContent;
                break;
            case(1):
                if(ele.tagName=='SPAN') {
                    str = str + ele.childNodes[0].textContent;
                }
                break;
            default:
                break;
        }
    }
    return str;
}

function onAsciiCharChange(evt) {
    var eqId = evt.currentTarget.id.substring(5);
    var ele = $('#'+evt.currentTarget.id);
    var leVal = ele.val() || ele.text();
    MathJax.Hub.queue.Push(["Text", MathJax.Hub.getAllJax(eqId)[0],leVal]);
}

function enableEditor(editor, length) {
    if(currentEditor != null && currentEditor[0] != editor[0]) {
        disableEditor();
    }
    currentEditor = editor;
    currentLength = length;
    GENTICS.Utils.Dom.setCursorInto( editor[0] );
    if(editorToOffset[editor[0].id] != null) {
        window.getSelection().getRangeAt(0).setStart(window.getSelection().focusNode.childNodes[0], editorToOffset[editor[0].id]);
    }
    editor.show();
}

function disableEditor() {
    if(currentEditor != null) {
        editorToOffset[currentEditor[0].id] = window.getSelection().getRangeAt(0).startOffset;
        currentEditor.hide();
        currentEditor = null;
    }
}

function generateMathContainer(openDelimiter, closeDelimiter, charChangeFunction, initValue, editableObj) {
    var newElId = wrapPrefix+cntEq;
    var range = Aloha.Selection.getRangeObject();

    var newMathEditContainer = $('<div id="edit-'+newElId+'" style="padding:2px;min-height:28px;border:1px solid green;-moz-border-radius: 4px;-webkit-border-radius: 4px;-khtml-border-radius: 4px;border-radius: 4px;background-color:white;"></div>');
    var newMathContainer = $('<div id="'+newElId+'" style="left;border:1px dotted grey">'+openDelimiter+closeDelimiter+'</div>');

    GENTICS.Utils.Dom.insertIntoDOM( newMathEditContainer, range, $( Aloha.activeEditable.obj ) );
    GENTICS.Utils.Dom.insertIntoDOM( newMathContainer, range, $( Aloha.activeEditable.obj ) );
    GENTICS.Utils.Dom.setCursorInto( newMathEditContainer[0] );
    newMathEditContainer.bind('DOMCharacterDataModified', charChangeFunction);
    newMathEditContainer.bind('DOMNodeInserted', charChangeFunction);
    newMathEditContainer.hide();

    var initText = document.createTextNode('');

    if(initValue == '') {
        MathJax.Hub.queue.Push(["Typeset", MathJax.Hub, newElId, function() { 
                enableEditor(newMathEditContainer, 0);
                }]);
    } else {

        if(openDelimiter == '${') {

            MathJax.Hub.queue.Push(["Typeset", MathJax.Hub, newElId, function() { 
                    enableEditor(newMathEditContainer, initValue.length);
                    MathJax.Hub.queue.Push(["Text", MathJax.Hub.getAllJax(newElId)[0],"\\displaystyle{"+initValue+"}"]);
                    }]);
        } else {

            MathJax.Hub.queue.Push(["Typeset", MathJax.Hub, newElId, function() { 
                    enableEditor(newMathEditContainer, initValue.length);
                    MathJax.Hub.queue.Push(["Text", MathJax.Hub.getAllJax(newElId)[0],initValue]);
                    }]);
        }
        }

        var blurout = function()
        {
            Inserted = [];
            FuncInserted = [];
            disableEditor();
        };

        var editableClickBlurout = function(evt) {
            if(currentEditor != null) {
                var id = evt.target.id;
                if(id == null) {
                    return;
                }
                if(id.length > 8) {
                    if(id.substring(0, 8) == 'eqprefix-') {
                        return;
                    }
                }
                if(id.length > 13) {
                    if(id.substring(0, 13) == 'edit-eqprefix-') {
                        return;
                    }
                }
                disableEditor();
            }
        };

        /*
           $(editableObj).on('blur focusout', blurout);
           $(editableObj).on('click', editableClickBlurout);
         */
        newMathEditContainer.on('focusout', blurout);
        newMathEditContainer.on('blur', blurout);

        newMathContainer.on('click', function()
                {
                Inserted = [];
                FuncInserted = [];
                enableEditor(newMathEditContainer, newMathEditContainer.val() ? newMathEditContainer.val().length : newMathEditContainer.text().length );
                });

        cntEq++;

    }

    function toggleMath()
    {
        if( Aloha.activeEditable ) 
        {
            var range = Aloha.Selection.getRangeObject()
                if ( !( range.startContainer && range.endContainer ) ) {
                    return;
                }

            // get text from selection
            var leText = range.getText();

            if( $.trim(leText) === '' ) return;

            GENTICS.Utils.Dom.removeRange(range);
            // make a new placeholder for the new equation

            generateMathContainer('${','}$', onTexCharChange, leText, editableObj);
        }
    }

    scopes.createScope('math', 'Aloha.empty');

    self._mathCtrl = ui.adopt( 'characterPicker'/*"math"*/, button, 
            {
tooltip: 'Math', /*i18n.t('button.addmath.tooltip'),*/
icon: "M",
click: toggleMath
});

var parsedJax = false; 
Aloha.bind('aloha-editable-activated', function (event, data) 
        {

        !parsedJax && (function()
            {
            parsedJax = true;
            MathJax.Hub.Queue(["Typeset",MathJax.Hub, null, function()
                { 
                $(MathJax.Hub.getAllJax()).each(function()
                    { 
                    var elfr = $('#'+this.inputID+'-Frame'),
                    el = $('#'+this.inputID),
                    elpr = $('#'+this.inputID+'-Frame').prevAll('.MathJax_Preview').eq(0),
                    eqWrapper = $('<span id="'+wrapPrefix+cntEq+'" />').insertBefore(elpr)
                    .append(elpr).append(elfr).append(el)
                    .data('equation', this.originalText);

                    cntEq++;
                    }); 
                }]);
            })();
        self._mathCtrl.show();
        });


Aloha.bind('aloha-editable-created', function (event, editable) 
        {
        console.log("HOWDY PARDNER");
        editableObj = editable.obj;

        editable.obj.bind('keydown', self.hotKey.insertTexMath, function() 
            {
            generateMathContainer('${','}$', onTexCharChange, '', editable.obj);
            });

        editable.obj.bind('keydown', self.hotKey.insertAsciiMath, function() 
            {
            generateMathContainer('`','`', onAsciiCharChange, '', editable.obj);
            });
        editable.obj.bind('keydown', self.hotKey.insertMLMath, function() 
            {
            generateMathContainer('<math>','</math>', onAsciiCharChange, '', editable.obj);
            });
        });

}
});
});
