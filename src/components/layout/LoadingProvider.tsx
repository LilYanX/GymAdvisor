"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { LoadingOverlay } from "@/components/layout/LoadingOverlay";

type LoadingContextValue = {
  setLoading: (active: boolean) => void;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  const setLoading = useCallback((active: boolean) => {
    setVisible(active);
  }, []);

  useEffect(() => {
    setVisible(false);
  }, [pathname]);

  return (
    <LoadingContext.Provider value={{ setLoading }}>
      {children}
      {visible ? <LoadingOverlay /> : null}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading doit être utilisé dans LoadingProvider.");
  }
  return context;
}

export function useLoadingActive(active: boolean) {
  const { setLoading } = useLoading();

  useLayoutEffect(() => {
    setLoading(active);
    return () => setLoading(false);
  }, [active, setLoading]);
}
