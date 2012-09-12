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
