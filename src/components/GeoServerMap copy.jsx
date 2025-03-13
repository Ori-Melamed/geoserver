import React, { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import { OSM } from "ol/source";
import TileLayer from "ol/layer/Tile";
import Overlay from "ol/Overlay";
import { fromLonLat } from "ol/proj";
import { unByKey } from "ol/Observable";
import MapLayer from "./MapLayer";
import Popup from "./Popup";
import LayerControls from "./LayerControls";
import SelectSearchBar from "./SelectSearchBar"; // New import
import { setupPopupListener } from "./setupPopupListener";

// Imports for WFS and styling
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";

const GeoServerMap = () => {
  const mapRef = useRef(null);
  const popupRef = useRef(null);

  const [map, setMap] = useState(null);
  const [popupContent, setPopupContent] = useState("");

  const [assetsLayer, setAssetsLayer] = useState(null);
  const [mosdarLayer, setMosdarLayer] = useState(null);
  const [wfsLayer, setWfsLayer] = useState(null);
  const [filteredLayer, setFilteredLayer] = useState(null);

  const [assetsVisible, setAssetsVisible] = useState(true);
  const [mosdarVisible, setMosdarVisible] = useState(true);
  const [wfsVisible, setWfsVisible] = useState(true);
  const [filteredVisible, setFilteredVisible] = useState(true);
  const [wfsLoading, setWfsLoading] = useState(true);

  // State for base map and CQL query
  const [baseMap, setBaseMap] = useState("osm");

  useEffect(() => {
    const baseLayer = new TileLayer({
      source: new OSM(), 
    });

    const assetsLayerInstance = MapLayer({
      url: "http://localhost:8080/geoserver/wms",
      layerName: "test_nadlan:assets_polygons",
      visible: assetsVisible,
    });

    const mosdarLayerInstance = MapLayer({
      url: "http://localhost:8080/geoserver/wms",
      layerName: "test_nadlan:dis_from_tel_aviv_1",
      visible: mosdarVisible,
    });

    const popup = new Overlay({
      element: popupRef.current,
      autoPan: true,
      autoPanAnimation: { duration: 250 },
    });

    const newMap = new Map({
      target: mapRef.current,
      layers: [baseLayer, assetsLayerInstance, mosdarLayerInstance],
      view: new View({
        center: fromLonLat([35.2137, 31.7683]),
        zoom: 8,
      }),
      overlays: [popup],
    });

    setMap(newMap);
    setAssetsLayer(assetsLayerInstance);
    setMosdarLayer(mosdarLayerInstance);

    const clickListenerKey = setupPopupListener(newMap, mosdarLayerInstance, popup, setPopupContent);

    const pageSize = 100000;
    let featuresLoaded = [];
    let startIndex = 0;
    let totalFeatures = null;

    const wfsUrlBase =
      "http://localhost:8080/geoserver/ows?" +
      "service=WFS&version=2.0.0&request=GetFeature&typeNames=test_nadlan%3Anadlan_mosdar" +
      "&outputFormat=application/json&srsName=EPSG:3857&sortBy=id";

    const purpleStyle = new Style({
      fill: new Fill({ color: "rgba(128, 0, 128, 0.3)" }),
      stroke: new Stroke({ color: "purple", width: 2 }),
    });

    const loadWFSChunk = async () => {
      const url = `${wfsUrlBase}&startIndex=${startIndex}&count=${pageSize}`;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response from WFS:", errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (!totalFeatures) {
          totalFeatures = data.totalFeatures || data.numberMatched || 0;
        }

        const format = new GeoJSON();
        const features = format.readFeatures(data);
        featuresLoaded = [...featuresLoaded, ...features];

        startIndex += pageSize;

        if (features.length > 0 && featuresLoaded.length < totalFeatures) {
          await loadWFSChunk();
        } else {
          const wfsSource = new VectorSource({ features: featuresLoaded });
          const wfsLayerInstance = new VectorLayer({
            source: wfsSource,
            style: purpleStyle,
            visible: wfsVisible,
          });
          newMap.addLayer(wfsLayerInstance);
          setWfsLayer(wfsLayerInstance);
          setWfsLoading(false);
        }
      } catch (err) {
        console.error("Error loading WFS layer in chunks:", err);
        setWfsLoading(false);
      }
    };

    loadWFSChunk();

    return () => {
      newMap.setTarget(null);
      unByKey(clickListenerKey);
    };
  }, [baseMap]);

  // Handle CQL query submission from SelectSearchBar
  const handleCQLQuery = async (selectedLayer, cqlQuery) => {
    if (!cqlQuery || !selectedLayer) return;

    if (filteredLayer) {
      map.removeLayer(filteredLayer);
      setFilteredLayer(null);
    }

    const wfsUrl =
      `http://localhost:8080/geoserver/ows?` +
      `service=WFS&version=2.0.0&request=GetFeature&typeNames=${encodeURIComponent(selectedLayer)}` +
      `&outputFormat=application/json&srsName=EPSG:3857&cql_filter=${encodeURIComponent(cqlQuery)}`;

    try {
      const response = await fetch(wfsUrl);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response from WFS with CQL:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      const format = new GeoJSON();
      const features = format.readFeatures(data);

      const filteredStyle = new Style({
        fill: new Fill({ color: "rgba(255, 0, 0, 0.3)" }),
        stroke: new Stroke({ color: "red", width: 2 }),
      });

      const filteredSource = new VectorSource({ features });
      const filteredLayerInstance = new VectorLayer({
        source: filteredSource,
        style: filteredStyle,
        visible: filteredVisible,
      });

      map.addLayer(filteredLayerInstance);
      setFilteredLayer(filteredLayerInstance);
    } catch (err) {
      console.error("Error loading filtered WFS layer:", err);
    }
  };

  // Update layer visibility when toggled
  useEffect(() => {
    if (assetsLayer) assetsLayer.setVisible(assetsVisible);
  }, [assetsVisible, assetsLayer]);

  useEffect(() => {
    if (mosdarLayer) mosdarLayer.setVisible(mosdarVisible);
  }, [mosdarVisible, mosdarLayer]);

  useEffect(() => {
    if (wfsLayer) wfsLayer.setVisible(wfsVisible);
  }, [wfsVisible, wfsLayer]);

  useEffect(() => {
    if (filteredLayer) filteredLayer.setVisible(filteredVisible);
  }, [filteredVisible, filteredLayer]);

  return (
    <div className="w-screen h-screen flex">
      {/* Map Area */}
      <div className="flex-1 relative">
        <LayerControls
          layers={[
            {
              name: "Assets Polygons",
              visible: assetsVisible,
              toggleVisibility: () => setAssetsVisible(!assetsVisible),
            },
            {
              name: "Nadlan Mosdar (WMS)",
              visible: mosdarVisible,
              toggleVisibility: () => setMosdarVisible(!mosdarVisible),
            },
            {
              name: wfsLoading ? "Nadlan Mosdar (WFS) - Loading..." : "Nadlan Mosdar (WFS)",
              visible: wfsVisible,
              toggleVisibility: () => setWfsVisible(!wfsVisible),
            },
            filteredLayer && {
              name: "Filtered Layer (WFS)",
              visible: filteredVisible,
              toggleVisibility: () => setFilteredVisible(!filteredVisible),
            },
          ].filter(Boolean)}
        />
        <div ref={mapRef} className="w-full h-full" />
        <Popup popupRef={popupRef} popupContent={popupContent} />
      </div>

      {/* Right Side Panel with SelectSearchBar */}
      <div className="w-80 bg-gray-100 p-4 shadow-lg overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Map Options</h2>
        <SelectSearchBar
          baseMap={baseMap}
          setBaseMap={setBaseMap}
          onCQLQuerySubmit={handleCQLQuery}
        />
      </div>
    </div>
  );
};

export default GeoServerMap;