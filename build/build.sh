root=$(pwd)
src=$root/src
tmp=$root/build/tmp
target=$tmp/aloha
entry=aloha
versioned=alohaeditor
optimization=ADVANCED_OPTIMIZATIONS
dot=" \e[0;32m•\e[0m"
tick=" \e[0;32m✔\e[0m"
ish=$(echo "https:\/\/github.com\/alohaeditor\/Aloha-Editor\/commit\/$(git rev-parse HEAD)")

function help {
	echo -e "
Aloha Editor build script

--none       build with no optimization
--simple     build with simple optimization
--source-map creates a source-mapped output in build directory
--docs       build api docs

Make sure to run this script from the project's root directory.
This means you should be calling this script like this: \`/build/build.sh\`.
Also make sure to include an .env file in the same root directory.
Your .env file should define CLOSURE_PATH=$CLOSURE_PATH.

Building without optimizations (--none) and building docs require nodejs.
Building all other build options (eg: --simple) require Google Closure Compiler
and Java.
	"
}

function clean {
	if [ -d $tmp ]; then
		printf "$dot Removing old $tmp\n"
		rm -r $tmp
	fi
	printf "$dot Creating new $tmp\n"
	mkdir $tmp
}

function build {
	clean

	if [ "$optimization" == "ADVANCED_OPTIMIZATIONS" ]; then
		printf "$dot Building with ADVANCED_OPTIMIZATIONS\n"
	else
		printf "$dot Building with SIMPLE_OPTIMIZATIONS\n"
	fi

	cd $src
	sed s/%buildcommit%/$ish/ $entry.js > $versioned.js

	find ./ -name "*.js" |                                \
	    grep -v require-pronto.js |                       \
	    grep -v require-pronto.dev.js |                   \
	    xargs java -jar $CLOSURE_PATH/compiler.jar        \
	        --compilation_level=$optimization             \
	        --common_js_entry_module=$versioned.js        \
	        --manage_closure_dependencies                 \
	        --process_common_js_modules                   \
	        --transform_amd_modules                       \
	        --output_wrapper="(function () {%output%}())" \
	        --only_closure_dependencies                   \
	        --externs $root/externs.js                    \
	        $sourcemap                                    \
	    > $target.min.js

	if [[ -n $sourcemap ]]; then
		echo -e "\n//# sourceMappingURL=aloha.js.map" >> $target.min.js
		cp -r $src/* $tmp
		printf "$tick Source maps placed in $tmp.\n"
	else
		rm $versioned.js
	fi

	printf "$tick Building is complete: $target.min.js\n"
}

function noopt {
	clean

	sed s/%buildcommit%/$ish/ $src/$entry.js > $src/$versioned.js

	node build/r.js -o                        \
	    baseUrl=$src                          \
	    name=../build/almond                  \
	    include=$versioned                    \
	    out=$target.js                        \
	    wrap.startFile=$root/build/start.frag \
	    wrap.endFile=$root/build/end.frag     \
	    optimize=none

	rm $src/$versioned.js

	printf "$tick Building is complete: $target.js\n"
}

function docs {
	printf "$dot Building API docs\n"
	cd $root
	rm -rf api; mkdir api
	jsdoc --verbose -r -d api/ -c jsdoc/conf.json src -t jsdoc -R README.md
	printf "$tick Done!\n"
}

if [ -f .env ]; then
	source .env
fi

while test $# -gt 0; do
	case "$1" in
		-h|--help)
			help
			exit 0
			;;
		--docs)
			docs
			exit 0
			;;
		--none)
			noopt
			exit 0
			;;
		--simple)
			optimization=SIMPLE_OPTIMIZATIONS
			shift
			;;
		--source-map)
			sourcemap="--create_source_map $root/build/tmp/aloha.js.map --source_map_format=V3"
			shift
			;;
	esac
done

build

