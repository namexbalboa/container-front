import { Container, ContainerStatus } from "@/types/api";

export const containerStatusValues: ContainerStatus[] = ["ativo", "em_transito", "entregue", "inativo"];

export const containerStatusMeta: Record<ContainerStatus, { label: string; className: string }> = {
    ativo: { label: "Ativo", className: "bg-green-100 text-green-800" },
    em_transito: { label: "Em trânsito", className: "bg-blue-100 text-blue-800" },
    entregue: { label: "Entregue", className: "bg-emerald-100 text-emerald-800" },
    inativo: { label: "Inativo", className: "bg-gray-200 text-gray-700" },
};

export const getContainerId = (container: Partial<Container>) =>
    container.idContainerRegistro ?? (container as any).id ?? (container as any).idContainer ?? null;

export const getContainerNumber = (container: Partial<Container>) =>
    container.nrContainer ?? (container as any).numero ?? (container as any).numeroContainer ?? "";

export const getContainerTypeName = (container: Partial<Container>) =>
    container.tipoContainer?.tipoContainer ?? (container as any).tipoContainer ?? (container as any).tipo ?? "";

export const getContainerStatus = (container: Partial<Container>): ContainerStatus => {
    const status = container.statusContainer ?? (container as any).status ?? "";
    if (containerStatusValues.includes(status as ContainerStatus)) {
        return status as ContainerStatus;
    }
    return "ativo";
};
