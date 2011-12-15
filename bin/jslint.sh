#!/bin/bash
# $Id: build-guide, v 1.0 2011/12/15 15:54:21 jotschi Exp $
# 2011 - written by Johannes Schüth <j.schueth@gentics.com>

BASEDIR="$( cd "$( dirname "$0" )" && pwd )"


# Generic error check and abort method
function handleError() {
  if [ "$1" != "0" ]; then
     echo -e "\n\nERROR: $2"
     echo -e "Aborting with errorcode $1 \n\n"
     exit 10
  fi
}

which jslint > /dev/null
handleError $? "Could not find jslint within PATH. Please install jslint according to described procedure within generated guides."

echo -e "\n * Starting jslint check of aloha editor core"
  JSLINT_OUTPUT=$BASEDIR/../target/jslint-core.out
  find $BASEDIR/../src/lib/aloha -name "*.js" -exec jslint {} \; > $JSLINT_OUTPUT
  JSLINT_EXIT_CODE=$?
  if [ $JSLINT_EXIT_CODE -ne "123" ]  ; then
     handleError $JSLINT_EXIT_CODE "JSLint check was not executed sucessfully"
  fi
  JSLINT_ERROR_COUNT=`cat $JSLINT_OUTPUT | wc -l`
  echo $JSLINT_ERROR_COUNT
echo "Done."

echo -e "\n * Starting jslint check of plugins directory"
  JSLINT_OUTPUT=$BASEDIR/../target/jslint-plugins.out
  find $BASEDIR/../src/plugins -name "*.js" -exec jslint {} \; > $JSLINT_OUTPUT
  JSLINT_EXIT_CODE=$?
  if [ $JSLINT_EXIT_CODE -ne "123" ]  ; then
     handleError $JSLINT_EXIT_CODE "JSLint check was not executed sucessfully"
  fi
  JSLINT_ERROR_COUNT=`cat $JSLINT_OUTPUT | wc -l` 
  echo $JSLINT_ERROR_COUNT
echo "Done."

