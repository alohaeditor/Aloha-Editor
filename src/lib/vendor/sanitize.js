/**
 * Copyright (c) 2010 by Gabriel Birke
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the 'Software'), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

function Sanitize(){
  var options;
  options = arguments[0] || {};
  this.jQuery = arguments[1] || {};
  this.config = {}
  this.config.elements = options.elements ? options.elements : [];
  this.config.attributes = options.attributes ? options.attributes : {};
  this.config.attributes[Sanitize.ALL] = this.config.attributes[Sanitize.ALL] ? this.config.attributes[Sanitize.ALL] : [];
  this.config.allow_comments = options.allow_comments ? options.allow_comments : false;
  this.allowed_elements = {};
  this.config.protocols = options.protocols ? options.protocols : {};
  this.config.add_attributes = options.add_attributes ? options.add_attributes  : {};
  this.dom = options.dom ? options.dom : document;
	for (var i = 0, len = this.config.elements.length; i < len; i++) {
		this.allowed_elements[this.config.elements[i]] = true;
	}
  this.config.remove_element_contents = {};
  this.config.remove_all_contents = false;
  if(options.remove_contents) {

     if (options.remove_contents instanceof Array) {
		  var elementContents = this.config.remove_element_contents;
		  for (var i = 0, len = options.remove_contents.length; i < len; i++) {
			  elementContents[options.remove_contents[i]] = true;
		  }
	  }
	  else {
		  this.config.remove_all_contents = true;
	  }
  }
  this.transformers = options.transformers ? options.transformers : [];

  // filters might let the sanitizer stop clean elements (and their children)
  this.filters = options.filters ? options.filters : [];
}

Sanitize.REGEX_PROTOCOL = /^([A-Za-z0-9\+\-\.\&\;\*\s]*?)(?:\:|&*0*58|&*x0*3a)/i
Sanitize.RELATIVE = '__relative__'; // emulate Ruby symbol with string constant

Sanitize.prototype.clean_node = function(container) {
  var fragment = this.dom.createDocumentFragment();
  this.current_element = fragment;
  this.whitelist_nodes = [];

  

  /**
   * Utility function to check if an element exists in an array
   */
  function _array_index(needle, haystack) {
	  var i,
	      len = haystack.length
	  for (i = 0; i < len; i++) {
		  if (haystack[i] === needle)
			  return i;
	  }
	  return -1;
  }

	function _merge_arrays_uniq() {
		var result = [],
		    uniq_hash = {},
			i,
		    len = arguments.length,
		    arg;
		for (i = 0; i < len; i++) {
			arg = arguments[i];
			if (!arg || !arg.length)
				continue;
			for (var j = 0, argLen = arg.length; j < argLen; j++) {
				if (uniq_hash[arg[j]])
					continue;
				uniq_hash[arg[j]] = true;
				result.push(arg[j]);
			}
		}
		return result;
	}
  
  /**
   * Clean function that checks the different node types and cleans them up accordingly
   * @param elem DOM Node to clean
   */
  function _clean(elem) {
    var clone,
	    i,
	    len = this.filters.length;

    // check whether the elem passes all of the filters
	  for (i = 0; i < len; i++) {
		  if (!this.filters[i](elem)) {
			  clone = elem.cloneNode(true);
			  this.current_element.appendChild(clone);
			  return;
		  }
	  }

    switch(elem.nodeType) {
      // Element
      case 1:
        _clean_element.call(this, elem)
        break;
      // Text
      case 3:
        var clone = elem.cloneNode(false);
        this.current_element.appendChild(clone);
        break;
      // Entity-Reference (normally not used)
      case 5:
        var clone = elem.cloneNode(false);
        this.current_element.appendChild(clone);
        break;
      // Comment
      case 8:
        if(this.config.allow_comments) {
          var clone = elem.cloneNode(false);
          this.current_element.appendChild(clone);
        }
      default:
        //console.log("unknown node type", elem.nodeType)
    }
 
  }
  
  function _clean_element(elem) {
    var i, len, parent_element, name, allowed_attributes, attr, attr_name, attr_node, protocols, del, attr_ok;
    var transform = _transform_element.call(this, elem);
    var jQuery = this.jQuery;
    var isIE7 = Aloha.browser.msie && Aloha.browser.version === "7.0";
    
    elem = transform.node;
    name = elem.nodeName.toLowerCase();
    
    // check if element itself is allowed
    parent_element = this.current_element;
    if (this.allowed_elements[name] || transform.whitelist) {
        this.current_element = this.dom.createElement(elem.nodeName);
        parent_element.appendChild(this.current_element);

      // clean attributes
      allowed_attributes = _merge_arrays_uniq(
        this.config.attributes[name],
        this.config.attributes['__ALL__'],
        transform.attr_whitelist
      );
	    len = allowed_attributes.length;
	    for (i = 0; i < len; i++) {
		    attr_name = allowed_attributes[i];
		    attr = elem.attributes[attr_name];
		    if (attr) {
			    attr_ok = true;
			    // Check protocol attributes for valid protocol
			    if (this.config.protocols[name] && this.config.protocols[name][attr_name]) {
				    protocols = this.config.protocols[name][attr_name];
				    del = attr.nodeValue.toLowerCase().match(Sanitize.REGEX_PROTOCOL);
				    if (del) {
					    attr_ok = (_array_index(del[1], protocols) != -1);
				    }
				    else {
					    attr_ok = (_array_index(Sanitize.RELATIVE, protocols) != -1);
				    }
			    }
			    if (attr_ok) {
				    // sanitize does not work in IE7. It tries to set the style attribute via setAttributeNode() and this is know to not work in IE7
				    // (see http://www.it-blogger.com/2007-06-22/microsofts-internetexplorer-und-mitglied-nicht-gefunden/ as a reference)
				    if (!isIE7 || (isIE7 && "style" !== attr_name)) {
					    this.current_element.setAttribute(attr_name, attr.nodeValue)
				    }
			    }
		    }
      }

      // Add attributes
      if(this.config.add_attributes[name]) {
        for(attr_name in this.config.add_attributes[name]) {
        	// sanitize does not work in IE7. It tries to set the style attribute via setAttributeNode() and this is know to not work in IE7
			// (see http://www.it-blogger.com/2007-06-22/microsofts-internetexplorer-und-mitglied-nicht-gefunden/ as a reference)
        	if(!isIE7 || (isIE7 && "style" !== attr_name)) {
	          this.current_element.setAttribute(attr_name, this.config.add_attributes[name][attr_name]);
        	}
        }
      }
    } // End checking if element is allowed
    // If this node is in the dynamic whitelist array (built at runtime by
    // transformers), let it live with all of its attributes intact.
    else if(_array_index(elem, this.whitelist_nodes) != -1) {
      this.current_element = elem.cloneNode(true);
      // Remove child nodes, they will be sanitiazied and added by other code
	    var childNodesLength = this.current_element.childNodes.length;
	    while(childNodesLength > 0) {
            this.current_element.removeChild(this.current_element.firstChild);
      }
      parent_element.appendChild(this.current_element);
    }

    // iterate over child nodes
    if(!this.config.remove_all_contents && !this.config.remove_element_contents[name]) {
	    var childNodes = elem.childNodes,
		    len = childNodes.length;
	    for (i = 0; i < len; i++) {
		    _clean.call(this, childNodes[i]);
	    }
    }

    // some versions of IE don't support normalize.
    if(this.current_element.normalize) {
      this.current_element.normalize();
    }
    this.current_element = parent_element;
  } // END clean_element function
  
  function _transform_element(node) {
    var output = {
      attr_whitelist:[],
      node: node,
      whitelist: false
    };
    var transform,
	    i,
	    j,
	    transLength = this.transformers.length,
	    len;
	for (i = 0; i < transLength; i++) {
      transform = this.transformers[i]({
        allowed_elements: this.allowed_elements,
        config: this.config,
        node: node,
        node_name: node.nodeName.toLowerCase(),
        whitelist_nodes: this.whitelist_nodes,
        dom: this.dom
      });
      if(transform == null) 
        continue;
      else if(typeof transform == 'object') {
        if(transform.whitelist_nodes && transform.whitelist_nodes instanceof Array) {
	      len = transform.whitelist_nodes.length
	      for (j = 0; j < len; j++) {
            if(_array_index(transform.whitelist_nodes[j], this.whitelist_nodes) == -1) {
              this.whitelist_nodes.push(transform.whitelist_nodes[j]);
            }
          }
        }
        output.whitelist = transform.whitelist ? true : false;
        if(transform.attr_whitelist) {
          output.attr_whitelist = _merge_arrays_uniq(output.attr_whitelist, transform.attr_whitelist);
        }
        output.node = transform.node ? transform.node : output.node;
      }
      else {
        throw new Error("transformer output must be an object or null");
      }
    }
    return output;
  }


  var childNodes = container.childNodes,
      i;
  for (i = 0, len = childNodes.length; i < len; i++) {
    _clean.call(this, childNodes[i]);
  }
  
  if(fragment.normalize) {
    fragment.normalize();
  }
  
  return fragment;
  
}