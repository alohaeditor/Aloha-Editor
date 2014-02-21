args=$*

function help {
	echo -e "
\t--s\tSource directory
\t--o\tOptimization level
\t--e\tEntry module
\t--t\tTarget file

\tor

\t--advanced
	"
}

function build {
	cd $src
	find ./ -name "*.js" | \
		grep -v mandox.js | \
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
		> $wd/$target
}

if [ -f .env ]; then
	source .env
fi

if [[ $args == "" ]]; then
	help
	exit
fi

wd=$(pwd)

if [[ $args =~ "--advanced" ]]; then
	src=src
	entry="--common_js_entry_module=aloha"
	target=build/aloha.js
	optimization=ADVANCED_OPTIMIZATIONS
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

