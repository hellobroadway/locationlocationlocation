var apiurl = "http://api.nytimes.com/svc/events/v2/listings.jsonp?filters=category:%28Theater%29,borough:Manhattan&api-key=249fd02b51b18fa0242178b3b4c32d39:10:67424442&limit=100&callback=?";

var attribution_mapbox = 'Map via <a href="http://openstreetmap.org">OpenStreetMap</a>, <a href="http://mapbox.com">Mapbox</a>';

// present
var ny_2014 = L.tileLayer( 'https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png',{id: 'examples.map-20v6611k',attribution: attribution_mapbox});

// create map with default tileset
var map = L.map('map', {layers:ny_2014, maxZoom:21, minZoom:13});

// the geojson as it comes from the text document
var jsonurl = 'https://gist.githubusercontent.com/mgiraldo/cc86b6b043f3ad16a719/raw/f5771610375e21253bae97dbf37f8f9c906478c3/merged.geojson';

var overlays, geodata, geolayer;

function showMap(geodata) {
    geolayer = L.geoJson(geodata, {onEachFeature: showPopup});
    // add the points to the map
    geolayer.addTo(map);
    // zoom the map to the bounds of the points
    map.fitBounds(geolayer.getBounds());
}

function showPopup(feature, layer) {
    var key, val;
    var content = [];
    for (key in feature.properties) {
      val = "<strong>" + key + ":</strong> ";
      val += feature.properties[key];
      content.push(val);
    }
    layer.bindPopup(content.join("<br />"));
}

function geoJSONify(resultarray) {
  var i, j;
  var result = {};
  result.type = "FeatureCollection";
  result.features = [];
  var keys = ["event_id",
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
    var item = resultarray[i]
    feature = {};
    feature.type = "Feature";
    for (j=0;j<keys.length;j++) {
      feature.properties[keys[j]] = item[keys[j]];
    }
    feature.geometry = {
      type: "Point",
      coordinates: [item.geocode_longitude,item.geocode_latitude]
    }
    result.features.push(feature);
  }
  return result;
}

$.getJSON(apiurl, function(data){
  var geojson = geoJSONify(data.results);
  showMap(geojson);
});
