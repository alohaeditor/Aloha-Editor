define(['jquery'],function($){

	function wordList(str) {
		// "  x  ".split(/\s/) -> ["", "x", ""] (Chrome)
		var list = $.trim(str).split(/\s+/);
		// "".split(/\s/) -> [""] (Chrome)
		return (list.length && list[0] === "") ? [] : list;
	}

	return {
		'wordList': wordList
	};
});
