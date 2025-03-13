import React from "react";

const Popup = ({ popupRef, popupContent }) => {
  return (
    <div
      ref={popupRef}
      className="absolute bg-white p-4 rounded-lg shadow-lg"
      style={{ display: popupContent ? "block" : "none", width: "300px", maxWidth: "400px" }}
    >
      <div dangerouslySetInnerHTML={{ __html: popupContent }} />
    </div>
  );
};

export default Popup;