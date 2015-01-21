(function (aloha, $, CodeMirror) {
	'use strict';

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
				     + '" _="' + snippetLinksCount + '">'
				     + (html || code)
				     + '</span>';
			});
		}
		$(elem).html(html);
	});

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
	});

}(window.aloha, window.jQuery, window.CodeMirror));
