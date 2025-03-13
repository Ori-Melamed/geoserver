import React from "react";

const LayerControls = ({ layers }) => {
  return (
    <div className="absolute top-2 left-2 bg-white p-2 rounded-md shadow-md z-10">
      {layers.map(({ name, visible, toggleVisibility }) => (
        <label key={name} className="flex items-center space-x-2">
          <input type="checkbox" checked={visible} onChange={toggleVisibility} />
          <span>{name}</span>
        </label>
      ))}
    </div>
  );
};
export default LayerControls;
