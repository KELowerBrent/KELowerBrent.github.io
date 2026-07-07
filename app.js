// 1. Initialize the Leaflet Map
const map = L.map('map').setView([0, 0], 2); // Fallback global view

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// 2. Global Variables for Data and Calculation Tracking
let georaster2017 = null;
let georaster2026 = null;

// Reusable function to fetch and map a GeoTIFF layer
function loadRasterLayer(filePath, isPrimaryForBounds, successCallback) {
    fetch(filePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for file: ${filePath}`);
            }
            return response.arrayBuffer();
        })
        .then(arrayBuffer => parseGeoraster(arrayBuffer))
        .then(raster => {
            console.log(`Successfully parsed GeoTIFF: ${filePath}`, raster);
            
            // Generate the visual Leaflet layer
            const rasterLayer = new GeoRasterLayer({
                georaster: raster,
                opacity: 0.7,
                resolution: 256 // Improves rendering performance
            });
            
            rasterLayer.addTo(map);

            // Save raster object globally for click calculations
            successCallback(raster);

            // Zoom map to the dataset bounds if it's the primary layer
            if (isPrimaryForBounds) {
                map.fitBounds(rasterLayer.getBounds());
            }
        })
        .catch(error => {
            console.error(`Failed to load raster layer from ${filePath}:`, error);
            alert(`Error loading layer: ${filePath}. Check browser console for details.`);
        });
}

// 3. Trigger Asynchronous Loading for Both Catchment Rasters
// CRITICAL: Verify these paths match your project structure precisely
loadRasterLayer("Data/Image_Landsat_2017_LST_catchment.tif", true, (raster) => {
    georaster2017 = raster;
});

loadRasterLayer("Data/Image_Landsat_2026_LST_catchment_wgs84.tif", false, (raster) => {
    georaster2026 = raster;
});

// 4. Unified Interactive Map Click Handler
map.on("click", function(e) {
    // Render pinpoint coordinates
    document.getElementById("lat").innerHTML = e.latlng.lat.toFixed(6);
    document.getElementById("lng").innerHTML = e.latlng.lng.toFixed(6);

    const valElement1 = document.getElementById("value_1");
    const valElement2 = document.getElementById("value_2");
    const diffElement = document.getElementById("value_");

    // Extract numerical pixel values
    const val2017 = getRasterValue(georaster2017, e.latlng);
    const val2026 = getRasterValue(georaster2026, e.latlng);

    // Update UI elements for individual years
    valElement1.innerHTML = formatDisplayValue(val2017);
    valElement2.innerHTML = formatDisplayValue(val2026);

    // Calculate absolute cross-decade difference
    if (typeof val2017 === 'number' && typeof val2026 === 'number') {
        const difference = val2026 - val2017;
        diffElement.innerHTML = difference.toFixed(2);
    } else {
        diffElement.innerHTML = "-";
    }
});

// 5. Utility Data Extraction Function
function getRasterValue(raster, latlng) {
    if (!raster) return "Loading...";

    const x = Math.floor((latlng.lng - raster.xmin) / raster.pixelWidth);
    const y = Math.floor((raster.ymax - latlng.lat) / raster.pixelHeight);

    // Dynamic boundary safety check
    if (x < 0 || y < 0 || x >= raster.width || y >= raster.height) {
        return "Outside Raster";
    }

    // Safely parse single band pixel index arrays
    const rawVal = raster.values[0][y][x];
    
    // Catch no-data values or unpopulated pixels
    if (rawVal === raster.noDataValue || rawVal === null || undefined) {
        return "No Data";
    }
    
    return rawVal;
}

// Helper to sanitize display outputs
function formatDisplayValue(val) {
    return (typeof val === 'number') ? val.toFixed(2) : val;
}
