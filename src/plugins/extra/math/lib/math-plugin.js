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
        hotKey: { insertMath: 'ctrl+m' },
        init: function() 
        {
            var self = this,
                wrapPrefix = this.settings.wrapPrefix;
            
            // MathJax init
            var script0 = document.createElement("script");
            script0.type = "text/x-mathjax-config";
            $(script0).html( 'MathJax.Hub.Config({'
                    + 'jax: ["input/TeX","input/MathML","output/SVG"],'
                    + 'extensions: ["tex2jax.js","mml2jax.js","MathMenu.js","MathZoom.js"],'
                    + 'tex2jax: { inlineMath: [["$","$"],["\\(","\\)"]] },'
                    + 'TeX: {'
                        + 'extensions: ["AMSmath.js","AMSsymbols.js","noErrors.js","noUndefined.js"], noErrors: { disabled: true }'
                    + '}});');
            //$(script0).html('MathJax.Hub.Config({ tex2jax: { inlineMath: [["$","$"],["\\(","\\)"]] } });');
            
            var script = document.createElement("script");
            script.type = "text/javascript";
            //script.src  = "http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_SVG";
            script.src  = "http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=default";
            var config = 'MathJax.Hub.Startup.onload();';
            $(script).html(config);
            
            document.getElementsByTagName("head")[0].appendChild(script0);
            document.getElementsByTagName("head")[0].appendChild(script);
            

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
                Inserted.push({ start: offset, loc: offset+1, character: character });
                return leVal;
            }
           
            function onTexCharChange(evt) {
                if(inChange) return;
                inChange = true;

                console.log(evt);

                var range = window.getSelection().getRangeAt(0);
                var offset = range.startOffset;
                console.log(Inserted);
                var eqId = evt.currentTarget.id.substring(5);
                var ele = $('#'+evt.currentTarget.id);
                var leVal = ele.val() || ele.text();
                console.log(currentLength+ " "+leVal.length);
                var ch = leVal[offset];
                var diff = leVal.length - currentLength;

                var didRemove = false;
                for(var i = 0; i < Inserted.length; i++) {

                    // if this was a delete or backspace that removed a character
                    if(leVal.length < currentLength) {
                        // if this delete was on the opening character of a virtual closing character and there is no content in between
                        if(offset == Inserted[i].start && Inserted[i].loc == Inserted[i].start + 1) {
                            diff = diff - 1;

                           if(ele.val() == leVal) {
                                ele.val(leVal.slice(0,offset)+leVal.slice(offset+1));
                                leVal = ele.val();
                            } else {
                                ele.text(leVal.slice(0,offset)+leVal.slice(offset+1));
                                leVal = ele.text();
                            }
                            Inserted.splice(i, 1);
                            window.getSelection().getRangeAt(0).setStart(window.getSelection().focusNode.childNodes[0], offset);
                            // this can only occur once
                            didRemove = true;
                            break;
                        }
                    }
                }

                if(!didRemove) {
                    var i = 0;
                    while(i < Inserted.length) {
                        if(offset > Inserted[i].loc || offset <= Inserted[i].start) {
                            Inserted.splice(i, 1);
                        } else {
                            i = i + 1;
                        }
                    }
                }

                for(var i = 0; i < Inserted.length; i++) {

                    if(Inserted[i].start >= offset) {
                        Inserted[i].start = Inserted[i].start + diff;
                    }

                    if(Inserted[i].loc >= offset) {
                        Inserted[i].loc = Inserted[i].loc + diff;
                    }
                }

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
                MathJax.Hub.queue.Push(["Text", MathJax.Hub.getAllJax(eqId)[0],"\\displaystyle{"+leVal+"}"]);
                inChange = false;
                currentLength = leVal.length;
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
            
            // changing eq in input
            function changeMath(evt)
            {
                updateMath.call(this, null, $($(this).data('current-edit')).attr('id'));
                $(this).val('');
            }
            
            function updateMath(evt, eqId)
            {
                var leVal = $(this).val() || $(this).text();
                
                if( !eqId || !leVal ) return;
                
                console.log(arguments, eqId, $('#'+eqId), MathJax.Hub.getAllJax(eqId)[0]);
                
                
                MathJax.Hub.queue.Push(["Typeset", MathJax.Hub, eqId, function()
                { 
                    MathJax.Hub.queue.Push(["Text", MathJax.Hub.getAllJax(eqId)[0],"\\displaystyle{"+leVal+"}"]);
                }]);
                
                $('#'+eqId).data('equation', leVal).on('click.aloha-math', editMath );
                
            }
            
            function toggleMath()
            {
                if( Aloha.activeEditable ) 
                {
                    var range = Aloha.Selection.getRangeObject()
                    if ( !( range.startContainer && range.endContainer ) ) {
                        return;
                    }
                    
                    // this should work but it has some stupid preprocessing that sanitizes elements
                    // in some content handler manager which limits the things we can insert 
                    // Aloha.execCommand('insertHTML', false, $( self.settings.mathPlaceholder) );

                    // get text from selection
                    var leText = range.getText();
                    
                    if( $.trim(leText) === '' ) return;
                    
                    GENTICS.Utils.Dom.removeRange(range);
                    // make a new placeholder for the new equation
                    GENTICS.Utils.Dom.insertIntoDOM( $('<span id="'+wrapPrefix+cntEq+'">${}$</span>'), range, $( Aloha.activeEditable.obj ) );
                    leMathInput.val(leText).trigger('change', [wrapPrefix+cntEq]);
                    cntEq++;
                }
            }
            
            var leMathInput = $('<input style="display:none" />');
            leMathInput.on('change', updateMath );
            leMathInput.appendTo('body');
            
            scopes.createScope('math', 'Aloha.empty');
            
            self._mathCtrl = ui.adopt( 'characterPicker'/*"math"*/, button, 
            {
                tooltip: 'Math', /*i18n.t('button.addmath.tooltip'),*/
                icon: "M",
                click: toggleMath
            });
            
            self._mathEdit = new attributeField
            ({
                label: 'Math',/*i18n.t('field.mathedit.label'),*/
                tooltip: 'Math Edit', /*i18n.t('field.mathedit.tooltip'),*/
                name: 'matheditSource',
                scope: 'math'
            });
            
            // hack cause I have no idea how this works, and there is no docs for it
            self._mathEditInput = $(self._mathEdit.getInputElem());
            self._mathEditInput.css({width: 150}).insertAfter(self._mathCtrl.element[0]);
            self._mathEditInput.hide();
            self._mathEditInput.on('change', changeMath);
            
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
                                    .data('equation', this.originalText)
                                    .on('click.aloha-math', editMath );
                            
                            cntEq++;
                        }); 
                    }]);
                })();
                self._mathCtrl.show();
            });
            
           
            Aloha.bind('aloha-editable-created', function (event, editable) 
            {
                
                var activeMathEdit = false;
                editable.obj.bind('keydown', self.hotKey.insertMath, function() 
                {
                    if( activeMathEdit !== false ) 
                    {
                        $('#edit-'+newElId).hide();
                        clearInterval(activeMathEdit);
                        activeMathEdit = false;
                        return
                    }
                    
                    var newElId = wrapPrefix+cntEq,
                        range = Aloha.Selection.getRangeObject(),
                        newMathEditContainer = $('<div id="edit-'+newElId+'" style="padding:2px;min-height:28px;border:1px solid green;-moz-border-radius: 4px;-webkit-border-radius: 4px;-khtml-border-radius: 4px;border-radius: 4px;background-color:white;"></div>'),
                        newMathContainer = $('<div id="'+newElId+'" style="left;border:1px dotted grey">${}$</div>');
                    
                    GENTICS.Utils.Dom.insertIntoDOM( newMathEditContainer, range, $( Aloha.activeEditable.obj ) );
                    GENTICS.Utils.Dom.insertIntoDOM( newMathContainer, range, $( Aloha.activeEditable.obj ) );
                    GENTICS.Utils.Dom.setCursorInto( newMathEditContainer[0] );
                    
                    function startWatch()
                    {
                        activeMathEdit = setInterval(function()
                        {
                            updateMath.call(newMathEditContainer, null, newElId); 
                        }, 2000);
                    };
                    startWatch();
                    
                    
                    var blurout = function()
                    {
                        newMathEditContainer.hide();
                        clearInterval(activeMathEdit);
                        activeMathEdit = false;
                    };
                    $(editable.obj).on('blur focusout', blurout);
                    newMathEditContainer.on('focusout blur', blurout);
                    
                    
                    newMathContainer.on('click', function()
                    {
                        GENTICS.Utils.Dom.setCursorInto( newMathEditContainer[0] );
                        newMathEditContainer.show();
                        startWatch();
                    });
                    
                    cntEq++;
                    
                });
            });
            
        }
    });
});
