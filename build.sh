function help {
	echo -e "
Aloha Editor build script

--simple      build with simple optimization - default is advanced
--source-map  creates a source-mapped output in build directory

Make sure to run this script from within the directory in which is located (ie: ./build.sh).
Also make sure to include an .env file in the same directory as this script.
Your .env file should define CLOSURE_PATH=$CLOSURE_PATH.
	"
}

pwd=$(pwd)
dot=" \e[0;32m•\e[0m"
tick=" \e[0;32m✔\e[0m"
ish=$(echo "https:\/\/github.com\/alohaeditor\/Aloha-Editor\/commit\/$(git rev-parse HEAD)")
src=src
entry=aloha
target=aloha.min.js
optimization=ADVANCED_OPTIMIZATIONS

function build {
	if [ -d $pwd/build ]; then
		printf "$dot Removing old $pwd/build\n"
		rm -r $pwd/build
	fi

	printf "$dot Creating new $pwd/build\n"
	mkdir $pwd/build
	
	if [ "$optimization" == "ADVANCED_OPTIMIZATIONS" ]; then
		printf "$dot Building with ADVANCED_OPTIMIZATIONS\n"
	else
		printf "$dot Building with SIMPLE_OPTIMIZATIONS\n"
	fi

	cd $src
	
	versioned=$entry.versioned
	sed s/%buildcommit%/$ish/ <(cat $entry.js) > $versioned.js

	find ./ -name "*.js" | \
		grep -v require-pronto.js | \
		grep -v require-pronto.dev.js | \
		xargs java -jar $CLOSURE_PATH/compiler.jar \
			--compilation_level=$optimization \
			--common_js_entry_module=$versioned \
			--manage_closure_dependencies \
			--process_common_js_modules \
			--transform_amd_modules \
			--output_wrapper="(function () {%output%}())" \
			--only_closure_dependencies \
			--externs ../externs.js \
			$sourcemap \
		> $pwd/build/$target

	rm $versioned.js

	if [[ -n $sourcemap ]]; then
		echo -e "\n//# sourceMappingURL=aloha.js.map" >> $pwd/build/$target
		cp -r $pwd/src/* $pwd/build
		printf "$tick Source maps placed in $pwd/build.\n"
	fi

	printf "$tick Building is complete.\n"
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
		--simple)
			optimization=SIMPLE_OPTIMIZATIONS
			shift
			;;
		--source-map)
			sourcemap="--create_source_map ../build/aloha.js.map --source_map_format=V3"
			shift
			;;
	esac
done

build

