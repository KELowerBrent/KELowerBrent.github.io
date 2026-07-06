// =========================
// INITIALIZE MAP
// =========================

const map = L.map("map").setView([51.7, -0.12], 8);

// Base map
const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
}).addTo(map);

// =========================
// GLOBAL VARIABLES
// =========================

let lulcRaster, ndviRaster, lstRaster;

// Chart setup
const ctx = document.getElementById("chart");

const chart = new Chart(ctx, {
    type: "bar",
    data: {
        labels: ["LULC", "NDVI", "LST"],
        datasets: [{
            label: "Raster Values",
            data: [0, 0, 0]
        }]
    },
    options: {
        responsive: true
    }
});

// =========================
// LOAD GEOTIFF FILES
// =========================

async function loadRasters() {

    // LULC
    // const lulcResponse = await fetch("Data/Image_Landsat_2017_LST_catchment.tif");
    // const lulcArrayBuffer = await lulcResponse.arrayBuffer();
    // lulcRaster = await parseGeoraster(lulcArrayBuffer);

    // NDVI
    // const ndviResponse = await fetch("data/NDVI.tif");
    // const ndviArrayBuffer = await ndviResponse.arrayBuffer();
    // ndviRaster = await parseGeoraster(ndviArrayBuffer);

    // LST
    const lstResponse = await fetch("Data/Image_Landsat_2017_LST_catchment.tif.tif");
    const lstArrayBuffer = await lstResponse.arrayBuffer();
    lstRaster = await parseGeoraster(lstArrayBuffer);

    // Add rasters to map as layers
    const lulcLayer = new GeoRasterLayer({
        georaster: lulcRaster,
        opacity: 0.6,
        resolution: 256
    });

    const ndviLayer = new GeoRasterLayer({
        georaster: ndviRaster,
        opacity: 0.6,
        resolution: 256
    });

    const lstLayer = new GeoRasterLayer({
        georaster: lstRaster,
        opacity: 0.6,
        resolution: 256
    });

    // Layer control
    const overlays = {
        "LULC": lulcLayer,
        "NDVI": ndviLayer,
        "LST": lstLayer
    };

    L.control.layers(null, overlays).addTo(map);

    lulcLayer.addTo(map); // default layer
}

// =========================
// GET RASTER VALUE AT POINT
// =========================

function getValue(raster, lat, lng) {

    const value = geoblaze.identify(raster, [lng, lat]);

    return value;
}

// =========================
// MOUSE MOVE EVENT
// =========================

map.on("mousemove", function (e) {

    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    document.getElementById("lat").innerText = lat.toFixed(5);
    document.getElementById("lon").innerText = lng.toFixed(5);

    if (!lulcRaster || !ndviRaster || !lstRaster) return;

    const lulc = getValue(lulcRaster, lat, lng);
    const ndvi = getValue(ndviRaster, lat, lng);
    const lst = getValue(lstRaster, lat, lng);

    document.getElementById("lulc").innerText = lulc ?? "NoData";
    document.getElementById("ndvi").innerText = ndvi ?? "NoData";
    document.getElementById("lst").innerText = lst ?? "NoData";

    chart.data.datasets[0].data = [
        lulc ?? 0,
        ndvi ?? 0,
        lst ?? 0
    ];

    chart.update();

});

// =========================
// START APP
// =========================

loadRasters();
