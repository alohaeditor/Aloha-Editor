#!/bin/bash
# $Id: deploy_aloha, v 1.0 2011/10/3 15:50:00 jotschi Exp $
# 2011 - written by Johannes Schüth <j.schueth@gentics.com>

SCRIPT="`readlink -f $0`" 
BASEDIR="`dirname "$SCRIPT"`"

# Deployment url
DURL=$1
DPATH=$2

echo -e "\n * Removing old archives from $DPATH"
  ssh $DURL "cd $DPATH ; rm -rf *"
echo "Done."

echo -e "\n * Transfering aloha archive to to target server."
  scp $BASEDIR/../target/*.zip $DURL:$DPATH
echo "Done."

echo -e "\n * Extracting aloha archive at target location $DPATH"
  ssh $DURL "cd $DPATH ; unzip *.zip"
echo "Done."


echo "All Done."

