# Temporary Makefile for Aloha Developers
# This should be replaced with something that works on Windows + Mac... perhaps a ANT command.

MAKEFLAGS = --no-print-directory --always-make
MAKE = make $(MAKEFLAGS)

install:
	git submodule init;
	git submodule update;
	git submodule foreach --recursive 'git reset --hard; git branch -D stable; git checkout -b stable origin/stable; git branch -D master; git checkout -b master origin/master; git branch -D dev; git branch dev; git checkout dev; git merge stable; git merge master; git submodule init; git submodule update';

add:
	git add -u;

build:
	cd build; ant all; cd ..;

push:
	git push origin --all;