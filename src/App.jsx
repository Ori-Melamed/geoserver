import React from "react";
import GeoServerMap from "./components/GeoServerMap";

const App = () => {
  return (
    <div className=" flex flex-col align-center justify-center items-center">
      <h1 className=" text-6xl m-6 font-bold font-serif">
        Israel Real Estate Map
      </h1>
      <GeoServerMap />
    </div>
  );
};

export default App;
