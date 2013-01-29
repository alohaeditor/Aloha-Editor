# Import / export string translations to / from gengo.com


## Export strings from gengo.com to Aloha Editor

To import all 100 % translated strings use the following command:

    php gengo-export.php

To import a specific language (in this case German with the ISO 639-1 code 'de') use:

    php gengo-export.php de

To get a list of all available languages type:

    php gengo-export.php -h


## Import strings from Aloha Editor to gengo.com

The following command will prepare the data to manually import it to gengo.com:

    php gengo-import.php


## Further information

For further information navigate to the [Translation Guide](http://aloha-editor.org/guides/translations.html)
