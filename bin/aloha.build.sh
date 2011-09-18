#!/bin/sh

PWD=`pwd`
SCRIPT=`cd \`dirname "$0"\`; pwd`
STAGGINGNAME="tmp"
BUILD="$SCRIPT/../$STAGGINGNAME"

# build core JS files
cd "$SCRIPT"
r.js -o aloha.build.js
./update-aloha.js.sh "$STAGGINGNAME"

# combine css files for core
cd "$BUILD/css"
r.js -o cssIn=aloha.css out=aloha.css


## Change back from where we started
cd "$PWD"