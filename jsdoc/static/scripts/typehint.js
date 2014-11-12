$(function ($) {
	var fmatch = document.location.href.match(/#(\w+)/);
	var tmatch = document.location.href.match(/\?types=([\w-]+)/);
	if (!(fmatch && tmatch)) {
		return;
	}
	
	var func  = fmatch[1];
	var types = tmatch[1].split('-');
	
	var $types = $('#' + func).parent().parent().next().find('.type .param-type');
	var DELAY = 300;

	function compareType (expected, provided) {
		if (expected === '*') {
			return true;
		}
		if (expected === 'Node' && provided === 'Element') {
			return true;
		}
		if (expected === provided) {
			return true;
		}
		return false;
	}

	function checkTypes (typesToCheck, i) {
		i = i || 0;
		var t = typesToCheck.shift();
		var $t = $($types.get(i));
		var expected = $t.text();
		
		if (compareType(expected, t)) {
			$t
				.addClass('ok')
				.parent()
				.prepend('&check; ');
		} else {
			$t
				.addClass('error')
				.parent()
				.prepend('&#215; ')
				.next()
				.prepend('<p><b>Error:</b> <i>Expected <span class="param-type error">' +
					expected +
					'</span>, you passed <span class="param-type error">' +
					t +
					'</span></i></p>');
		}

		if (typesToCheck.length) {
			setTimeout(function () { checkTypes(typesToCheck, ++i);	}, DELAY);
		}
	}
	
	setTimeout(function () { checkTypes(types);	}, DELAY);
});