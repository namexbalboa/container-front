"use client";

import { clsx } from "clsx";

type Status = "ativo" | "inativo" | "bloqueado" | "suspenso" | "ativa" | "inativa" | "suspensa" | "pendente" | "aprovada" | "rejeitada" | "cancelada";

interface StatusBadgeProps {
  status: Status;
  size?: "sm" | "md" | "lg";
}

const STATUS_CONFIG: Record<Status, { label: string; color: string }> = {
  ativo: { label: "Ativo", color: "bg-green-100 text-green-800" },
  ativa: { label: "Ativa", color: "bg-green-100 text-green-800" },
  inativo: { label: "Inativo", color: "bg-gray-100 text-gray-800" },
  inativa: { label: "Inativa", color: "bg-gray-100 text-gray-800" },
  bloqueado: { label: "Bloqueado", color: "bg-red-100 text-red-800" },
  suspenso: { label: "Suspenso", color: "bg-yellow-100 text-yellow-800" },
  suspensa: { label: "Suspensa", color: "bg-yellow-100 text-yellow-800" },
  pendente: { label: "Pendente", color: "bg-blue-100 text-blue-800" },
  aprovada: { label: "Aprovada", color: "bg-green-100 text-green-800" },
  rejeitada: { label: "Rejeitada", color: "bg-red-100 text-red-800" },
  cancelada: { label: "Cancelada", color: "bg-gray-100 text-gray-800" },
};

const SIZE_CLASSES = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
  lg: "px-3 py-1.5 text-base",
};

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || { label: status, color: "bg-gray-100 text-gray-800" };

  return (
    <span
      className={clsx(
        "inline-flex items-center font-medium rounded-full",
        config.color,
        SIZE_CLASSES[size]
      )}
    >
      {config.label}
    </span>
  );
}
