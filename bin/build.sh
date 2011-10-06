#!/bin/bash
# $Id: build, v 1.0 2011/10/3 15:50:00 jotschi Exp $
# 2011 - written by Johannes Schüth <j.schueth@gentics.com>


BASEDIR="$( cd "$( dirname "$0" )" && pwd )"

TMP="$BASEDIR/../target/tmp/aloha"
OUT="$BASEDIR/../target/out/aloha"


function displayUsage() { 
     echo "Please add a build target configuration in $SCRIPT/../build/"
        echo "Example:"
        echo "        $SCRIPT/../build/aloha-custom"
        echo "Usage:"
        echo "        $0 aloha-custom"
        exit 1
}

function cleanup() {

        # check if out dir exists
        if [ -d "$1" ]; then
		echo -e "\n * Removing $1"
                  rm -rf $1
  		echo "Done."
        fi

        echo -e "\n * Creating $1 directory"
          mkdir -p "$1"
        echo "Done."

}

if [ "$1" != "" ]; then
	TARGET="$1"
	CONFDIR="$BASEDIR/../build/$TARGET"
	cleanup $OUT
	cleanup $TMP
	
	# check if build configuration can be found
	if [ ! -d "$CONFDIR" ]; then
	   echo "Build configuration not found. $CONFDIR. Aborting"
	   exit 10
	fi
else
	displayUsage
fi

echo -e "\n * Build core JS files"
  cd "$CONFDIR"
  r.js -o build.js
echo "Done."

echo -e "\n * Combine css files for core"
  cd "$TMP/css"
  r.js -o cssIn=aloha.css out=aloha.css
echo "Done."

echo -e "\n * Merge require and aloha-bootstrap"
  $BASEDIR/update-aloha.js.sh 
echo "Done."

echo -e "\n * Coping $TMP to $OUT"
  cp -r "$TMP" "$OUT"
echo "Done."
 
echo -e "\n * Building guide"
  $BASEDIR/build-guide.sh
echo "Done."

echo -e "\n * Adding build information"
  echo "build-date: `date`" >> $OUT/build.txt
  echo "build-target: $TARGET" >> $OUT/build.txt
echo "Done."


echo -e "\n\nAll Done. Built Aloha Editor for $TARGET"
