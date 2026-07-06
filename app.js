// Initialize the map centered on London
const map = L.map('map').setView([51.5, -0.12], 10);
//add scale bar
L.control.scale({ position: 'bottomright', metric:true, imperial:false, maxWidth: 200 }).addTo(map);    

var coordsDiv = document.getElementById("coords");

map.on("mousemove", function (e) {
    var lat = e.latlng.lat.toFixed(5);
    var lng = e.latlng.lng.toFixed(5);

    coordsDiv.innerHTML = "Lat: " + lat + " | Lng: " + lng;
});

// ==========================================
// 1. BASE LAYERS
// ==========================================
var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
});

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
//.addTo(map); // Set default active base layer

var dark = L.tileLayer(
'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png',
{
    attribution: '&copy; CARTO'
}).addTo(map);

// ==========================================
// 2. WMS OVERLAY LAYERS (GeoServer)
// ==========================================
var geoserverUrl = 'http://localhost:8081/geoserver/test_1_KE_Brent/wms';

var River_Water_Body = L.tileLayer.wms(geoserverUrl, {
    layers: 'test_1_KE_Brent:River_Water_Body',
    format: 'image/png',
    transparent: true
});

var Lake_Water_Body = L.tileLayer.wms(geoserverUrl, {
    layers: 'test_1_KE_Brent:Lake_Water_Body',
    format: 'image/png',
    transparent: true
});

var River_Water_Body_Catchment = L.tileLayer.wms(geoserverUrl, {
    layers: 'test_1_KE_Brent:River_Water_Body_Catchment',
    format: 'image/png',
    transparent: true
});

var Lower_brent_river_catchment= L.tileLayer.wms(geoserverUrl, {
    layers: 'test_1_KE_Brent:Lower_brent_river_catchment',
    format: 'image/png',
    transparent: true
}); 

var Lower_brent_river = L.tileLayer.wms(geoserverUrl, {
    layers: 'test_1_KE_Brent:Lower_brent_river',
    format: 'image/png',
    transparent: true
}); 

var Surface_Water_Operational_Catchment = L.tileLayer.wms(geoserverUrl, {
    layers: 'test_1_KE_Brent:Surface_Water_Operational_Catchment',
    format: 'image/png',
    transparent: true
});

var London_Ward = L.tileLayer.wms(geoserverUrl, {
    layers: 'test_1_KE_Brent:London_Ward_NDVI',
    format: 'image/png',
    transparent: true
});

var London_Borough = L.tileLayer.wms(geoserverUrl, {
    layers: 'test_1_KE_Brent:London_Borough_NDVI',
    format: 'image/png',
    transparent: true
});

var landuse = L.tileLayer.wms(geoserverUrl, {
    layers: 'test_1_KE_Brent:gis_osm_landuse',
    format: 'image/png',
    transparent: true
});

var lst2016 = L.tileLayer.wms(
    "http://localhost:8081/geoserver/Lower_BrentRiver_raster/wms",
    {
        layers:"Lower_BrentRiver_raster:Image_Landsat_2016_LST_catchment",
        format:"image/png",
        transparent:true
    }
);

var lst2026 = L.tileLayer.wms(
    "http://localhost:8081/geoserver/Lower_BrentRiver_raster/wms",
    {
        layers:"Lower_BrentRiver_raster:Image_Landsat_2026_LST_catchment",
        format:"image/png",
        transparent:true
    }
);

//Load default active overlays
River_Water_Body.addTo(map);
Lake_Water_Body.addTo(map);
River_Water_Body_Catchment.addTo(map);
Surface_Water_Operational_Catchment.addTo(map);
London_Ward.addTo(map);
London_Borough.addTo(map);

// ==========================================
// 3. LAYER CONTROL INTERFACE
// ==========================================
// Grouping your background base maps
var baseMaps = {
    "OpenStreetMap": osm,
    "OpenTopoMap": topo,
    "CartoDB Light": cartoLight,
    "Esri Satellite": satellite
};

// Grouping your data overlays
var overlayMaps = {
    "London Borough": London_Borough,
    "London Ward": London_Ward,
    "Surface Water Operational Catchment": Surface_Water_Operational_Catchment,
    "River Water Body Catchment": River_Water_Body_Catchment,
    "Lake Water Body": Lake_Water_Body,
    "River Water Body": River_Water_Body,
    "Landuse": landuse,
   "Lower Brent River Catchment": Lower_brent_river_catchment,
    "Lower Brent River": Lower_brent_river,
    "LST 2016": lst2016,
    "LST 2026": lst2026

};

// Add structural toggle control to the map
L.control.layers(baseMaps, overlayMaps, { collapsed: true, position:'bottomleft'}).addTo(map);

// Show Boroughs when zoomed out, Wards when zoomed in
var wardZoomLevel = 12;
map.on('zoomend', function () {

    var currentZoom = map.getZoom();

    if (currentZoom >= wardZoomLevel) {

        // Remove Borough layer
        if (map.hasLayer(London_Borough)) {
            map.removeLayer(London_Borough);
        }

        // Add Ward layer
        if (!map.hasLayer(London_Ward)) {
            map.addLayer(London_Ward);
        }

    } else {

        // Remove Ward layer
        if (map.hasLayer(London_Ward)) {
            map.removeLayer(London_Ward);
        }

        // Add Borough layer
        if (!map.hasLayer(London_Borough)) {
            map.addLayer(London_Borough);
        }
    }

});

//chart
fetch(
    "http://localhost:8081/geoserver/test_1_KE_Brent/ows?" +
    "service=WFS&version=1.0.0&request=GetFeature" +
    "&typeName=test_1_KE_Brent:London_Borough" +
    "&outputFormat=application/json"
)
.then(res => res.json())
.then(data => {

    let boroughNames = [];
    let boroughAreas = [];

    data.features.forEach(f => {

        let name = f.properties.NAME;
        let area = f.properties.HECTARES;

        // safety check (IMPORTANT FIX)
        if (name && area !== null && area !== undefined) {
            boroughNames.push(name);
            boroughAreas.push(area);
        }
    });

    const ctx = document.getElementById("boroughChart");

    if (!ctx) {
        console.error("Chart canvas not found!");
        return;
    }

    new Chart(ctx, {
        type: "bar",
        data: {
            labels: boroughNames,
            datasets: [{
                label: "Area (Hectares)",
                data: boroughAreas,
                backgroundColor: "Blue"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
    padding: {
      top: 10,
      right: 20,
      bottom: 20,
      left: 10
    }
  },
            plugins: {
                legend: { display: true }
            },
            scales: {
    x: {
      ticks: {
        font: {
          size: 10
        }
      }
    },
    y: {
      beginAtZero: true,
      ticks: {
        font: {
          size: 10
        }
      }
    }
  }
}
    });

});

// WARD CHART
fetch("http://localhost:8081/geoserver/test_1_KE_Brent/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=test_1_KE_Brent:London_Ward_NDVI&outputFormat=application/json")
  .then(res => res.json())
  .then(data => {
    let wardNames = [];
    let wardAreas = [];

    data.features.forEach(f => {
      let name = f.properties.BOROUGH;
      let area = f.properties._mean;
      if (name && area !== null && area !== undefined) {
        wardNames.push(name);
        wardAreas.push(area);
      }
    });

    var ctx = document.getElementById("wardChart");
    if (!ctx) return;

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: wardNames,
        datasets: [{
          label: "Measure of Greenness (NDVI)",
          data: wardAreas,
          backgroundColor: "Green"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
         layout: {
    padding: {
      top: 10,
      right: 20,
      bottom: 20,
      left: 10
    }
  },
        plugins: {
          legend: { display: true }
        },
        scales: {
    x: {
      ticks: {
        font: {
          size: 10
        }
      }
    },
    y: {
      beginAtZero: true,
      ticks: {
        font: {
          size: 10
        }
      }
    }
  }
}
    });
  });



function getFeatureInfoUrl(map, layer, latlng){

    var point =
        map.latLngToContainerPoint(
            latlng,
            map.getZoom()
        );

    var size = map.getSize();

    var params = {
        request:'GetFeatureInfo',
        service:'WMS',
        srs:'EPSG:32630',
        styles:'',
        transparent:true,
        version:'1.1.1',
        format:'image/png',
        bbox:map.getBounds().toBBoxString(),
        height:size.y,
        width:size.x,
        layers:layer.options.layers,
        query_layers:layer.options.layers,
        info_format:'application/json',
        x:Math.round(point.x),
        y:Math.round(point.y)
    };

    return layer._url +
           L.Util.getParamString(
               params,
               layer._url,
               true
           );
}

async function getLSTValue(layer, latlng){

     try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.features && data.features.length > 0) {
            return data.features[0].properties.GRAY_INDEX;
        }

        return null;
    } catch (err) {
        console.error(err);
        return null;
    }
}

// =====================================================
// 9. LST CHART
// =====================================================
var lstChart = new Chart(document.getElementById("lstChart"), {
    type: "bar",
    data: {
        labels: ["2016", "2026"],
        datasets: [{
            label: "LST (°C)",
            data: [0, 0],
            backgroundColor: ["orange", "red"]
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false
    }
});


map.on('click', async function(e){

    const value2016 =
        await getLSTValue(
            lst2016,
            e.latlng
        );

    const value2026 =
        await getLSTValue(
            lst2026,
            e.latlng
        );

    const diff =
        (value2026 - value2016)
        .toFixed(1);

    document.getElementById(
        "lat-value"
    ).innerText =
        e.latlng.lat.toFixed(5);

    document.getElementById(
        "lon-value"
    ).innerText =
        e.latlng.lng.toFixed(5);

    document.getElementById(
        "lst2016-value"
    ).innerText =
        value2016 + " °C";

    document.getElementById(
        "lst2026-value"
    ).innerText =
        value2026 + " °C";

    document.getElementById(
        "lst-difference"
    ).innerText =
        (diff > 0 ? "+" : "")
        + diff + " °C";

    if(diff > 0)
        document.getElementById(
            "lst-status"
        ).innerText =
            "Warming ▲";

    else
        document.getElementById(
            "lst-status"
        ).innerText =
            "Cooling ▼";

    lstChart.data.datasets[0].data = [v2016, v2026];
    lstChart.update();
});



