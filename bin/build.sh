#!/bin/sh

echo
PWD=`pwd`
SCRIPT=`cd \`dirname "$0"\`; pwd`
if [ "$1" != "" ]; then
	TARGET="$1"
	TMP="$SCRIPT/../tmp/$TARGET"
	OUT="$SCRIPT/../out/$TARGET"
	
	#check if out dir exists
	if [ ! -d "$SCRIPT/../out" ]; then
		mkdir "$SCRIPT/../out"
	fi
	
	if [ -d "$SCRIPT/../build/$TARGET" ]; then
		# Clean existing dirs
		if [ -d "$TMP" ]; then
			echo "Cleaning existing temporary dir tmp/$TARGET"
			rm -R "$TMP"
		fi
		if [ -d "$OUT" ]; then
			echo "Cleaning existing output dir out/$TARGET"
			rm -R "$OUT"
		fi
	else
		echo "Build configuration not found. $SCRIPT/../build/$TARGET"
		exit;
	fi
else
	echo "Please add a build target configuration in $SCRIPT/../build/"
	echo "Example:"
	echo "        $SCRIPT/../build/aloha-custom"
	echo "Usage:"
	echo "        $0 aloha-custom"
	exit;
fi

# build core JS files
cd "$SCRIPT/../build/$TARGET"
r.js -o build.js

# combine css files for core
cd "$TMP/css"
r.js -o cssIn=aloha.css out=aloha.css

# merge require and aloha-bootstrap
cd "$SCRIPT"
./update-aloha.js.sh "tmp/$TARGET"

# Coping builded files to out
echo "Coping tmp/$TARGET out/$TARGET"
echo
cp -r "$TMP" "$OUT"

## Change back from where we started
cd "$PWD"

echo "Builded Aloha Editor for $TARGET"
