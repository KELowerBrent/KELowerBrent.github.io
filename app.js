// Create Map

const map = L.map("map").setView([51.7, -0.8], 15);

L.control.scale({ position: 'bottomright', metric:true, imperial:false, maxWidth: 200 }).addTo(map);

// Base Layer

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
{
    maxZoom:19,
    attribution:"© OpenStreetMap"
}).addTo(map);

var topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: '&copy; OpenTopoMap contributors'
});

var cartoLight = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://carto.com">CARTO</a>'
});

var satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '&copy; Esri'
})


var dark = L.tileLayer(
'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png',
{
    attribution: '&copy; CARTO'
});

var baseMaps = {
    "OpenStreetMap": osm,
    "OpenTopoMap": topo,
    "CartoDB Light": cartoLight,
    "Esri Satellite": satellite
};

// const geoJsonFiles = [
//     { path: './Data/London_Ward_json.geojson', color: '#3388ff', label: 'Ward' },
//     { path: './Data/London_Boroughs.geojson', color: '#ff5533', label: 'Borough' },
//     { path: './Data/Lower_brent_river.geojson', color: '#2ecc71', label: 'Lower Brent River' },
//     { path: './Data/Lower_brent_river_catchment.geojson', color: '#9b59b6', label: 'Catchment' }
// ];


L.control.layers(baseMaps, { collapsed: true, position:'bottomleft'}).addTo(map);


let rasterLayer;
let georaster;

// Global variables to hold both rasters
let georaster2017 = null;
let georaster2026 = null;

// 1. Load GeoTIFF 2017
fetch("Data/Image_Landsat_2017_LST_catchment.tif")
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => parseGeoraster(arrayBuffer))
    .then(raster => {
        georaster2017 = raster;
        let rasterLayer = new GeoRasterLayer({ georaster: raster, opacity: 0.7 });
        rasterLayer.addTo(map);
        map.fitBounds(rasterLayer.getBounds());
    });

// 2. Load GeoTIFF 2026
fetch("Data/Image_Landsat_2026_LST_catchmentwgs84.tif") // Ensure this path matches your 2026 file
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => parseGeoraster(arrayBuffer))
    .then(raster => {
        georaster2026 = raster;
        let rasterLayer = new GeoRasterLayer({ georaster: raster, opacity: 0.7 });
        rasterLayer.addTo(map);
    });

// Mouse Click Event
map.on("click", function(e) {
    document.getElementById("lat").innerHTML = e.latlng.lat.toFixed(3);
    document.getElementById("lng").innerHTML = e.latlng.lng.toFixed(3);

    // Get value for 2017
    let val2017 = getRasterValue(georaster2017, e.latlng);
    document.getElementById("value_1").innerHTML = isNaN(val2017) ? val2017 : val2017.toFixed(2);

    // Get value for 2026
    let val2026 = getRasterValue(georaster2026, e.latlng);
    document.getElementById("value_2").innerHTML = isNaN(val2026) ? val2026 : val2026.toFixed(2);

    // Calculate and display mathematical difference
    let diffEl = document.getElementById("value_");
    if (!isNaN(val2017) && !isNaN(val2026)) {
        let difference = val2026 - val2017;
        diffEl.innerHTML = difference.toFixed(2);
    } else {
        diffEl.innerHTML = "-";
    }
});

// Reusable Function to Read Raster Value
function getRasterValue(raster, latlng) {
    if (!raster) return "Loading...";

    const xmin = raster.xmin;
    const ymax = raster.ymax;
    const pixelWidth = raster.pixelWidth;
    const pixelHeight = raster.pixelHeight;

    const x = Math.floor((latlng.lng - xmin) / pixelWidth);
    const y = Math.floor((ymax - latlng.lat) / pixelHeight);

    if (x < 0 || y < 0 || x >= raster.width || y >= raster.height) {
        return "Outside Raster";
    }

    // Assumes single-band raster (band 0). 
    // If your georaster library structure returns an array, use: raster.values[0][y][x]
    return raster.values[0][y][x]; 
}

// Single Unified Mouse Click Event Listener
map.on("click", function(e) {
    // 1. Update Coordinates
    document.getElementById("lat").innerHTML = e.latlng.lat.toFixed(6);
    document.getElementById("lng").innerHTML = e.latlng.lng.toFixed(6);

    // 2. Safely extract values using the generalized reader function
    const val2017 = (typeof georaster2017 !== 'undefined') ? getRasterValue(georaster2017, e.latlng) : "Outside";
    const val2026 = (typeof georaster2026 !== 'undefined') ? getRasterValue(georaster2026, e.latlng) : "Outside";

    // 3. Update the UI Text elements (handles formatting if it is a valid number)
    document.getElementById("value_1").innerHTML = isNaN(val2017) ? val2017 : val2017.toFixed(2);
    document.getElementById("value_2").innerHTML = isNaN(val2026) ? val2026 : val2026.toFixed(2);

    // 4. Directly calculate the mathematical difference
    const diffElement = document.getElementById("value_");
    
    if (!isNaN(val2017) && !isNaN(val2026)) {
        const difference = val2026 - val2017;
        diffElement.innerHTML = difference.toFixed(2);
    } else {
        diffElement.innerHTML = "N/A"; // Display if one or both are outside the raster bounds
    }
});
