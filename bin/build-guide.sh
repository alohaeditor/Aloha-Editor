#!/bin/bash
# $Id: build-guide, v 1.0 2011/10/3 15:50:00 jotschi Exp $
# 2011 - written by Johannes Schüth <j.schueth@gentics.com>

SCRIPT="`readlink -f $0`" 
BASEDIR="`dirname "$SCRIPT"`"

TARGETDIR=$BASEDIR/../target/out/doc

# Generic error check and abort method
function handleError() {
  if [ "$1" != "0" ]; then
     echo -e "\n\nERROR: $2"
     echo -e "Aborting with errorcode $1 \n\n"
     exit 10
  fi
}

# Check if guides is there
which guides > /dev/null
handleError $? "Could not find guides within PATH. Please install guides according to described procedure within genered guides."

echo -e "\n * Creating $TARGETDIR"
  mkdir -p $TARGETDIR
  handleError $? "Error while creating target directory"
echo "Done."

echo -e "\n * Building guides"
  cd $BASEDIR/../doc/guides
  handleError $? "Could not find guides directory"
  
  rm -rf output
  handleError $? "Could not remove old output directory"

  guides build
  handleError $? "Error while building guides"
echo "Done."

echo -e "\n * Coping output files to $TARGETDIR"
  cp -ra output $TARGETDIR
  cp -ra assets/* $TARGETDIR
echo "Done."

echo -e "\n * Coping README to out"
  cp $BASEDIR/../doc/README $BASEDIR/../target/out
  handleError $? "Error while coping readme"
echo "Done."

