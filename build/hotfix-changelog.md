All changes are categorized into one of the following keywords:

- **BUG**: The change fixes a bug.
- **ENHANCEMENT**: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**: The change introduces a new feature, or modifies the function,
               usage, or intent of an existing one.

----

- **BUG**: numerated-headers plugin: Fixed misleading interpretation of the 'numeratedactive' for configuration per editable. 'numeratedactive' will now only determine, whether headers shall be numerated by default (if button not unclicked by the editor). To disable the function for an editable, choose an empty 'headingselector'.
- **BUG**: numerated-headers plugin: Fixed numeration, when the headers are not starting with the highest level (e.g. when using h2 h1 h2 h3, the first h2 will be omitted and numeration will start at the h1)
