
 !! PLEASE NO LONGER ADD ENTRIES TO THIS FILE !!
http://www.alohaeditor.org/guides/develop_aloha.html#changelog


- **BUGFIX**: highlighteditables plugin: When using nested editables, isModfied()
              would sometimes detect a change although the content is untouched.
              This was due to highlighteditables plugin, which previously didn't
              register the aloha-editable-highlight css class as ephemeral.
              RT#52589
