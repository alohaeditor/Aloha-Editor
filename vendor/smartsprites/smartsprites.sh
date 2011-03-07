#!/bin/sh

#
# Add extra JVM options here
#
OPTS="-Xms64m -Xmx256m"

java $OPTS -Djava.ext.dirs=lib org.carrot2.labs.smartsprites.SmartSprites "$@"
