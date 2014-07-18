function help {
	echo -e "
\t--s\tSource directory
\t--o\tOptimization level
\t--e\tEntry module
\t--t\tTarget file

\tor

\t--simple
\t--advanced
\t--source-map creates a source-mapped output in build

\tMake sure to include an .env file in the same directory as this script.
\tYour .env file should define ClOSURE_PATH=$CLOSURE_PATH.
	"
}

args=$*
pwd=$(pwd)
dot=" \e[0;32m•\e[0m"
tick=" \e[0;32m✔\e[0m"
ish=$(echo "https:\/\/github.com\/alohaeditor\/Aloha-Editor\/tree\/$(git rev-parse HEAD)")

function build {
	if [ -d $pwd/build ]; then
		printf "$dot Removing old $pwd/build...\n"
		rm -r $pwd/build
	fi

	printf "$dot Creating new $pwd/build...\n"
	mkdir $pwd/build
	cd $src
	printf "$dot Hang on...\n"
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

if [[ $args == "" ]]; then
	help
	exit 1
fi

if [[ $args =~ "--source-map" ]]; then
	sourcemap="--create_source_map ../build/aloha.js.map --source_map_format=V3"
else
	sourcemap=""
fi

if [[ $args =~ "--advanced" ]]; then
	src=src
	entry=aloha
	target=aloha.min.js
	optimization=ADVANCED_OPTIMIZATIONS
	printf "$dot Building with advanced optimizations...\n"
	build
	exit 1
elif [[ $args =~ "--simple" ]]; then
	src=src
	entry=aloha
	target=aloha.min.js
	optimization=SIMPLE_OPTIMIZATIONS
	printf "$dot Building with simple optimizations...\n"
	build
	exit 1
fi

if [[ $args =~ "-s=" ]]; then
	src=$(sed 's/^.*-s=\([^ ]\+\).*$/\1/' <<<"$args")
else
	src=.
fi

if [[ $args =~ "-e=" ]]; then
	entry=$(sed 's/^.*-e=\([^ ]\+\).*$/\1/' <<<"$args")
	if [ -f $pwd/$src/$entry".js" ]; then
		echo ""
	else
		echo -e "\n\tFile '$pwd/$src/$entry.js' for entry module does not exist"
		help
		exit 1
	fi
fi

if [[ $args =~ "-t=" ]]; then
	target=$(sed 's/^.*-t=\([^ ]\+\).*$/\1/' <<<"$args")
else
	target=$(echo "$(date +"%Y-%m-%d").js")
fi

if [[ $args =~ "-o=" ]]; then
	optimization=$(sed 's/^.*-o=\([^ ]\+\).*$/\1/' <<<"$args")
else
	optimization=SIMPLE_OPTIMIZATIONS
fi

build

