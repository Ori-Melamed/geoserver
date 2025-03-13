export const setupPopupListener = (map, layer, popup, setPopupContent) => {
  const listenerKey = map.on("singleclick", async (evt) => {
    const viewResolution = map.getView().getResolution();
    const url = layer.getSource().getFeatureInfoUrl(evt.coordinate, viewResolution, "EPSG:3857", {
      INFO_FORMAT: "application/json",
      FEATURE_COUNT: 1,
    });
    if (url) {
      try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          const properties = data.features[0].properties;
          const fieldLabels = {
            region_name: "Region - 1",
            locality_name: "Locality",
            county_name: "County",
            distance_from_tel_aviv_km: "Distance From Tel-Aviv",
          };
          const popupData = Object.entries(fieldLabels)
            .map(([key, label]) => (properties[key] ? `<strong>${label}:</strong> ${properties[key]}` : ""))
            .filter((line) => line !== "")
            .join("<br/>");
          setPopupContent(popupData);
          popup.setPosition(evt.coordinate);
        } else {
          setPopupContent("");
          popup.setPosition(undefined);
        }
      } catch (error) {
        console.error("Error fetching feature info:", error);
      }
    }
  });
  return listenerKey;
};
