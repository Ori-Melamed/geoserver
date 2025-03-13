import TileLayer from "ol/layer/Tile";
import { TileWMS } from "ol/source";

const MapLayer = ({ url, layerName, visible, cqlFilter }) => {
  return new TileLayer({
    source: new TileWMS({
      url,
      params: {
        LAYERS: layerName,
        TILED: true,
        FORMAT: "image/png",
        TRANSPARENT: true,
        ...(cqlFilter && { CQL_FILTER: cqlFilter }), 
      },
      serverType: "geoserver",
    }),
    visible,
  });
};

export default MapLayer;
