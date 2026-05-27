"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ScanResult } from "@/types/interview";

export type ScanScope = "google" | "microsoft" | "all";

// Module-level cache shared across pages within the same client session so we
// don't re-scan every time the user switches tabs.
let cachedScan: ScanResult | null = null;
const listeners = new Set<(s: ScanResult | null) => void>();

function setCached(s: ScanResult | null) {
  cachedScan = s;
  for (const l of listeners) l(s);
}

export function useScan(autoScanInDemo = false) {
  const [scan, setScan] = useState<ScanResult | null>(cachedScan);
  const [scanning, setScanning] = useState<ScanScope | null>(null);
  const triggered = useRef(false);

  useEffect(() => {
    const onChange = (s: ScanResult | null) => setScan(s);
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);

  const runScan = useCallback(async (provider: ScanScope = "all") => {
    setScanning(provider);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (data.ok) {
        setCached(data.scanResult);
      }
      return data.scanResult as ScanResult | undefined;
    } finally {
      setScanning(null);
    }
  }, []);

  useEffect(() => {
    if (!autoScanInDemo) return;
    const demo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
    if (!demo) return;
    if (cachedScan) return;
    if (triggered.current) return;
    triggered.current = true;
    runScan("all");
  }, [autoScanInDemo, runScan]);

  return { scan, scanning, runScan };
}
