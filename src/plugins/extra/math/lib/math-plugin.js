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

            var Inserted = [];
            var savedOffset = -1;

            function convertToConcrete(character, ele, leVal, currentOffset) {
                for(var i = 0; i < Inserted.length; i++) {
                    if(Inserted[i].loc == currentOffset+1 && Inserted[i].character == character) {
                        Inserted.splice(i, 1);
                        if(ele.val() == leVal) {
                            ele.val(leVal.slice(0,currentOffset+1)+leVal.slice(currentOffset+2));
                            leVal = ele.val();
                        } else {
                            ele.text(leVal.slice(0,currentOffset+1)+leVal.slice(currentOffset+2));
                            leVal = ele.text();
                        }
                        window.getSelection().getRangeAt(0).setStart(window.getSelection().focusNode.childNodes[0], currentOffset+1);
                        break;
                    }
                }
                return leVal;
            }

            function generateInserted(ele, leVal, offset, character) {
                if(ele.val() == leVal) {
                    ele.val(leVal.slice(0,offset+1)+character+leVal.slice(offset+1));
                    leVal = ele.val();
                } else {
                    ele.text(leVal.slice(0,offset+1)+character+leVal.slice(offset+1));
                    leVal = ele.text();
                }
                window.getSelection().getRangeAt(0).setStart(window.getSelection().focusNode.childNodes[0], offset+1);
                Inserted.push({ loc: offset+1, character: character });
                return leVal;
            }
           
            function onTexCharChange(evt, arg) {
                if(inChange) return;
                inChange = true;

                var range = window.getSelection().getRangeAt(0);
                var offset = range.startOffset;
                var eqId = evt.currentTarget.id.substring(5);
                var ele = $('#'+evt.currentTarget.id);
                var leVal = ele.val() || ele.text();
                var ch = leVal[offset];

                for(var i = 0; i < Inserted.length; i++) {
                    if(Inserted[i].loc >= offset) {
                        Inserted[i].loc = Inserted[i].loc + 1;
                    }
                }

                console.log(evt);

                switch(ch) {
                    case(')'):
                    case('}'):
                        leVal = convertToConcrete(ch, ele, leVal, offset);
                        break;
                    case('{'):
                        leVal = generateInserted(ele, leVal, offset, '}');
                        break;
                    case('('):
                        leVal = generateInserted(ele, leVal, offset, ')');
                        break;
                }
                console.log(Inserted);
                MathJax.Hub.queue.Push(["Text", MathJax.Hub.getAllJax(eqId)[0],"\\displaystyle{"+leVal+"}"]);
                inChange = false;
                savedOffset = offset;
            }

            function onAsciiCharChange(evt) {
                var eqId = evt.currentTarget.id.substring(5);
                var ele = $('#'+evt.currentTarget.id);
                var leVal = ele.val() || ele.text();
                MathJax.Hub.queue.Push(["Text", MathJax.Hub.getAllJax(eqId)[0],leVal]);
            }

            function generateMathContainer(openDelimiter, closeDelimiter, charChangeFunction, initValue, editableObj) {
                var newElId = wrapPrefix+cntEq;
                var range = Aloha.Selection.getRangeObject();
                var newMathEditContainer = $('<div id="edit-'+newElId+'" style="padding:2px;min-height:28px;border:1px solid green;-moz-border-radius: 4px;-webkit-border-radius: 4px;-khtml-border-radius: 4px;border-radius: 4px;background-color:white;">'+initValue+'</div>');
                var newMathContainer = $('<div id="'+newElId+'" style="left;border:1px dotted grey">'+openDelimiter+closeDelimiter+'</div>');
                
                GENTICS.Utils.Dom.insertIntoDOM( newMathEditContainer, range, $( Aloha.activeEditable.obj ) );
                GENTICS.Utils.Dom.insertIntoDOM( newMathContainer, range, $( Aloha.activeEditable.obj ) );
                GENTICS.Utils.Dom.setCursorInto( newMathEditContainer[0] );
                newMathEditContainer.bind('DOMCharacterDataModified', charChangeFunction);
                newMathEditContainer.bind('DOMNodeInserted', charChangeFunction);
                newMathEditContainer.hide();
               
                if(initValue == '') {
                    MathJax.Hub.queue.Push(["Typeset", MathJax.Hub, newElId, function() { newMathEditContainer.show() }]);
                } else {

                    if(openDelimiter == '${') {

                        MathJax.Hub.queue.Push(["Typeset", MathJax.Hub, newElId, function() { 
                               newMathEditContainer.show(); 
                               MathJax.Hub.queue.Push(["Text", MathJax.Hub.getAllJax(newElId)[0],"\\displaystyle{"+initValue+"}"]);
                        }]);
                    } else {

                        MathJax.Hub.queue.Push(["Typeset", MathJax.Hub, newElId, function() { 
                               newMathEditContainer.show(); 
                               MathJax.Hub.queue.Push(["Text", MathJax.Hub.getAllJax(newElId)[0],initValue]);
                        }]);
                    }
                }
                                    
                var blurout = function()
                {
                    Inserted = [];
                    newMathEditContainer.hide();
                };

                $(editableObj).on('blur focusout', blurout);
                newMathEditContainer.on('focusout blur', blurout);
                
                
                newMathContainer.on('click', function()
                {
                    GENTICS.Utils.Dom.setCursorInto( newMathEditContainer[0] );
                    newMathEditContainer.show();
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
