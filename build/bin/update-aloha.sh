#!/bin/sh

# Updates the built require-jquery.js file if either jQuery or RequireJS
# is updated. The new version of either file should be placed in this
# directory, then this command should be run.

# relative to src/lib/vendor
REQUIRE='require/require.js'
JQUERY='jquery-1.6.1.js'
EXT_ADAPT='ext-3.2.1/adapter/jquery/ext-jquery-adapter-debug.js'
EXT_ALL='ext-3.2.1/ext-all-debug.js'



## code

MYDIR=`cd \`dirname "$0"\`; pwd`
#$MYDIR/../requirejs/build/build.sh $MYDIR/aloha.build.js "$@"

LIB=$MYDIR/../../src/lib
VENDOR=$LIB/vendor

cat $VENDOR/$JQUERY > $LIB/aloha.js
echo "(function( jQuery ) {" >> $LIB/aloha.js
cat $VENDOR/$EXT_ADAPT $VENDOR/$EXT_ALL >> $LIB/aloha.js 
echo "})( jQuery );" >> $LIB/aloha.js
cat $VENDOR/$REQUIRE >> $LIB/aloha.js
cat $LIB/aloha-settings.js $LIB/aloha-bootstrap.js >> $LIB/aloha.js