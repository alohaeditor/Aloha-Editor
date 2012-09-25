* import / export string translations to / from mygengo.com *

usage:

*** export strings from mygengo to aloha editor ***
change: define("ENVIRONMENT_LIVE", false);
set to true for live environment

php -f mygengo-export.php


*** import strings from aloha editor to mygengo ***
php -f mygengo-export.php