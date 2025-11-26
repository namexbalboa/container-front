"use client";

import { use } from "react";
import { ParametroForm } from "../../components/ParametroForm";

export default function EditarParametroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return <ParametroForm parametroId={parseInt(id)} />;
}
