(function (aloha, $, CodeMirror) {
	'use strict';

	var VENDOR_PREFIX = (function () {
		var elem = document.createElement('div');
		var prefixes = ['', '-webkit-', '-moz-', '-ms-', '-o-'];
		var style = elem.style;
		for (var i = 0; i < prefixes.length; i++) {
			if (style.hasOwnProperty(prefixes[i] + 'transform')) {
				return prefixes[i];
			}
		}
		return '';
	}());

	function createAnchor(domains, link) {
		return domains.reduce(function (list, item) {
			return list.concat(item + '.' + link);
		}, []).join(',');
	}

	aloha.dom.query('.snippet', document).forEach(function (elem) {
		var code = (
			elem.textContent || elem.innerText
		).trim().replace(/&lt;/g, '<').replace(/&gt;/g, '>');
		var $elem = $(elem).html('');
		CodeMirror(elem, {
			value    : code,
			mode     : $elem.attr('data-syntax') || 'javascript',
			readOnly : true
		});
		var html = elem.innerHTML;
		var snippetLinksCount = 0;
		var regex = new RegExp(
			'<span class="cm-operator">&lt;&amp;<\/span>'
			+ '(.*?)'
			+ '<span class="cm-operator">&amp;&gt;<\/span>'
			+ '|'
			+ '{&amp;(.*?)&amp;}',
			'g'
		);
		var link = $elem.attr('data-snippet');
		if (link) {
			html = html.replace(regex, function (match, code, html) {
				return '<span data-snippet-anchor="'
				     + createAnchor(link.split(','), ++snippetLinksCount)
				     + '" title="' + snippetLinksCount + '">' + (html || code) + '</span>';
			});
		}
		$(elem).html(html);
	});

	var $window = $(window);

	var state = {
		offsets  : [],
		viewport : {width: 0, height: 0}
	};

	function onresize() {
		state.offsets = [];
		state.viewport = {
			width  : $window.width(),
			height : $window.height()
		};
		$('header').each(function (i, elem) {
			var $elem = $(elem);
			var offset = $elem.offset().top;
			state.offsets.push([offset, offset + $elem.height(), $elem.find('.bg')]);
		});
	}

	function findLinks(domain, link) {
		return $(
			'[data-snippet-link*="' + domain + '.' + link + '"],' +
			'[data-snippet*="' + domain + '"] [data-snippet-anchor*="' + domain + '.' + link + '"]'
		);
	}

	function findLinksFromAnchor($elem) {
		return $($elem.attr('data-snippet-anchor').split(',').reduce(function (list, item) {
			return list.concat('[data-snippet-link*="' + item + '"]');
		}, []).join(','));
	}

	$(function () {
		$('[data-snippet-link]').each(function (i, elem) {
			var $elem = $(elem);
			$elem.attr('data-snippet-link').split(',').forEach(function (linkage) {
				linkage = linkage.split('.');
				var domain = linkage[0];
				var link = linkage[1];
				$elem.hover(function () {
					findLinks(domain, link).addClass('snippet-highlight');
				}, function () {
					findLinks(domain, link).removeClass('snippet-highlight');
				});
			});
		});
		$('[data-snippet-anchor]').hover(
			function (event) {
				findLinksFromAnchor($(event.target)
					.closest('[data-snippet-anchor]'))
						.addClass('snippet-highlight');
			},
			function (event) {
				findLinksFromAnchor($(event.target)
					.closest('[data-snippet-anchor]'))
						.removeClass('snippet-highlight');
			}
		);
		if (0 === $('header .bg').length) {
			return;
		}
		window.requestAnimationFrame(function parallax() {
			var yStart = $window.scrollTop();
			var yEnd = yStart + state.viewport.height;
			state.offsets.forEach(function (offsets) {
				if (offsets[0] < yEnd && offsets[1] > yStart) {
					var position = Math.round(yStart - offsets[0]) / 2;
					offsets[2].css(
						VENDOR_PREFIX + 'transform',
						'translate3d(0, ' + position + 'px, 0)'
					);
				}
			});
			window.requestAnimationFrame(parallax);
		});
	});

	function delayed(fn, delay) {
		var timeout = null;
		return function () {
			if (timeout) {
				clearTimeout(timeout);
			}
			timeout = setTimeout(fn, delay);
		};
	}

	$window.on('resize', delayed(onresize, 50));

	onresize();

}(window.aloha, window.jQuery, window.CodeMirror));
