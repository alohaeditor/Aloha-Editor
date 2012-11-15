// Generated by CoffeeScript 1.3.3
(function() {

  define(['aloha', 'aloha/plugin', 'jquery', 'popover', 'ui/ui', 'css!../../../oerpub/math/css/math.css'], function(Aloha, Plugin, jQuery, Popover, UI) {
    var EDITOR_HTML, LANGUAGES, MATHML_ANNOTATION_ENCODINGS, SELECTOR, buildEditor, triggerMathJax;
    EDITOR_HTML = '<div class="math-editor-dialog">\n    <div>\n        <textarea type="text" class="formula" rows="1"></textarea>\n    </div>\n    <span>This is:</span>\n    <label class="radio inline">\n        <input type="radio" name="mime-type" value="math/asciimath"> ASCIIMath\n    </label>\n    <label class="radio inline">\n        <input type="radio" name="mime-type" value="math/tex"> LaTeX\n    </label>\n    <label class="radio inline mime-type-mathml">\n        <input type="radio" name="mime-type" value="math/mml"> MathML\n    </label>\n    <div class="footer">\n        <button class="btn btn-primary done">Done</button>\n        <button class="btn btn-danger remove"><i class="icon-remove icon-white"></i> Remove</button>\n    </div>\n</div>';
    LANGUAGES = {
      'math/asciimath': {
        open: '`',
        close: '`'
      },
      'math/tex': {
        open: '[TEX_START]',
        close: '[TEX_END]'
      },
      'math/mml': {
        raw: true
      }
    };
    MATHML_ANNOTATION_ENCODINGS = {
      'TeX': 'math/tex',
      'ASCIIMath': 'math/asciimath'
    };
    UI.adopt('insertMath', null, {
      click: function() {
        var $el;
        $el = jQuery('<span class="math-element">`x^2`</span>');
        GENTICS.Utils.Dom.insertIntoDOM($el, Aloha.Selection.getRangeObject(), Aloha.activeEditable.obj);
        return triggerMathJax($el, function() {
          return $el.trigger('show');
        });
      }
    });
    triggerMathJax = function($el, cb) {
      return MathJax.Hub.Typeset($el[0], cb);
    };
    buildEditor = function($span) {
      var $annotation, $editor, $formula, $tmp, formula, keyDelay, keyTimeout, lang, mimeType, radios,
        _this = this;
      $editor = jQuery(EDITOR_HTML);
      $editor.find('.done').on('click', function() {
        return $span.trigger('hide');
      });
      $editor.find('.remove').on('click', function() {
        $span.trigger('hide');
        return $span.remove();
      });
      $formula = $editor.find('.formula');
      mimeType = $span.find('script[type]').attr('type') || 'math/asciimath';
      mimeType = mimeType.split(';')[0];
      formula = $span.find('script[type]').html();
      if (mimeType === 'math/mml') {
        $tmp = jQuery('<div></div>').html($span.find('script[type]').text());
        $annotation = $tmp.find('annotation');
        lang = $annotation.attr('encoding');
        if (MATHML_ANNOTATION_ENCODINGS[lang]) {
          mimeType = MATHML_ANNOTATION_ENCODINGS[lang];
          formula = $annotation.text();
        }
      }
      $editor.find("input[name=mime-type][value='" + mimeType + "']").attr('checked', true);
      $formula.val(formula);
      if (mimeType !== 'math/mml') {
        $editor.find("label.mime-type-mathml").remove();
      }
      keyTimeout = null;
      keyDelay = function() {
        var formulaWrapped;
        formula = jQuery(this).val();
        mimeType = $editor.find('input[name=mime-type]:checked').val();
        if (LANGUAGES[mimeType].raw) {
          $span[0].innerHTML = formula;
        } else {
          formulaWrapped = LANGUAGES[mimeType].open + formula + LANGUAGES[mimeType].close;
          $span.text(formulaWrapped);
        }
        triggerMathJax($span, function() {
          var $math;
          $math = $span.find('math');
          if ($math[0]) {
            $annotation = $math.find('annotation');
            if (!($annotation[0] != null)) {
              $annotation = jQuery('<annotation></annotation>').prependTo($math);
            }
            $annotation.attr('encoding', mimeType);
            return $annotation.text(formula);
          }
        });
        $span.data('math-formula', formula);
        return $formula.trigger('focus');
      };
      $formula.data('math-old', $formula.val());
      $formula.on('keyup', function() {
        var val;
        val = jQuery(this).val();
        if ($formula.data('math-old') !== val) {
          $formula.data('math-old', val);
          clearTimeout(keyTimeout);
          return setTimeout(keyDelay.bind(this), 500);
        }
      });
      radios = $editor.find('input[name=mime-type]');
      radios.on('click', function() {
        radios.attr('checked', false);
        jQuery(this).attr('checked', true);
        clearTimeout(keyTimeout);
        return setTimeout(keyDelay.bind($formula), 500);
      });
      return $editor;
    };
    Aloha.bind('aloha-editable-activated', function(event, data) {
      var editable;
      editable = data.editable;
      return jQuery(editable.obj).on('click.matheditor', '.math-element, .math-element *', function(evt) {
        var $el, range;
        $el = jQuery(this);
        if (!$el.is('.math-element')) {
          $el = $el.parents('.math-element');
        }
        $el.contentEditable(false);
        range = new GENTICS.Utils.RangeObject();
        range.startContainer = range.endContainer = $el[0];
        range.startOffset = range.endOffset = 0;
        Aloha.Selection.rangeObject = range;
        Aloha.trigger('aloha-selection-changed', range);
        return evt.stopPropagation();
      });
    });
    SELECTOR = '.math-element';
    return Popover.register({
      selector: SELECTOR,
      populator: buildEditor,
      placement: 'top',
      noHover: true,
      focus: function($popover) {
        return setTimeout(function() {
          return $popover.find('.formula').trigger('focus');
        }, 10);
      }
    });
  });

}).call(this);
