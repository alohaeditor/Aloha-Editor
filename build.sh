args=$*

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

function build {
	cd $src
	find ./ -name "*.js" | \
		grep -v require-pronto.js | \
		grep -v require-pronto.dev.js | \
		xargs java -jar $CLOSURE_PATH/compiler.jar \
			--compilation_level=$optimization \
			$entry \
			--manage_closure_dependencies \
			--process_common_js_modules \
			--transform_amd_modules \
			--output_wrapper="(function () {%output%}())" \
			--only_closure_dependencies \
			--externs ../externs.js \
			$sourcemap \
		> $wd/$target

	if [[ -n $sourcemap ]]; then
		echo -e "\n//# sourceMappingURL=aloha.js.map" >> $wd/$target
		cp -r $wd/src/* $wd/build
	fi
}

if [ -f .env ]; then
	source .env
fi

if [[ $args == "" ]]; then
	help
	exit
fi

wd=$(pwd)

if [[ $args =~ "--source-map" ]]; then
	sourcemap="--create_source_map ../build/aloha.js.map --source_map_format=V3"
else
	sourcemap=""
fi

if [[ $args =~ "--advanced" ]]; then
	src=src
	entry="--common_js_entry_module=aloha"
	target=build/aloha.min.js
	optimization=ADVANCED_OPTIMIZATIONS
	build
	exit
elif [[ $args =~ "--simple" ]]; then
	src=src
	entry="--common_js_entry_module=aloha"
	target=build/aloha.min.js
	optimization=SIMPLE_OPTIMIZATIONS
	build
	exit
fi

if [[ $args =~ "-s=" ]]; then
	src=$(sed 's/^.*-s=\([^ ]\+\).*$/\1/' <<<"$args")
else
	src=.
fi

if [[ $args =~ "-e=" ]]; then
	entry=$(sed 's/^.*-e=\([^ ]\+\).*$/\1/' <<<"$args")
	if [ -f $wd"/"$src"/"$entry".js" ]; then
		echo ""
	else
		echo -e "\n\tFile '$wd/$src/$entry.js' for entry module does not exist"
		help
		exit
	fi
	entry="--common_js_entry_module=$entry"
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

