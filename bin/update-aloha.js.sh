#!/bin/sh

# Updates the built require-jquery.js file if either jQuery or RequireJS
# is updated. The new version of either file should be placed in this
# directory, then this command should be run.

# relative to src/lib/
REQUIRE='require.js'
JQUERY='vendor/jquery-1.6.1.js'
EXT_ADAPT='vendor/ext-3.2.1/adapter/jquery/ext-jquery-adapter-debug.js'
EXT_ALL='vendor/ext-3.2.1/ext-all-debug.js'


## code

SCRIPTDIR=`cd \`dirname "$0"\`; pwd`
TARGET="src"
if [ "$1" != "" ]; then
	if [ -d "$SCRIPTDIR/../$1" ]; then
		TARGET="$1"
	else
		echo "Cannot update aloha.js in $SCRIPTDIR/../$1/lib."
		exit;
	fi
fi

LIB="$SCRIPTDIR/../$TARGET/lib"
cat /dev/null > "$LIB/aloha.js"

echo "$LIB/$REQUIRE"
cat "$LIB/$REQUIRE" >> "$LIB/aloha.js"

echo "$LIB/$JQUERY"
cat "$LIB/$JQUERY" >> "$LIB/aloha.js"

echo "$LIB/$EXT_ADAPT + $LIB/$EXT_ALL"
echo "(function( jQuery ) {" >> "$LIB/aloha.js"
cat "$LIB/$EXT_ADAPT" "$LIB/$EXT_ALL" >> "$LIB/aloha.js" 
echo "})( jQuery );" >> "$LIB/aloha.js"

echo "$LIB/aloha-bootstrap.js"
cat "$LIB/aloha-bootstrap.js" >> "$LIB/aloha.js"

echo "Updated $LIB/aloha.js."