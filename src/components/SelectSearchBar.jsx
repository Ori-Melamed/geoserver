import React, { useState } from "react";

const allowedFields = {
  region_name: "Region",
  locality_name: "Locality",
  county_name: "County",
};

const SelectSearchBar = ({ onCQLQuerySubmit }) => {
  const [selectedLayer, setSelectedLayer] = useState("test_nadlan:nadlan_mosdar");
  const [filters, setFilters] = useState([{ field: "", value: "", logic: "AND" }]);

  const handleFilterChange = (index, key, value) => {
    const updatedFilters = [...filters];
    updatedFilters[index][key] = value;
    setFilters(updatedFilters);
  };

  const addFilter = () => {
    setFilters([...filters, { field: "", value: "", logic: "AND" }]);
  };

  const removeFilter = (index) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const validFilters = filters.filter(f => f.field && f.value);
    if (validFilters.length === 0) {
      console.log("No valid filters, aborting");
      return;
    }

    const cqlQuery = validFilters.reduce((acc, { field, value, logic }, index) => {
      const expression = isNaN(value) ? `${field} = '${value}'` : `${field} = ${value}`;
      if (index === 0) {
        return expression;
      } else {
        return `${acc} ${logic} ${expression}`;
      }
    }, "");

    console.log("Generated CQL Query:", cqlQuery);
    onCQLQuerySubmit(selectedLayer, cqlQuery);
  };

  return (
    <div>
      <div>
        <form onSubmit={handleSubmit}>
          <label className="block mb-2">
            Select Layer:
            <select
              value={selectedLayer}
              onChange={(e) => setSelectedLayer(e.target.value)}
              className="block w-full mt-1 p-2 border rounded"
            >
              <option value="test_nadlan:nadlan_mosdar">Nadlan Mosdar</option>
              <option value="test_nadlan:assets_polygons">Assets Polygons</option>
            </select>
          </label>

          {filters.map((filter, index) => (
            <div key={index} className="mb-4 border p-3 rounded bg-white shadow space-y-2">
              {index > 0 && (
                <div>
                  <label className="block font-medium">Logic:</label>
                  <select
                    value={filter.logic}
                    onChange={(e) => handleFilterChange(index, "logic", e.target.value)}
                    className="block w-full p-2 border rounded"
                  >
                    <option value="AND">AND</option>
                    <option value="OR">OR</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block font-medium">Field:</label>
                <select
                  value={filter.field}
                  onChange={(e) => handleFilterChange(index, "field", e.target.value)}
                  className="block w-full mt-1 p-2 border rounded"
                >
                  <option value="">Select a field</option>
                  {Object.entries(allowedFields).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium">Value:</label>
                <input
                  type="text"
                  value={filter.value}
                  onChange={(e) => handleFilterChange(index, "value", e.target.value)}
                  placeholder="Enter value"
                  className="block w-full mt-1 p-2 border rounded"
                  disabled={!filter.field}
                />
              </div>

              {index > 0 && (
                <button
                  type="button"
                  onClick={() => removeFilter(index)}
                  className="text-red-600 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addFilter}
            className="bg-green-500 text-white p-2 rounded w-full mb-2"
          >
            + Add Filter
          </button>

          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded w-full disabled:bg-gray-400"
            disabled={filters.length === 0}
          >
            Apply Query
          </button>
        </form>
      </div>
    </div>
  );
};

export default SelectSearchBar;
