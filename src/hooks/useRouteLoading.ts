"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLoading } from "@/contexts/LoadingContext";

export function useRouteLoading() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    // Esconde o loading quando a rota muda
    hideLoading();
  }, [pathname, searchParams, hideLoading]);

  return { showLoading, hideLoading };
}
