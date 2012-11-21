###
Register a couple of assorted oer plugins
###
define [ 'popover', './link', './image', './figure', './title-figcaption' ], (Popover, linkConfig, imageConfig, figureConfig, figcaptionConfig) ->

  Popover.register linkConfig
  Popover.register imageConfig
  # Popover.register figureConfig
  Popover.register figcaptionConfig
