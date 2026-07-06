// =========================
// 1. INITIALIZE MAP ENGINE (IMMEDIATE)
// =========================

// Center view coordinates directly over Brent River Park, West London
const map = L.map("map").setView([51.515, -0.34], 12);

L.control.scale({ position: 'bottomright', metric: true, imperial: false, maxWidth: 200 }).addTo(map);  

// Standard OpenStreetMap Tile Layer - Instantly added to prevent blank canvas
const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
}).addTo(map); // <--- Added directly to ensure immediate visual feedback

const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: '&copy; OpenTopoMap contributors'
});

const cartoLight = L.tileLayer('https://{s}://{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CARTO'
});

const dark = L.tileLayer('https://{s}://{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CARTO'
});

const baseMaps = {
    "OpenStreetMap": osm,
    "Dark Theme Map": dark,
    "OpenTopoMap": topo,
    "CartoDB Light": cartoLight
};

// Global Layer Control variable placed on the map structural canvas
const layerControl = L.control.layers(baseMaps, null, { collapsed: true, position: 'bottomleft' }).addTo(map);

// Vector Overlay Storage Paths
const geoJsonFiles = [
    { path: './Data/London_Ward_json.geojson', color: '#3388ff', label: 'Ward' },
    { path: './Data/London_Boroughs.geojson', color: '#ff5533', label: 'Borough' },
    { path: './Data/Lower_brent_river.geojson', color: '#2ecc71', label: 'Lower Brent River' },
    { path: './Data/Lower_brent_river_catchment.geojson', color: '#9b59b6', label: 'Catchment' }
];

// Async execution pipeline processing vector layouts
const fetchPromises = geoJsonFiles.map(file => 
    fetch(file.path)
        .then(res => {
            if (!res.ok) throw new Error(`Network failure resolving: ${file.path}`);
            return res.json();
        })
        .catch(err => {
            console.warn(`Vector layer skipped: ${file.path}. Check if file exists.`, err);
            return null; // Don't break the promise chain if one file is missing
        })
);

Promise.all(fetchPromises)
    .then(datasets => {
        datasets.forEach((data, index) => {
            if (!data) return; // Skip failed fetches
            const config = geoJsonFiles[index];
            const vectorLayer = L.geoJSON(data, {
                style: { color: config.color, weight: 2, fillOpacity: 0.1 },
                onEachFeature: function(feature, layer) {
                    if (feature.properties) {
                        const name = feature.properties.name || feature.properties.NAME || 'Unknown Region';
                        layer.bindPopup(`<b>${config.label}:</b> ${name}`);
                    }
                }
            }).addTo(map);
            
            layerControl.addOverlay(vectorLayer, config.label);
        });
    })
    .catch(error => console.error('Error compiling external Vector layers: ', error));

// =========================
// 2. RASTER INITIALIZATION & CHART SETUP
// =========================

let lulcRaster = null, ndviRaster = null, lstRaster = null;
let lulcLayer = null, ndviLayer = null, lstLayer = null;

const ctx = document.getElementById("chart");

const chart = new Chart(ctx, {
    type: "bar",
    data: {
        labels: ["LULC", "NDVI", "LST"],
        datasets: [{
            label: "Pixel Analysis Readings",
            data: [0, 0, 0], // Safe initialization array
            backgroundColor: ["#3182ce", "#2ecc71", "#e53e3e"]
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { beginAtZero: true }
        }
    }
});

// =========================
// 3. LOAD GEOTIFF ENGINE ARCHITECTURE (DEFERRED ASYNC)
// =========================

async function loadRasters() {
    try {
        // Fetch LULC
        const lulcResponse = await fetch("Data/Image_Landsat_2017_LST_catchment.tif");
        if (!lulcResponse.ok) throw new Error("LULC GeoTIFF file not found");
        const lulcArrayBuffer = await lulcResponse.arrayBuffer();
        lulcRaster = await parseGeoraster(lulcArrayBuffer);

        // Fetch NDVI
        const ndviResponse = await fetch("Data/NDVI.tif");
        if (!ndviResponse.ok) throw new Error("NDVI GeoTIFF file not found");
        const ndviArrayBuffer = await ndviResponse.arrayBuffer();
        ndviRaster = await parseGeoraster(ndviArrayBuffer);

        // Fetch LST
        const lstResponse = await fetch("Data/Image_Landsat_2017_LST_catchment.tif");
        if (!lstResponse.ok) throw new Error("LST GeoTIFF file not found");
        const lstArrayBuffer = await lstResponse.arrayBuffer();
        lstRaster = await parseGeoraster(lstArrayBuffer);

        // Check if the external constructor plugin exists in global window memory space
        if (typeof GeoRasterLayer !== "undefined") {
            lulcLayer = new GeoRasterLayer({ georaster: lulcRaster, opacity: 0.5, resolution: 256 });
            ndviLayer = new GeoRasterLayer({ georaster: ndviRaster, opacity: 0.5, resolution: 256 });
            lstLayer = new GeoRasterLayer({ georaster: lstRaster, opacity: 0.5, resolution: 256 });

            layerControl.addOverlay(lulcLayer, "Raster Map: LULC");
            layerControl.addOverlay(ndviLayer, "Raster Map: NDVI");
            layerControl.addOverlay(lstLayer, "Raster Map: LST");

            // Set LULC checked by default
            lulcLayer.addTo(map);
            setupLegendToggles();
        } else {
            console.error("GeoRasterLayer engine missing. Verify scripts in index.html");
        }

    } catch (err) {
        console.error("Raster Engine deferred initialization note: ", err.message);
        // Map continues displaying base imagery safely even if local files fail to load
    }
}

function getPixelValue(raster, lat, lng) {
    if (!raster || typeof geoblaze === "undefined") return null;
    try {
        const val = geoblaze.identify(raster, [lng, lat]);
        if (Array.isArray(val)) {
            return (val[0] !== null && !isNaN(val[0])) ? val[0] : null;
        }
        return (val !== null && !isNaN(val)) ? val : null;
    } catch (e) {
        return null;
    }
}

function setupLegendToggles() {
    const tLulc = document.getElementById("toggle-lulc");
    const tNdvi = document.getElementById("toggle-ndvi");
    const tLst = document.getElementById("toggle-lst");

    if (tLulc && lulcLayer) {
        tLulc.addEventListener("change", (e) => e.target.checked ? lulcLayer.addTo(map) : map.removeLayer(lulcLayer));
    }
    if (tNdvi && ndviLayer) {
        tNdvi.addEventListener("change", (e) => e.target.checked ? ndviLayer.addTo(map) : map.removeLayer(ndviLayer));
    }
    if (tLst && lstLayer) {
        tLst.addEventListener("change", (e) => e.target.checked ? lstLayer.addTo(map) : map.removeLayer(lstLayer));
    }
}

// =========================
// 4. MOUSE INTERACTION TRACKER
// =========================

map.on("mousemove", function (e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    document.getElementById("lat").innerText = lat.toFixed(5);
    document.getElementById("lon").innerText = lng.toFixed(5);

    if (!lulcRaster || !ndviRaster || !lstRaster) return;

    const lulc = getPixelValue(lulcRaster, lat, lng);
    const ndvi = getPixelValue(ndviRaster, lat, lng);
    const lst = getPixelValue(lstRaster, lat, lng);

    document.getElementById("lulc").innerText = lulc !== null ? lulc.toFixed(1) : "NoData";
    document.getElementById("ndvi").innerText = ndvi !== null ? ndvi.toFixed(4) : "NoData";
    document.getElementById("lst").innerText = lst !== null ? lst.toFixed(1) : "NoData";

    chart.data.datasets[0].data = [
        lulc !== null ? lulc : 0,
        ndvi !== null ? ndvi : 0,
        lst !== null ? lst : 0
    ];

    chart.update('none');
});

// Run file processor safely after base map configuration maps are structural
loadRasters();
