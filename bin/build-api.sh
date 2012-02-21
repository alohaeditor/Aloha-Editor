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
handleError $? "Could not find sc-docs within PATH. Please install sc-docs according to described procedure within genered guides."

mkdir -p $TARGETDIR

echo -e "\n * Starting building of api documentation"
  sc-docs generate $BASEDIR/../src/lib/aloha -t $BASEDIR/../doc/api/source -o $TARGETDIR
  handleError $? "Error while generating api documentation."
echo "Done."

