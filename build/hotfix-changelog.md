All changes are categorized into one of the following keywords:

- **BUG**: The change fixes a bug.
- **ENHANCEMENT**: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**: The change introduces a new feature, or modifies the function,
               usage, or intent of an existing one.

----

- **BUG**: added the del format button to the possible format plugin buttons

	The del button is not enabled by default. To enable it, it has to
	be configured. For example

	Aloha.settings.plugins.format.config = ['del', ...];

	See http://aloha-editor.org/guides/plugin_format.html

- **BUG**: characterpicker-plugin: Fixed a bug that when inserting a special character using the character picker plugin, the focus would be sometimes set to the start of the active editable (e.g. when inserting into a table cell).
- **BUG**: listenforcer-plugin: Fixed a bug that would only mark the first editable matching a configured selector as an enforced editable. Also when leaving an editable, we now remove the added list properly.
- **FEATURE**: metaview: We now also display HR tags in the metaview. We also removed the dependency to the flag-icons plugin.
- **FEATURE**: list-plugin: When transforming a list from ul to ol or back all sub elements that are selected are also transformed.
- **BUG**: core: Sometimes when putting the cursor at the first position of an editable, the cursor would vanish or be put outside the editable. This has been fixed.
- **FEATURE**: core: Added method Aloha.getEditableHost() to get the editable, that contains the given jQuery object.
- **FEATURE**: repository browser: If one of the repositories runs into a timeout during query, the browser will now call the method handleTimeout().
- **FEATURE**: abbr-plugin: We added a remove abbreviation button to make the functionality more consistent with the wai-lang plugin.
- **FEATURE**: core: makeClean is in the process of being obsoleted in favor of the aloha/ephemera.js module. See http://aloha-editor.org/guides/writing_plugins.html
