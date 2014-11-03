function linkify(inputText) {
	var replacedText, replacePattern1, replacePattern2, replacePattern3;

	//URLs starting with http://, https://, or ftp://
	replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
	replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

	//URLs starting with "www." (without // before it, or it'd re-link the ones done above).
	replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
	replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

	//Change email addresses to mailto:: links.
	replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
	replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

	return replacedText;
}

function escapeSomeHtml(text) {
	text = text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/\r\n|\n|\r/g, '<br>')
			.replace(/&lt;pre>/g, '<pre>')
			.replace(/&lt;\/pre>/g, '</pre>'); //edit: keep the preformatted text
	text = linkify(text);
	return text;
}

exports.handlers = {
	/**
	 Translate HTML tags in descriptions into safe entities.
	 Replaces <, & and newlines
	 */
	newDoclet: function(e) {
		//console.log(e.doclet);
		if (e.doclet.description) {
			e.doclet.scope = null;
			e.doclet.description = escapeSomeHtml(e.doclet.description);
		}
		if (e.doclet.tags) {
			for (i in e.doclet.tags) {
				var tag = e.doclet.tags[i];
				console.log(tag.title);
				e.doclet.tags[i].text = escapeSomeHtml(e.doclet.tags[i].text);
			}
		}
		if (e.doclet.todo) {
			for (i in e.doclet.todo) {
				e.doclet.todo[i] = escapeSomeHtml(e.doclet.todo[i]);
			}
		}
	}
};
