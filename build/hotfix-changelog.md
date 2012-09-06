All changes are categorized into one of the following keywords:

- **BUG**: The change fixes a bug.
- **ENHANCEMENT**: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**: The change introduces a new feature, or modifies the function,
               usage, or intent of an existing one.

----

- **BUG**: characterpicker-plugin: Fixed a bug that when inserting a special character using the character picker plugin, the focus would be sometimes set to the start of the active editable (e.g. when inserting into a table cell).
- **BUG**: listenforcer-plugin: Fixed a bug that would only mark the first editable matching a configured selector as an enforced editable. Also when leaving an editable, we now remove the added list properly.
- **BUG**: floatingmenu: Fixed a bug in the floating menu that the position would not be adjusted if the height of the floating menu changed. This is needed in the topalign mode to not hide parts of the editable.