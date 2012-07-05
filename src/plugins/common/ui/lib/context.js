define(['jquery'],function($){
	'use strict';

	var className = 'aloha-ui-context';
	var selector = '.' + className;

	$('<div>', {'class': 'aloha ' + className}).appendTo('body');

	return {
		selector: function(){
			return selector;
		},
		element: function(){
			return $(selector);
		}
	};
});
