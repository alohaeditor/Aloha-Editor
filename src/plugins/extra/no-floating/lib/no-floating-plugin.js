(function() {

  define(['jquery', 'aloha', 'aloha/plugin', 'PubSub', 'ui/settings', 'ui/ui', 'ui/floating', 'ribbon/ribbon-plugin', 'jqueryui'], function($, Aloha, Plugin, PubSub, Settings, Ui, Floating, Ribbon) {
    var c, getToolbarSettings, ribbonCreateTimeout, ribbonMenu, slot, slots, squirreledEditable, squirreledRange, tab, _i, _j, _k, _len, _len2, _len3, _ref, _ref2;
    getToolbarSettings = function() {
      var defaultSettings, userSettings;
      userSettings = Aloha.settings.toolbar;
      defaultSettings = Settings.defaultToolbarSettings;
      if (!userSettings) {
        return defaultSettings.tabs;
      } else {
        return Settings.combineToolbarSettings(userSettings.tabs || [], defaultSettings.tabs, userSettings.exclude || []);
      }
    };
    /*
       Aloha.settings.toolbar uses the following format:
       
       label: "Tab Title"
       components: [ [ 'bold', 'strong', italic' ] ]
    
    
       While the ribbon expects the following:
       
       Ribbon.addButton
         text: 'Button Title'
         menu: [
           {
             text: 'Subitem title'
             menu: [] # Optional
             click: () -> alert 'hello!'
           }
         ]
    
        So, we construct the ribbon with hollow actions and then as plugins
        provide their actions we add them to a lookup map.
    */
    ribbonMenu = [];
    _ref = getToolbarSettings();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      tab = _ref[_i];
      slots = [];
      _ref2 = tab.components;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        c = _ref2[_j];
        for (_k = 0, _len3 = c.length; _k < _len3; _k++) {
          slot = c[_k];
          slots.push(slot);
        }
      }
      ribbonMenu.push({
        text: tab.label,
        menu: slots
      });
    }
    ribbonCreateTimeout = 0;
    squirreledEditable = null;
    squirreledRange = null;
    PubSub.sub('aloha.selection.context-change', function(message) {
      squirreledEditable = Aloha.activeEditable || squirreledEditable;
      return squirreledRange = message.range || squirreledRange;
    });
    return $.extend(Ui, {
      /*
           * This module is part of the Aloha API.
           * It is valid to override this module via requirejs to provide a
           * custom behaviour. An overriding module must implement all API
           * methods. Every member must have an api annotation. No private
           * members are allowed.
           * @api
      */
      /*
           * Adopts a component instance into the UI.
           *
           * Usually, the implementation of this method will display the
           * component, at a position in the UI given by the slot
           * argument.
           *
           * @param slot
           *        A position argument that is interpreted by the UI however it likes.
           * @param component
           *        An instance of a component to adopt into the given slot.
           * @api
      */
      adopt: function(slot, type, settings) {
        var i, tab, _l, _len4;
        clearTimeout(ribbonCreateTimeout);
        for (_l = 0, _len4 = ribbonMenu.length; _l < _len4; _l++) {
          tab = ribbonMenu[_l];
          i = tab.menu.indexOf(slot);
          if (i >= 0) {
            tab.menu[i] = {
              text: settings.tooltip,
              click: function() {
                Aloha.activeEditable = Aloha.activeEditable || squirreledEditable;
                return settings.click();
              }
            };
          }
        }
        ribbonCreateTimeout = setTimeout(function() {
          var r, _len5, _m;
          for (_m = 0, _len5 = ribbonMenu.length; _m < _len5; _m++) {
            r = ribbonMenu[_m];
            Ribbon.addButton(r);
          }
          return Ribbon.show();
        }, 1000);
        return {
          show: function() {},
          hide: function() {},
          setActive: function(bool) {},
          setState: function(bool) {},
          setActiveButton: function(a, b) {},
          enable: function() {},
          disable: function() {},
          focus: function(a) {},
          foreground: function(a) {}
        };
      }
    });
  });

}).call(this);
