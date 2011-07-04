#!/bin/sh

MYDIR=`cd \`dirname "$0"\`; pwd`
echo $MYDIR
$MYDIR/../bin/x $MYDIR/build.js "$@"
