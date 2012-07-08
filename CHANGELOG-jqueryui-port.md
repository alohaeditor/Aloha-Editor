- **MANUAL CHANGE**: Properties exposed by Aloha.Selection or aloha/selection were changed
                     tagHierarchy
                     replacingElements
                     allowedToStealElements
                     These properties are now maps of maps instead of maps of lists.

- **MANUAL CHANGE**: Aloha.define was removed as it didn't serve any purpose

- **MANUAL CHANGE**: The jQuery loaded by Aloha no longer performs a call to $.noConflict.

                     Aloha now loads jQuery asynchronously. It is
                     difficult to predictably call $.noConflict after
                     loading jquery asynchronously - the global jQuery
                     and $ variables may or may not be set to the jQuery
                     loaded by Aloha for some time after loading has
                     finished, resulting in possibly unpredictable
                     behaviour if multiple jQuery instances are used.

                     It is up to the user to load jQuery, call
                     noConflict himself, and pass jQuery into Aloha via
                     Aloha.settings.predefinedModules.

- **ENHANCEMENT**: It is now possible to pass in any third party
                   dependencies, for example:

                   Aloha.settings.predefinedModules = {'jquery': window.jQuery, 'jqueryui': window.jQuery.ui}

                   Aloha will not try to load any of the dependencies defined in this way.

                   Please note that if jqueryui is defined, a jquery
                   dependency must also be defined, and the given
                   jqueryui dependency must extend the given jquery
                   dependency. The same rule holds for any other jquery
                   plugins.

                   It is also possible to define alternative paths to
                   third party dependencies, for example:

                   Aloha.settings.requireConfig.paths = {'jquery': '/my/jquery.js'};

                   This will override the default location Aloha loads jquery from.

                   Please note that any dependency defined in this way must have an AMD define.

                   Care must be taken with both settings. Passing in a
                   dependency that has a different version from the
                   dependency that is loaded by default may result in
                   unpredictable behaviour.

                   Also, the third part libraries that come with Aloha
                   may have been patched to fix bugs or increase
                   performance. See the git log for each third party
                   library for further information before redefining it.

- **ENHANCEMENT**: Aloha specific css rules that are not in use any more were removed:

                   .aloha-editable-zerowidthfix
                   .aloha-logo
                   .aloha-maximize

- **MANUAL CHANGE**: The jquery requirejs dependency was renamed from aloha/jquery to just jquery.

- **MANUAL CHANGE**: The jQuery.isBoolean extension added to jQuery by Aloha was removed.
                     Instead consider typeof x === 'boolean'. 

- **ENHANCEMENT**: The default jQuery version distributed with Aloha was updated from 1.6.1 to 1.7.2.
                   The jQuery.isNumeric extension added to jQuery by Aloha was removed to
                   account for jQuery's own isNumeric function added in 1.7.

- **MANUAL CHANGE**: The browser plugin was removed

                     The browser plugin is obsolete. Please see
                     linkbrowser and imagebrowser plugins for
                     alternatives.

- **MANUAL CHANGE**: Added the ui-plugin and removed ui specific code from the Aloha core

                     Due to a complete re-implementation of the Aloha
                     user interface in the form of the ui-plugin, most
                     of the ui specific Aloha API has changed.

                     * FloatingMenu - removed

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

                        Aloha.settings.plugins.image.ui.oneTab
                        Aloha.settings.plugins.image.ui.insert
                        Aloha.settings.plugins.image.ui.meta
                        Aloha.settings.plugins.image.ui.reset
                        Aloha.settings.plugins.image.ui.align
                        Aloha.settings.plugins.image.ui.margin
                        Aloha.settings.plugins.image.ui.crop
                        Aloha.settings.plugins.image.ui.resize
                        Aloha.settings.plugins.image.ui.aspectRatioToggle

                       It is now up to the toolbar configuration whether or
                       not and how to display these components.

                     * Selection.isFloatingMenuVisible - removed
 
                     All settings associated with the removed components
                     do not have any effect any more.

                     Most Aloha css rules have been re-implemented.
                     
                     In particular, the Aloha block handles now have
                     z-index 10000, the floating menu has 10100, and
                     Aloha dialogs have 10200. The sidebar continus to
                     have a z-index of 999999999.

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
                     plugin, buttons were pushed onto the exposed
                     multi-split-button of the Format plugin. Most of
                     these exposed components were removed.

                     The removal of the Ext.* namespace and the ExtJs
                     css may inadvertently affect the behaviour and
                     display of any site that includes Aloha.

                     In particular the trim() function on the String
                     object was provided by ExtJs for older versions of
                     IE. Since ExtJs is gone, calling this function will
                     now probably cause errors on older versions of
                     IE. jQuery.trim() may be used as an alternative.

- **MANUAL CHANGE**: The following files have been removed
                     src/lib/aloha/ext-alohatreeloader.js
                     src/lib/aloha/ui-browser.js
                     src/lib/aloha/ecma5.js

                     These files are not in use by any of the main Aloha
                     plugins and as such are deemed obsolete. These
                     files were never loaded and their removal should not
                     have any side-effect.

                     Custom plugins should be checked for a possible
                     dependency on these files.

- **BUG**: cite-plugin: Fixed a javascript error when the cite plugin had no explicit sidebar configuration.
