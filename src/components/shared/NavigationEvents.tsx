"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLoading } from "@/contexts/LoadingContext";

export function NavigationEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { hideLoading } = useLoading();

  useEffect(() => {
    // Esconde o loading quando a navegação é concluída
    hideLoading();
  }, [pathname, searchParams, hideLoading]);

  useEffect(() => {
    // Intercepta cliques em links para mostrar o loading
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (!link) return;

      const href = link.getAttribute("href");
      if (!href) return;

      // Ignora links externos, âncoras e downloads
      const isExternal = href.startsWith("http") || href.startsWith("//");
      const isAnchor = href.startsWith("#");
      const isDownload = link.hasAttribute("download");
      const isSamePage = href === pathname || href === `${pathname}/`;

      if (isExternal || isAnchor || isDownload || isSamePage) {
        return;
      }

      // Mostra o loading para navegações internas
      const { showLoading } = require("@/contexts/LoadingContext").useLoading();
      showLoading();
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  return null;
}
