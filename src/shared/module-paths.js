/**
 * @overview: Map of shared modules and the location where they are provided.
 *
 * The __DEPS__.paths maps module names to the relative locations of the files
 * which provide them.  This map is used to resolve dependencies listed in
 * define() calls.
 *
 * The global __DEPS__ object looks like something like this:
 * {
 *   root: './',
 *   paths: {},
 *   lang: 'en'
 * }
 */

(function (global) {
	'use strict';

	var DependencyManagement = global.__DEPS__ || (global.__DEPS__ = {});

	if (!DependencyManagement.root) {
		DependencyManagement.root = '';
	}

	if (!DependencyManagement.lang) {
		DependencyManagement.lang = 'en';
	}

	if (!DependencyManagement.paths) {
		DependencyManagement.paths = {};
	}

	var root = DependencyManagement.root + 'shared';

	// jQuery
	// NB: require('jQuery') will guarentee that you receive the exact version
	// pointed to by "jQuery." require('jquery') makes no such guarentee if
	// there are multiple jquery files loaded on the same page.
	DependencyManagement.paths['jquery'] = root + '/vendor/jquery-1.7.2';             // Mutates global
	DependencyManagement.paths['jQuery'] = root + '/vendor/jquery-1.7.2';             // Mutates global
	// Other common vendor libraries
	DependencyManagement.paths['jqueryui'] = root + '/vendor/jquery-ui-1.8.18';       // Mutates jquery
	DependencyManagement.paths['Class'] = root + '/vendor/class';                     // Mutates global
	// Plugin vendor libraries
	DependencyManagement.paths['jquery-layout'] = root + '/vendor/jquery.layout';     // Mutates jquery
	DependencyManagement.paths['jstree'] = root + '/vendor/jquery.jstree';            // Mutates jquery
	DependencyManagement.paths['jqgrid'] = root + '/vendor/jquery.jqgrid';            // Mutates jquery
	DependencyManagement.paths['jqgrid-locale-en'] = root + '/vendor/grid.locale.en'; // Mutates jqgrid
	DependencyManagement.paths['jqgrid-locale-de'] = root + '/vendor/grid.locale.de'; // Mutates jqgrid
	// Gentics libraries
	DependencyManagement.paths['PubSub'] = root + '/pubsub/js/pubsub';
	DependencyManagement.paths['RepositoryBrowser'] = root + '/repository-browser/js/repository-browser-unminified';
	DependencyManagement.paths['repository-browser-i18n-de'] = DependencyManagement.paths['RepositoryBrowser'];
	DependencyManagement.paths['repository-browser-i18n-en'] = DependencyManagement.paths['RepositoryBrowser'];
}(this));
