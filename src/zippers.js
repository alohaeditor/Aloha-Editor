/**
 * zippers.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * @reference:
 * http://hackage.haskell.org/package/rosezipper-0.2/docs/src/Data-Tree-Zipper.html
 *
 * @usage:
 *	var boundaries = Boundaries.get(document);
 *	var zip = zipper(Dom.editingHost(Boundaries.container(boundaries[0])), {
 *		start : boundaries[0],
 *		end   : boundaries[1]
 *	});
 *	var loc = zip.loc;
 *	var markers = zip.markers;
 *	loc = splitAt(loc, markers.start);
 *	loc = insert(loc, contents(createRecord('#text'), ['↵']));
 *	loc = splitAt(loc, markers.end);
 *	var preserved = update(root(loc));
 *	console.log(aloha.markers.hint([preserved.start, preserved.end]));
 *
 * @TODO Add documentation, then add namespace zippers here.
 */
define([
	'dom',
	'maps',
	'html',
	'paths',
	'arrays',
	'record',
	'boromir',
	'boundaries',
	'functions'
], function (
	Dom,
	Maps,
	Html,
	Paths,
	Arrays,
	Record,
	Boromir,
	Boundaries,
	Fn
) {
	'use strict';

	function isTextRecord(record) {
		return '#text' === record.name();
	}

	/**
	 * Gets the contents of the given record. If a second argument is passed,
	 * will set the contents of this record.
	 *
	 * @private
	 * @param  {!Record}                 record
	 * @param  {Array.<!Record|string>=} content
	 * @return {Record}
	 */
	function contents(record, content) {
		record = arguments[0];
		if (1 === arguments.length) {
			return isTextRecord(record) ? record.text() : record.children();
		}
		return isTextRecord(record)
		     ? record.text(content.join(''))
		     : record.children(content);
	}

	/**
	 * Represents a position between nodes inside a tree.
	 *
	 * @private
	 * @type   Location
	 * @param  {Array.<!Record>}   lefts
	 * @param  {Array.<!Record>}   rights
	 * @param  {Array.<!Location>} frames
	 * @return {Location}
	 */
	function Location(lefts, rights, frames) {
		return {
			lefts  : lefts,
			rights : rights,
			frames : frames
		};
	}

	/**
	 * Return the parent frame of the given location.
	 *
	 * @param  {!Location} loc;
	 * @return {Location}
	 * @memberOf zippers
	 */
	function peek(loc) {
		return Arrays.last(loc.frames);
	}

	/**
	 * The node before the given tree position.
	 *
	 * @param  {!Location} loc
	 * @return {Record}
	 * @memberOf zippers
	 */
	function before(loc) {
		return Arrays.last(loc.lefts);
	}

	/**
	 * The node after the given tree position.
	 *
	 * @param  {!Location} loc
	 * @return {Record}
	 * @memberOf zippers
	 */
	function after(loc) {
		return loc.rights[0];
	}

	/**
	 * Returns previous location from the given position.
	 * If a second argument is specified, it will specify the number steps to
	 * shift the location.
	 *
	 * @param  {!Location} loc
	 * @param  {number=}   stride
	 * @return {Location}
	 * @memberOf zippers
	 */
	function prev(loc, stride) {
		stride = 'number' === typeof stride ? stride : 1;
		return 0 === stride ? loc : Location(
			loc.lefts.slice(0, -stride),
			loc.lefts.slice(-stride).concat(loc.rights),
			loc.frames.concat()
		);
	}

	/**
	 * Returns next location from the given position.
	 * If a second argument is specified, it will specify the number steps to
	 * shift the location.
	 *
	 * @param  {!Location} loc
	 * @param  {number=}   stride
	 * @return {Location}
	 * @memberOf zippers
	 */
	function next(loc, stride) {
		stride = 'number' === typeof stride ? stride : 1;
		return 0 === stride ? loc : Location(
			loc.lefts.concat(loc.rights.slice(0, stride)),
			loc.rights.slice(stride),
			loc.frames.concat()
		);
	}

	/**
	 * Descends into the record at the given tree location.
	 *
	 * @param  {!Location} loc
	 * @return {Location}
	 * @memberOf zippers
	 */
	function down(loc) {
		return Location([], contents(after(loc)), loc.frames.concat(loc));
	}

	/**
	 * Ascends to the front of the parent of the current location.
	 *
	 * @param  {!Location} loc
	 * @return {Location}
	 * @memberOf zippers
	 */
	function up(loc) {
		var content = loc.lefts.concat(loc.rights);
		var frame = Arrays.last(loc.frames);
		var first = contents(after(frame), content);
		return Location(
			frame.lefts.concat(),
			[first].concat(frame.rights.slice(1)),
			loc.frames.slice(0, -1)
		);
	}

	/**
	 * Ascends to the root of the tree.
	 * The location returned will be the create() position.
	 *
	 * @param  {!Location} loc
	 * @return {Location}
	 * @memberOf zippers
	 */
	function root(loc) {
		return loc.frames.reduce(up, loc);
	}

	/**
	 * Creates a tree location pointing to the given DOM node as its root.
	 *
	 * @private
	 * @param  {!Node} node
	 * @return {Location}
	 * @memberOf zippers
	 */
	function create(root) {
		return Location([], [Boromir(root)], []);
	}

	/**
	 * Checks whether the given locations points to a text record.
	 *
	 * @private
	 * @param  {!Location} loc
	 * @return {Location}
	 */
	function isTextLocation(loc) {
		return 'string' === typeof after(loc);
	}

	/**
	 * Counts the cumulative length of the given lists of text fragment records.
	 *
	 * @private
	 * @param  {Array.<!Record>} fragments
	 * @return {number}
	 */
	function fragmentsLength(fragments) {
		return fragments.reduce(function (sum, record) {
			return sum + record.text().length;
		}, 0);
	}

	/**
	 * Post order traversal throught the tree, mapping each not with a given
	 * mutate() function.
	 *
	 * @private
	 * @param  {!Location}                                         loc
	 * @param  {!function(Record, Array.<number>):Array.<!Record>} mutate
	 * @return {Location}
	 */
	function mapInPostOrder(loc, mutate) {
		loc = root(loc);
		var replacements;
		var trail = [];
		var offset;
		while (true) {
			if (isAtEnd(loc)) {
				loc = up(loc);
				if (isRoot(loc)) {
					break;
				}
				trail = trail.slice(0, -1);
				replacements = mutate(after(loc), trail);
				loc = next(replace(loc, replacements), replacements.length);
			} else if (isVoid(loc)) {
				offset = isFragmentedText(after(up(loc)))
				       ? fragmentsLength(loc.lefts.filter(isTextRecord))
				       : loc.lefts.length;
				replacements = mutate(after(loc), trail.concat(offset));
				loc = next(replace(loc, replacements), replacements.length);
			} else {
				if (!isRoot(loc)) {
					trail.push(loc.lefts.length);
				}
				loc = down(loc);
			}
		}
		return loc;
	}

	/**
	 * Walks the tree in depth-first pre order traversal until pred() returns
	 * false.
	 *
	 * @private
	 * @param  {!Location}                   loc
	 * @param  {function(Location):boolean=} pred
	 * @return {Location}
	 * @memberOf zippers
	 */
	function walkInPreOrderWhile(loc, pred) {
		pred = pred || Fn.returnTrue;
		loc = root(loc);
		while (pred(loc)) {
			if (isAtEnd(loc)) {
				do {
					if (isRoot(loc)) {
						return loc;
					}
					loc = up(loc);
				} while (isAtEnd(loc));
				loc = next(loc);
			} else if (isVoid(loc)) {
				loc = next(loc);
			} else {
				loc = down(loc);
			}
		}
		return loc;
	}

	/**
	 * Reconstitues a fragmented text record.
	 *
	 * @private
	 * @param  {!Record} record
	 * @return {Record}
	 */
	function defragmentText(record) {
		var text = record.children().filter(isTextRecord).reduce(function (strings, string) {
			return strings.concat(string.text());
		}, []).join('');
		return (record.original && record.original.text() === text)
		     ? record.original
		     : createRecord('#text', [text]);
	}

	function dom(loc) {
		return after(loc).domNode();
	}

	/**
	 * Updates the DOM tree below this location and returns a map of named boundaries
	 * that are found therein.
	 *
	 * @param  {!Location} loc
	 * @return {Map.<string, Boundary>}
	 * @memberOf zippers
	 */
	function update(loc) {
		var paths = [];
		loc = mapInPostOrder(loc, function (record, trail) {
			if (isMarker(record)) {
				if (record.marker) {
					paths.push({
						name : record.marker,
						path : trail
					});
				}
				return [];
			}
			return [isFragmentedText(record) ? defragmentText(record) : record];
		});
		var editable = after(loc).updateDom().domNode();
		return paths.reduce(function (markers, mark) {
			markers[mark.name] = Paths.toBoundary(editable, mark.path);
			return markers;
		}, {});
	}

	/**
	 * Prints the content.
	 *
	 * @private
	 * @param  {!Record|string} content
	 * @return {string}
	 */
	function print(content) {
		return 'string' === typeof content
		     ? '“' + content + '”'
		     : isTextRecord(content)
		     ? content.text()
		     : content.domNode().outerHTML;
	}

	/**
	 * Return a partial representation of the given location in the tree.
	 *
	 * @param  {!Location} loc
	 * @return {string}
	 * @memberOf zippers
	 */
	function hint(loc) {
		return loc.lefts.map(print).concat('▓', loc.rights.map(print)).join('');
	}

	/**
	 * Normalizes the given offset inside the given record by ignoring any
	 * markers.
	 *
	 * @private
	 * @param  {!Record} record
	 * @param  {number}  offset
	 * @return {number}
	 */
	function normalizeOffset(record, offset) {
		return offset + record.children().slice(0, offset).filter(isMarker).length;
	}

	/**
	 * Maps the given offsets from a intergral text record to that of a
	 * fragmented representation of it.
	 *
	 * @private
	 * @param  {!Record} record
	 * @param  {number}  offset
	 * @return {number}
	 */
	function fragmentedOffset(record, offset) {
		if (0 === offset) {
			return [0];
		}
		var fragments = record.children();
		var len = fragments.length;
		var remainder = offset;
		var index = 0;
		var overflow;
		var fragment;
		while (index < len) {
			fragment = fragments[index];
			if (isMarker(fragment)) {
				index++;
				continue;
			}
			overflow = remainder - fragment.text().length;
			if (0 === overflow) {
				return [index + 1];
			}
			if (overflow < 0) {
				return [index, remainder];
			}
			index++;
			remainder = overflow;
		}
		throw 'Text offset out of bounds';
	}

	/**
	 * Splits text into two halves at the givne offset.
	 *
	 * @private
	 * @param  {string} text
	 * @param  {number} offset
	 * @return {Array.<string>}
	 */
	function splitText(text, offset) {
		return [text.substr(0, offset), text.substr(offset)];
	}

	/**
	 * Descends into an offset inside a text location.
	 *
	 * @private
	 * @param  {!Location} loc
	 * @param  {number}    offset
	 * @return {Location}
	 */
	function locationInText(loc, offset) {
		var text = splitText(contents(after(loc)), offset);
		return Location([text[0]], [text[1]], loc.frames.concat(loc));
	}

	/**
	 * Descends into an offset inside a element location.
	 *
	 * @private
	 * @param  {!Location} loc
	 * @param  {number}    offset
	 * @return {Location}
	 */
	function locationInElement(loc, offset) {
		return next(down(loc), normalizeOffset(after(loc), offset));
	}

	/**
	 * Descends into an offset inside a fragmented text location.
	 *
	 * @private
	 * @param  {!Location} loc
	 * @param  {number}    offset
	 * @return {Location}
	 */
	function locationInFragment(loc, offset) {
		var record = after(loc);
		var offsets = fragmentedOffset(record, offset);
		var atText = next(down(loc), offsets[0]);
		if (1 === offsets.length) {
			return atText;
		}
		var text = splitText(contents(after(atText)), offsets[1]);
		return next(splice(atText, 1, [
			contents(createRecord('#text'), [text[0]]),
			contents(createRecord('#text'), [text[1]])
		]));
	}

	/**
	 * Traverses the given path.
	 *
	 * @private
	 * @param  {!Location} loc
	 * @param  {!Path}     path
	 * @return {Location}
	 */
	function traverse(loc, path) {
		var offset;
		var trail = path.concat().reverse();
		while (trail.length) {
			while (isMarker(after(loc))) {
				loc = next(loc);
			}
			offset = trail.pop();
			if (isTextRecord(after(loc))) {
				return locationInText(loc, offset);
			}
			loc = isFragmentedText(after(loc))
			    ? locationInFragment(loc, offset)
			    : locationInElement(loc, offset);
		}
		return loc;
	}

	/**
	 * Clips the sub section of the given path that is common with `root`.
	 *
	 * @private
	 * @param  {!Path} root
	 * @param  {!Path} path
	 * @return {Path}
	 */
	function clipCommonRoot(root, path) {
		for (var i = 0; i < root.length; i++) {
			if (path[i] !== root[i]) {
				return [];
			}
		}
		return path.slice(i);
	}

	/**
	 * Splices the rights of the given location.
	 *
	 * @param  {!Location}                loc
	 * @param  {number}                   num
	 * @param  {!Record|Array.<!Record>=} items
	 * @return {Location}
	 */
	function splice(loc, num, items) {
		items = items
		      ? (items.constructor === Boromir || items.constructor === Record)
		      ? [items]
		      : items
		      : [];
		return Location(
			loc.lefts.concat(),
			items.concat(loc.rights.slice(num)),
			loc.frames.concat()
		);
	}

	/**
	 * Inserts the given items at this location.
	 *
	 * @param  {!Location}               loc
	 * @param  {!Record|Array.<!Record>} items
	 * @return {Location}
	 */
	function insert(loc, items) {
		return splice(loc, 0, items);
	}

	/**
	 * Replaces the record at this location with the given.
	 *
	 * @param  {!Location} loc
	 * @param  {!Record}   item
	 * @return {Location}
	 */
	function replace(loc, item) {
		return splice(loc, 1, item);
	}

	/**
	 * Removes the record at this location.
	 *
	 * @param  {!Location} loc
	 * @return {Location}
	 */
	function remove(loc) {
		return splice(loc, 1);
	}

	/**
	 * FragmentedText implementation is backed by a 'Q' element in order to be
	 * able to visualize it in the document for debugging.
	 *
	 * FIXME: isFragmentedText and original won't be preserved on cloning.
	 *
	 * @private
	 * @type FragmentedText
	 * @param  {!Location} loc
	 * @return {Location}
	 */
	function FragmentedText(loc) {
		var atText = up(loc);
		var wrapper = Boromir(document.createElement('q'));
		wrapper.isFragmentedText = true;
		wrapper.original = after(atText);
		return Location(
			[contents(createRecord('#text'), loc.lefts)],
			[contents(createRecord('#text'), loc.rights)],
			down(replace(atText, wrapper)).frames.concat()
		);
	}

	function isFragmentedText(record) {
		return true === record.isFragmentedText;
	}

	var markerCount = 0;

	/**
	 * Creates a markers.
	 *
	 * FIXME: isFragmentedText and original and isMarker won't be preserved on cloning.
	 *
	 * @param  {string} name
	 * @return {Record}
	 * @memberOf zippers
	 */
	function createMarker(name) {
		var node = document.createElement('code');
		node.innerHTML = ++markerCount;
		var record = Boromir(node);
		record.isMarker = true;
		record.marker = name;
		return record;
	}

	/**
	 * @memberOf zippers
	 */
	function isMarker(record) {
		return true === record.isMarker;
	}

	/**
	 * Markup the tree with the given marker.
	 *
	 * @private
	 * @param  {!Location} loc
	 * @param  {!Marker}   marked
	 * @return {Object}
	 */
	function markup(loc, marked) {
		var markers = {};
		Maps.forEach(marked, function (boundary, name) {
			var result = markTree(loc, boundary, name);
			markers[name] = result.marker;
			loc = result.loc;
		});
		return {
			loc     : loc,
			markers : markers
		};
	}

	/**
	 * Creates a zipper with the given set of named boundaries laced into the
	 * tree.
	 *
	 * @type   zipper
	 * @param  {!Element}                    element
	 * @param  {!Object.<string, !Boundary>} boundaries
	 * @return {Location}
	 */
	function zipper(element, boundaries) {
		return markup(create(element), boundaries);
	}

	/**
	 * Inserts a marker at the given boundary
	 *
	 * @private
	 * @param  {!Location}  loc
	 * @param  {!Boundary}  boundary
	 * @param  {markerName} string
	 * @return {Object}
	 */
	function markTree(loc, boundary, markerName) {
		loc = root(loc);
		var element = dom(loc);
		var body = element.ownerDocument.body;
		var origin = Paths.fromBoundary(body, Boundaries.fromFrontOfNode(element));
		var path = Paths.fromBoundary(body, boundary);
		var clipped = clipCommonRoot(origin, path);
		if (0 === clipped.length) {
			return {
				loc    : loc,
				marker : null
			};
		}
		var marker = createMarker(markerName);
		loc = traverse(loc, clipped);
		loc = insert(isTextLocation(loc) ? FragmentedText(loc) : loc, marker);
		return {
			loc    : loc,
			marker : marker
		};
	}

	/**
	 * Creates a record of the given type and fills it with the given content.
	 *
	 * @private
	 * @param  {string}                 type
	 * @param  {Array.<!Record|string>} content
	 * @return {Record}
	 */
	function createRecord(type, content) {
		var node = '#text' === type
		         ? document.createTextNode('')
		         : document.createElement(type);
		return 'undefined' === typeof content
		     ? Boromir(node)
		     : contents(Boromir(node), content);
	}

	/**
	 * Clones a record.
	 *
	 * @param  {!Record} record
	 * @return {Record}
	 */
	function clone(record) {
		return Boromir(Dom.cloneShallow(record.domNode()));
	}

	/**
	 * Checks whether this location is the root of the tree.
	 *
	 * @private
	 * @param  {!Location} loc
	 * @return {boolean}
	 */
	function isRoot(loc) {
		return 0 === loc.frames.length;
	}

	/**
	 * Checks whether this location is which cannot be descended.
	 *
	 * @private
	 * @param  {!Location} loc
	 * @return {boolean}
	 */
	function isVoid(loc) {
		var record = after(loc);
		return '#text' === record.name()
		    || isMarker(record)
		    || Html.isVoidNode(record.domNode());
	}

	/**
	 * Checks whether this location is at the start of its parent node.
	 *
	 * @param  {!Location} loc
	 * @return {boolean}
	 */
	function isAtStart(loc) {
		return 0 === loc.lefts.length;
	}

	/**
	 * Checks whether this location is at the end of its parent node.
	 *
	 * @param  {!Location} loc
	 * @return {boolean}
	 */
	function isAtEnd(loc) {
		return 0 === loc.rights.length;
	}

	/**
	 * Splits the tree down until until() returns true or we reach the editing
	 * host.
	 *
	 * @param  {!Location}                   location
	 * @param  {!function(Location):boolean} until
	 * @return {boolean}
	 * @memberOf zippers
	 */
	function split(loc, until) {
		until = until || Fn.returnFalse;
		if (isRoot(peek(loc)) || until(loc)) {
			return loc;
		}
		var left, right;
		var upper = up(loc);
		if (isTextLocation(loc)) {
			left = createRecord('#text');
			right = createRecord('#text');
		} else {
			left = clone(after(upper));
			right = clone(after(upper));
		}
		left = contents(left, loc.lefts);
		right = contents(right, loc.rights);
		loc = Location(
			upper.lefts.concat(left),
			[right].concat(upper.rights.slice(1)),
			upper.frames.concat()
		);
		return split(loc, until);
	}

	/**
	 * Go the the location at this given marker.
	 *
	 * @param  {!Location} loc
	 * @param  {!Marker}   marker
	 * @return {?Location}
	 * @memberOf zippers
	 */
	function go(loc, marker) {
		loc = walkInPreOrderWhile(root(loc), function (loc) {
			var record = after(loc);
			return !(record && isMarker(record) && record === marker);
		});
		return isRoot(loc) ? null : loc;
	}

	/**
	 * Splits at the given marker location.
	 *
	 * @param  {!Location} loc
	 * @param  {!Marker}   marker
	 * @param  {!function(Location):boolean}
	 * @memberOf zippers
	 */
	function splitAt(loc, marker, until) {
		return split(go(loc, marker), until);
	}

	/**
	 * Insert content at the given marker location.
	 *
	 * @param  {!Location} loc
	 * @param  {!Marker}   marker
	 * @param  {!function(Location):boolean}
	 * @memberOf zippers
	 */
	function insertAt(loc, marker, inserts) {
		return insert(go(loc, marker), inserts);
	}

	return {
		go           : go,
		dom          : dom,
		hint         : hint,
		update       : update,
		before       : before,
		after        : after,
		prev         : prev,
		next         : next,
		up           : up,
		down         : down,
		root         : root,
		peek         : peek,
		split        : split,
		splice       : splice,
		insert       : insert,
		replace      : replace,
		remove       : remove,
		zipper       : zipper,
		isAtStart    : isAtStart,
		isAtEnd      : isAtEnd,
		splitAt      : splitAt,
		insertAt     : insertAt,
		isMarker     : isMarker,
		createMarker : createMarker
	};
});
