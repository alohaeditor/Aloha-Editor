  
  var aolDictionary = { };
  var cntEq = 0;
  function parentOfParent(ele) {
      if(ele == null) return null;
      var tmp = ele.parentNode;
      if(tmp == null) return null;
      return tmp.parentNode;
  }

  function existingEquationConfig() {
        $(MathJax.Hub.getAllJax()).each(function()
        { 
            console.log(this.originalText);
            var pp = parentOfParent(document.getElementById(this.inputID));
            console.log(this);
            if(pp == null || pp.className != "MathJax_MathContainer")
            {
                console.log("Initializing... "+this.inputID);
                var elfr = $('#'+this.inputID+'-Frame');
                var el = $('#'+this.inputID);
                var elpr = $('#'+this.inputID+'-Frame').prevAll('.MathJax_Preview').eq(0);
                var outerEqWrapper = $('<span id="'+'eqprefix-'+cntEq+'" class="MathBox MathBoxNew"/>').insertBefore(elpr);

                var eqWrapper = $('<span id="sub'+'eqprefix-'+cntEq+'"/>').
                    append(elpr).append(elfr).append(el)
                    .data('equation', '$'+this.originalText+'$');
                outerEqWrapper.append(eqWrapper);

                if(this.inputJax == "AsciiMath") { 
                    aolDictionary['eqprefix-'+cntEq] = 'radio_ascii';

                } else if(this.inputJax == "TeX") {
                    aolDictionary['eqprefix-'+cntEq] = 'radio_latex';

                }
                console.log('JAX: '+this.inputJax);

                cntEq++;
            } 
        });
  }

define([ 'aloha/plugin', 'jquery', 'ui/ui', 'ui/button', 'ui/port-helper-attribute-field', 'ui/scopes' ],
        function( plugin, $, ui, button, attributeField, scopes, floatingMenu ) 
        {
        "use strict";


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

var config = 'MathJax.Hub.Register.StartupHook("End", function() { existingEquationConfig(); }); MathJax.Hub.Startup.onload();';
$(script).html(config);

document.getElementsByTagName("head")[0].appendChild(script0);
document.getElementsByTagName("head")[0].appendChild(script);

var inChange = false;

var FuncInserted = [];
var Inserted = [];
var currentEditor = null;
var currentLength = -1;
var editorToOffset = { };

var aol = 'radio_latex';

function removeFromInserted(index) {
    if(Inserted.length == 1) {
        Inserted = [ ]
    } else {
        Inserted.splice(index, 1);
    }
}

function removeFromFuncInserted(index) {
    if(FuncInserted.length == 1) {
        FuncInserted = [ ]
    } else {
        FuncInserted.splice(index, 1);
    }

}

function convertToConcrete(character, ele, leVal, currentOffset) {
    var i = 0;
    var currentNode = window.getSelection().focusNode;
    while(i < Inserted.length) {
        if(currentNode.nextSibling == Inserted[i].close && currentNode.nextSibling.childNodes[0].textContent == character && 
            currentOffset == currentNode.textContent.length-1) {
            break;
        }
        i = i + 1;
    }

    if(i != Inserted.length) {
        concretize(Inserted[i].open);
        removeFromInserted(i);
        currentNode.parentNode.removeChild(currentNode.nextSibling);
    }
}


function insertAfter(newChild, refChild) { 
    refChild.parentNode.insertBefore(newChild,refChild.nextSibling); 
} 

function insertFunc(ele, leVal, offset, dummyName) {
    console.log('Inside insertFunc')
    var currentNode = window.getSelection().focusNode;
    console.log(currentNode.className)
    var completeStr = currentNode.textContent;
    console.log(completeStr);

    // happens if first character typed generates a virtual character
    if(currentNode.className == "math-source") {
        currentNode = currentNode.childNodes[0];
    }

    //var preEle = document.createTextNode(completeStr.slice(0,offset+1));
    var replacement = document.createTextNode(completeStr.slice(0, offset));

    var openSpan = document.createElement('span');
    openSpan.style.display='inline';
    var openText = document.createTextNode('\\');
    openSpan.appendChild(openText);


    var newSpan = document.createElement('span');
    newSpan.style.display="inline";
    newSpan.style.color="#999999";
    var newText = document.createTextNode(dummyName);
    newSpan.appendChild(newText);

    var postEle = null;
    if(completeStr.slice(offset+1).length > 0) {
        postEle = document.createTextNode(completeStr.slice(offset+1));
    }

    insertAfter(replacement, currentNode);
    insertAfter(openSpan, replacement);
    insertAfter(newSpan, openSpan);
    
    if(postEle != null) {
        insertAfter(postEle, newSpan);
    }

    currentNode.parentNode.removeChild(currentNode);

    GENTICS.Utils.Dom.setCursorInto( newText );
    window.getSelection().getRangeAt(0).setStart(newText, 0);
    window.getSelection().getRangeAt(0).setEnd(newText, 0);

    FuncInserted.push({ span: newSpan, open:openSpan });
}


function insertBraces(ele, leVal, offset) {
    generateInserted(offset+1, '}', '{');
}



function generateInserted(offset, character, additionalCharacter) {
    var currentNode = window.getSelection().focusNode;
    var completeStr = currentNode.textContent;

    // happens if first character typed generates a virtual character
    if(currentNode.className == "math-source") {
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
        curr = curr.previousSibling;
    }
    return false;
}

function getTextBetweenElementsInclusive(start, finish) {
    var curr = start;
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
    switch(finish.nodeType) {
        case(3):
            acc+=finish.textContent;
            break;
        case(1):
            if(finish.tagName=='SPAN') {
                acc += curr.childNodes[0].textContent;
            }
            break;
        default:
            break;
    }
    return acc;
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

function concretize(span) {
    var c = span.childNodes[0].textContent;
    var prev = span.previousSibling;
    var next = span.nextSibling;
    var parentNode = span.parentNode;
    parentNode.removeChild(span);

    if(prev != null && prev.tagName != 'SPAN') {
        prev.textContent += c;
        //GENTICS.Utils.Dom.setCursorInto( prev );
        //window.getSelection().getRangeAt(0).setStart(prev, prev.textContent.length);
    } else if(next != null && next.tagName != 'SPAN') {
        next.textContent = c + next.textContent;
        //GENTICS.Utils.Dom.setCursorInto( next );
        //window.getSelection().getRangeAt(0).setStart(next, 0);
    } else {
        var newText = document.createTextNode(c);
        parentNode.insertBefore(newText, next);
        /*
        if(window.getSelection().focusNode == span) {
            GENTICS.Utils.Dom.setCursorInto( newText );
            window.getSelection().getRangeAt(0).setStart(newText, newText.textContent.length);
        }
        */
    }

}

function hasChild(parentNode, childNode) {
    var nodes = parentNode.childNodes;
    for(var i = 0; i < nodes.length; i++) {
        if(nodes[i] == childNode) {
            return true;
        }
    }
    return false;
}



function checkForOrphans() {
    var i = 0;
    while(i < Inserted.length) {
        if(Inserted[i].open.parentNode == null || Inserted[i].close.parentNode == null) {
            if(Inserted[i].open.parentNode != null) {
                concretize(Inserted[i].open);
            } 
            if(Inserted[i].close.parentNode != null) {
                concretize(Inserted[i].close);
            } 
            removeFromInserted(i);

        } else if(Inserted[i].open.childNodes[0].textContent.length == 0) {
            Inserted[i].open.parentNode.removeChild(Inserted[i].open);
            concretize(Inserted[i].close);
            removeFromInserted(i);
        } else if(Inserted[i].close.childNodes[0].textContent.length == 0) {
            Inserted[i].close.parentNode.removeChild(Inserted[i].close);
            concretize(Inserted[i].open);
            removeFromInserted(i);
        }else {
            i = i + 1;
        }
    }
}

function handleInsertsInsideSpans(leVal, currentNode, ch) {
    if(leVal.length > currentLength) {
        for(var i = 0; i < Inserted.length; i++) {

            var enclosing = null;
            var isInsertedAtFrontOfSpan = false;

            if(currentNode.parentNode == Inserted[i].close) {
                enclosing = Inserted[i].close;
                isInsertedAtFrontOfSpan = currentNode.textContent[0] == ch[0];
            } else if(currentNode.parentNode == Inserted[i].open) {
                enclosing = Inserted[i].open;
                isInsertedAtFrontOfSpan = currentNode.textContent[0] == ch[0];
            }

            if(enclosing != null) {
                if(isInsertedAtFrontOfSpan) {
                    var prevElement = currentNode.parentNode.previousSibling;
                    var newText = document.createTextNode(ch);
                    currentNode.parentNode.parentNode.insertBefore(newText, currentNode.parentNode);
                    currentNode.parentNode.textContent = currentNode.parentNode.textContent.slice(currentNode.parentNode.textContent.length-1, currentNode.parentNode.textContent.length);
                    return { "newNode": newText, "setAfter": true };
                } else {
                    var nextElement = currentNode.parentNode.nextSibling;
                    var newText = document.createTextNode(ch);
                    insertAfter(newText, currentNode.parentNode);
                    currentNode.parentNode.textContent = currentNode.parentNode.textContent.slice(0,1);
                    return { "newNode": newText, "setAfter": false };
                }
            }
        }
    }
    return { "newNode": null, "setAfter": false };
}

function handleBulkDelete(leVal, range) {
    if(leVal.length < currentLength && currentLength - leVal.length > 1) {
        // bulk delete
        var startDelete = range.startContainer;
        if(startDelete.className == "math-source") {
            startDelete = startDelete.childNodes[0];
        }
        var endDelete = range.endContainer;
        if(endDelete.className == "math-source") {
            endDelete = endDelete.childNodes[endDelete.childNodes.length-1];
        }

        var i = 0;
        while(i < Inserted.length) {

            var open = Inserted[i].open;
            var close = Inserted[i].close;
            var deleteOpen = false;
            var deleteClose = false;
            var parentNode = Inserted[i].open.parentNode;

            if(isAfterOther(open, startDelete) && isBeforeOther(open, endDelete)) {
                deleteOpen = true;
            }
            if(isAfterOther(close, startDelete) && isBeforeOther(close, endDelete)) {
                deleteClose = true;
            }
            if(deleteOpen && deleteClose) {
                parentNode.removeChild(open);
                parentNode.removeChild(close);
                removeFromInserted(i);
            } else if(deleteOpen) {
                concretize(close);
                parentNode.removeChild(open);
                removeFromInserted(i);
            } else if(deleteClose) {
                concretize(open);
                parentNode.removeChild(close);
                removeFromInserted(i);
            } else {
                i = i+1;
            }
        }

        //for(var i = 0; i < FuncInserted.length; i++) {
        //    var span = FuncInserted[i].span;
        //    var open = FuncInserted[i].open;
        //    var deleteOpen = false;
        //    var deleteSpan = false;

        //    if(isAfterOther(open, startDelete) && isBeforeOther(open, endDelete)) {
        //        deleteOpen = true;
        //    }
        //    if((span.childNodes[0] == startDelete || isAfterOther(span, startDelete)) && (span.childNodes[0] == endDelete || isBeforeOther(span, endDelete))) {
        //        deleteSpan= true;
        //    }

        //    if(deleteOpen && deleteSpan) {
        //        parentNode.removeChild(open);
        //        //parentNode.removeChild(span);
        //        concretize(span);
        //        removeFromInserted(i);
        //    } else if(deleteOpen) {
        //        concretize(span);
        //        parentNode.removeChild(open);
        //        removeFromInserted(i);
        //    } else if(deleteSpan) {
        //        concretize(open);
        //        concretize(span);
        //        //parentNode.removeChild(span);
        //        removeFromInserted(i);
        //    } else {
        //        i = i+1;
        //    }

        //}

        var tmp = getFullStr(mathEditBox[0].childNodes);
        MathJax.Hub.queue.Push(["Text", MathJax.Hub.getAllJax(eqId)[0],"\\displaystyle{"+tmp+"}"]);
        inChange = false;
        currentLength = tmp.length;
        return true;
    }
    return false;
}

function handleFunctionReplacement(leVal, currentNode, ch, mathEditBox, eqId, offset) {
    console.log('IN FUNC REPLACE '+FuncInserted.length);
    for(var i = 0; i < FuncInserted.length; i++) {
        console.log('Checking in func replace')
        console.log(FuncInserted[i].span);
        if(currentNode.parentNode == FuncInserted[i].span) {
            console.log('FOUND IN FUNC REPLACE')
            var saveStr = currentNode.textContent;
            var prev = currentNode.parentNode.previousSibling.previousSibling;
            var next = currentNode.parentNode.nextSibling;
            var parentNode = currentNode.parentNode.parentNode;
            parentNode.removeChild(currentNode.parentNode);
            parentNode.removeChild(FuncInserted[i].open);

            if(leVal.length - currentLength < 0) {
                var newText = document.createTextNode('\\'+saveStr);
                parentNode.insertBefore(newText, next);
                GENTICS.Utils.Dom.setCursorInto( newText );
                window.getSelection().getRangeAt(0).setStart(newText, offset+2);
            } else if(leVal.length - currentLength > 0) {
                var newText = document.createTextNode('\\'+ch);
                parentNode.insertBefore(newText, next);
                GENTICS.Utils.Dom.setCursorInto( newText );
                window.getSelection().getRangeAt(0).setStart(newText, 1+ch.length);
            }

            removeFromFuncInserted(i);

            var tmp = getFullStr(mathEditBox[0].childNodes);
            MathJax.Hub.queue.Push(["Text", MathJax.Hub.getAllJax(eqId)[0],"\\displaystyle{"+tmp+"}"]);
            inChange = false;
            currentLength = tmp.length;
            return true;
        }
    }
    return false;
}

function checkLeftScope(currentNode) {
    var i = 0;
    while(i < Inserted.length) {
        if(isAfterOther(currentNode, Inserted[i].close) || isBeforeOther(currentNode, Inserted[i].open)) {
            concretize(Inserted[i].open);
            concretize(Inserted[i].close);
            removeFromInserted(i);
        } else {
            i = i + 1;
        }
    }
}

function onTexCharChange(evt, mathEditorContainer, eqId) {
    if(inChange) return;
    inChange = true;
    var mathEditBox = mathEditorContainer.find(".math-source");

    try {
        var currentNode = window.getSelection().focusNode;

        if(currentNode.className == "math-source") currentNode = currentNode.childNodes[0];

        if(currentNode.parentNode.childNodes.length == 2 && currentNode.parentNode.childNodes[0] == currentNode && 
            currentNode.parentNode.childNodes[1].className == "math-source-hint-text") {
            currentNode.parentNode.removeChild(currentNode.parentNode.childNodes[1]);
            currentLength = 0;
        }

        var range = window.getSelection().getRangeAt(0);
        var leVal = getFullStr(mathEditBox[0].childNodes);
        var offset= - 1;
        var ch = '\0';
        if(leVal.length-currentLength > 0) {
            offset = range.startOffset+(leVal.length-currentLength)-1;
            ch = currentNode.textContent.slice(range.startOffset, range.startOffset+(leVal.length-currentLength));
        } else {
            offset = range.startOffset-1;
            ch = currentNode.textContent.slice(offset, offset+1);
        }
        var ele = $('#'+evt.currentTarget.id);
        console.log('-----------------------------------------');
        console.log(currentNode);
        console.log(range.startContainer);
        console.log(range.endContainer);
        console.log('LEVAL IS \"'+leVal+'\" : LENGTH '+leVal.length);
        console.log('CHANGE IN LENGTH IS '+(leVal.length-currentLength));
        console.log('RANGE IS ['+range.startOffset+'->'+range.endOffset+']');
        console.log('OFFSET IS '+offset);
        console.log('SO CH IS '+ch);
        console.log('CURRENT LENGTH '+currentLength);


        var newCurrent = handleInsertsInsideSpans(leVal, currentNode, ch);
        if(newCurrent["newNode"] != null) {
            currentNode = newCurrent["newNode"];
            GENTICS.Utils.Dom.setCursorInto( currentNode );
            offset= ch.length;
            window.getSelection().getRangeAt(0).setStart(currentNode, offset);
        }

        //range = window.getSelection().getRangeAt(0);
        //offset = range.startOffset;
        leVal = getFullStr(mathEditBox[0].childNodes);
        var diff = leVal.length - currentLength;


        if(!handleBulkDelete(leVal, range) ) {
            handleFunctionReplacement(leVal, currentNode, ch, mathEditBox, eqId, offset);
        }

        
        checkForOrphans();
        checkLeftScope(currentNode);
        console.log('CH IS '+ch);

        if(leVal.length - currentLength > 0) {
            switch(ch) {
                case(')'):
                case('}'):
                    convertToConcrete(ch, mathEditBox[0], leVal, offset);
                    break;
                case('{'):
                    generateInserted(offset, '}', '');
                    break;
                case('('):
                    generateInserted(offset, ')', '');
                    break;
                case('^'):
                case('_'):
                    insertBraces(mathEditBox[0], leVal, offset);
                    break;
                case('\\'):
                    insertFunc(mathEditBox[0], leVal, offset, 'func');
                    break;
            }
        }

        console.log('LEVAL is: '+leVal);
        console.log('EQID is: '+eqId);
        leVal = getFullStr(mathEditBox[0].childNodes);
        MathJax.Hub.queue.Push(["Text", MathJax.Hub.getAllJax(eqId)[0],"\\displaystyle{"+leVal+"}"]);
    } catch(err) {
        leVal = getFullStr(mathEditBox[0].childNodes);
    }
    currentLength = leVal.length;
    console.log('Setting current length to '+currentLength);
    inChange = false;
}

function onAsciiCharChange(evt,  mathEditorContainer, eqId) {
        // var eqId = evt.currentTarget.id.substring(5);
        console.log("Refreshing ascii rendering");
        var mathEditBox = mathEditorContainer.find(".math-source");

        //var eqId = evt.currentTarget.id.substring(5);
        // var mathEditBox = $('#'+evt.currentTarget.id);
        // var leVal = mathEditBox.val() || mathEditBox.text();
        var leVal = getFullStr(mathEditBox[0].childNodes);
        //var leVal = mathEditBox.text() || mathEditBox.val();
        console.log("The ascii eqid is: " + eqId);
        console.log("The retrieved value is: " + leVal);
        MathJax.Hub.queue.Push(["Text", MathJax.Hub.getAllJax(eqId)[0],leVal]);
    }

function generateMathContainer(openDelimiter, closeDelimiter, charChangeFunction, equation, editableObj, newMathEditContainer) {
    console.log("Entering generate");
    var newElId = wrapPrefix+cntEq;
    var mathJaxElId = "sub" + wrapPrefix+cntEq;
    var range = Aloha.Selection.getRangeObject();
    var newMathContainer = $('<span id="'+newElId+'" class="MathBox MathBoxNew selected"> <span id="'+ mathJaxElId + '">' + openDelimiter + closeDelimiter+'</span> </span>');
   /* Generates the math editor */ 
    GENTICS.Utils.Dom.insertIntoDOM( newMathContainer, range, $("#content"));

    // console.log("Editable obj is: " + $( Aloha.activeEditable.obj ).attr("id"));
    console.log("ID is: " + newElId);
    if(equation == '' || equation == "&nbsp\;") {
        MathJax.Hub.queue.Push(["Typeset", MathJax.Hub, mathJaxElId, function() { 
        console.log("Just inserted new math");
        console.log("Finished typsetting");
        }]);
    } 
    else {

        if(openDelimiter == '${') {

            MathJax.Hub.queue.Push(["Typeset", MathJax.Hub, mathJaxElId, function() { 
                   MathJax.Hub.queue.Push(["Text", MathJax.Hub.getAllJax(mathJaxElId)[0],"\\displaystyle{"+equation+"}"]);
                   
            }]);
        } 
        else {

            MathJax.Hub.queue.Push(["Typeset", MathJax.Hub, mathJaxElId, function() { 
                   MathJax.Hub.queue.Push(["Text", MathJax.Hub.getAllJax(mathJaxElId)[0],equation]);
            }]);
        }
    }
    cntEq++;
    return newElId; // Returns the id of the newly inserted math element

}

 function insertToolbar() {
    var popOutHtml = buildMathEditor();
    popOutHtml = '<span id="" class="MathBox selected MathBoxNew" contenteditable="false"' + popOutHtml + '</span>';
    $("#content").append(popOutHtml);
    //$(document.body).append(popOUt);
    //pasteHtmlAtCaret(popOUt);
}
// Inserts html where the caret is in the html
function pasteHtmlAtCaret(html) { // From Tim Down at http://stackoverflow.com/questions/6690752/insert-html-at-cursor-in-a-contenteditable-div
    var sel, range;
    if (window.getSelection) {
        // IE9 and non-IE
        sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            range = sel.getRangeAt(0);
            range.deleteContents();

            // Range.createContextualFragment() would be useful here but is
            // non-standard and not supported in all browsers (IE9, for one)
            var el = document.createElement("div");
            el.innerHTML = html;
            var frag = document.createDocumentFragment(), node, lastNode;
            while ( (node = el.firstChild) ) {
                lastNode = frag.appendChild(node);
            }
            range.insertNode(frag);

            // Preserve the selection
            if (lastNode) {
                range = range.cloneRange();
                range.setStartAfter(lastNode);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
    } else if (document.selection && document.selection.type != "Control") {
        // IE < 9
        document.selection.createRange().pasteHTML(html);
    }
  }
/* 
 * Converts text to ASCII math or LaTex if the user selected some text.
 * If not it provides the user with a math-editor
*/
  function mathClickNew(openDelimiter, closeDelimiter, charChangeFunction) {
    console.log("mathClickNew ");
    // Prevents multiple editors from being opened at the same time
    mathEditorRemove("");
    var equation = getSelectionText();
    // Pops up the math-editor if the user hasn't selected text
    if (equation == '') {
      equation = "&nbsp\;";

     /* $("[class*='-header']").die("mouseenter mouseleave"); // Turning hovers off (temporarily)
      $(".canvas-wrap").die("mouseenter mouseleave"); // Have to do this one separately from above, apparently
      $(".MathBox").die("mouseenter mouseleave");
      $("table caption").die("mouseenter mouseleave");*/
      // cwLeave($(".canvas-wrap"),"special");

      // Changes status of math button to selected
      $('button[title="Math"]').addClass("selected");
    
      // console.log("Building the math editor");
      var mathEditor = buildMathEditor();
      // console.log("Delimiter is: " + openDelimiter);
    // pasteHtmlAtCaret('<span id="" class="MathBox selected MathBoxNew" contenteditable="false">' + exText + '</span>');
    // Generates and inserts a new math equation container
     var newElId = generateMathContainer(openDelimiter, closeDelimiter, charChangeFunction, equation, editableObj);
     // Calculates the id of the element which actually holds the mathjax
     var mathJaxElId = "sub" + newElId;
      // Retrieves the html element(which has the selected text) it just inserted to the document
      var mathEditorContainer = $(".MathBoxNew");
      // Inserts the math editor
      mathEditorContainer.prepend(mathEditor);

      // console.log("Editor text is: " + getFullStr($(".math-editor").find(".math-source")[0].childNodes));
      // Sets the radio button depending on the saved global preferences. Optional if Kathi wants this feature
      if (aol == 'radio_latex')
        mathEditorContainer.find("#radio_latex").attr('checked','checked');

      else
        mathEditorContainer.find("#radio_ascii").attr('checked','checked');
      
      // mathEditorContainer.find("#radio_latex").attr("checked",false);
      //mathEditorContainer.removeClass("temporarily-hide");
      
      // Adjusts the position of the math editor
      var newB = mathEditorContainer.outerHeight() + 14; // 14 = approx. positive value of :after's "bottom" property
      var newL = mathEditorContainer.outerWidth() / 2 - parseInt($(".math-editor").css("width")) / 2 - 7; // 7 for mysterious good measure
   
      // Sets the originally calculated positions so that offset() retrieves the right position
      $(".math-editor").css("bottom", newB + "px");
      $(".math-editor").css("left", newL + "px");
      // Adds and positions the arrow to the math-editor pop-up that points to the current equation
      newL = adjustEditor(newL);
      $(".math-editor").css("bottom", newB + "px");
      $(".math-editor").css("left", newL + "px");
      console.log(charChangeFunction);
      // Adds event listeners to update the math as the user types
      updateMath(mathJaxElId, mathEditorContainer, charChangeFunction);

      /* If the math-editor is empty then it's replaced w/ default text */
      if (equation == "&nbsp\;") {
        mathEditorContainer.find(".math-source").append('<span class="math-source-hint-text">Enter your math notation here</span>');
        /*
        var newSpan = document.createElement('span');
        newSpan.style.display="inline";
        newSpan.style.color="#999999";
        var newText = document.createTextNode("Enter your math notation here");
        newSpan.appendChild(newText);
        mathEditorContainer.find(".math-source")[0].appendChild(newSpan);
        */

        //insertFunc(mathEditorContainer.find(".math-source")[0], '', 0, "Enter your math notation here");

        console.log("Inserting the cursor at the beginning of the editor");
        placeCaretAtBeginning($(".math-source").get(0));

        //GENTICS.Utils.Dom.setCursorInto( mathEditorContainer.find(".math-source")[0] );
      } 
      // Not sure if this case will ever be hit
      else {
        /* Appends the equation to the text in the editor and sets the cursor at the beginning of the beginning of the editor */
        mathEditorContainer.find(".math-source").append(equation);
        console.log("Inserting the cursor at the end of the editor");
        placeCaretAtEnd($(".math-source").get(0));
      }
      console.log("Current contents of container are:");
      console.log($(".math-source").get(0));
      /*if ( $("#cheat-sheet").css("display") != 'none' ) $("#cheat-sheet-activator").attr("checked",true);
      $("#cheat-sheet-wrap").slideUp("fast", function(){
        $(this).show();
      });*/


    } 
    /* If the user selects text then that text is converted to whatever was selected */
    else {
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
        }  
      generateMathContainer(openDelimiter, closeDelimiter, charChangeFunction, equation, editableObj, null);
      // Changes status of math button to be 'unselected'
      $('button[title="Math"]').removeClass("selected");
      // $(".MathBoxNew").removeAttr("id").effect("highlight", { color: "#E5EEF5" }, 1000);
    }
    // e.stopPropagation();
    //e.preventDefault();

  }

  function updateMath(mathJaxElId, mathEditorContainer, charChangeFunction) {
           /* Changes the update function based on what radio button is chosen */

        /* Changes the update function to the LaTeX update function */
       mathEditorContainer.find("#radio_latex").on("click", function(e){
        // Ensures that the math doesn't regenerate if the same option is selected consecutively
        if (aol == 'radio_latex')
            return;
        // Retrieves the current text in the math editor
        var actualMathText = getFullStr($(".math-editor").find(".math-source")[0].childNodes);
        // actualMathText = removeMathWrapper(actualMathText);
        console.log("Changing the update function to latex: " + actualMathText);
        // Updates the update function which gets called on char change
        charChangeFunction = onTexCharChange;

        /* Updates the current equation */
        // Removes and inserts a new math element with the correct rendering
        changeMathLang(actualMathText, mathJaxElId, '${', '}$', "radio_latex");
        });


       /* Changes the update function to the ASCII update function */
       mathEditorContainer.find("#radio_ascii").on("click", function(e){
        // Ensures that the math doesn't regenerate if the same option is selected consecutively
        if (aol == 'radio_ascii')
            return;

        // Retrieves the current text in the math editor
        var actualMathText = getFullStr($(".math-editor").find(".math-source")[0].childNodes);
        // actualMathText = removeMathWrapper(actualMathText);
        console.log("Changing the update function to ascii: " + actualMathText);
        // Updates the update function which gets called on char change
        charChangeFunction = onAsciiCharChange;
        /* Updates the current equation */
        // Removes and inserts a new math element with the correct rendering
        changeMathLang(actualMathText, mathJaxElId, '`', '`', "radio_ascii");
        });


      // Updates the generated math as the user modifies it
      $(".math-editor").find(".math-source-wrap").on('DOMCharacterDataModified', function(e) {
        /* Replaces the current text with a '&nbsp;' if the user removes all the text */
        var text = getFullStr($(".math-editor").find(".math-source")[0].childNodes);
        if (text == '') {
            //$(".math-editor").find(".math-source").append("&nbsp\;");
        }
        // console.log("Modified1: Editor text is: " + getFullStr($(".math-editor").find(".math-source")[0].childNodes));
        charChangeFunction(e, $(".math-editor"), mathJaxElId);
       });

      $(".math-editor").find(".math-source-wrap").on('DOMNodeInserted', function(e) {
        /* Replaces the current text with a '&nbsp;' if the user removes all the text */
        // var text = getFullStr($(".math-editor").find(".math-source")[0].childNodes);
        var text = $(".math-editor").find(".math-source").text();
        console.log("The retrieved text is: ");
        console.log(text);
        // $(".math-editor").find(".math-source").text(text);
        if (text == '') {
            console.log("Appending nsbsp");
            $(".math-editor").find(".math-source").append("&nbsp\;");
        }
        // console.log("Inserted1: Editor text is: " + getFullStr($(".math-editor").find(".math-source")[0].childNodes));
        charChangeFunction(e, $(".math-editor"), mathJaxElId);
    });
  }
  function mathEditorRemove(override) {
     try {
      // console.log("mathEditorRemove, override is: " + override);
      // If the new math element is empty then unselect and unhover it
      $(".MathBox").removeClass("selected");
      $(".MathBox").removeClass("hovered");
      // This is only related to the math cheat sheet
      /*if ($("#cheat-sheet-wrap").css("display") != 'none') {
        $("#cheat-sheet-wrap").slideDown("fast", function(e){
          $(this).hide();
        });
      }*/
      // Retrieves the closest mathjax element
      var mathJax = $(".math-editor").closest(".MathBox");
      // Retrieves the math editor's text
      console.log($(".math-editor"))
      if($(".math-editor").length == 0) {
          // no math editor currently exists to be closed. This can be triggered by a click on the HTML without an existing math editor
          return;
      }
      var mathSource = getFullStr($(".math-editor").find(".math-source")[0].childNodes) || $(".math-editor").find(".math-source").text();
      /* Checks if the override's string length is non zero or the 'radio button(I don't know which yet) is checked' 
         And that  the hint text is zero
        */
     // Sets the user preferences to the id of which radio button is checked {}
      var newAol = $(".math-editor").find('input[name="math-type"]:checked').attr("id");
      // Saves the preference of the rendering to the global aolDictionary so that their preferenc will be saved depending on which equation they're editing
      if (newAol != null && mathJax != null) {
        aol = newAol;      
        aolDictionary[mathJax.attr("id")] = aol;
        console.log("Adding a new aol: " + aol + " with id: " + mathJax.attr("id"));

    }
    
      if ((override.length || $("#radio_regular").is(":checked")) && !$(".math-source-hint-text").length) {
        if (mathSource == "&nbsp\;") {
            // If the math source only has a 'standard space' simply replace it with empty text?
          //mathJax.replaceWith("");
        } 
        else {
            // Otherwise update it with the next text
          // /mathJax.replaceWith(mathSource);
        }
      } 
      else {
        // Removes the mathjax element if the editor is empty
        if (!mathJax.find(".asciimath").length) { 
          if (!mathSource.trim().length || $(".MathBoxNew").find(".math-source-hint-text").length) {
            mathJax.remove();
          } 
          else {
            //mathJax.html('<span class="MathJaxText">' + mathSource + '</span>');
          }
        }
      }
  }
catch(e) {
    console.log("Error: " + e);
} 
// Ensures that the editor is removed in case of an error
finally {
      /* Clears all the 'insert' dictionaries */
      Inserted = [];
      FuncInserted = [];
      // Removes every math editor open
      $(".math-editor").remove();
      $('button[title="Math"]').removeClass("selected"); //Unselects the button
      // For every math element it removes the 'MathBoxNew' class from the element
      $(".MathBox").each(function(){
        if ($(this).hasClass('MathBoxNew')) {
          $(this).removeClass("MathBoxNew"); // Removes its 'new status from it'
        }
      });
  }
    }
    /* Sets a callback on the aloha button by looking for an element whose title=math,
     * This is used to prevent the math editor being closed by another callback function keyed on the entire html document. 
     * it does this by calling e.stopPropogation()
     */

    $('button[title="Math"]').live("click", function(e) {
        // console.log("Button being clicked");
        e.stopPropagation();
    });
    /* Generates events everytime the inserted equation is being interacted with */
  $(".MathBox").live("mouseenter", function(e){
    // console.log("Editor being entered");
    mathEnter($(this),e);
  });
  $(".MathBox").live("mouseleave", function(e){
    // console.log("Editor being left");    
    mathLeave($(this),e);
  });
  $(".MathBox:not(.selected)").live("click", function(e){
    console.log("Editor not selected?");    
    mathClick($(this),e);

  });
  $(".math-editor").live("click", function(e){
    // console.log("math editor being clicked");
//  e.stopPropagation();
    meClick($(this),e);
  });


  function removeMathWrapper(mathText) {
    /*var latexRegexPattern = "(?<=\\displaystyle{)(.*)(?=})";
    latexRegexPattern = "\\displaystyle{.*}";*/
    var latexRegex = /\\displaystyle{(.*)}/;
    var asciiRegex = /`(.*)`}/; 
    var actualMathTextFromLatex = latexRegex.exec(mathText);
    var actualMathTextFromAscii = asciiRegex.exec(mathText);
    var actualMathText = actualMathTextFromLatex || actualMathTextFromAscii;
    if (actualMathText == null) {
        return mathText;       
    }
    return actualMathText[1];
  }
  function meClick(me,e) {
    e.stopPropagation();
  };
function mathClick(mathEditorContainer, e) {

   /* $("[class*='-header']").die("mouseenter mouseleave"); // Turning hovers off (temporarily)
   // $(".canvas-wrap").die("mouseenter mouseleave"); // Have to do this one separately from above, apparently
    $(".MathBox").die("mouseenter mouseleave");

    $("table caption").die("mouseenter mouseleave");*/
    console.log("Math click being called");
   /* cwLeave($(".canvas-wrap"),"special");*/
    var charChangeFunction, elementId;
    if(!mathEditorContainer.find(".math-editor").length) {
      mathEditorRemove("");
      mathEditorContainer.find('#math-icon-edit').remove();
      mathEditorContainer.find('#math-icon-clear').remove();
      mathEditorContainer.removeAttr("title");
      mathEditorContainer.addClass("selected");
      // Changes status of button to selected
      $('button[title="Math"]').addClass("selected");
      /* Inserts the math editor */
      var mathEditor = buildMathEditor(mathEditorContainer,e);
      mathEditorContainer.prepend(mathEditor);
      var mathtext = mathEditorContainer.find(".asciimath").text(); // Don't quite know what this is supposed to do
      // Retrieves the  id of the math element
      var elementId = mathEditorContainer.closest(".MathBox").attr("id");
      // Calculates the id of the element containing the actual mathjax 
      var mathJaxElId = "sub"+ elementId;
      // Retrieves the original math text by searching for the specific mathjax element w/ the original text
      console.log("Actual math text is: " + mathEditorContainer.find("#" + mathJaxElId).children('[id^="MathJax-Element-*"], [type^="math/"]').text());
      var actualMathText = mathEditorContainer.find("#" + mathJaxElId).children('[id^="MathJax-Element-*"], [type^="math/"]').text();
     // var actualMathText = getFullStr(mathEditorContainer.children('[id^="MathJax-Element-*"], [type^="math/"]'));

      // Retrieves the user rendering preferences for the selected mathjax element. If it can't find it's value then it uses the default value
      var savedAol = aolDictionary[elementId] || 'radio_latex';
      // Updates the global variable which holds which type of equation is currently being edited
      aol = savedAol;
      console.log("Retrieved aol with an id of: " + elementId + " is: " + savedAol);

    // Checks the radio button based on what was last chosen, then sets the update function based on what the user chooses
      if (savedAol == 'radio_latex') {
        mathEditorContainer.find("#radio_latex").attr('checked','checked');
        // Changes which function is called to update the mathjax
        charChangeFunction = onTexCharChange;
        actualMathText = removeMathWrapper(actualMathText);
        console.log("The retrieved math looks like: " + actualMathText);
      } 
      else if(savedAol == 'radio_ascii')
      {
        mathEditorContainer.find("#radio_ascii").attr('checked','checked');
        charChangeFunction = onAsciiCharChange;
        console.log("Setting the onAsciiCharChange");
        actualMathText = removeMathWrapper(actualMathText);
        console.log("The retrieved math looks like: " + actualMathText);
      }
      /* Retrieves the raw equation from the generated math element and populates the math editor */
      if (mathtext.length) {
        // Don't know what this does but haven't hit this case yet
        console.log("IN that weird case");
        mathEditorContainer.find(".math-source").html(mathtext);
      } 
      else if (actualMathText.length) {
        // Drops the text into the math editor if the text is non-empty
        mathEditorContainer.find(".math-source").html(actualMathText);
      } 
      else {
        // Otherwise  it just appends nbsp
        mathEditorContainer.find(".math-source").html("&nbsp\;");
      }

      // Repositions the editor next to the mathjax
      var newB = mathEditorContainer.outerHeight() + 14; // 14 = approx. positive value of :after's "bottom" property
      var newL = mathEditorContainer.outerWidth() / 2 - parseInt($(".math-editor").css("width")) / 2 - 7; // 7 wfor mysterious good measure

      // Sets the originally calculated positions so that offset() retrieves the right position
      $(".math-editor").css("bottom", newB + "px");
      $(".math-editor").css("left", newL + "px");
      // Adds and positions the arrow to the math-editor pop-up that points to the current equation
      newL = adjustEditor(newL);
      // Positions the editor
      $(".math-editor").css("bottom", newB + "px");
      $(".math-editor").css("left", newL  +  "px");
      placeCaretAtEnd($(".math-source").get(0));
    } 
    else {
      console.log("In the else case");
      placeCaretAtEnd($(".math-source").get(0));
    }
    // Adds event listeners to update the math as the user types
    updateMath(mathJaxElId, mathEditorContainer, charChangeFunction);     
    /*if ( $("#cheat-sheet").css("display") != 'none' ) $("#cheat-sheet-activator").attr("checked",true);
    $("#cheat-sheet-wrap").slideUp("fast", function(e){
      $(this).show();
    });*/
    e.stopPropagation();
  }
  /// Clears the editor help text when a user clicks on the math editor editable
  $(".math-source").live("click", function(e){
    $(this).find(".math-source-hint-text").replaceWith("&nbsp\;");
  });
  // Clears the editor help text when a user types in the math editor
  $(".math-source").live("DOMCharacterDataModified", function(e){
    $(this).find(".math-source-hint-text").replaceWith("&nbsp\;");
  });
// Appends and positions the arrow of the math-editor pop-up that points to the current equation
function adjustEditor(newL) {
    // Inserts the 'arrow' which points to the currently edited eqation into the dom
      $(".math-editor").append('<div id="math-editor-arrow"> </div>');
      // Defines how offset the math-editor arrow should be from the edit box
      var arrowOffset = 0;
      // Retrieves the math editor's relative position
      var arrow = $("#math-editor-arrow");
      var oldArrowPos = arrow.position().left;
      // Retrieves the aloha-editor's absolute position and the editor position 
      var content = $("#content");
      var editor = $(".math-editor");
      // Calculates the delta between their position to see if the editor is out of bounds
      var leftPositionDelta = editor.offset().left - content.offset().left;
      var rightPositionDelta = (content.offset().left + content.width()) - (editor.offset().left  + editor.width());
      // Adjusts the math edit box if it's outside the content area 
      if (leftPositionDelta < 0)  {
        console.log("Adjusting for left side");
        arrowOffset = leftPositionDelta;
        newL = newL - leftPositionDelta;
        //Positions the math-editor's arrow in relation to the math-editor box
        $("#math-editor-arrow").css("left", oldArrowPos + arrowOffset + "px");

      }
      else if (rightPositionDelta < 0) {
        console.log("Adjusting for right side");
        arrowOffset = rightPositionDelta;
        newL = newL + rightPositionDelta;
        //Positions the math-editor's arrow in relation to the math-editor box
        $("#math-editor-arrow").css("left", oldArrowPos - arrowOffset + "px");
      }
      // Returns the new position of the editor
      return newL;
}
function changeMathLang(equation, elementId, openDelimiter, closeDelimiter, mathType) {
    console.log("Changing the math equation");
    // Deletes the previous equation
    $("#" + elementId).children().remove();
    // Sets the delimeters in the element
    $("#" + elementId).append(openDelimiter + closeDelimiter);
    // Insert the equation back into the doc with the correct delimiters - using generatemathcontianer
    console.log("The parameters are: " + equation + " " + elementId);
    // Update the dictionary's stored preferences for the element ID
    aolDictionary[elementId] = mathType;
    if (mathType == "radio_latex") {
        MathJax.Hub.queue.Push(["Typeset", MathJax.Hub, elementId, function() { 
            console.log("In callback");
               MathJax.Hub.queue.Push(["Text", MathJax.Hub.getAllJax(elementId)[0],"\\displaystyle{"+equation+"}"]);
               
        }]);
        aol = "radio_latex";

    } 
    else if (mathType == "radio_ascii") {
        MathJax.Hub.queue.Push(["Typeset", MathJax.Hub, elementId, function() { 
               console.log("In callback");
               MathJax.Hub.queue.Push(["Text", MathJax.Hub.getAllJax(elementId)[0],equation]);
        }]);
        aol = "radio_ascii";
    }
    else {
        console.log("Unsupported math language inserted");
    }

    // generateMathContainer(openDelimiter, closeDelimiter, charChangeFunction, mathText, overrideId, editableObj);   


}
function getSelectionText() { // from Tim Down at http://stackoverflow.com/questions/5379120/jquery-get-the-highlighted-text
    var text = "";
    if (window.getSelection) {
        text = window.getSelection().toString();
    } else if (document.selection && document.selection.type != "Control") {
        text = document.selection.createRange().text;
    }
    return text;
  }

  function placeCaretAtEnd(el) { // From Tim Down at http://stackoverflow.com/questions/4233265/contenteditable-set-caret-at-the-end-of-the-text-cross-browser
    el.focus();
    if (typeof window.getSelection != "undefined"
            && typeof document.createRange != "undefined") {
        var range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        console.log("In the if case");
    } else if (typeof document.body.createTextRange != "undefined") {
        var textRange = document.body.createTextRange();
        textRange.moveToElementText(el);
        textRange.collapse(false);
        textRange.select();
        console.log("in the else if case");
    }
  }

  function placeCaretAtBeginning(el) { // From Tim Down at http://stackoverflow.com/questions/4233265/contenteditable-set-caret-at-the-end-of-the-text-cross-browser
    el.focus();
    if (typeof window.getSelection != "undefined"
            && typeof document.createRange != "undefined") {
        var range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(true);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        console.log("In the if case");
    } else if (typeof document.body.createTextRange != "undefined") {
        var textRange = document.body.createTextRange();
        textRange.moveToElementText(el);
        textRange.collapse(true);
        textRange.select();
        console.log("in the else if case");
    }
  }

function getFullStr(allChildren) {
    var str = '';
    for(var i = 0; i < allChildren.length; i++) {
        var ele = allChildren[i];
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
function mathLeave(mathEditorContainer,e) {
    if(!mathEditorContainer.find(".math-editor").length) {
      mathEditorContainer.removeClass("selected");
    }
    mathEditorContainer.removeClass("hovered");
    mathEditorContainer.removeAttr("title");
    mathEditorContainer.find('#math-icon-edit').remove();
    mathEditorContainer.find('#math-icon-clear').remove();
  /*  if ( !mathEditorContainer.parents().closest(".active").length) {
      mathEditorContainer.parent().closest('.canvas-wrap').each(function(){
        $(this).children().children().children('.canvas-buddy, .canvas-buddy-2').show();
        $(this).children().children().children().children().children('.canvas-buddy, .canvas-buddy-2').show();
        $(this).children('.canvas').addClass("canvas-hovered");
      });
    }*/
  }

   function mathEnter(mathEditorContainer,e) {
    
    /* Wraps the text */
    /*$('.canvas-wrap').each(function(){
      $(this).children().children().children('.canvas-buddy, .canvas-buddy-2').hide();
      $(this).children().children().children().children().children('.canvas-buddy, .canvas-buddy-2').hide();
      $(this).children('.canvas').removeClass("canvas-hovered");
    });*/
    // console.log("Entering math");
    mathEditorContainer.addClass("hovered");
    // If the length is zero then add the original text back
    if(!mathEditorContainer.find(".math-editor").length) {
      mathEditorContainer.attr("title","Click anywhere on the math to edit it");
      mathEditorContainer.append('<span class="math-icon" id="math-icon-edit"><span class="math-icon-message">Click anywhere on the math to edit it</span></span>');
      mathEditorContainer.append('<span class="math-icon" id="math-icon-clear"><span class="math-icon-message"><span class="math-icon-message-close">X</span> Remove math formatting (revert to plain text)</span></span>');
    }
    e.stopPropagation();
  }
  // Removes the math editor when the html document is clicked. I don't know where the '.math-done' class is used b/c  I don't see it used in the page
   $("html, .math-editor-close, .math-done").live("click", function(e){
      console.log("Removing the math editor");
      mathEditorRemove("");
    });
    /* Establishes a listener for mouse movements to on the math mathjax box */
    $(".MathBox").live("mouseenter", function(e){
      mathEnter($(this),e);
    });
    $(".MathBox").live("mouseleave", function(e){
      mathLeave($(this),e);
    });


  $(".math-editor").live("click", function(e){
        console.log("Stopping propagation");
        meClick($(this),e);
  });

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

  /* Builds the math editor html */

  function buildMathEditor(mathEditorContainer,e) {
    var ed = '<div class="math-editor" contenteditable="false" id="meditor">\
        <span class="math-editor-close">\
          <img src="http://mountainbunker.org/~maxwell/oerpub/editor-ideas/content_files/remove-element-01.png">\
        </span>\
        <div class="math-source-wrap">\
          <span class="math-source" contenteditable="true"></span>\
          <div id="math-error" contentEditable="false">\
            <strong>LaTeX error:</strong> <br/>sqrt requires initial backslash: \\sqrt\
          </div>\
        </div>\
        <div class="math-options-activate">\
          This is:\
          <input type="radio" name="math-type" id="radio_ascii" value="ascii" checked="checked"> <label for="radio_ascii">ASCIIMath</label>\
          <input type="radio" name="math-type" id="radio_latex" value="latex" checked=""> <label for="radio_latex">LaTeX</label>\
          <span id="math-type-help" class="math-help" style="display: none\;">(<a href="#asdfasdf">what\'s this?</a>)</span>\
        </div>\
        <div id="cheat-sheet-activate" style="text-align: right\; display: block\;">\
          <input type="checkbox" name="cheat-sheet-activator" id="cheat-sheet-activator">\
          <label for="cheat-sheet-activator" style="font-weight: normal\; padding-right: .4em\;">Show cheat sheet</label>\
          <span id="math-editor-help" class="math-editor-help" style="border-left: 1px solid #7D8B94\; padding-left: .6em\;">\
            <a href="#asdfasdfasdf">See help</a>\
          </span>\
        </div>\
        <div id="math-advanced" style="clear: both\;">\
        </div>\
        <div class="math-help-text-wrap">\
          <div class="math-help-text" id="math-type">\
            <span class="math-help-text-close">x</span>\
            ASCIIMath and LaTeX transform plain text into mathematics format.\
            <ul>\
              <li>\
                <strong>ASCIIMath</strong> is a simple input notation similar to that of a graphing calculator.\
                For example, <span style="font-family: courier new">x^(ab)</span> would render as \
                <span class="math-style">x<sup style="line-height: .5em; vertical-align: .3em;">ab</sup></span>.\
                <a href="http\:\/\/www1.chapman.edu\/\~jipsen\/asciimath.html" target="_blank" class="external">Learn more.</a>\
              </li>\
              <li>\
                <strong>LaTeX</strong>, while similar to ASCIIMath, includes some more complex notation for advanced math.\
                <a href="http\:\/\/en.wikibooks.org/wiki/LaTeX/Mathematics" target="_blank" class="external">Learn more.</a>\
              </li>\
            </ul>\
            Click the "<strong>Show cheat sheet</strong>" box to see examples of each.\
          </div>\
          <div class="math-help-text" id="math-editor-help-text">\
            <span class="math-help-text-close">x</span>\
            To add math to your document, type math in the text field using either \
            <a href="#asd" id="math-type-help-2">ASCIIMath or LaTeX notation</a>.\
            The display math will be rendered below in real time.  When you\'re done, just click anywhere outside the blue box.\
            <ul>\
              <li>\
                <strong>Show cheat sheet</strong>.  Use this to see common examples of notation and their respective display.\
              </li>\
              <li>\
                <strong>Show advanced options</strong>.  Use this to switch between your choice of ASCIIMath or LaTeX.\
              </li>\
            </ul>\
          </div>\
        </div>\
      </div>';
    return ed;
  }


  

    
            scopes.createScope('math', 'Aloha.empty');
            /* Configure the 'insert latex' math */
            self._mathCtrl = ui.adopt( 'characterPicker'/*"math"*/, button, 
            {
                tooltip: 'Math', /*i18n.t('button.addmath.tooltip'),*/
                icon: "mathEditorContainer",
                click: function() {
                    console.log("Math button being clicked");
                    // Generates a new math editor
                    mathClickNew('${','}$', onTexCharChange);
                    aol = radio_latex;
                }
            });
                      
           
            Aloha.bind('aloha-editable-created', function (event, editable) 
            {
                editableObj = editable.obj;
                
                editable.obj.bind('keydown', self.hotKey.insertTexMath, function() 
                {
                    aol = 'radio_latex';
                    mathClickNew('${','}$', onTexCharChange); // Generates a new math container and binds the 'latex' callback function
                });

                editable.obj.bind('keydown', self.hotKey.insertAsciiMath, function() 
                {
                    aol = 'radio_ascii';
                    mathClickNew('`','`', onAsciiCharChange); // Generates a new math container and binds the 'asciimath' callback functoin
                    console.log("Setting the radio default");
                });
                editable.obj.bind('keydown', self.hotKey.insertMLMath, function() 
                {
                    aol = 'radio_mathml';
                    mathClickNew('<math>','</math>', onAsciiCharChange); // Generates a new math container and binds the 'asciimathml' callback functoin
                });
            });

        }
    });
});

function editor_focus() {
    document.getElementById('content').focus();
}
window.onload = editor_focus;

