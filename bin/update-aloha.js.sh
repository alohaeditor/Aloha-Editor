#!/bin/bash
# Updates the aloha.js file. This script should be executed when require-jquery.js and/or jQuery and/or RequireJS
# is updated. The first argument will be the target directory in which the aloha.js will be generated. 

# relative to src/lib/
REQUIRE='require.js'
JQUERY='vendor/jquery-1.6.1.js'
EXT_ADAPT='vendor/ext-3.2.1/adapter/jquery/ext-jquery-adapter-debug.js'
EXT_ALL='vendor/ext-3.2.1/ext-all-debug.js'


# Generic error check and abort method
function handleError() {
  if [ "$1" != "0" ]; then
     echo -e "\n\nERROR: $2"
     echo -e "Aborting with errorcode $1 \n\n"
     exit 10
  fi
}

# Simple usage message
function displayUsage() { 
        echo "Please add a target directory argument."
        echo "Example:"
        echo "        src"
        echo "Usage:"
        echo "        $0 [TARGET_DIRECTORY]"
        exit 1
}

SCRIPTDIR=`cd \`dirname "$0"\`; pwd`
SOURCE="$SCRIPTDIR/../src/lib"
TARGET="$SCRIPTDIR/../src"

if [ "$1" != "" ]; then
	TARGET="$SCRIPTDIR/../$1"
	# Check if the user defined target directory exists
	if [ ! -d "$TARGET" ]; then
		echo "Cannot update aloha.js in $TARGET since the directory could not be found."
		displayUsage
	fi
else
        displayUsage
fi 


echo "Generating aloha.js in $TARGET"
echo > "$TARGET/aloha.js"

echo "Adding $REQUIRE"
cat "$SOURCE/$REQUIRE" >> "$TARGET/aloha.js"
handleError $? "Could not add file to aloha.js"

echo "Adding $JQUERY"
cat "$SOURCE/$JQUERY" >> "$TARGET/aloha.js"
handleError $? "Could not add file to aloha.js"

echo "Adding $EXT_ADAPT"
echo "Adding $EXT_ALL"
echo "(function( jQuery ) {" >> "$TARGET/aloha.js"
cat "$SOURCE/$EXT_ADAPT" "$SOURCE/$EXT_ALL" >> "$TARGET/aloha.js" 
handleError $? "Could not add file to aloha.js"
echo "})( jQuery );" >> "$TARGET/aloha.js"

echo "Adding aloha-bootstrap.js"
cat "$SOURCE/aloha-bootstrap.js" >> "$TARGET/aloha.js"
handleError $? "Could not add file to aloha.js"

echo "Updated $TARGET/aloha.js."
