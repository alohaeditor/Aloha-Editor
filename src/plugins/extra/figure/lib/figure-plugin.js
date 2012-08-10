(function() {
  var __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  define(["aloha", "aloha/plugin", 'block/block', "block/blockmanager", 'ui/ui'], function(Aloha, Plugin, block, BlockManager, Ui, i18n, i18nCore) {
    /*
       Monkey patch a couple of things in Aloha so figures can be draggable blocks
    */    block.AbstractBlock.prototype._postProcessElementIfNeeded = function() {
      this.createEditablesIfNeeded();
      this._checkThatNestedBlocksAreStillConsistent();
      this._makeNestedBlockCollectionsSortable();
      this.renderBlockHandlesIfNeeded();
      if (this.isDraggable() && this.$element[0].tagName.toLowerCase() === 'span') {
        this._setupDragDropForInlineElements();
        return this._disableUglyInternetExplorerDragHandles();
      } else if (this.isDraggable()) {
        this._setupDragDropForBlockElements();
        return this._disableUglyInternetExplorerDragHandles();
      }
    };
    BlockManager._blockify = function(element, instanceDefaults) {
      var $element, attributes, tagName;
      $element = jQuery(element);
      tagName = $element[0].tagName.toLowerCase();
      attributes = this.getConfig($element, instanceDefaults);
      if (!this.blockTypes.has(attributes['aloha-block-type'])) {
        Aloha.Log.error('block/blockmanager', 'Block Type ' + attributes['aloha-block-type'] + ' not found!');
        return;
      }
      block = new (this.blockTypes.get(attributes['aloha-block-type']))($element);
      block.$element.addClass('aloha-block-' + attributes['aloha-block-type']);
      jQuery.each(attributes, function(k, v) {
        return block._setAttribute(k, v);
      });
      return this.blocks.register(block.getId(), block);
    };
    /*
       register the plugin with unique name
    */
    return Plugin.create("figure", {
      init: function() {
        var FigureBlock, editable, initializeEditable, initializeFigures, _i, _len, _ref;
        Ui.adopt('insertFigure', {
          isInstance: function() {
            return false;
          }
        }, {
          tooltip: 'Create Figure',
          click: function(evt) {
            var markup, rangeObject;
            console.log('sdkjfh');
            markup = jQuery("<figure><span class='media'><img src='" + (Aloha.getPluginUrl('image')) + "/img/blank.jpg'/></span><figcaption>Enter Caption Here</figcaption></figure>");
            rangeObject = Aloha.Selection.getRangeObject();
            GENTICS.Utils.Dom.insertIntoDOM(markup, rangeObject, jQuery(Aloha.activeEditable.obj));
            markup.alohaBlock({
              'aloha-block-type': 'FigureBlock'
            });
            return initializeFigures(markup);
          }
        });
        FigureBlock = block.AbstractBlock.extend({
          title: 'Image',
          init: function($element, postProcessFn) {
            $element.contentEditable(true);
            this.attr('image', $element.find('img').attr('src'));
            return postProcessFn();
          },
          update: function($element, postProcessFn) {
            if (this.attr('position') === 'right') {
              $element.css('float', 'right');
            } else if (this.attr('position') === 'left') {
              $element.css('float', 'left');
            } else {
              $element.css('float', '');
            }
            $element.find('img').attr('src', this.attr('image'));
            return postProcessFn();
          },
          _onElementClickHandler: function() {
            return console.log('Ignoring figure click');
          },
          _preventSelectionChangedEventHandler: function(evt) {
            console.log('Ignoring figure mousedown/focus/something');
            return window.setTimeout((function() {
              return jQuery(this).trigger('focus');
            }), 1);
          }
        });
        BlockManager.registerBlockType('FigureBlock', FigureBlock);
        initializeFigures = function($figures) {
          $figures.find('figcaption').on('dblclick', function() {
            var caption, captionArea, dialog, figure;
            dialog = $('<div></div>');
            captionArea = $('<div></div>').appendTo(dialog);
            captionArea[0].innerHTML = this.innerHTML;
            caption = $(this);
            figure = caption.parent();
            dialog.dialog({
              close: function() {
                captionArea.mahalo();
                return caption[0].innerHTML = captionArea[0].innerHTML;
              }
            });
            return captionArea.aloha();
          });
          return $figures.find('img').on('drop', function(dropEvent) {
            var dt, img, readFile;
            img = jQuery(dropEvent.target);
            dropEvent.preventDefault();
            readFile = function(file) {
              var majorType, minorType, reader, _ref;
              if (file != null) {
                _ref = file.type.split("/"), majorType = _ref[0], minorType = _ref[1];
                reader = new FileReader();
                if (majorType === "image") {
                  reader.onload = function(loadEvent) {
                    return img.attr('src', loadEvent.target.result);
                  };
                  return reader.readAsDataURL(file);
                }
              }
            };
            if ((dt = dropEvent.originalEvent.dataTransfer) != null) {
              if (__indexOf.call(dt.types, 'Files') >= 0) {
                return readFile(dt.files[0]);
              }
            }
          });
        };
        initializeEditable = function($editable) {
          return initializeFigures($editable.find('figure:not(.aloha-block)').alohaBlock({
            'aloha-block-type': 'FigureBlock'
          }));
        };
        _ref = Aloha.editables;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          editable = _ref[_i];
          initializeEditable(editable.obj);
        }
        return Aloha.bind('aloha-editable-created', function($event, editable) {
          return initializeEditable(editable.obj);
        });
      },
      /*
           toString method
      */
      toString: function() {
        return "figure";
      }
    });
  });

}).call(this);
