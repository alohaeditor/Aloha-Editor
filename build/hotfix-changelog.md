All changes are categorized into one of the following keywords:

- **BUG**: The change fixes a bug.
- **ENHANCEMENT**: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**: The change introduces a new feature, or modifies the function,
               usage, or intent of an existing one.

----


- **BUG**: headerids-plugin: Fixed a bug in the headerids plugin that the ids were not generated when the getContents was called.
- **BUG**: numerated-headers-plugin: Fixed a bug in the numerated-headers plugin, that the selection was not properly updated when the annotations were removed.
- **ENHANCEMENT**: numerated-headers-plugin: Added a &nbsp to the annotation, to seperate it from the heading's text.
- **BUG**: core: Fixed that sanitizing was not executed for IE7 because of an error with modifying style attributes in IE7. We now execute sanitizing, but ignore style attributes.