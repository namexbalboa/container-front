"use client";

import Link from "next/link";
import { useLoading } from "@/contexts/LoadingContext";
import { ComponentProps, MouseEvent } from "react";

type LoadingLinkProps = ComponentProps<typeof Link>;

export function LoadingLink({ onClick, ...props }: LoadingLinkProps) {
  const { showLoading } = useLoading();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Verifica se não é um link externo ou download
    const href = props.href?.toString() || "";
    const isExternal = href.startsWith("http") || href.startsWith("//");
    const isDownload = props.download !== undefined;
    const isSamePage = href.startsWith("#");

    if (!isExternal && !isDownload && !isSamePage) {
      showLoading();
    }

    onClick?.(e);
  };

  return <Link {...props} onClick={handleClick} />;
}
