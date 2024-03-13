#!/bin/sh

# Default build profile.
BUILD_PROFILE=build-profile-with-common-extra-plugins

# Make sure we are in the top-level directory of the project.
cd $(dirname $(readlink -f "$0"))/..

# If a valid build profile was passed as argument, use that one.
if [ -f "build/aloha/${1%.js}.js" ]
then
	BUILD_PROFILE="${1%.js}"
fi

run_command() {
	MSG="$1"

	echo $MSG

	shift

	eval "$1"

	RESULT=$?

	if [ $RESULT != 0 ]
	then
		echo "Error while executing '$@', aborting build"

		exit $RESULT
	fi

	echo "(${MSG}done)"
	echo
}

run_command "Installing dependencies..." "npm install -SD --no-fund --no-audit"
run_command "Performing linting..." "npx eslint src/lib"
run_command "Building Aloha-Editor $BUILD_PROFILE..." "npx r.js -o 'build/aloha/$BUILD_PROFILE.js'"

run_command "Building Aloha-Editor $BUILD_PROFILE (full)..." "cat build/aloha/license-header.frag target/$BUILD_PROFILE/lib/require.js target/$BUILD_PROFILE/lib/vendor/jquery-3.7.0.js target/$BUILD_PROFILE/lib/aloha.js > target/$BUILD_PROFILE/lib/aloha-full.js"
run_command "Building Aloha-Editor $BUILD_PROFILE (full; minified)..." "npx uglifyjs target/$BUILD_PROFILE/lib/require.js target/$BUILD_PROFILE/lib/vendor/jquery-3.7.0.js target/$BUILD_PROFILE/lib/aloha.js --compress --mangle --source-map --output 'target/$BUILD_PROFILE/lib/aloha-full.min.js'"

run_command "Building Aloha-Editor $BUILD_PROFILE (bare)..." "cat build/aloha/license-header.frag target/$BUILD_PROFILE/lib/aloha.js > target/$BUILD_PROFILE/lib/aloha-bare.js"
run_command "Building Aloha-Editor $BUILD_PROFILE (bare; minified)..." "npx uglifyjs target/$BUILD_PROFILE/lib/aloha.js --compress --mangle --source-map --output 'target/$BUILD_PROFILE/lib/aloha-bare.min.js'"

run_command "Building Aloha-Editor CSS..." "npx postcss src/css/aloha-common-extra.css -o 'target/$BUILD_PROFILE/css/aloha.css'"
