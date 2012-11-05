###
Register a couple of assorted oer plugins
###
define [ 'bubble', './link', './figure', './title-figcaption' ], (Bubble, linkConfig, figureConfig, figcaptionConfig) ->

  Bubble.register linkConfig
  Bubble.register figureConfig
  Bubble.register figcaptionConfig
