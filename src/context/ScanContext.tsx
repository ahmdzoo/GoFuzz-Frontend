import { createContext, useContext, useState, type ReactNode } from "react";

export interface VulnerabilityItem {
  id?: number;
  attack_type?: string;
  severity?: string;
  description?: string;
  recommendation?: string;
  payload?: string;
  status?: string | number;
  length?: string | number;
  confidence?: number;
  raw_vulnerability?: string;
  ml_prediction?: number;
  attack?: string;
  vulnerability?: string;
}

interface ScanContextType {
  result: VulnerabilityItem[];
  setResult: (data: VulnerabilityItem[]) => void;
}

const ScanContext = createContext<ScanContextType | null>(null);

export const ScanProvider = ({ children }: { children: ReactNode }) => {
  const [result, setResult] = useState<VulnerabilityItem[]>([]);

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
