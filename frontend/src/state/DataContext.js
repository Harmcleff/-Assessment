import React, { createContext, useCallback, useContext, useState } from "react";

const DataContext = createContext();

export function DataProvider({ children }) {
  const [items, setItems] = useState([]);

  const fetchItems = useCallback(async (signal) => {
    try {
      const res = await fetch("http://localhost:3001/api/items", { signal });
      const json = await res.json();
      console.log(json)
     setItems(Array.isArray(json.items) ? json.items : []);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error(err);
      }
    }
  }, []);

  return (
    <DataContext.Provider value={{ items, fetchItems }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
