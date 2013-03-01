# To be able to edit math, render in MathJax, and serialize out MathML
# we need to wrap the math element in various elements.
#
# Note: Webkit in linux has a bug where `math` elements are always visible so we wrap it in a hidden `span`
# See http://code.google.com/p/chromium/issues/detail?id=175212

# Example intermediate states:
#
# ### Original DOM
#
#    <math/>

# ### Before MathJax loads (STEP1)
#
#    <span class="math-element aloha-ephemera-wrapper">
#      <span class="mathjax-wrapper aloha-ephemera"> # Note: This element will be removed completely when serialized
#        <math/>
#      </span>
#    </span>

# ### After MathJax loads (STEP2)
#
#    <span class="math-element ...">
#      <span class="mathjax-wrapper ...">
#        <span class="MathJax_Display">...</span>
#        <script type="text/mml">...</script>
#      </span>
#    </span>

# ### After Editor loads (STEP3)
#
#    <span class="math-element ...">
#      <span class="mathjax-wrapper ...">...</span>
#      <span class="mathml-wrapper aloha-ephemera-wrapper">    # This element is to fix the Webkit display bug
#        <math/>
#      </span>
#    </span>


define [ 'aloha', 'aloha/plugin', 'jquery', 'popover', 'ui/ui', 'css!../../../oer/math/css/math.css' ], (Aloha, Plugin, jQuery, Popover, UI) ->

  EDITOR_HTML = '''
    <div class="math-editor-dialog">
        <div class="math-container">
            <pre><span></span><br></pre>
            <textarea type="text" class="formula" rows="1"
                      placeholder="Insert your math notation here"></textarea>
        </div>
        <div class="footer">
          <span>This is:</span>
          <label class="radio inline">
              <input type="radio" name="mime-type" value="math/asciimath"> ASCIIMath
          </label>
          <label class="radio inline">
              <input type="radio" name="mime-type" value="math/tex"> LaTeX
          </label>
          <label class="radio inline mime-type-mathml">
              <input type="radio" name="mime-type" value="math/mml"> MathML
          </label>
          <button class="btn btn-primary done">Done</button>
        </div>
    </div>
  '''

  LANGUAGES =
    'math/asciimath': {open: '`', close: '`'}
    'math/tex': {open: '[TEX_START]', close: '[TEX_END]'}
    'math/mml': {raw: true}

  MATHML_ANNOTATION_ENCODINGS =
    'TeX':       'math/tex'
    'ASCIIMath': 'math/asciimath'

  TOOLTIP_TEMPLATE = '<div class="aloha-ephemera tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'

  # Wait until Aloha is started before loading MathJax
  # Also, wrap all math in a span/div. MathJax replaces the MathJax element
  # losing all jQuery data attached to it (like popover data, the original Math Formula, etc)
  # add `aloha-ephemera-wrapper` so this span is unwrapped
  Aloha.ready ->
    MathJax.Hub.Configured() if MathJax?

  getMathFor = (id) ->
    jax = MathJax?.Hub.getJaxFor id
    if jax
      mathStr = jax.root.toMathML()
      jQuery(mathStr)

  squirrelMath = ($el) ->
    # `$el` is the `.math-element`

    $mml = getMathFor $el.find('script').attr('id')

    # STEP3
    $el.find('.mathml-wrapper').remove()
    $mml.wrap '<span class="mathml-wrapper aloha-ephemera-wrapper"></span>'
    $el.append $mml.parent()

  Aloha.bind 'aloha-editable-activated', (evt, ed) ->
    # STEP1
    $maths = ed.editable.obj.find('math')
    $maths.wrap '<span class="math-element aloha-ephemera-wrapper"><span class="mathjax-wrapper aloha-ephemera"></span></span>'

    # TODO: Explicitly call Mathjax Typeset
    jQuery.each $maths, (i, mml) ->
      $mml = jQuery(mml)
      $mathElement = $mml.parent().parent()
      # replace the MathML with ASCII/LaTeX formula if possible
      mathParts = findFormula $mml
      if mathParts.mimeType is "math/asciimath"
        $mathElement.find('.mathjax-wrapper').text(LANGUAGES['math/asciimath'].open +
                                                   mathParts.formula +
                                                   LANGUAGES['math/asciimath'].close)
      else if mathParts.mimeType is "math/tex"
        $mathElement.find('.mathjax-wrapper').text(LANGUAGES['math/tex'].open +
                                                   mathParts.formula +
                                                   LANGUAGES['math/tex'].close)
      triggerMathJax $mathElement, ->
        if mathParts.mimeType is "math/asciimath" or mathParts.mimeType is "math/tex"
          addAnnotation $mathElement, mathParts.formula, mathParts.mimeType
        makeCloseIcon $mathElement
        if not $mathElement.next().is '.aloha-ephemera-wrapper'
          # a math meta-element needs to followed by a non-breaking space in a span
          $('<span class="aloha-ephemera-wrapper">&#160;</span>').insertAfter($mathElement)

    ###
    MathJax.Hub.Queue ->
      jQuery.each MathJax.Hub.getAllJax(), (i, jax) ->
        $el = jQuery "##{ jax.inputID }"
        # `$el` is the `span` added by MathJax. We are interested in its parent, the `math-element`
        squirrelMath $el.parent()
    ###

  insertMath = () ->
    $el = jQuery('<span class="math-element aloha-ephemera-wrapper"><span class="mathjax-wrapper aloha-ephemera">&#160;</span></span>') # nbsp
    range = Aloha.Selection.getRangeObject()
    if range.isCollapsed()
      GENTICS.Utils.Dom.insertIntoDOM $el, range, Aloha.activeEditable.obj
      # Callback opens up the math editor by "clicking" on it
      $el.trigger 'show'
      makeCloseIcon($el)
    else
      # a math meta-element needs to followed by a non-breaking space in a span
      $tail = $('<span class="aloha-ephemera-wrapper">&#160;</span>')
      # Assume the user highlighted ASCIIMath (by putting the text in backticks)
      formula = range.getText()
      $el.find('.mathjax-wrapper').text(LANGUAGES['math/asciimath'].open +
                                        formula +
                                        LANGUAGES['math/asciimath'].close)
      GENTICS.Utils.Dom.removeRange range
      GENTICS.Utils.Dom.insertIntoDOM $el.add($tail), range, Aloha.activeEditable.obj
      triggerMathJax $el, ->
        addAnnotation $el, formula, 'math/asciimath'
        makeCloseIcon($el)

        # This will likely break in IE
        sel = window.getSelection()
        r = sel.getRangeAt(0)
        r.selectNodeContents($tail.parent().get(0))
        r.setEndAfter($tail.get(0))
        r.setStartAfter($tail.get(0))
        sel.removeAllRanges()
        sel.addRange(r)

        # Let aloha know what we've done
        r = new GENTICS.Utils.RangeObject()
        r.update()
        Aloha.Selection.rangeObject = r
        Aloha.activeEditable.smartContentChange {type: 'block-change'}

  # Register the button with an action
  UI.adopt 'insertMath', null,
    click: () -> insertMath()

  # STEP2
  triggerMathJax = ($mathElement, cb) ->
    if MathJax?
      # keep the `.math-element` parent
      # Be sure to squirrel away the MathML because the DOM only contains the HTML+CSS output
      callback = () ->
        squirrelMath $mathElement
        cb?()
      MathJax.Hub.Queue ["Typeset", MathJax.Hub, $mathElement.find('.mathjax-wrapper')[0], callback]
    else
      console.log 'MathJax was not loaded properly'

  cleanupFormula = ($editor, $span, destroy=false) ->
    # If math is empty, remove the box
    if destroy or jQuery.trim($editor.find('.formula').val()).length == 0
      $span.find('.math-element-destroy').tooltip('destroy')
      $span.remove()

  # $span contains the span with LaTeX/ASCIIMath
  buildEditor = ($span) ->
    $editor = jQuery(EDITOR_HTML)
    # Bind some actions for the buttons
    $editor.find('.done').on 'click', =>
      if not $span.next().is '.aloha-ephemera-wrapper'
        # a math meta-element needs to followed by a non-breaking space in a span
        $('<span class="aloha-ephemera-wrapper">&#160;</span>').insertAfter($span)
      $span.trigger 'hide'
    $editor.find('.remove').on 'click', =>
      $span.trigger 'hide'
      cleanupFormula($editor, $span, true)

    $formula = $editor.find('.formula')

    # Set the formula in jQuery data if it hasn't been set before
    #$span.data('math-formula', $span.data('math-formula') or $span.attr('data-math-formula') or $span.text())

    mimeType = $span.find('script[type]').attr('type') or 'math/asciimath'
    # tex could be "math/tex; mode=display" so split in the semicolon
    mimeType = mimeType.split(';')[0]


    formula = $span.find('script[type]').html()

    # If the input is MathML try and pull out the formula from the mml:annotation element
    if mimeType == 'math/mml'
      $tmp = jQuery('<div></div>').html($span.find('script[type]').text())
      $annotation = $tmp.find('annotation')
      lang = $annotation.attr('encoding')
      if MATHML_ANNOTATION_ENCODINGS[lang]
        mimeType = MATHML_ANNOTATION_ENCODINGS[lang]
        formula = $annotation.text()

    # Set the language and fill in the formula
    $editor.find("input[name=mime-type][value='#{mimeType}']").attr('checked', true)
    $formula.val(formula)

    # Set the hidden pre that causes auto-sizing to the same value
    $editor.find('.math-container pre span').text(formula)

    # If the language isn't MathML then hide the MathML radio
    $editor.find("label.mime-type-mathml").remove() if mimeType != 'math/mml'

    keyTimeout = null
    keyDelay = () ->
      # Try and parse it as ASCIIMath
      formula = jQuery(@).val() # $span.data('math-formula')
      mimeType = $editor.find('input[name=mime-type]:checked').val()

      $mathPoint = $span.children('.mathjax-wrapper')
      if not $mathPoint[0]
        $mathPoint = jQuery('<span class="mathjax-wrapper aloha-ephemera"></span>')
        $span.prepend $mathPoint

      if LANGUAGES[mimeType].raw
        $mathPoint.innerHTML = formula
      else
        formulaWrapped = LANGUAGES[mimeType].open + formula + LANGUAGES[mimeType].close
        $mathPoint.text(formulaWrapped)
      triggerMathJax $span, ->
        # Save the Edited text into the math annotation element
        $mathml = $span.find('math')
        if $mathml[0]
          addAnnotation $span, formula, mimeType
          makeCloseIcon($span)
        Aloha.activeEditable.smartContentChange {type: 'block-change'}

      # TODO: Async save the input when MathJax correctly parses and typesets the text
      $span.data('math-formula', formula)
      $formula.trigger('focus')

    $formula.on 'input', () ->
        clearTimeout(keyTimeout)
        setTimeout(keyDelay.bind(@), 500)
        $editor.find('.math-container pre span').text(
            $editor.find('.formula').val())

    # Grr, Bootstrap doesn't set the cheked value properly on radios
    radios = $editor.find('input[name=mime-type]')
    radios.on 'click', () ->
        radios.attr('checked', false)
        jQuery(@).attr('checked', true)
        clearTimeout(keyTimeout)
        setTimeout(keyDelay.bind($formula), 500)

    $span.off('shown-popover').on 'shown-popover', () ->
      $span.css 'background-color', '#E5EEF5'
      $el = jQuery(@)
      tt = $el.data('tooltip')
      tt.hide().disable() if tt
      setTimeout( () ->
        $popover = $el.data('popover')
        $popover.$tip.find('.formula').trigger('focus') if $popover
      , 10)

    $span.off('hidden-popover').on 'hidden-popover', () ->
      $span.css 'background-color', ''
      tt = jQuery(@).data('tooltip')
      tt.enable() if tt
      cleanupFormula($editor, jQuery(@))

    $editor

  makeCloseIcon = ($el) ->
    # $el is <span class="math-element">
    $closer = $el.find '.math-element-destroy'
    if not $closer[0]?
      $closer = jQuery('<a class="math-element-destroy aloha-ephemera" title="Delete\u00A0math">&nbsp;</a>')
      if jQuery.ui and jQuery.ui.tooltip
        $closer.tooltip()
      else
        $closer.tooltip(placement: 'bottom', template: TOOLTIP_TEMPLATE)
      $el.append($closer)

  addAnnotation = ($span, formula, mimeType) ->
      # $span is <span class="math-element">
    $mml = $span.find('math')
    if $mml[0]
      $annotation = $mml.find('annotation')
      # ## Finicky MathML structure
      #
      # The generated MathML needs:
      #
      # - A single `<semantics/>` element
      # - The semantics element **must** have _exactly_ 2 children
      # - The second child **must** be the `<annotation/>`

      # If the `<annotation/>` element is not the 2nd child or not in a `<semantics/>`
      # then MathJax will treat it as a '<mtext/>' and not hide it.
      if not $annotation[0]?
        if $mml.children().length > 1 # Wrap math equation in mrow if equation is more than one single child
          $mml.wrapInner('<mrow></mrow>')
        $semantics = $mml.find('semantics')
        if not $semantics[0]
          $mml.wrapInner('<semantics></semantics>')
          $semantics = $mml.find('semantics')
        $annotation = jQuery('<annotation></annotation>').appendTo($semantics)
      $annotation.attr('encoding', mimeType)
      $annotation.text(formula)

  # Looking to precisely match the math we create in the editor
  #    <math>
  #      <semantics>
  #        single math element
  #        <annotation />
  #      </semantics>
  #    </math>
  findFormula = ($mml) ->
    formula = null
    mimeType = "math/mml"
    if $mml.children().length is 1
      $firstChild = jQuery($mml.children()[0])
      if $firstChild.is 'semantics'
        $semantics = $firstChild
        if $semantics.children().length is 2
          $secondChild = jQuery($semantics.children()[1])
          if $secondChild.is 'annotation[encoding]'
            $annotation = $secondChild
            encoding = $annotation.attr 'encoding'
            formula = $annotation.text()
            if encoding of LANGUAGES
              return { 'mimeType': encoding, 'formula': formula }
    return { 'mimeType': mimeType, 'formula': formula }

  Aloha.bind 'aloha-editable-created', (e, editable) ->
    # Bind ctrl+m to math insert/mathify
    editable.obj.bind 'keydown', 'ctrl+m', (evt) ->
      insertMath()
      evt.preventDefault()

  Aloha.bind 'aloha-editable-activated', (event, data) ->
    editable = data.editable

    jQuery(editable.obj).on 'click.matheditor', '.math-element, .math-element *', (evt) ->
      $el = jQuery(@)

      $el = $el.parents('.math-element') if not $el.is('.math-element')

      # Make sure the math element is never editable
      $el.contentEditable(false)

      # Select (in the browser) the entire math
      #range = rangy.createRange()
      #range.selectNode($el[0])
      #sel = rangy.getSelection()
      #sel.setSingleRange(range)

      # Update what Aloha thinks is the selection
      # Can't just use Aloha.Selection.updateSelection because the thing that was clicked isn't editable
      # and setSelection will just silently return without triggering the selection update.
      range = new GENTICS.Utils.RangeObject()
      range.startContainer = range.endContainer = $el[0]
      range.startOffset = range.endOffset = 0
      Aloha.Selection.rangeObject = range

      #evt.target = evt.currentTarget = $el[0]
      Aloha.trigger('aloha-selection-changed', range)

      # Since the click is on the math-element or its children
      # (the math element is just a little horizontal bar but its children stick out above and below it)
      # Don't handle the same event for each child
      evt.stopPropagation()

    editable.obj.on('click.matheditor', '.math-element-destroy', (e) ->
      jQuery(e.target).tooltip('destroy')
      $el = jQuery(e.target).closest('.math-element')
      # Though the tooltip was bound to the editor and delegates
      # to these items, you still have to clean it up youself
      $el.trigger('hide').tooltip('destroy').remove()
      Aloha.activeEditable.smartContentChange {type: 'block-change'}
      e.preventDefault()
    )

    if jQuery.ui and jQuery.ui.tooltip
      # Use jq.ui tooltip
      editable.obj.tooltip(
        items: ".math-element",
        content: -> 'Click anywhere in math to edit it',
        template: TOOLTIP_TEMPLATE)
    else
      # This requires a custom version of jquery-ui, to avoid the conflict
      # between the two .toolbar plugins. This one assumes bootstrap
      # tooltip
      editable.obj.tooltip(
        selector: '.math-element'
        placement: 'top'
        title: 'Click anywhere in math to edit it'
        trigger: 'hover',
        template: TOOLTIP_TEMPLATE)

  SELECTOR = '.math-element' # ,.MathJax[role="textbox"][aria-readonly="true"],.MathJax_Display[role="textbox"][aria-readonly="true"]'
  Popover.register
    selector: SELECTOR
    populator: buildEditor
    placement: 'top'
    markerclass: 'math-popover'
