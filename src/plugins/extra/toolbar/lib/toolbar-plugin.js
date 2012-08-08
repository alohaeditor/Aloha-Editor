(function() {
  var menuSettings, toolbarSettings;

  menuSettings = [
    {
      text: "Format",
      subMenu: [
        "bold", "italic", "underline", "strikethrough", "subscript", "superscript", "quote", '', {
          text: 'Paragraph Styles',
          subMenu: ["indentList", "outdentList"]
        }, {
          text: "Align",
          subMenu: ["alignLeft", "alignCenter", "alignRight", "alignJustify"]
        }, "formatLink", "formatAbbr", "formatNumeratedHeaders", "toggleMetaView", "wailang", "toggleFormatlessPaste"
      ]
    }, {
      text: "Insert",
      subMenu: ["characterPicker", "insertLink", "insertImage", 'insertFigure', "insertAbbr", "insertToc", "insertHorizontalRule", "insertTag"]
    }, {
      text: "Table",
      subMenu: [
        "createTable", '', {
          text: "Cell",
          subMenu: ["mergecells", "splitcells", "tableCaption", "tableSummary", "formatTable"]
        }, {
          text: "Row",
          subMenu: ["addrowbefore", "addrowafter", "deleterows", "rowheader", "mergecellsRow", "splitcellsRow", "formatRow"]
        }, '', {
          text: "Column",
          subMenu: ["addcolumnleft", "addcolumnright", "deletecolumns", "columnheader", "mergecellsColumn", "splitcellsColumn", "formatColumn"]
        }
      ]
    }
  ];

  toolbarSettings = ['bold', 'italic', 'underline', '', 'insertLink', 'insertImage', 'insertFigure', '', 'orderedList', 'unorderedList', 'outdentList', 'indentList', '', "alignLeft", "alignCenter", "alignRight", "alignJustify"];

  define(["aloha", "aloha/plugin", "ui/ui", 'ribbon/ribbon-plugin', '../../appmenu/appmenu', "i18n!format/nls/i18n", "i18n!aloha/nls/i18n", "aloha/console", "css!toolbar/css/toolbar.css"], function(Aloha, Plugin, Ui, Ribbon, appmenu, i18n, i18nCore) {
    var CONTAINER_JQUERY;
    CONTAINER_JQUERY = jQuery('.toolbar');
    if (CONTAINER_JQUERY.length === 0) {
      CONTAINER_JQUERY = jQuery('<div></div>').addClass('toolbar-container').appendTo('body');
    }
    /*
       register the plugin with unique name
    */
    return Plugin.create("toolbar", {
      init: function() {
        var applyHeading, item, labels, menu, menuLookup, menubar, order, recurse, subMenuItems, tab, toolbar, toolbarLookup, _i, _j, _len, _len2;
        window.menubar = menubar = new appmenu.MenuBar([]);
        menubar.el.appendTo(CONTAINER_JQUERY);
        window.toolbar = toolbar = new appmenu.ToolBar();
        toolbar.el.appendTo(CONTAINER_JQUERY);
        toolbar.el.addClass('aloha');
        menuLookup = {};
        toolbarLookup = {};
        recurse = function(item, lookupMap) {
          var menuItem, subItem, subItems, subMenu;
          if ('string' === $.type(item)) {
            if ('' === item) return new appmenu.Separator();
            menuItem = new appmenu.MenuItem('EMPTY_LABEL');
            lookupMap[item] = menuItem;
            return menuItem;
          } else {
            subItems = (function() {
              var _i, _len, _ref, _results;
              _ref = item.subMenu || [];
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                subItem = _ref[_i];
                _results.push(recurse(subItem, lookupMap));
              }
              return _results;
            })();
            subMenu = new appmenu.Menu(subItems);
            subMenu.el.addClass('aloha');
            menuItem = new appmenu.MenuItem(item.text, {
              subMenu: subMenu
            });
            return menuItem;
          }
        };
        for (_i = 0, _len = menuSettings.length; _i < _len; _i++) {
          tab = menuSettings[_i];
          subMenuItems = (function() {
            var _j, _len2, _ref, _results;
            _ref = tab.subMenu;
            _results = [];
            for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
              item = _ref[_j];
              _results.push(recurse(item, menuLookup));
            }
            return _results;
          })();
          menu = new appmenu.Menu(subMenuItems);
          menu.el.addClass('aloha');
          menubar.append(new appmenu.MenuButton(tab.text, menu));
        }
        for (_j = 0, _len2 = toolbarSettings.length; _j < _len2; _j++) {
          item = toolbarSettings[_j];
          toolbar.append(recurse(item, toolbarLookup));
        }
        Ui.adopt = function(slot, type, settings) {
          var ItemRelay, item2;
          ItemRelay = (function() {

            function ItemRelay(items) {
              this.items = items;
            }

            ItemRelay.prototype.show = function() {
              var item, _k, _len3, _ref, _results;
              _ref = this.items;
              _results = [];
              for (_k = 0, _len3 = _ref.length; _k < _len3; _k++) {
                item = _ref[_k];
                _results.push(item.setHidden(false));
              }
              return _results;
            };

            ItemRelay.prototype.hide = function() {
              var item, _k, _len3, _ref, _results;
              _ref = this.items;
              _results = [];
              for (_k = 0, _len3 = _ref.length; _k < _len3; _k++) {
                item = _ref[_k];
                _results.push(item.setHidden(true));
              }
              return _results;
            };

            ItemRelay.prototype.setActive = function(bool) {
              var item, _k, _len3, _ref, _results;
              _ref = this.items;
              _results = [];
              for (_k = 0, _len3 = _ref.length; _k < _len3; _k++) {
                item = _ref[_k];
                _results.push(item.setChecked(bool));
              }
              return _results;
            };

            ItemRelay.prototype.setState = function(bool) {
              return this.setActive(bool);
            };

            ItemRelay.prototype.enable = function(bool) {
              var item, _k, _len3, _ref, _results;
              if (bool == null) bool = true;
              _ref = this.items;
              _results = [];
              for (_k = 0, _len3 = _ref.length; _k < _len3; _k++) {
                item = _ref[_k];
                _results.push(item.setDisabled(!bool));
              }
              return _results;
            };

            ItemRelay.prototype.disable = function() {
              var item, _k, _len3, _ref, _results;
              _ref = this.items;
              _results = [];
              for (_k = 0, _len3 = _ref.length; _k < _len3; _k++) {
                item = _ref[_k];
                _results.push(item.setDisabled(true));
              }
              return _results;
            };

            ItemRelay.prototype.setActiveButton = function(a, b) {
              return console.log("" + slot + " TODO:SETACTIVEBUTTON:", a, b);
            };

            ItemRelay.prototype.focus = function(a) {
              return console.log("" + slot + " TODO:FOCUS:", a);
            };

            ItemRelay.prototype.foreground = function(a) {
              return console.log("" + slot + " TODO:FOREGROUND:", a);
            };

            return ItemRelay;

          })();
          if (slot in menuLookup && slot in toolbarLookup) {
            item = menuLookup[slot];
            item2 = toolbarLookup[slot];
            item.element = item.el;
            item2.element = item2.el;
            item.setText(settings.tooltip);
            item.setIcon(settings.icon);
            item.setAction(settings.click);
            item2.setText(settings.tooltip);
            item2.setIcon(settings.icon);
            item2.setAction(settings.click);
            return new ItemRelay([item, item2]);
          } else if (slot in menuLookup || slot in toolbarLookup) {
            item = menuLookup[slot] || toolbarLookup[slot];
          } else {
            item = new appmenu.MenuItem('DUMMY_ITEM_THAT_SQUASHES_STATE_CHANGES');
          }
          item.setText(settings.tooltip);
          item.setIcon(settings.icon);
          item.setAction(settings.click);
          item.element = item.el;
          return new ItemRelay([item]);
        };
        applyHeading = function() {
          var $newEl, $oldEl, rangeObject;
          rangeObject = Aloha.Selection.getRangeObject();
          if (rangeObject.isCollapsed()) {
            GENTICS.Utils.Dom.extendToWord(rangeObject);
          }
          Aloha.Selection.changeMarkupOnSelection(Aloha.jQuery(this.markup));
          $oldEl = Aloha.jQuery(rangeObject.getCommonAncestorContainer());
          $newEl = Aloha.jQuery(Aloha.Selection.getRangeObject().getCommonAncestorContainer());
          return $newEl.addClass($oldEl.attr('class'));
        };
        order = ['p', 'h1', 'h2', 'h3'];
        labels = {
          'p': 'Normal Text',
          'h1': 'Heading 1',
          'h2': 'Heading 2',
          'h3': 'Heading 3'
        };
        /*
              headingButtons = (new appmenu.custom.Heading("<#{ h } />", labels[h], {accel: "Ctrl+#{ h.charAt(1) }", action: applyHeading }) for h in order)
              
              headingsButton = new appmenu.ToolButton("Heading 1", {subMenu: new appmenu.Menu(headingButtons)})
              toolbar.append(headingsButton)
              toolbar.append(new appmenu.Separator())
        */
        return Aloha.bind("aloha-selection-changed", function(event, rangeObject) {
          var $el, h, i, isActive, _len3, _results;
          $el = Aloha.jQuery(rangeObject.startContainer);
          _results = [];
          for (i = 0, _len3 = order.length; i < _len3; i++) {
            h = order[i];
            _results.push(isActive = $el.parents(h).length > 0);
          }
          return _results;
        });
      },
      /*
           toString method
      */
      toString: function() {
        return "toolbar";
      }
    });
  });

}).call(this);
