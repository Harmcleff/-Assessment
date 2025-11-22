import React, { createContext, useCallback, useContext, useState } from 'react';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [items, setItems] = useState([]);

  const fetchItems = useCallback(async (signal) => {
    try {
      const res = await fetch('http://localhost:3001/api/items?limit=500', { signal });
      const json = await res.json();
      setItems(json);
    } catch (err) {
      // Ignore abort errors (normal behavior)
      if (err.name !== 'AbortError') {
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
