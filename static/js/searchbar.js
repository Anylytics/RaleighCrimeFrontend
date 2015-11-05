// Now we've configured RequireJS, we can load our dependencies and start
define([ 'ractive', 'ractive_events_keys', 'rv!../ractive/searchbarTemplate', 'geocoder', 'map', 'recentSearches', 'crimeIndex', 'summary', 'jquery', 'jqueryui', 'velocity', 'drag_drop'], function ( Ractive, events, html, geocoder, map, recentSearchesRactive, crimeIndexRactive, summaryRactive, $, jqueryui, Velocity, drag_drop) {

	animationID = 0;
	//------------Setup Mapbox / Leaflet ---------\\
	dayCrimes = L.mapbox.featureLayer().addTo(map);
	nightCrimes = L.mapbox.featureLayer().addTo(map);
	circleLayer = L.mapbox.featureLayer().addTo(map);
	filters = crimeIndexRactive.get("filters");
	dayCount = 0;
	nightCount = 0;

	dayFilter = function(f) {
		if (f.properties["hour"] >= 4 &&  f.properties["hour"] < 20) {
			dayCount++;
			return filters[f.properties["filter"]].checked;
		}
		return false;
	};
	dayCrimes.setFilter(dayFilter);

	nightFilter = function(f) {
		if (f.properties["hour"] < 4 ||  f.properties["hour"] >= 20) {
			nightCount++;
			return filters[f.properties["filter"]].checked;
		}
		return false;
	};
	nightCrimes.setFilter(nightFilter);

	//-------------Done--------------------------\\


	lastSearch = undefined;

    var searchRactive = new Ractive({
      el: 'searchContainer',
      template: html,
      data: {
        searchquery: "",
        partialMatches: undefined,
        modalText: undefined
      }
    });


    
    function processResult(result) 
    {
    	var newlatlng = { "lat": result.geometry.location.lat(), "lng": result.geometry.location.lng()};
    	var address = result.formatted_address;
    	var main_name = address.split(",").slice(0,2);
    	var object = {'name': main_name, 'geo': newlatlng, 'isChecked': false};
    	updateMap(object);
    }

    function styleLayer(layer)
    {
    	layer.eachLayer(function(locale) {
	        // Iterate over each marker.
	        var prop = locale.feature.properties;
	        //console.log(locale);
	        var appendClass = prop.type1 == 1 ? "tier1" : "";
	        locale.setIcon(L.icon({
			  iconUrl: './static/img/'+prop.icon,
			  iconSize: [25, 25],
			  iconAnchor: [25, 25],
			  popupAnchor: [0, -34],
			  className: appendClass
			}));
			$(locale._icon).addClass('animated fadeIn');
	        locale.bindPopup(prop.desc);
	    });
    }

    function populateMap(object, startDate, endDate)
    {
    	$.ajax({
	        dataType: "json",
	        url: "./crimes/"+object["geo"]["lat"]+","+object["geo"]["lng"]+","+startDate+","+endDate,
	        success: function(json) {
	        	nightCount = 0;
	        	dayCount = 0;
	            geojson = json["geojson"]
	            dayCrimes.setGeoJSON(geojson);
	            styleLayer(dayCrimes);
			    nightCrimes.setGeoJSON(geojson);
	            styleLayer(nightCrimes);

	            crimeIndexRactive.set("indexRatio", nightCount/(nightCount + dayCount)*100);

	            crimeIndexRactive.set("categoryCount", json["categoryCount"]);
	            //console.log(json["categoryCount"]);
	        }
	    });
    }

    function hideUI () {
    	$('#crimeIndex, #addresses, #summary, #legend, .die').velocity("fadeOut", { delay: 0, duration: 800 });
    	$('.leaflet-container').css('cursor', 'url(./static/img/cursorPick.png),auto');
    	//$('#addresses').css('display', 'none');
    }

    function showUI () {

    	$('.leaflet-container').css('cursor','');

    	$('#crimeIndex, #addresses, #summary, #legend, .die').velocity("fadeIn", { delay: 0, duration: 800 });

    }

    function updateMap(object)
    {
    	map.setView(object["geo"], 16);

	    var circle = L.circle([object["geo"]["lat"], object["geo"]["lng"]], 5, {
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
	    dayCrimes.clearLayers();
	    nightCrimes.clearLayers();
	    circleLayer.clearLayers();
	    circle.addTo(circleLayer);
		
	    var startDate = "20150101";
	    var endDate = "20151231";
	    lastSearch = object;
		populateMap(object, startDate, endDate);
		
	    $.ajax({
	        url: "./crimeIndex/"+object["geo"]["lat"]+","+object["geo"]["lng"],
	        dataTye: "json",
	        success: function(json) {
	            crimeIndexRactive.set("crimeIndex", json["crimeRatingYear"][5]);
	            //var indexRatio = json["crimeRatingYear_night"][5] / (json["crimeRatingYear_day"][5] + json["crimeRatingYear_night"][5]) * 100;
	            //crimeIndexRactive.set("indexRatio", indexRatio);


	            summaryRactive.set("summary", json["crimeRatingYear"]);
	            summaryRactive.set("day", json["crimeRatingYear_day"]);
	            summaryRactive.set("night", json["crimeRatingYear_night"]);

	            object["index"] = json["crimeRatingYear"][5];
	            var isSame = recentSearchesRactive.get("hasSearch")(object);
	            if (isSame == false) 
	            	recentSearchesRactive.unshift('searches', object);
	            
	            

	        }
	    });
    }

    function geoCodeQuery(latlng) {
    	var raleighCoords = [
	    	new google.maps.LatLng(35.715785, -78.526610),
			new google.maps.LatLng(35.743655, -78.740156),
			new google.maps.LatLng(35.785999, -78.754576),
			new google.maps.LatLng(35.820526, -78.738096),
			new google.maps.LatLng(35.852812, -78.793715),
			new google.maps.LatLng(35.908447, -78.824614),
			new google.maps.LatLng(35.943477, -78.738096),
			new google.maps.LatLng(35.915121, -78.681105),
			new google.maps.LatLng(35.903442, -78.617933),
			new google.maps.LatLng(35.977935, -78.553389),
			new google.maps.LatLng(35.909559, -78.521803),
			new google.maps.LatLng(35.715785, -78.526610)
		];

		var raleighPolygon = new google.maps.Polygon({
		    paths: raleighCoords
		});

		if (google.maps.geometry.poly.containsLocation(latlng, raleighPolygon)) {
		    geocoder.geocode( { 'latLng': latlng }, function(results, status) {
			    if (status == google.maps.GeocoderStatus.OK) {
			    	if (results[1]) {
			    		if (results[1].formatted_address.indexOf("Raleigh, NC") > -1 && results[1].formatted_address.slice(0,11) != "Raleigh, NC") {
			    			results[1].geometry.location.lat = latlng.lat;
			    			results[1].geometry.location.lng = latlng.lng;
			    			//var newlatlng = { "lat": result.geometry.location.k, "lng": result.geometry.location.D};
			    			//var output = { "geometry": {"location": {"k": e.latlng.lat, "D": e.latlng.lng}}, "formatted_address": };
							processResult(results[1]);
							return;
			    		}
			    	}  
			    }
			    //Google Wasn't Able to GeoCode, so we'll manually geocode
			    var output = { "geometry": {"location": {"A": latlng.k, "F": latlng.D}}, "formatted_address": "Custom Search, Raleigh"};
			    processResult(output);
			    return;
			});	
		}
		else {
			//Something went wrong
	 		searchRactive.set('modalText', "Unfortuantely we only support Raleigh, North Carolina right now. Please try searching inside city limits.");
			searchRactive.set('partialMatches', undefined);
			$('#searchesModal').modal();
			return;
		}

    	
    }

    crimeIndexRactive.on('updateFilters', function(event,filters) {
	    //console.log(filters);
	    dayCrimes.setFilter(dayFilter);
	    nightCrimes.setFilter(nightFilter);
	    styleLayer(dayCrimes);
	    styleLayer(nightCrimes);
	    //updateFilters();
	});

    crimeIndexRactive.on( 'dayButton', function(event) {
    	var dayActive = !crimeIndexRactive.get("dayActive");
    	crimeIndexRactive.set("dayActive", dayActive);
    	if (dayActive) {
    		map.addLayer(dayCrimes);
    	}
    	else {
    		map.removeLayer(dayCrimes);
    	}
    });

    crimeIndexRactive.on( 'nightButton', function(event) {
    	var nightActive = !crimeIndexRactive.get("nightActive");
    	crimeIndexRactive.set("nightActive", nightActive);
    	if (nightActive) {
    		map.addLayer(nightCrimes);
    	}
    	else {
    		map.removeLayer(nightCrimes);
    	}
    });

    searchRactive.on( 'repopulateMap', function(event, startDate, endDate) {
    	populateMap(lastSearch, startDate, endDate);
    });

    searchRactive.on( 'currentLocation', function(event) {
    	if (navigator.geolocation) {
        	navigator.geolocation.getCurrentPosition(function (position) {
        		//console.log(position);
        		var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
				geoCodeQuery(latlng);
        	});
	    } else {
	        alert("Your browser does not support GeoLocation");
    	}
    });

    searchRactive.on( 'submitSuggested', function(event, result) {
    	processResult(result);
    });


	searchRactive.on( 'submit', function( event, address )  {
		searchRactive.set('partialMatches', undefined);
		searchRactive.set('modalText', undefined);
	  	geocoder.geocode( { 'address': address, 'componentRestrictions': {'country': 'United States', 'locality': 'Raleigh', 'administrativeArea': 'NC' }}, function(results, status) {
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
	      		return;
	      	}
	      }
	      //Found No Results
	      if (results[0].formatted_address != "Raleigh, NC, USA") {
	      	searchRactive.set('modalText', "We're sorry, we didn't find any exact matches to your search... do any of these results sound familiar?");
	      	searchRactive.set('partialMatches', results);
	      }
	      else {
	      	searchRactive.set('modalText', "We're sorry, we didn't find any exact or partial matches to your search. Currently we only support locations in Raleigh, North Carolina. Try putting in an address (128 Clarendon Crescent) or name (Enloe High School) of a location.");
	      }
	      //alert("Unable to find address. Please enter an exact location in Raleigh, NC");
	      $('#searchesModal').modal();
	  	  //
	  	  
	  	  //
	    } else {
	    	searchRactive.set('modalText', "Uh Oh! An error occured! Would you please email us at hello@anylytics.io and let us know that you're experiencing problems with our app? Thank you!")
	    	$('#searchesModal').modal();
	      //Error Occurred
	      //alert('Geocode was not successful for the following reason: ' + status);
	    }
	  });
	});

	recentSearchesRactive.on( 'select', function( event, object )  {
		updateMap(object);
	});

	map.on('click', function(e) {
		if (searchRactive.get('clickMode') === true) {
			showUI();
			searchRactive.set('clickMode', false);
			var latlng = new google.maps.LatLng(e.latlng.lat, e.latlng.lng);
			geoCodeQuery(latlng);
		 	
		}
	});

	searchRactive.on('clickLocation', function (event) {
		hideUI();
	  	searchRactive.set('clickMode', true);
	});



	

	
    return searchRactive;




});
