"use client";

import { ParametroForm } from "../../components/ParametroForm";

export default function EditarParametroPage({
  params,
}: {
  params: { id: string };
}) {
  return <ParametroForm parametroId={parseInt(params.id)} />;
}
