###
Register a couple of assorted oer plugins
###
define [ 'aloha/plugin', 'popover', './link', './image', './figure', './title-figcaption' ], (Plugin, Popover, linkConfig, imageConfig, figureConfig, figcaptionConfig) ->
  Plugin.create 'assorted',
    init: () ->
      Popover.register linkConfig
      Popover.register imageConfig
      # Popover.register figureConfig
      Popover.register figcaptionConfig
