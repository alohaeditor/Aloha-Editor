- **MANUAL CHANGE**: Added the ui-plugin and removed ui specific code from the Aloha core

                     Due to a complete re-implementation of the Aloha
                     user interface in the form of the ui-plugin, most
                     of the ui specific Aloha API has changed.

                     (In the following, ui/x.js refers to src/plugins/common/ui/lib/x.js.)

                     * Aloha.ui.AttributeField
                       See ui/autocomplete.js

                     * Aloha.ui.Button
                       See ui/button.js and ui/toggleButton.js

                     * Aloha.ui.MultiSplitButton
                       See ui/multiSplitButton

                     * Aloha.Message
                       See ui/message

                     * Aloha.settings.plugins.table.summaryinsidebar

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

                     Also note that any references to the Ext.* namespace
                     may not resolve any more.

- **MANUAL CHANGE**: The following files have been removed
                     src/lib/aloha/ext-alohatreeloader.js
                     src/lib/aloha/ui-browser.js

                     These files are not in use by any of the main Aloha
                     plugins and as such are deemed obsolete.

                     Custom plugins should be checked for a possible
                     dependency on these files.
