(function($) {
  /**
   * Adds dynamic behaviour to tabs, including click response and sorting by
   * drag&drop.
   */
  jQuery.fn.sourceTabs = function() {
    this.each(function() {
      $tabContainer = $(this);

      // Make the tabs sortable
      $tabContainer.find("ul").sortable({
        change: function() {
          $tabContainer.trigger("tabsChanged");
        },
        sort: function() {  
          if (!window.tabDragStarted) {
            $tabContainer.find("li:last").addClass("drag");
            $tabContainer.find("li:not(.drag), #tab-lead-in").css("visibility", "visible").animate({opacity: 0.5}, 300);
            window.tabDragStarted = true;
          }
        },
        stop: function() {
          window.tabDragStarted = false;
          $tabContainer.find("li:not(.drag), #tab-lead-in").css("visibility", "visible").animate({opacity: 1.0}, 300);
        },
        start: function(e) {
          activateTab(e, $tabContainer);
        },
        revert: true,
        distance: 15
      });

      // Make tabs respond to clicks
      $tabContainer.click($.delegate({
        ".label": function(e) {
          activateTab(e, $tabContainer);
          return false;
        }
      }));

      // Bind listener to tab structure change events
      $tabContainer.bind("tabsChanged", updateTabs);
      $tabContainer.find("a").bind("tabActivated", copyTabInfo);
    });
  };

  /**
   * Activates provided tab.
   */
  activateTab = function(e, $tabContainer) {
    $tabContainer.find("li.tab").removeClass("active").addClass("passive");
    $(e.target).parents("li.tab").removeClass("passive").addClass("active");
    $tabContainer.trigger("tabsChanged");
    $(e.target).trigger("tabActivated");
  };

  /**
   * Updates the look of tabs after the active tab or tab order has changed.
   */
  updateTabs = function(e)
  {
    var $tabContainer = $(e.target);
    var $tabs = $tabContainer.find("li:visible:not(.drag)");
    $tabs.removeClass("passive-first active-first passive-last active-last before-active");

    $.each($tabs, function(i, tab) {
      $tab = $(tab);
      var status = tabStatus(tab);
      var nextStatus = tabStatus($tabs[i + 1]);
      var orderSuffix = "";
      if (i == 0) {
        orderSuffix = "-first";
        if (status == "active") {
          $tabContainer.addClass("first-active");
        }
        else {
          $tabContainer.removeClass("first-active");
        }
      } else if (i == $tabs.length - 1) {
        orderSuffix = "-last";
      }

      $tab.addClass(status + orderSuffix);
      if (nextStatus == "active") {
        $tab.addClass("before-active");
      }
    });
  };

  /**
   * Returns the status ("active" or "passive") of the provided tab.
   */
  tabStatus = function(tabElement) {
    if (!tabElement) {
      return null;
    }
    return (tabElement && tabElement.className.indexOf("passive") >= 0 ? "passive" : "active");
  };

  copyTabInfo = function(e) {
    $("#tab-info").html($(e.target).siblings("span.tab-info").clone().removeClass("hide"));
  }
})(jQuery);
