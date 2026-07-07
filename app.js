// Create Map

const map = L.map("map").setView([51.7, -0.8], 15);

// Base Layer

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
{
    maxZoom:19,
    attribution:"© OpenStreetMap"
}).addTo(map);

let rasterLayer;
let georaster;

function getLSTColor(value){

    return chroma
        .scale([
            "#313695",
            "#4575b4",
            "#74add1",
            "#abd9e9",
            "#fee090",
            "#fdae61",
            "#f46d43",
            "#d73027"
        ])
        .domain([
            georaster.mins[0],
            georaster.maxs[0]
        ])(value)
        .hex();

}
// Load GeoTIFF from GitHub repository

fetch("Data/Image_Landsat_2017_LST_catchment.tif")

.then(response=>response.arrayBuffer())

.then(arrayBuffer=>parseGeoraster(arrayBuffer))

.then(raster=>{

  rasterLayer = new GeoRasterLayer({

    georaster: raster,

     // Add these lines
    console.log(georaster);
    console.log("Min:", georaster.mins);
    console.log("Max:", georaster.maxs);
    console.log("NoData:", georaster.noDataValue);

    rasterLayer = new GeoRasterLayer({

        georaster: georaster,
        opacity: 0.7

    });

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
