// Now we've configured RequireJS, we can load our dependencies and start
define([ 'ractive', 'ractive_events_keys', 'rv!../ractive/searchbarTemplate', 'geocoder', 'map', 'recentSearches'], function ( Ractive, events, html, geocoder, map, recentSearchesRactive) {

	animationID = 0;
	locations = L.mapbox.featureLayer().addTo(map);

    var searchRactive = new Ractive({
      el: 'searchContainer',
      template: html,
      data: {
        searchquery: ""
      }
    });

    
    function processResult(result) 
    {
    	var newlatlng = { "lat": result.geometry.location.k, "lng": result.geometry.location.D};
    	var address = result.formatted_address;
    	var main_name = address.split("Raleigh")[0].split(",");
    	main_name.pop();
    	var object = {'name': main_name, 'geo': newlatlng};
    	map.setView(newlatlng, 16);

	    var circle = L.circle([newlatlng["lat"], newlatlng["lng"]], 5, {
		    color: 'red',
		    fillColor: '#f03',
		    fillOpacity: 0.1
		});

	    animationID = window.setInterval(function() {
		    var rad = circle.getRadius();
		    if (rad<500)
		    	circle.setRadius(rad+5);
		    else
		    	window.clearInterval(animationID);
		}, 5);
	    locations.clearLayers();

		circle.addTo(locations);

		$.ajax({
	        dataType: "json",
	        url: "./crimes/"+newlatlng["lat"]+","+newlatlng["lng"],
	        success: function(json) {
	            geojson = json["geojson"]
	            
	            locations.setGeoJSON(geojson);
	        }
	    });


    	recentSearchesRactive.unshift('searches', object);
    }

	searchRactive.on( 'submit', function( event, address )  {
	  	geocoder.geocode( { 'address': address, 'componentRestrictions': {'country': 'United States', 'locality': 'Raleigh'}}, function(results, status) {
	    if (status == google.maps.GeocoderStatus.OK) {
	      for (var i = 0; i<results.length; i++)
	      {
	      	if (results[i].partial_match == true)
	      	{
	      		//Partial Result
	      		//Not Good Enough
	      		continue;
	      	}
	      	else
	      	{
	      		//Legit Result! 
	      		processResult(results[i]);
	      		break;
	      	}
	      }
	      //Found No Results

	  	  //
	  	  
	  	  //
	    } else {
	      //Error Occurred
	      //alert('Geocode was not successful for the following reason: ' + status);
	    }
	  });
	});

	

	
    return searchRactive;

});