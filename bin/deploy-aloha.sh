#!/bin/bash
# $Id: deploy-aloha, v 1.0 2011/10/3 15:50:00 jotschi Exp $
# 2011 - written by Johannes Schüth <j.schueth@gentics.com>

BASEDIR="$( cd "$( dirname "$0" )" && pwd )"

# Deployment url
DURL=$1
DPATH=$2

if [ "$DURL" == "NA" ] || [ "$DURL" == "SKIP" ] ; then
  echo "No valid deployment url specified. I'll silently omitt deployment via ssh"
  exit 0 
fi

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

