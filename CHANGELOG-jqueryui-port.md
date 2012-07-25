- **ENHANCEMENT**: Wrapping some Aloha.require calls in Aloha.ready calls is not necessary any more

    In some cases, wrapping an Aloha.require call in an Aloha.ready call
    is not necessary any more. There are some exceptions, because the
    module itself may assume that Aloha is ready before its API is used.

    At the time of this writing this affects most plugins, since most
    plugins are initialized when Aloha is ready. So, calling
    Aloha.require with the plugin as a dependency will work, but the API
    will likely not be initialized resulting in unpredictable behavior.

- **MANUAL CHANGE**: Most plugins don't load their css files through require any more

    Before this change, plugins loaded the necessary css automatically.
    Now, it is necessary to include aloha/css/aloha.css to get the css
    that is necessary to make plugins work.

- **MANUAL CHANGE**: baseUrl and data-aloha-plugins attribute detection changed slightly

    This change can be ignored if aloha.js is loaded in a page where
    only a single script element refers to a file with this name and if
    this script include is also the one carrying the data-aloha-plugins
    attribute, and no other script include is carrying this attribute -
    this should normally be the case. If this is not the case, aloha may
    not load correctly due to this change.

    The exact rules are now as follows:

    If Aloha.settings.baseUrl is not specified, it will be taken from
    the first script element that has a data-aloha-plugins attribute,
    or, if there is no such script element, the first script element of
    which the src attribute matches /\/aloha.js$/.
     
    If Aloha.settings.plugins.load is not specified, it will be taken
    from the data-aloha-plugins attribute of the first script element
    carrying this attribute.

- **MANUAL CHANGE**: The Aloha.requirePaths property has been removed.

- **MANUAL CHANGE**: The jquery.store and jquery.json plugins have been removed

    The jquery.store plugin was used for persisting the floating menu
    position and pinned state. The functionality provided by
    jquery.store has been replaced with amplify.store.

    The jquery.json plugin has been removed since the functionality
    provided by this module is already provided by util/json2.

    This also fixes the problem that pinning the floating menu was not
    persisted in IE8 and below.

- **MANUAL CHANGE**: requirejs is not loaded as part of Aloha-Editor

    For aloha development the user must now load requirejs himself
    before loading aloha.js.

    When using a built version of Aloha, it's possible to choose between
    aloha-bare.js, which doesn't include requirejs (or jQuery), and
    aloha-full.js, which does include requirejs (and jQuery).

- **MANUAL CHANGE**: Properties exposed by Aloha.Selection or aloha/selection were changed

    - tagHierarchy
    - replacingElements
    - allowedToStealElements

    These properties are now maps of maps instead of maps of lists.

- **MANUAL CHANGE**: Aloha.define was removed as it didn't serve any purpose

- **MANUAL CHANGE**: The jQuery loaded by Aloha no longer performs a call to $.noConflict.

    The combined and minified aloha-full.js will contain the call to
    $.noConflict to preserve behaviour with earlier Aloha builds

    The combined and minified aloha-bare.js, or the unminified and
    uncombined form used during development, will not contain the call
    to $.noConflict.

    Aloha now loads jQuery asynchronously, unless the user passes in a
    jQuery instance himself. It is difficult to predictably call
    $.noConflict after loading jquery asynchronously - the global jQuery
    and $ variables may or may not be set to the jQuery loaded by Aloha
    for some time after loading has finished, resulting in possibly
    unpredictable behaviour if multiple jQuery instances are used.

    It is up to the user to load jQuery, call noConflict himself, and
    pass jQuery into Aloha via Aloha.settings.predefinedModules or
    Aloha.settings.jQuery.

- **ENHANCEMENT**: Aloha specific css rules that are not in use any more were removed:

    .aloha-editable-zerowidthfix
    .aloha-logo
    .aloha-maximize

- **MANUAL CHANGE**: The jquery requirejs dependency was renamed from aloha/jquery to just jquery.

    define(['aloha/jquery', function($) { });

    must be changed to

    define(['jquery', function($) { });

- **MANUAL CHANGE**: The following jQuery extensions were removed

    jQuery.isBoolean - Instead consider typeof x === 'boolean'. 
    jQuery.isEmpty

- **MANUAL CHANGE**: The default jQuery version distributed with Aloha was updated from 1.6.1 to 1.7.2.

    The jQuery.isNumeric extension added to jQuery by Aloha was removed
    to account for jQuery's own isNumeric function added in 1.7.

- **MANUAL CHANGE**: The browser plugin was removed

    The browser plugin is obsolete. Please see linkbrowser and
    imagebrowser plugins.

- **MANUAL CHANGE**: Added the ui-plugin and removed ui specific code from the Aloha core

    Due to a complete re-implementation of the Aloha user interface in
    the form of the ui-plugin, most of the ui specific Aloha API has
    changed.

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

      This setting decided whether the summary was displayed either in
      the side bar or in the floating-menu. This setting now only
      decides whether or not a summary is displayed in the sidebar.

      The table-plugin defines a component with the name
      tableSummary. It is up to the toolbar configuration whether or not
      this component is displayed in the toolbar.

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

      It is now up to the toolbar configuration whether or not and how
      to display these components.

    * Selection.isFloatingMenuVisible - removed
 
    All settings associated with the removed components do not have any
    effect any more.

    Most Aloha css rules have been re-implemented.
    
    In particular, the Aloha block handles now have z-index 10000, the
    floating menu has 10100, and Aloha dialogs have 10200. The sidebar
    continues to have a z-index of 999999999.

    The new common/ui plugin is now required for the user interface to
    be shown. This plugin is not loaded automatically. Most plugins
    require a user interface and will fail to load if this plugin is not
    configured to be loaded.

    The requirejs plugins order! and jquery-plugin!  have been removed.

    Many plugins exposed buttons, attribute-field and multi-split-button
    components as non-private members. For example, as in the case of
    the cite plugin, buttons were pushed onto the exposed
    multi-split-button of the Format plugin. Most of these exposed
    components were removed.

    The removal of the Ext.* namespace and the ExtJs css may
    inadvertently affect the behaviour and display of any site that
    includes Aloha.

    In particular the trim() function on the String object was provided
    by ExtJs for older versions of IE. Since ExtJs is gone, calling this
    function will now probably cause errors on older versions of
    IE. jQuery.trim() may be used as an alternative.

    See the ui.html guide for more information about the new UI.

- **MANUAL CHANGE**: Several files have been removed

    - src/lib/aloha/ext-alohatreeloader.js
    - src/lib/aloha/ui-browser.js
    - src/lib/aloha/ecma5.js

    These files are not in use by any of the main Aloha plugins and as
    such are deemed obsolete. These files were never loaded and their
    removal should not have any side-effect.

    Custom plugins should be checked for a possible dependency on these
    files.

- **BUG**: cite-plugin: Fixed a javascript error when the cite plugin had no explicit sidebar configuration.

- **ENHANCEMENT**:  It's now possible to deactivate the transformFormattings method
    in the genericcontenthandler with the following setting:
    
    Aloha.settings.contentHandler.handler.generic.transformFormattings = false
    
    By default the transformFormattings method is enabled.

- **DISCUSS**:      It would make sense to support also input (like textarea) elements
    eg. for basic formattings like strong / em -- but prevent insertation of br / p ?

- **MANUAL CHANGE**:    HotKey for inserting links is changed back to ctrl+k like documented here:
    https://github.com/alohaeditor/Aloha-Editor/blob/dev-jqueryui-ultra/doc/guides/source/core_hotkey.textile

- **BUG**: abbr-plugin: Fixed a javascript error when Aloha.activeEditable.obj / Aloha.activeEditable was not defined

- **MANUAL CHANGE**: Updated naming from Aloha to Aloha Editor in boilerplate demo

