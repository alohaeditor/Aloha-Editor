# import / export string translations to / from mygengo.com

see: guides/translations.html

## export strings from gengo.com to aloha editor
import all 100 % translated strings

php gengo-export.php

import a specific language (in this case german with iso code 'de')
php gengo-export.php de


## import strings from aloha editor to gengo.com

this will prepare data to manually import to gengo.com

php gengo-export.php