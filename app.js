// 1. Initialize the Leaflet Map Engine
const map = L.map('map').setView([51.0, -0.8], 12);

// 2. Add an OpenStreetMap Tile Base Layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

/**
 * 3. File Target Pointers
 * Assumes a repository layout of:
 * ├── index.html
 * ├── app.js
 * ├── style.css
 * └── Data/
 *     ├── map.json
 *     └── raster.tif
 * Adjust filenames inside 'Data/' below if your file names are different.
 */
const geojsonUrl = 'Data/map.json'; 
const geotiffUrl = 'Data/raster.tif'; 

// 4. Async Fetch and Bind GeoJSON Data
fetch(geojsonUrl)
    .then(response => {
        if (!response.ok) throw new Error(`Could not find GeoJSON at ${geojsonUrl}`);
        return response.json();
    })
    .then(geojsonData => {
        const geojsonLayer = L.geoJSON(geojsonData, {
            style: {
                color: "#0d6efd",
                weight: 2,
                opacity: 0.8
            },
            onEachFeature: (feature, layer) => {
                // Click events map vector properties back to left HTML panel 
                layer.on('click', () => {
                    document.getElementById('json-info').innerHTML = `
                        <p><strong>Feature Properties:</strong></p>
                        <pre>${JSON.stringify(feature.properties, null, 2)}</pre>
                    `;
                });
            }
        }).addTo(map);
        
        // Autoreframe camera viewport to fit vector bounds
        map.fitBounds(geojsonLayer.getBounds());
    })
    .catch(err => {
        console.error(err.message);
        document.getElementById('json-info').innerHTML = `<span style="color:red;">Error loading GeoJSON: Verify file exists at "${geojsonUrl}"</span>`;
    });

// 5. Async Fetch and Decode GeoTIFF Binary Raster Arrays
fetch(geotiffUrl)
    .then(response => {
        if (!response.ok) throw new Error(`Could not find GeoTIFF at ${geotiffUrl}`);
        return response.arrayBuffer();
    })
    .then(arrayBuffer => parseGeoraster(arrayBuffer))
    .then(georaster => {
        // Output raw data profile into left informational container
        document.getElementById('tiff-info').innerHTML = `
            <p><strong>Width:</strong> ${georaster.width} px</p>
            <p><strong>Height:</strong> ${georaster.height} px</p>
            <p><strong>NoData Value:</strong> ${georaster.noDataValue}</p>
            <p><strong>Bands Available:</strong> ${georaster.numberOfRasters}</p>
        `;

        // Instantiate custom raster layer on Leaflet engine Canvas
        const layer = new GeoRasterLayer({
            georaster: georaster,
            opacity: 0.7,
            resolution: 64 // Controls pixel crispness vs rendering speed
        });
        layer.addTo(map);
        
        // Recenter camera viewport to scale layout bounds around raster footprint
        // Using setTimeout to prevent race conditions if both layers zoom simultaneously
        setTimeout(() => {
            map.fitBounds(layer.getBounds());
        }, 200);
    })
    .catch(error => {
        console.error(error.message);
        document.getElementById('tiff-info').innerHTML = `<span style="color:red;">Error parsing GeoTIFF: Verify file exists at "${geotiffUrl}"</span>`;
    });
