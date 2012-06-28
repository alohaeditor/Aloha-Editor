- **MANUAL CHANGE**: Added the ui-plugin and removed ui specific code from the Aloha core

                     Due to a complete re-implementation of the Aloha
                     user interface in the form of the ui-plugin, most
                     of the ui specific Aloha API has changed.

                     (In the following, ui/x refers to src/plugins/common/ui/lib/x.js.)

                     * FloatingMenu - removed
                       See ui/toolbar

                     * Aloha.ui - removed
                       Affects
                       Aloha.ui.AttributeField
                       Aloha.ui.Button
                       Aloha.ui.MultiSplitButton
                       Aloha.isMessageVisible
                       Aloha.hideMessage
                       Aloha.ui.MultiSplitButton.idCounter
                       Aloha.showMessage
                       Aloha.i18n
                       Plugin.i18n (has been deprecated for some time now)

                     * Aloha.Message - removed
                       See ui/message.

                     * Aloha.settings.plugins.table.summaryinsidebar - meaning changed

                       This setting decided whether the summary was
                       displayed either in the side bar or in the
                       floating-menu. This setting now only decides
                       whether or not a summary is displayed in the
                       sidebar.

                       The table-plugin defines a component with the name
                       tableSummary. It is up to the toolbar configuration
                       whether or not this component is displayed in the
                       toolbar.

                     * image-plugin - the following settings are obsolete

                        plugin.settings.ui.oneTab
            			plugin.settings.ui.insert
                        plugin.settings.ui.meta
                        plugin.settings.ui.reset
                        plugin.settings.ui.align
                        plugin.settings.ui.margin
                        plugin.settings.ui.crop
                        plugin.settings.ui.resize
                        plugin.settings.ui.aspectRatioToggle

                       It is now up to the toolbar configuration whether or
                       not and how to display these components.

                     * Selection.isFloatingMenuVisible - removed
 
                     All settings associated with the removed components
                     do not have any effect any more.

                     The Aloha css rules has been completely
                     re-implemented. In particular, the Aloha block
                     handles now have z-index 10000, the floating menu
                     has 10100, and Aloha dialogs have 10200.

                     The new common/ui plugin is now required for the
                     user interface to be shown. This plugin is not
                     loaded automatically. Most plugins require a user
                     interface and will fail to load if this plugin is
                     not configured to be loaded.

                     The requirejs plugins order! and jquery-plugin!
                     have been removed.

                     Many plugins exposed buttons, attribute-field and
                     multi-split-button components as non-private
                     members. For example, as in the case of the cite
                     plugin, buttons were pushed from other plugins onto
                     the multi-split-button of the Format plugin. This
                     kind of hack is obsolete and many of these
                     component properties were removed. Even if the
                     non-private property still exists, this kind of
                     hack will not work any more. For this reason
                     plugins must be refactored so that they do not
                     depend on the user interface of other plugins. Any
                     non-private component properties may be removed at
                     some time in the future.

                     Also note that the removal of the Ext.* namespace
                     and the ExtJs css may inadvertently affect the
                     behaviour and display of any site that includes
                     Aloha.

                     In particular the trim() function on the String
                     object was provided by ExtJs for older versions of
                     Internet Explorer. Since ExtJs is now gone this
                     function will now probably cause errors on older
                     versions of Internet Explorer. jQuery.trim() may be
                     used as an alternative.

- **MANUAL CHANGE**: The following files have been removed
                     src/lib/aloha/ext-alohatreeloader.js
                     src/lib/aloha/ui-browser.js

                     These files are not in use by any of the main Aloha
                     plugins and as such are deemed obsolete.

                     Custom plugins should be checked for a possible
                     dependency on these files.

- **BUG**: cite-plugin: Fixed a javascript error when the cite plugin had no explicit sidebar configuration.
