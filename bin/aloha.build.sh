#!/bin/sh

PWD=`pwd`
SCRIPT=`cd \`dirname "$0"\`; pwd`

# build JS files
cd "$SCRIPT"
r.js -o aloha.build.js
./update-aloha.js.sh build

# combine css files
cd "../build/css"
r.js -o cssIn=aloha.css out=aloha.css

cd "$PWD"