#!/bin/sh

MYDIR=`cd \`dirname "$0"\`; pwd`
$MYDIR/../requirejs/build/build.sh $MYDIR/aloha.build.js "$@"
