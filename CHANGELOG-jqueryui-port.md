- **MANUAL CHANGE**: Added the ui-plugin and removed ui specific code from the Aloha core

                     Due to a complete re-implementation of the Aloha
                     user interface in the form of the ui-plugin, most
                     of the ui specific Aloha API has changed.

                     (In the following, ui/x.js refers to src/plugins/common/ui/lib/x.js.)

                     * FloatingMenu - removed
                       There is now a new toolbar implementation in the ui plugin.

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
                     any time in the future.

                     Also note that any references to the Ext.* namespace
                     may not resolve any more.

- **MANUAL CHANGE**: The following files have been removed
                     src/lib/aloha/ext-alohatreeloader.js
                     src/lib/aloha/ui-browser.js

                     These files are not in use by any of the main Aloha
                     plugins and as such are deemed obsolete.

                     Custom plugins should be checked for a possible
                     dependency on these files.

- **BUG**: cite-plugin: Fixed a javascript error when the cite plugin had no explicit sidebar configuration.
