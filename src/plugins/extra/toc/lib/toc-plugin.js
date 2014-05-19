/* toc-plugin.js is part of the Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 * License  http://aloha-editor.org/license.php
 */
define([
	'jquery',
	'PubSub',
	'aloha',
	'aloha/plugin',
	'aloha/content-rules',
	'ui/ui',
	'ui/button',
	'util/dom',
	'i18n!toc/nls/i18n'
], function (
	$,
	PubSub,
	Aloha,
    Plugin,
	ContentRules,
	Ui,
	Button,
	Dom,
	i18n
) {
	'use strict';

	var namespace = 'toc';
	var $containers = null;
	var allTocs = [];
	var configurations = {};

	/* helper functions */
	function last(a) { return a[a.length - 1]; }
	function head(a) { return a[0]; }
	function tail(a) { return a.slice(1); }
	function indexOf(a, item) {
		return detect(a, function (cmp){
			return cmp === item;
		});
	}
	function detect(a, f) {
		for (var i = 0; i < a.length; i++) {
			if (f(a[i])) {
				return a[i];
			}
		}
		return null;
	}
	function map(a, f) {
		var result = [];
		for (var i = 0; i < a.length; i++) {
			result.push(f(a[i]));
		}
		return result;
	}

    function editableContainers() {
	    return $(map(Aloha.editables, function (editable) {
			return document.getElementById(editable.getId());
		}));
    }

    function anchorFromLinkId($ctx, linkId) {
        return linkId ? $ctx.find('a[href $= "#' + linkId + '"]') : $();
    }

	function generateId(elemOrText) {
	    var validId;
	    if (typeof elemOrText === 'object') {
	        validId = $(elemOrText).text()
			                       .replace(/[^a-zA-Z-]+/g, '-')
			                       .replace(/^[^a-zA-Z]+/, '');
	    } else if (elemOrText) {
	        validId = elemOrText;
	    }
	    for (var uniquifier = 0; ; uniquifier++) {
	        var uniqueId = validId;
	        if (uniquifier) {
	            uniqueId += '-' + uniquifier;
	        }
	        var conflict = $('#' + uniqueId);
	        if (conflict.length === 0 || (typeof elemOrText === 'object' && conflict === elemOrText)) {
				return uniqueId;
	        }
	    }
	}

	return Plugin.create(namespace, {
		minEntries: 0,
		updateInterval: 5000,
		config: ['toc'],

		init: function () {
			var plugin = this;

			if (typeof plugin.settings.minEntries === 'undefined') {
				plugin.settings.minEntries = plugin.minEntries;
			}

			if (typeof plugin.settings.updateInterval === 'undefined') {
				plugin.settings.updateInterval = plugin.updateInterval;
			}

			plugin._insertTocButton = Ui.adopt('insertToc', Button, {
		        tooltip: i18n.t('button.addtoc.tooltip'),
		        icon: 'aloha-icon aloha-icon-orderedlist',
				scope: 'Aloha.continuoustext',
		        click: function () {
					plugin.insertAtSelection($containers);
				}
			});

			PubSub.sub('aloha.editable.created', function (message) {
				var editable = message.editable;
				var config = plugin.getEditableConfig(editable.obj);
				var enabled = config
				           && ($.inArray('toc', config) > -1)
				           && ContentRules.isAllowed(editable.obj[0], 'ol');
				configurations[message.editable.getId()] = enabled;
			});

			PubSub.sub('aloha.editable.destroyed', function (message) {
				delete configurations[message.editable.getId()];
			});

			PubSub.sub('aloha.editable.activated', function (message) {
				plugin._insertTocButton.show(
					configurations[message.editable.getId()]
				);
			});

			$(document).ready(function () {
				plugin.spawn();
			});
	    },

		register: function ($c) {
			$containers = $c;
		},

	    /**
	     * inserts a new TOC at the current selection
	     */
	    insertAtSelection: function ($containers) {
			if (!Aloha.activeEditable) {
				return;
			}
		    $containers = $containers || editableContainers();
			var id = generateId('toc');
	        var $toc = $('<ol class="toc_root"></ol>').attr('id', id).attr('contentEditable', 'false');
		    Dom.insertIntoDOM(
				$toc,
				Aloha.Selection.getRangeObject(),
				$('#' + Aloha.activeEditable.getId())
			);
		    this.create(id).register($containers).update().tickTock();
	    },

		/**
		 * Spawn containers for all ols with the toc_root class.
		 */
		spawn: function ($ctx, $containers) {
			var plugin  = this;
			$ctx        = $ctx        || $('body');
			$containers = $containers || editableContainers();
			$ctx.find('ol.toc_root').each(function () {
				var id = $(this).attr('id');
				if (!id) {
					id = generateId('toc');
					$(this).attr('id', id);
				}
				plugin.create(id).register($containers).tickTock();
			});
		},

	    create: function (id) {
			allTocs.push(this);
	        return {
				'id': id,
				'$containers': $(),
				'settings': this.settings,

				/**
				 * find the TOC root element for this instance
				 */
				root: function () {
					return $('#' + this.id);
				},

				/**
				 * registers the given containers with the TOC. a
				 * container is an element that may begin or contain
				 * sections. Note: use .live on all [contenteditable=true]
				 * to catch dynamically added editables.
				 * the same containers can be passed in multiple times. they will
				 * be registered only once.
				 */
				register: function ($containers) {
					var self = this;
					// the .add() method ensures that the $containers will be in
					// document order (required for correct TOC order)

					self.$containers = self.$containers.add($containers);
					self.$containers.filter(function () {
						return !$(this).data(namespace + '.' + self.id + '.listening');
					}).each(function () {
						var $container = $(this);
						$container.data(namespace + '.' + self.id + '.listening', true);
						$container.bind('blur', function () {
							self.cleanupIds($container.get(0));
							self.update($container);
						});
					});
					return self;
				},

				tickTock: function (interval) {
					var self = this;
					interval = interval || this.settings.updateInterval;
					if (!interval) {
						return;
					}
					window.setInterval(function () {
						self.register(editableContainers());
						// TODO: use the active editable instead of rebuilding
						// the entire TOC
						self.update();
					}, interval);
					return self;
				},

				/**
				 * there are various ways which can cause duplicate ids on targets
				 * (e.g. pressing enter in a heading and writing in a new line, or
				 * copy&pasting). Passing a ctx updates only those elements
				 * either inside or equal to it.
				 * TODO: to be correct this should do
				 *  a $.contains(documentElement...
				 */
				cleanupIds: function (ctx) {
					var ids = [];
					this.headings(this.$containers).each(function () {
						var id = $(this).attr('id');
						if ((id && -1 != $.inArray(id, ids)) || (ctx && ($.contains(ctx, this) || ctx === this))) {
							$(this).attr('id', generateId(this));
						}
						ids.push(id);
					});
					return this;
				},

				/**
				 * Updates the TOC from the sections in the given context, or in
				 * all containers that have been registered with this TOC, if no
				 * context is given.
				 */
				update: function ($ctx) {
					var self = this;
					$ctx = $ctx || self.$containers;
					var outline = this.outline(self.$containers);
					var ancestors = [self.root()];
					var prevSiblings = [];
					//TODO: handle TOC rebuilding more intelligently. currently,
					//the TOC is always rebuilt from scratch.
					last(ancestors).empty();
					(function descend(outline) {
						var prevSiblings = [];
						map(outline, function (node) {
							var $section = head(node);
							var $entry = self.linkSection($section, ancestors, prevSiblings);
							ancestors.push($entry);
							descend(tail(node));
							ancestors.pop();
							prevSiblings.push($entry);
						});
					})(tail(outline));

					// count number of li's in the TOC, if less than minEntries, hide the TOC
					var minEntries = self.root().attr('data-TOC-minEntries') || this.settings.minEntries;
					if (self.root().find('li').length >= minEntries) {
						self.root().show();
					} else {
						self.root().hide();
					}

					return this;
				},
				/**
				 * updates or creates an entry in the TOC for the given section.
				 */
				linkSection: function ($section, ancestors, prevSiblings) {
					var linkId = $section.eq(0).attr('id');
					if (!linkId) {
						linkId = generateId($section.get(0));
						$section.eq(0).attr('id', linkId);
					}
					var $root = this.root();
					var $entry = anchorFromLinkId($root, linkId);
					if (!$entry.length) {
						$entry = $('<li><a></a></li>');
					}
					$entry.find('a').attr('href', '#' + linkId).text($section.eq(0).text());
					if (last(prevSiblings)) {
						last(prevSiblings).after($entry);
					} else {
						if (last(ancestors).get(0) === $root.get(0)) {
							$root.append($entry);
						} else {
							last(ancestors).append($('<ol></ol>').append($entry));
						}
					}
					return $entry;
				},

				/**
				 * returns a tree of sections in the given context. if the context
				 * element(s) begin a section, they will be included. First element
				 * of each branch in the tree is a $(section) or $() for the
				 * root node.
				 * TODO: http://www.w3.org/TR/html5/sections.html#outline
				 */
				outline: function (ctx) {
					var rootNode = [$()];
					var potentialParents = [rootNode];
					this.headings(ctx).each(function () {
						var $heading = $(this);
						var nodeName = this.nodeName.toLowerCase();
						var hLevels = ['h6', 'h5', 'h4', 'h3', 'h2', 'h1'];
						var currLevel = $.inArray(nodeName, hLevels);
						var higherEq = hLevels.slice(currLevel).join(',');
						var $section = $heading.nextUntil(higherEq).andSelf();
						var node = [$section];
						var parent = detect(potentialParents, function (parent) {
							var parentSection = parent[0];
							return !parentSection.length || //top-level contains everything
								detect(parentSection, function (sectionElem) {
									return $heading.get(0) === sectionElem || $.contains(sectionElem, $heading.get(0));
								});
						});
						parent.push(node);
						potentialParents.splice(0, indexOf(potentialParents, parent), node);
					});
					return rootNode;
				},

				headings: function ($ctx) {
					return $ctx.find(':header').add($ctx.filter(':header'));
				}
			};
		}
	});
});
