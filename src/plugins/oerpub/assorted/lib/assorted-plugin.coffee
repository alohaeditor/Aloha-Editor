###
Register a couple of assorted oer plugins
###
define [ 'popover', './link', './figure', './title-figcaption' ], (Popover, linkConfig, figureConfig, figcaptionConfig) ->

  Popover.register linkConfig
  Popover.register figureConfig
  Popover.register figcaptionConfig
