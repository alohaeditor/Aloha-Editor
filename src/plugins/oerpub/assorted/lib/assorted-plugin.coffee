###
Register a couple of assorted oer plugins
###
define [ 'aloha/plugin', 'jquery', 'popover', './link', './image', './figure', './title-figcaption', './list' ], (Plugin, $, Popover, linkConfig, imageConfig, figureConfig, figcaptionConfig) ->
  Plugin.create 'assorted',
    defaultSettings:
        image:
            preview: true
    init: () ->
      @settings = $.extend true, @defaultSettings, @settings
      Popover.register linkConfig
      Popover.register imageConfig
      #Popover.register figureConfig
      #Popover.register figcaptionConfig
