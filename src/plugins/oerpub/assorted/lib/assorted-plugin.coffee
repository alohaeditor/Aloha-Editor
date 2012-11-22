###
Register a couple of assorted oer plugins
###
define [ 'aloha/plugin', 'popover', './link', './image', './figure', './title-figcaption' ], (Plugin, Popover, linkConfig, imageConfig, figureConfig, figcaptionConfig) ->

  # This plugin is created simply so we can hook into plugin configuration
  Plugin.create 'assorted',
    defaultSettings: {
    },
    init: () ->
      Popover.register linkConfig
      Popover.register imageConfig
      # Popover.register figureConfig
      Popover.register figcaptionConfig
