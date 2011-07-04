#!/bin/sh

MYDIR=`cd \`dirname "$0"\`; pwd`
$MYDIR/../requirejs/bin/x $MYDIR/build.js "$@"
