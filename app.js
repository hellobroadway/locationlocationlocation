var event_limit = 200;

var apiurl = "http://api.nytimes.com/svc/events/v2/listings.jsonp?filters=category:%28Theater%29,borough:Manhattan&api-key=249fd02b51b18fa0242178b3b4c32d39:10:67424442&limit="+event_limit+"&callback=?";

var attribution_mapbox = 'Map via <a href="http://openstreetmap.org">OpenStreetMap</a>, <a href="http://mapbox.com">Mapbox</a>';

// present
var ny_2014 = L.tileLayer( 'https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png',{id: 'examples.map-20v6611k',attribution: attribution_mapbox});

// create map with default tileset
var map = L.map('map', {layers:ny_2014, maxZoom:21, minZoom:13});

var userMarker;

var userLat = 0;
var userLon = 0;

// Incorporate user icon using man icon Created by Klara Zalokar - https://thenounproject.com/klarazalokar/
var userIcon = L.icon({
    iconUrl: './leaflet-awesome/images/noun_14741_cc.svg',

    iconSize:     [17, 38], // size of the icon
    iconAnchor:   [8, 38], // point of the icon which will correspond to marker's location
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});

map.locate({setView: true, maxZoom: 16});

map.on('locationfound', function(e) {
    console.log("found", e);
    userLat = e.latitude;
    userLon = e.longitude;
    userMarker = L.marker(e.latlng, {icon: userIcon});
    userMarker.addTo(map);
});

map.on('locationerror', function(e) {
    console.log("not found");
});

var overlays, geodata, geolayer;

var mapdata = [], categories = [], subcategories = [];

var geodata = [];

var colorArray = ['red', 'purple', 'green', 'blue', 'purple', 'darkpurple', 'cadetblue'];

var markers = {};
// Create color markers for each subcategory:
markers["Off_Broadway"] = new L.AwesomeMarkers.icon({
  icon: 'star',
  iconColor: 'white',
  markerColor: colorArray[0]
});

markers["Off_Off_Broadway"] = new L.AwesomeMarkers.icon({
  icon: 'star',
  iconColor: 'white',
  markerColor: colorArray[1]
});

markers["Broadway"] = new L.AwesomeMarkers.icon({
  icon: 'star',
  iconColor: 'white',
  markerColor: colorArray[2]
});

markers["Extravaganzas"] = new L.AwesomeMarkers.icon({
  icon: 'star',
  iconColor: 'white',
  markerColor: colorArray[3]
});



function showMap() {

    var i;
    // console.log(mapdata);
    var b = new L.LatLngBounds();
    for (i=0;i<mapdata.length;i++) {
        var geo = L.geoJson(mapdata[i], {
            pointToLayer: function(f,l) {
                return L.marker(l,{icon:markers[mapdata[i].properties.subcategory.replace(/\s/g, "_")]});
            },
            onEachFeature: showPopup});
        geodata.push(geo);
        geo.addTo(map);
        map.setView(geo.getBounds().getCenter(), 12);
        b.extend(geo.getBounds());
    }
    map.fitBounds(b);
}

function showPopup(feature, layer) {
    var key, val;
    var html = "";
    var p = feature.properties;
    html += "<div class=\"event_name\">" + p.event_name.replace(/[’‘]*/g, "") + "</div>";
    if (p.free) html += "<div class=\"free\">FREE!</div>";
    if (p.kid_friendly) html += "<div class=\"kid_friendly\">Kid friendly</div>";
    html += "<div class=\"venue\">At: <a href=\"http://"+p.venue_website+"\">"+p.venue_name+"</a></div>";
    html += "<div class=\"category\">Categories: "+p.category + ", " + p.subcategory +"</div>";
    html += "<div class=\"directions\"><a href=\"https://www.google.com/maps/dir/"+( (userLat!=0 && userLon!=0) ? userLat+","+userLon+"/" : "/" )+p.geocode_latitude+","+p.geocode_longitude+"/data=!3m1!4b1!4m2!4m1!3e3\">Get directions</a></div>";
    html += "<div class=\"event_page\"><a href=\""+p.event_detail_url+"\">View event page</a></div>";
    layer.bindPopup(html);
}

// https://www.google.com/maps/dir/40.7710592,-73.9808833/40.7698559,-73.9843209/

function buildFacets() {
    var i;
    var html;
    var cat;
    for (i=0; i<categories.length; i++) {
        cat = categories[i];
        html = '<option value="'+cat+'">' + cat + '</option>';
        $("#categories").append(html);
    }
    for (i=0; i<subcategories.length; i++) {
        cat = subcategories[i];
        html = '<option value="'+cat+'">' + cat + '</option>';
        $("#subcategories").append(html);
    }
}

function geoJSONify(resultarray) {
    mapdata = {};
    categories = [];
    subcategories = [];
    var i, j;
    var result = [];
    var keys = [
        // "event_id",
        "event_name",
        "event_detail_url",
        "venue_name",
        "venue_website",
        "category",
        "geocode_latitude",
        "geocode_longitude",
        "subcategory",
        "free",
        "kid_friendly"
    ];
    var l = resultarray.length;
    for (i=0;i<l;i++) {
        var item = resultarray[i];
        feature = {};
        feature.type = "Feature";
        feature.properties = {};
        for (j=0;j<keys.length;j++) {
            var key = keys[j];
            feature.properties[key] = item[key];
            if (key == "category" && categories.indexOf(item[key])==-1) categories.push(item[key]);
            if (key == "subcategory" && subcategories.indexOf(item[key])==-1) subcategories.push(item[key]);
        }
        feature.geometry = {
            type: "Point",
            coordinates: [item.geocode_longitude,item.geocode_latitude]
        }
        result.push(feature);
    }
    return result;
}

function filterCategory(type, name) {
    var i;
    var b = new L.LatLngBounds();
    for (i=0;i<mapdata.length;i++) {
        var item = mapdata[i];
        var geo = geodata[i];
        if (name == "") {
            if (!map.hasLayer(geo)) map.addLayer(geo);
            b.extend(geo.getBounds());
            continue;
        }
        if (item.properties[type] != name) {
            if (map.hasLayer(geo)) map.removeLayer(geo);
        } else {
            if (!map.hasLayer(geo)) {
                map.addLayer(geo);
            }
            b.extend(geo.getBounds());
        }
    }
    map.fitBounds(b);
}


function init() {
    $("#categories").on( "change", function (event) {
        filterCategory("category", event.target.value);
    });
    $("#subcategories").on( "change", function (event) {
        filterCategory("subcategory", event.target.value);
    });
    $.getJSON(apiurl, function(data){
        // console.log(data);
        mapdata = geoJSONify(data.results);
        buildFacets();
        showMap();
    });
}

init();
