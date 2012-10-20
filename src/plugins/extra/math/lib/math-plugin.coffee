define [ 'aloha', 'aloha/plugin', 'jquery', '../../../extra/bubble/lib/bubble-plugin', 'ui/ui', 'css!../../../extra/math/css/math.css' ], (Aloha, Plugin, jQuery, Bubble, UI) ->

  EDITOR_HTML = '''
    <div class="math-editor">
        <div>
            <input type="text" class="formula"/>
        </div>
        <span>This is:</span>
        <label class="radio inline">
            <input type="radio" name="mime-type" value="math/asciimath"> ASCIIMath
        </label>
        <label class="radio inline">
            <input type="radio" name="mime-type" value="math/tex"> LaTeX
        </label>
        <label class="checkbox inline">
          <input type="checkbox" class="show-cheatsheet"/>
          Show Cheat Sheet
        </label>
        <span class="separator"> | </span>
        <a class="btn btn-link see-help">See Help</a>
    </div>
  '''

  LANGUAGES =
    'math/asciimath': {open: '`', close: '`'}
    'math/tex': {open: '\\(', close: '\\)'}

  # Register the button with an action
  #UI.adopt 'openMathEditor', null,
  #  click: () ->
  #      console.log 'math clicked!'
  #      # Either insert a new span around the cursor and open the box or just open the box
  #      if Aloha.activeEditable
  #          openMathDialog($el)

  triggerMathJax = ($el) ->
    if not $el.attr('id')
      id = 0
      id++ while jQuery('#autogen-math-' + id)[0]
      $el.attr('id', 'autogen-math-' + id)
    
    id = $el.attr('id')
    MathJax.Hub.queue.Push ['Typeset', MathJax.Hub, id]

  # $span contains the span with LaTex/ASCIIMath
  buildEditor = ($span) ->
    $editor = jQuery(EDITOR_HTML);

    # Set the formula in jQuery data if it hasn't been set before
    #$span.data('math-formula', $span.data('math-formula') or $span.attr('data-math-formula') or $span.text())

    mimeType = $span.find('script[type]').attr('type') or 'math/asciimath'
    # tex could be "math/tex; mode=display" so split in the semicolon
    mimeType = mimeType.split(';')[0]
    
    formula = $span.find('script[type]').html()
    
    $formula = $editor.find('.formula')

    # Set the language and fill in the formula
    $editor.find("input[name=mime-type][value='#{mimeType}']").attr('checked', true)
    $formula.val(formula)

    keyTimeout = null
    keyDelay = () ->
      # Try and parse it as ASCIIMath
      formula = jQuery(@).val() # $span.data('math-formula')
      mimeType = $editor.find('input[name=mime-type]:checked').val()
      formulaWrapped = LANGUAGES[mimeType].open + formula + LANGUAGES[mimeType].close
      $span.text(formulaWrapped)
      triggerMathJax($span, formulaWrapped)
      # TODO: Async save the input when MathJax correctly parses and typesets the text
      $span.data('math-formula', formula)

    $formula.data('math-old', $formula.val())
    $formula.on 'keyup', () ->
        val = jQuery(@).val()
        if $formula.data('math-old') != val
          $formula.data('math-old', val)
          clearTimeout(keyTimeout)
          setTimeout(keyDelay.bind(@), 500)
    
    # Grr, Bootstrap doesn't set the cheked value properly on radios
    radios = $editor.find('input[name=mime-type]')
    radios.on 'click', () ->
        radios.attr('checked', false)
        jQuery(@).attr('checked', true)
        clearTimeout(keyTimeout)
        setTimeout(keyDelay.bind($formula), 500)
    
    $editor

  Bubble.register
    selector: '.math-element'
    populator: buildEditor
    # placement: 'right'
    filter: () ->
        jQuery(@).hasClass('math-element') or jQuery(@).parents('.math-element')[0]
    
