# # Configure MathJax
# This module configures MathJax and runs right after `MathJax.js` is pulled into the browser.
#
console?.error 'MathJax did not load for some reason.' if not @MathJax?.Hub

@MathJax.Hub.Config
  jax: [
    'input/MathML'
    'input/TeX'
    'input/AsciiMath'
    'output/NativeMML'
    'output/HTML-CSS'
  ]
  extensions: [
    'asciimath2jax.js'
    'tex2jax.js'
    'mml2jax.js'
    'MathMenu.js'
    'MathZoom.js'
  ]
  tex2jax:
    inlineMath: [
      ['[TEX_START]','[TEX_END]']
      ['\\(', '\\)']
    ]

  # Apparently we cannot change the escape sequence for ASCIIMath (MathJax does not find it)
  #
  #     asciimath2jax: { inlineMath: [['[ASCIIMATH_START]', '[ASCIIMATH_END]']], },

  TeX:
    extensions: [
      'AMSmath.js'
      'AMSsymbols.js'
      'noErrors.js'
      'noUndefined.js'
    ]
    noErrors: {disabled:true}

  AsciiMath:
    noErrors: {disabled:true}

