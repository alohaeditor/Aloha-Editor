#!/bin/bash
# $Id: build-api, v 1.0 2011/12/15 16:16:20 jotschi Exp $
# 2011 - written by Johannes Schüth <j.schueth@gentics.com>

BASEDIR="$( cd "$( dirname "$0" )" && pwd )"

TARGETDIR=$BASEDIR/../target/out/api

# Generic error check and abort method
function handleError() {
  if [ "$1" != "0" ]; then
     echo -e "\n\nERROR: $2"
     echo -e "Aborting with errorcode $1 \n\n"
     exit 10
  fi
}


which sc-docs > /dev/null
handleError $? "Could not find guides within PATH. Please install guides according to described procedure within genered guides."

echo -e "\n * Starting building of api documentation"
  sc-docs generate $BASEDIR/../src -v -t $BASEDIR/../doc/api/source -o $BASEDIR/../doc/api/output
  handleError $? "Error while generating api documentation."
echo "Done."

echo -e "\n * Coping api to out"
  cp $BASEDIR/../doc/api/output $BASEDIR/../target/out/api
  handleError $? "Error while coping api documentation."
echo "Done."

