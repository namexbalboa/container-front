"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLoading } from "@/contexts/LoadingContext";

function RouteChangeHandler() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { hideLoading, showLoading } = useLoading();

  useEffect(() => {
    // Esconde o loading quando a rota carrega
    hideLoading();
  }, [pathname, searchParams, hideLoading]);

  useEffect(() => {
    // Intercepta navegações de links
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (!link) return;

      const href = link.getAttribute("href");
      if (!href) return;

      // Ignora links externos, âncoras, downloads e mesma página
      const isExternal = href.startsWith("http") || href.startsWith("//");
      const isAnchor = href.startsWith("#");
      const isDownload = link.hasAttribute("download");
      const isMailto = href.startsWith("mailto:");
      const isTel = href.startsWith("tel:");
      const isSamePage = href === pathname || href === `${pathname}/`;
      const isTargetBlank = link.getAttribute("target") === "_blank";

      if (
        isExternal ||
        isAnchor ||
        isDownload ||
        isSamePage ||
        isMailto ||
        isTel ||
        isTargetBlank
      ) {
        return;
      }

      // Mostra o loading para navegações internas
      showLoading();
    };

    // Captura na fase de captura para pegar todos os cliques
    document.addEventListener("click", handleLinkClick, true);

    return () => {
      document.removeEventListener("click", handleLinkClick, true);
    };
  }, [pathname, showLoading]);

  return null;
}

export function RouteLoadingMonitor() {
  return (
    <Suspense fallback={null}>
      <RouteChangeHandler />
    </Suspense>
  );
}
