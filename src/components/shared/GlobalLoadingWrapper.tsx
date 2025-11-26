"use client";

import { useLoading } from "@/contexts/LoadingContext";
import { GlobalLoading } from "./GlobalLoading";

export function GlobalLoadingWrapper() {
  const { isLoading } = useLoading();
  return <GlobalLoading isLoading={isLoading} />;
}
