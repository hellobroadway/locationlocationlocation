var event_limit = 200;

var apiurl = "http://api.nytimes.com/svc/events/v2/listings.jsonp?filters=category:%28Theater%29,borough:Manhattan&api-key=249fd02b51b18fa0242178b3b4c32d39:10:67424442&limit="+event_limit+"&callback=?";

var attribution_mapbox = 'Map via <a href="http://openstreetmap.org">OpenStreetMap</a>, <a href="http://mapbox.com">Mapbox</a>';

// present
var ny_2014 = L.tileLayer( 'https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png',{id: 'examples.map-20v6611k',attribution: attribution_mapbox});

// create map with default tileset
var map = L.map('map', {layers:ny_2014, maxZoom:21, minZoom:13});

// TRYING GEOLOCATION

var userMarker;

map.locate({setView: true, maxZoom: 16});

map.on('locationfound', function(e) {
    console.log("found", e);
    userMarker = L.circleMarker(e.latlng,{
        fillOpacity: 1,
        opacity: 1,
        color: '#009',
        fillColor: '#ddf',
        weight: 2,
        radius: 6
    });
    userMarker.addTo(map);
});

map.on('locationerror', function(e) {
    console.log("not found");
});

// END TRYING GEOLOCATION

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
    html += "<div class=\"event_page\"><a href=\""+p.event_detail_url+"\">View event page</a></div>";
    layer.bindPopup(html);
}

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
