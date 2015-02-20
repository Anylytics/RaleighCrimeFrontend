// Now we've configured RequireJS, we can load our dependencies and start
define([ 'ractive', 'rv!../ractive/recentSearchesTemplate'], function ( Ractive, html) {



    var recentSearchesRactive = new Ractive({
      el: 'addresses',
      template: html,
      data: {
        searches: [],
        findColor: function(index) {
        	if (index >=85)
        		return "red";
        	if (index <= 35)
        		return "green";
        	return "orange";
        }
      }
    });

    return recentSearchesRactive;

});
