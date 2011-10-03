#!/bin/sh

echo
PWD=`pwd`
SCRIPT=`cd \`dirname "$0"\`; pwd`
if [ "$1" != "" ]; then
	TARGET="$1"
	TMP="$SCRIPT/../target/tmp/aloha"
	OUT="$SCRIPT/../target/out/aloha"
	
	#check if out dir exists
	if [ ! -d "$SCRIPT/../target/out" ]; then
		mkdir -p "$SCRIPT/../target/out"
	fi
	
	if [ -d "$SCRIPT/../build/$TARGET" ]; then
		# Clean existing dirs
		if [ -d "$TMP" ]; then
			echo "Cleaning existing temporary dir tmp/aloha"
			rm -R "$TMP"
		fi
		if [ -d "$OUT" ]; then
			echo "Cleaning existing output dir out/aloha"
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

echo "Build core JS files"
cd "$SCRIPT/../build/$TARGET"
r.js -o build.js

echo "Combine css files for core"
cd "$TMP/css"
r.js -o cssIn=aloha.css out=aloha.css

echo "Merge require and aloha-bootstrap"
cd "$SCRIPT"
./update-aloha.js.sh "target/tmp/aloha"

echo "Coping built files to out"
echo "Coping target/tmp/aloha target/out/aloha"
cp -r "$TMP" "$OUT"

echo "Adding build information"
echo "build-date: `date`" >> $OUT/build.txt
echo "build-target: $TARGET" >> $OUT/build.txt


## Change back from where we started
cd "$PWD"

echo "Built Aloha Editor for $TARGET"
