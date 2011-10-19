"use strict";
define([],
function(){
  var Ecma5Polyfills = {

    // Function bind
    bind: function(func, owner){
      var native_method = Function.prototype.bind;          
      var args= Array.prototype.slice.call(arguments, 1);

      if(native_method){
        native_method.apply(func, arguments); 
      }
      else{
        return function() {
          return func.apply(owner, arguments.length===0? args : args.concat(Array.prototype.slice.call(arguments)));
        }
      }
    },

    // String trim
    trim: function(string){
      var native_method = String.prototype.trim;

      if(native_method){
        native_trim.call(string); 
      }
      else {
        return this.replace(/^\s+/, '').replace(/\s+$/, '');
      }
    },

    // Array methods 
    indexOf: function(array, find, i /*opt*/){
      var native_method = Array.prototype.indexOf;     

      if(native_method){
        native_method.call(array, find, i); 
      }
      else {
        if (i===undefined) i= 0;
        if (i<0) i+= array.length;
        if (i<0) i= 0;
        for (var n = array.length; i<n; i++)
            if (i in array && array[i]===find)
                return i;
        return -1;
      }
    },
    
    forEach: function(array, action, that /*opt*/){
      var native_method = Array.prototype.forEach;          

      if(native_method){
        native_method.call(array, action, that); 
      }
      else {
        for (var i= 0, n= array.length; i<n; i++)
          if (i in array)
            action.call(that, array[i], i, array);
      }
    },

    map: function(array, mapper, that /*opt*/){
      var native_method = Array.prototype.map; 

      if(native_method){
        native_method.call(array, mapper, that); 
      }
      else {
        var other= new Array(array.length);
        for (var i= 0, n= array.length; i<n; i++)
            if (i in array)
                other[i]= mapper.call(that, array[i], i, array);
        return other;
      }
    },

    filter: function(array, filter, that /*opt*/){
      var native_method = Array.prototype.filter;         

      if(native_method){
        native_method.call(array, filter, that); 
      }
      else {
        var other= [], v;
        for (var i=0, n= array.length; i<n; i++)
            if (i in array && filter.call(that, v= array[i], i, array))
                other.push(v);
        return other;
      }
    },

    every: function(array, tester, that /*opt*/) {
       var native_method = Array.prototype.every;

       if(native_method){
         native_method.call(array, tester, that); 
       }
       else {
         for (var i= 0, n= array.length; i<n; i++)
            if (i in array && !tester.call(that, array[i], i, array))
                return false;
         return true;
       }
    },

    some: function(array, tester, that /*opt*/){
        var native_method = Array.prototype.some;  

        if(native_method){
          native_method.call(array, tester, that); 
        }
        else {
          for (var i= 0, n= array.length; i<n; i++)
            if (i in array && tester.call(that, array[i], i, array))
                return true;
          return false;
        }
    },

    // Node constants
    // http://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-1841493061
    nodeType: function(){
      if(Node){
        return Node; 
      }                
      else {
        return {
          'ELEMENT_NODE' : 1,
          'ATTRIBUTE_NODE': 2,
          'TEXT_NODE': 3,
          'CDATA_SECTION_NODE': 4,
          'ENTITY_REFERENCE_NODE': 5,
          'ENTITY_NODE': 6,
          'PROCESSING_INSTRUCTION_NODE': 7,
          'COMMENT_NODE': 8,
          'DOCUMENT_NODE': 9,
          'DOCUMENT_TYPE_NODE': 10,
          'DOCUMENT_FRAGMENT_NODE': 11,
          'NOTATION_NODE': 12,
          //The two nodes are disconnected. Order between disconnected nodes is always implementation-specific.
          'DOCUMENT_POSITION_DISCONNECTED': 0x01,
          //The second node precedes the reference node.
          'DOCUMENT_POSITION_PRECEDING': 0x02, 
          //The node follows the reference node.
          'DOCUMENT_POSITION_FOLLOWING': 0x04,
          //The node contains the reference node. A node which contains is always preceding, too.
          'DOCUMENT_POSITION_CONTAINS': 0x08,
          //The node is contained by the reference node. A node which is contained is always following, too.
          'DOCUMENT_POSITION_CONTAINED_BY': 0x10,
          //The determination of preceding versus following is implementation-specific.
          'DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC': 0x20
        } 
      }
    },

    // http://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-compareDocumentPosition
    // FIXME: Check if the DOMNode prototype can be set.
    compareDocumentPosition: function(node1, node2) {
      
      if ('compareDocumentPosition' in document.documentElement ) {
        return node1.compareDocumentPosition(node2);
      } 
      
      if (!("contains" in document.documentElement)) {
        throw 'compareDocumentPosition nor contains is not supported by this browser.';
      }
      
      if (node1 == node2) return 0;
      
      //if they don't have the same parent, there's a disconnect
      if (getRootParent(node1) != getRootParent(node2)) return 1;
      
      //use this if both nodes have a sourceIndex (text nodes don't)
      if ("sourceIndex" in node1 && "sourceIndex" in node2) {
        return comparePosition(node1, node2);
      }
      
      //document will definitely contain the other node
      if (node1 == document) return 20;
      else if (node2 == document) return 10;
      
      //get sourceIndexes to use for both nodes
      var useNode1 = getUseNode(node1), useNode2 = getUseNode(node2);
      
      //call this function again to get the result
      var result = comparePosition(useNode1, useNode2);
      
      //clean up if needed
      if (node1 != useNode1) useNode1.parentNode.removeChild(useNode1);
      if (node2 != useNode2) useNode2.parentNode.removeChild(useNode2);
      return result;


      //node.ownerDocument gives the document object, which isn't the right info for a disconnect
      function getRootParent(node) {
        do { var parent = node; }
        while (node = node.parentNode);
        return parent;
      }

      //Compare Position - MIT Licensed, John Resig; http://ejohn.org/blog/comparing-document-position/
      //Already checked for equality and disconnect
      function comparePosition(node1, node2) {
        return (node1.contains(node2) && 16) +
          (node2.contains(node1) && 8) +
            (node1.sourceIndex >= 0 && node2.sourceIndex >= 0 ?
              (node1.sourceIndex < node2.sourceIndex && 4) +
                (node1.sourceIndex > node2.sourceIndex && 2) :
              1);
      }

      //get a node with a sourceIndex to use
      function getUseNode(node) {
        //if the node already has a sourceIndex, use that node
        if ("sourceIndex" in node) return node;
        //otherwise, insert a comment (which has a sourceIndex but minimal DOM impact) before the node and use that
        return node.parentNode.insertBefore(document.createComment(""), node);
      }
    },

    getComputedStyle: function(node, style){
      if('getComputedStyle' in window) {
        window.getComputedStyle(node, style); 
      }
      else {
        if( node.currentStyle ) {
          return node.currentStyle;
        }
        return null;
      }
    }
     
  };

  return Ecma5Polyfills;
});
