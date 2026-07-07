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

// Load GeoTIFF from GitHub repository

fetch("Data/Image_Landsat_2017_LST_catchment.tif")

.then(response=>response.arrayBuffer())

.then(arrayBuffer=>parseGeoraster(arrayBuffer))

.then(raster=>{

    georaster=raster;

    rasterLayer=new GeoRasterLayer({

        georaster:georaster,
        opacity:0.7

    });

    rasterLayer.addTo(map);

    map.fitBounds(rasterLayer.getBounds());

});

// Mouse Click

map.on("click",function(e){

    document.getElementById("lat").innerHTML=e.latlng.lat.toFixed(6);

    document.getElementById("lng").innerHTML=e.latlng.lng.toFixed(6);

    if(!georaster) return;

    const value=getRasterValue(e.latlng);

    document.getElementById("value").innerHTML=value;

});


// Read Raster Value

function getRasterValue(latlng){

    const xmin=georaster.xmin;
    const ymax=georaster.ymax;

    const pixelWidth=georaster.pixelWidth;
    const pixelHeight=georaster.pixelHeight;

    const x=Math.floor((latlng.lng-xmin)/pixelWidth);

    const y=Math.floor((ymax-latlng.lat)/pixelHeight);

    if(
        x<0 ||
        y<0 ||
        x>=georaster.width ||
        y>=georaster.height
    ){

        return "Outside Raster";

    }

    const value=georaster.values[0][y][x];

    return value;

}
