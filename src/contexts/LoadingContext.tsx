"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useRef } from "react";

interface LoadingContextType {
  isLoading: boolean;
  showLoading: () => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

const MIN_LOADING_TIME = 1800; // 1.8 segundos

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const loadingStartTime = useRef<number | null>(null);
  const hideTimeout = useRef<NodeJS.Timeout | null>(null);

  const showLoading = useCallback(() => {
    loadingStartTime.current = Date.now();
    setIsLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    if (!loadingStartTime.current) {
      setIsLoading(false);
      return;
    }

    const elapsedTime = Date.now() - loadingStartTime.current;
    const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);

    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
    }

    hideTimeout.current = setTimeout(() => {
      setIsLoading(false);
      loadingStartTime.current = null;
    }, remainingTime);
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, showLoading, hideLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}
