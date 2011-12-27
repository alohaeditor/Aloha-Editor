#!/bin/bash
# $Id: build, v 1.1 2011/10/3 15:50:00 jotschi Exp $
# 2011 - written by Johannes Schüth <j.schueth@gentics.com>


BASEDIR="$( cd "$( dirname "$0" )" && pwd )"

function displayUsage() { 
     echo "Please add a build target configuration in $SCRIPT/../build/"
        echo "Example:"
        echo "        $SCRIPT/../build/aloha-custom"
        echo "Usage:"
        echo "        $0 aloha-custom"
        exit 1
}

# Filesize check
# $1: File
# $2: Upper limit
# $3: Lower limit
function checkFilesize() {
  FILE=$1
  UPPERLIMIT="${2}000"
  LOWERLIMIT="${3}000"
  RESULTS_SIZE=`stat -c %s $FILE`
  if [ "$RESULTS_SIZE" -gt $UPPERLIMIT ] || [ "$RESULTS_SIZE" -lt $LOWERLIMIT ] ; then
    echo "Filesize of $FILE exceeded given bounds of [$UPPERLIMIT:$LOWERLIMIT] kB with $RESULTS_SIZE kB."
    exit 20
  fi
}

# Generic error check and abort method
function handleError() {
  if [ "$1" != "0" ]; then
     echo -e "\n\nERROR: $2"
     echo -e "Aborting with errorcode $1 \n\n"
     exit 10
  fi
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


# Check if the given confdir is existing
if [ "$1" != "" ]; then
	CONFDIR="$1"
	
	# check if build configuration can be found
	if [ ! -d "$CONFDIR" ]; then
	   echo "Build configuration not found. $CONFDIR. Aborting"
	   exit 10
	fi
else
	displayUsage
fi


TMP="$BASEDIR/../target/tmp/"
OUT="$BASEDIR/../target/out/"

cleanup $OUT
cleanup $TMP

echo -e "\n * Executing jslint checks"
  $BASEDIR/jslint.sh
  handleError $? "Error while checking for jslint errors"
echo "Done."

echo -e "\n * Build core JS files"
  cd "$CONFDIR"
  r.js -o build.js
  handleError $? "Error while building using r.js"
echo "Done."

echo -e "\n * Combine css files for core"
  cd "$TMP/aloha/css"
  r.js -o cssIn=aloha.css out=aloha.css
  handleError $? "Error while building csss using r.js"
echo "Done."

echo -e "\n * Merge require and aloha-bootstrap"
  $BASEDIR/update-aloha.js.sh target/tmp/aloha/lib/
  handleError $? "Error while updating aloha.js"
echo "Done."

echo -e "\n * Checking filesize of final aloha.js"
  checkFilesize "$TMP/aloha/lib/aloha.js" 2700 2500
echo "Done."

echo -e "\n * Coping $TMP/aloha to $OUT"
  cp -r "$TMP/aloha" "$OUT"
  handleError $? "Error while adding aloha build to out directory"
echo "Done."
 
echo -e "\n * Building guide"
  $BASEDIR/build-guide.sh
  handleError $? "Error while building the guide"
#echo "Done."

echo -e "\n * Building api doc"
  $BASEDIR/build-api.sh
  handleError $? "Error while building the api doc"
echo "Done."

echo -e "\n * Adding build information"
  echo "build-date: `date`" >> $OUT/aloha/build.txt
  echo "build-target: $TARGET" >> $OUT/aloha/build.txt
echo "Done."


echo -e "\n\nAll Done. Built Aloha Editor for $TARGET"
