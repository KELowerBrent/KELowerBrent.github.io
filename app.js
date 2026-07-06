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

function getColor(value){

    let min = georaster.mins[0];
    let max = georaster.maxs[0];

    let ratio = (value - min) / (max - min);


    if(ratio < 0.25){
        return "blue";
    }

    else if(ratio < 0.5){
        return "cyan";
    }

    else if(ratio < 0.75){
        return "yellow";
    }

    else{
        return "red";
    }

}

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

     pixelValuesToColorFn:function(values){

            let value = values[0];


            // Hide NoData pixels

            if(value === georaster.noDataValue){

                return null;

            }


            return getColor(value);

        }

    });


    rasterLayer.addTo(map);

    map.fitBounds(rasterLayer.getBounds());
    addLegend();
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

function addLegend(){

    const legend = L.control({
        position:"bottomright"
    });


    legend.onAdd=function(){

        const div=L.DomUtil.create(
            "div",
            "gradient-legend"
        );


        div.innerHTML=`

        <b>Land Surface Temperature</b>

        <div class="gradient-bar"></div>

        <div class="labels">
            <span>${georaster.mins[0].toFixed(1)}</span>
            <span>${georaster.maxs[0].toFixed(1)}</span>
        </div>

        `;


        return div;

    };


    legend.addTo(map);

}
