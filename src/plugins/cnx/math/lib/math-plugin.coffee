define [ 'aloha', 'aloha/plugin', 'jquery', 'popover', 'ui/ui', 'css!../../../cnx/math/css/math.css' ], (Aloha, Plugin, jQuery, Popover, UI) ->

  EDITOR_HTML = '''
    <div class="math-editor-dialog">
        <div class="math-container">
            <pre><span></span><br></pre>
            <textarea type="text" class="formula" rows="1"></textarea>
        </div>
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
        <div class="footer">
            <button class="btn btn-primary done">Done</button>
            <button class="btn btn-danger remove"><i class="icon-remove icon-white"></i> Delete</button>
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

  # Register the button with an action
  UI.adopt 'insertMath', null,
    click: () ->
        # Either insert a new span around the cursor and open the box or just
        # open the box
        $el = jQuery('<span class="math-element">`x^2`</span>')
        GENTICS.Utils.Dom.insertIntoDOM $el,
          Aloha.Selection.getRangeObject(),
          Aloha.activeEditable.obj
        triggerMathJax $el, ->
          # Callback opens up the math editor by "clicking" on it
          $el.trigger 'show'

  triggerMathJax = ($el, cb) ->
    MathJax.Hub.Typeset $el[0], cb

  # $span contains the span with LaTex/ASCIIMath
  buildEditor = ($span) ->
    $editor = jQuery(EDITOR_HTML);


    # Bind some actions for the buttons
    $editor.find('.done').on 'click', =>
      $span.trigger 'hide'
      # If math is empty, remove the box
      if jQuery.trim($editor.find('.formula').val()).length == 0
        $span.remove()
    $editor.find('.remove').on 'click', =>
      $span.trigger 'hide'
      $span.remove()


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
      if LANGUAGES[mimeType].raw
        $span[0].innerHTML = formula
      else
        formulaWrapped = LANGUAGES[mimeType].open + formula + LANGUAGES[mimeType].close
        $span.text(formulaWrapped)
      triggerMathJax $span, ->
        # Save the Edited text into the math annotation element
        $math = $span.find('math')
        if $math[0] # Webkit browsers don't natively support MathML
          $annotation = $math.find('annotation')
          if not $annotation[0]?
            $annotation = jQuery('<annotation></annotation>').prependTo($math)
          $annotation.attr('encoding', mimeType)
          $annotation.text(formula)

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

    $editor

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

  SELECTOR = '.math-element' # ,.MathJax[role="textbox"][aria-readonly="true"],.MathJax_Display[role="textbox"][aria-readonly="true"]'
  Popover.register
    selector: SELECTOR
    populator: buildEditor
    placement: 'top'
    markerclass: 'math-popover'
    focus: ($popover) ->
      # Give focus to the text box
      setTimeout( () ->
        $popover.find('.formula').trigger('focus')
      , 10)
