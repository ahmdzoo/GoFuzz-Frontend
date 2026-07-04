import { createContext, useContext, useState } from "react";

const ScanContext = createContext(null);

export const ScanProvider = ({ children }) => {
  const [result, setResult] = useState([]);

  return (
    <ScanContext.Provider value={{ result, setResult }}>
      {children}
    </ScanContext.Provider>
  );
};

export const useScan = () => {
  const context = useContext(ScanContext);

  if (!context) {
    throw new Error("useScan harus dipakai di dalam ScanProvider");
  }

  return context;
};
