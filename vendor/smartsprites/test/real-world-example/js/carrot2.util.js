jQuery.delegate = function(rules) {
  return function(e) {
    var target = jQuery(e.target);
    for (var selector in rules) {
      if (target.is(selector)) {
        return rules[selector].apply(this, jQuery.makeArray(arguments));
      }
    }
  }
};
