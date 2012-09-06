#!/bin/bash
# $Id: deploy-aloha, v 1.0 2011/10/3 15:50:00 jotschi Exp $
# 2011 - written by Johannes Schüth <j.schueth@gentics.com>

BASEDIR="$( cd "$( dirname "$0" )" && pwd )"

# Deployment url
# eg: somebody@www.somewhere.com
DURL=$1

# Deployment path
# eg: /var/www/builds/development
DPATH=$2

# Buildtimestamp
BUILDDATE=$3

echo "Using Builddate: $BUILDDATE"

if [ "$DURL" == "NA" ] || [ "$DURL" == "SKIP" ] ; then
  echo "No valid deployment url specified. I'll silently omitt deployment via ssh"
  exit 0 
fi

ZIPFILE=`ls target/alohaeditor-* | egrep -v "source|cdn"`
SOURCEFILENAME=`basename $ZIPFILE`

FILENAME=`echo $SOURCEFILENAME | sed 's/-aloha-package//'`
EXTENSION=${FILENAME##*.}
NAME=${FILENAME%.*}

FOLDERNAME=$NAME-$BUILDDATE
FILENAME=$FOLDERNAME.$EXTENSION

echo "Deploying $SOURCEFILENAME "

echo -e "\n * Removing old archive from $DPATH"
  ssh $DURL "cd $DPATH ; rm -rf $FILENAME ; rm -rf $FOLDERNAME"
echo "Done."

echo -e "\n * Removing old builds"
  ssh $DURL "find "$DPATH/" -mtime +90 -exec rm -rf {} \;"
echo "Done."

echo -e "\n * Transfering aloha archive to to target server."
  scp $BASEDIR/../target/$SOURCEFILENAME $DURL:$DPATH/$FILENAME
  ssh $DURL "cd $DPATH ; unlink latest.zip ; ln -s $FILENAME latest.zip"
echo "Done."

echo -e "\n * Extracting aloha archive at target location $DPATH"
  ssh $DURL "cd $DPATH ; unzip -o -d $DPATH/$FOLDERNAME $FILENAME"
  ssh $DURL "cd $DPATH ; unlink latest ; ln -s $FOLDERNAME latest"
echo "Done."


echo "All Done."

