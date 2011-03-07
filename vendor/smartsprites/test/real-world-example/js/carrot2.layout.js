(function($) {
  /**
   * Shows the actual UI elements. If there is no JavaScript enabled, this
   * function will not be called and the user will see the message shown
   * in <noscript> rather than the UI which requires JavaScript to run.
   */
  jQuery.fn.enableUi = function() {
    this.find(".disabled-ui").removeClass("disabled-ui");
  };

  /**
   * Dynamically adds markup required by the specific skin.
   */
  jQuery.enhanceMarkup = function() {
    // Extra wrappers for tabs
    $("#source-tabs li.tab").wrapInner('<div class="tab-left"><div class="tab-right"><div class="tab-inside"></div></div></div>');

    // A lead-in element for tabs
    $("#source-tabs").prepend('<div id="tab-lead-in"></div>');

    // Glows
    $("#query").glow("glow-small");
    $("#search").glow("glow-big");
  };

  /**
   * Adds the markup required to create a glow effect.
   */
  jQuery.fn.glow = function(glowClass) {
    this.each(function() {
      var $this = $(this);

      // Get content dimensions
      var contentWidth = $this.outerWidth();
      var contentHeight = $this.outerHeight();
    
      // Add glow markup
      var $glowDiv = $("<span class='" + glowClass + "'></span>");
      $this.before($glowDiv);
      $glowDiv.append("<span class='tl'></span><span class='t'></span><span class='tr'></span><span class='l'></span>");
      $glowDiv.append($this);
      $glowDiv.append("<span class='r'></span><span class='bl'></span><span class='b'></span><span class='br'></span>");

      // Extract border sizes
      var borderWidth = $glowDiv.find(".tl").width();
      var borderHeight = $glowDiv.find(".tl").height();

      // Add appropriate dimensions to the newly created markup
      $glowDiv.width(contentWidth + borderWidth * 2);
      $glowDiv.height(contentHeight + borderHeight * 2);
      $glowDiv.find(".t, .b").width(contentWidth);
      $glowDiv.find(".l, .r").height(contentHeight);
    });
  };
})(jQuery);
