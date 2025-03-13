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
import SelectSearchBar from "./SelectSearchBar";
import { setupPopupListener } from "./setupPopupListener";

const GeoServerMap = () => {
  const mapRef = useRef(null);
  const popupRef = useRef(null);

  const [map, setMap] = useState(null);
  const [baseMap, setBaseMap] = useState("osm");

  const [popupContent, setPopupContent] = useState("");

  const [assetsLayer, setAssetsLayer] = useState(null);
  const [mosdarLayer, setMosdarLayer] = useState(null);

  const [filteredLayer, setFilteredLayer] = useState(null);
  const [assetsVisible, setAssetsVisible] = useState(true);
  const [mosdarVisible, setMosdarVisible] = useState(true);
  const [filteredVisible, setFilteredVisible] = useState(true);

  useEffect(() => {
    const baseLayer = new TileLayer({
      source: new OSM(),
    });

    const assetsLayerInstance = MapLayer({
      url: `${import.meta.env.VITE_GEOSERVER_WMS_URL}`,
      layerName: `${import.meta.env.VITE_GEOSERVER_WORKSPACE}:assets_polygons`,
      visible: assetsVisible,
    });

    const mosdarLayerInstance = MapLayer({
      url: `${import.meta.env.VITE_GEOSERVER_WMS_URL}`,
      layerName: `${import.meta.env.VITE_GEOSERVER_WORKSPACE}:dis_from_tel_aviv_1`,
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

    return () => {
      newMap.setTarget(null);
      unByKey(clickListenerKey);
    };
  }, [baseMap]);

  const handleCQLQuery = (selectedLayer, cqlQuery) => {
    if (!cqlQuery || !selectedLayer) {
      console.log("Missing CQL query or layer, aborting");
      return;
    }

    console.log("Applying CQL Query:", cqlQuery, "to layer:", selectedLayer);

    if (filteredLayer) {
      map.removeLayer(filteredLayer);
      setFilteredLayer(null);
      console.log("Removed previous filtered layer");
    }

    const filteredLayerInstance = MapLayer({
      url: `${import.meta.env.VITE_GEOSERVER_WMS_URL}`,
      layerName: selectedLayer,
      visible: filteredVisible,
      cqlFilter: cqlQuery,
    });

    map.addLayer(filteredLayerInstance);
    setFilteredLayer(filteredLayerInstance);
    console.log("Added new filtered WMS layer");
  };

  useEffect(() => {
    if (assetsLayer) assetsLayer.setVisible(assetsVisible);
  }, [assetsVisible, assetsLayer]);

  useEffect(() => {
    if (mosdarLayer) mosdarLayer.setVisible(mosdarVisible);
  }, [mosdarVisible, mosdarLayer]);

  useEffect(() => {
    if (filteredLayer) filteredLayer.setVisible(filteredVisible);
  }, [filteredVisible, filteredLayer]);

  return (
    <div className="w-screen h-screen flex">
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
            filteredLayer && {
              name: "Filtered Layer (WMS)",
              visible: filteredVisible,
              toggleVisibility: () => setFilteredVisible(!filteredVisible),
            },
          ].filter(Boolean)}
        />
        <div
          ref={mapRef}
          className="w-full h-full"
        />
        <Popup
          popupRef={popupRef}
          popupContent={popupContent}
        />
      </div>

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
