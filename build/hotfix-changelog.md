All changes are categorized into one of the following keywords:

- **BUGFIX**: The change fixes a bug.
- **ENHANCEMENT**: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**: The change introduces a new feature, or modifies the function,
               usage, or intent of an existing one.

----

- **BUGFIX**: Empty tabs will no longer show on the toolbar

- **BUGFIX**: Merging table cells which contains &nbsp; will no longer result
              in the cell that was merged having unnecessary white spaces.

- **BUGFIX**: Setting transformFormattings to true in the generic handler, and
              allowing the U tag, will no longer result in the elimination of
              the U tags

- **ENHANCEMENT**: Filters the tags used in transformFormattings, extracting the
                   tags setted in the elements allowed setting

- **BUGFIX**: Textcolor button on toolbar not longer have style superposition
              when have styles applied to td or you have jquery-ui styles

- **BUGFIX**: The extra plugin headerids not longer result in duplicated id when 
              have duplicated headers title

- **ENHANCEMENT**: Added trimWhitespaceCharacters method in util/html to remove 
                   the weirds whitespace characters, this is necessary in 
                   Internet Explorer 7

- **ENHANCEMENT**: The extra plugin headerids now uses PubSub.sub instead 
                   Aloha.bind, when is available


- **ENHANCEMENT**: The editable Class now publish the message 
                   aloha.editable.deactivated via PubSub

