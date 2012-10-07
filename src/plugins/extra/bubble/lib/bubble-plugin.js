(function() {

  define(["aloha", "jquery", "css!bubble/css/bubble.css"], function(Aloha, jQuery) {
    var $nodes, displayer, makeBubbler;
    $nodes = jQuery('.document a');
    displayer = function($el, $bubble) {
      return $bubble.append("ADSKJFH");
    };
    window.makeBubbler = makeBubbler = function($nodes, displayer, placement) {
      var $bubble, MILLISECS, canvas, localBubble, makeBubble, timeoutId;
      canvas = jQuery('body');
      MILLISECS = 1000;
      $bubble = null;
      localBubble = null;
      timeoutId = null;
      makeBubble = function(evt, displayer, placement) {
        var $el, offset;
        if (placement == null) {
          placement = {
            vertical: 'below',
            horizontal: 'start'
          };
        }
        placement.vertical = placement.vertical || 'below';
        placement.horizontal = placement.horizontal || 'start';
        $el = jQuery(evt.currentTarget);
        $bubble = jQuery('<div class="bubble"></div>').appendTo(canvas);
        localBubble = $bubble;
        displayer($el, $bubble);
        offset = $el.offset();
        offset.position = 'absolute';
        switch (placement.vertical) {
          case 'below':
            offset.top = offset.top + $el.outerHeight();
            break;
          case 'above':
            offset.top = offset.top - $bubble.outerHeight();
            break;
          default:
            console.error('Invalid vertical placement');
        }
        switch (placement.horizontal) {
          case 'start':
            break;
          case 'center':
            if ($el.outerWidth() > $bubble.outerWidth()) {
              offset.left = offset.left + ($el.outerWidth() - $bubble.outerWidth()) / 2;
            }
            break;
          default:
            console.error('Invalid horizontal placement');
        }
        $bubble.css(offset);
        return $bubble.on('mouseleave', function() {
          return $bubble.remove();
        });
      };
      $nodes.on('mouseenter', function(evt) {
        var makeBubbleTimeout;
        if (timeoutId) clearTimeout(timeoutId);
        if ($bubble) $bubble.remove();
        makeBubbleTimeout = function() {
          return makeBubble(evt, displayer, placement);
        };
        return timeoutId = setTimeout(makeBubbleTimeout, MILLISECS);
      });
      $nodes.on('click', function() {
        timeoutId = null;
        return $bubble = null;
      });
      $nodes.on('mouseleave', function() {
        clearTimeout(timeoutId);
        return timeoutId = null;
      });
      return Aloha.bind('aloha-selection-changed', function(event, rangeObject) {
        clearTimeout(timeoutId);
        timeoutId = null;
        if (localBubble) return localBubble.remove();
      });
    };
    return makeBubbler;
  });

}).call(this);
