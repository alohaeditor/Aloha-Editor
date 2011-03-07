/**
 * Apply the function {handler} to each element in the array
 * Return false in the {handler} to break the cycle.
 * @param {Function} handler
 * @version 1.0.1
 * @date August 20, 2010
 * @since June 30, 2010
 * @package jquery-sparkle {@link http://www.balupton/projects/jquery-sparkle}
 * @author Benjamin "balupton" Lupton {@link http://www.balupton.com}
 * @copyright (c) 2009-2010 Benjamin Arthur Lupton {@link http://www.balupton.com}
 * @license GNU Affero General Public License version 3 {@link http://www.gnu.org/licenses/agpl-3.0.html}
 */
Array.prototype.each = function(handler){
	for (var i = 0; i < this.length; ++i) {
		var value = this[i];
		if ( handler.apply(value,[i,value]) === false ) {
			break;
		}
	}
	return this;
}

/**
 * Apply the function {handler} to each item in the object, ignoring inherited items.
 * Return false in the {handler} to break the cycle.
 * @param {Function} handler
 * @version 1.0.0
 * @date August 20, 2010
 * @since August 20, 2010
 * @package jquery-sparkle {@link http://www.balupton/projects/jquery-sparkle}
 * @author Benjamin "balupton" Lupton {@link http://www.balupton.com}
 * @copyright (c) 2009-2010 Benjamin Arthur Lupton {@link http://www.balupton.com}
 * @license GNU Affero General Public License version 3 {@link http://www.gnu.org/licenses/agpl-3.0.html}
 */
Object.prototype.each = function(handler){
	// Check
	if ( typeof handler !== 'function' ) {
		throw new Exception('Object.prototype.each: Invalid input');
	}
	// Cycle
	for ( var key in this ) {
		// Check
		if ( !this.hasOwnProperty(key) ) {
			continue;
		}
		// Fire
		var value = this[key];
		if ( handler.apply(value,[key,value]) === false ) {
			break;
		}
	}
	// Chain
	return this;
};

/**
 * Extends the current object with the passed object(s), ignoring iherited properties.
 * @param {Object} ... The passed object(s) to extend the current object with
 * @version 1.0.0
 * @date August 20, 2010
 * @since August 20, 2010
 * @package jquery-sparkle {@link http://www.balupton/projects/jquery-sparkle}
 * @author Benjamin "balupton" Lupton {@link http://www.balupton.com}
 * @copyright (c) 2009-2010 Benjamin Arthur Lupton {@link http://www.balupton.com}
 * @license GNU Affero General Public License version 3 {@link http://www.gnu.org/licenses/agpl-3.0.html}
 */
Object.prototype.extend = function(object){
	var Me = this;
	// Check
	if ( typeof object !== 'object' ) {
		throw new Exception('Object.prototype.extend: Invalid input');
	}
	// Handle
	if ( arguments.length > 1 ) {
		arguments.each(function(){
			Me.extend(this);
		});
	}
	else {
		// Extend
		object.each(function(key,object){
			if ( typeof object === 'object' && typeof Me[key] === 'object' ) {
				Me[key].extend(object);
			}
			else {
				Me[key] = object;
			}
		});
	}
	// Chain
	return this;
};
