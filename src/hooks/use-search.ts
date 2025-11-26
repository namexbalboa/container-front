"use client";
"use strict";

import { useState, useCallback, useMemo } from "react";
import { apiService } from "@/lib/api";
import {
    SearchParams,
    SearchResponse,
    SearchResult,
    SearchFilters,
    SearchOrdenacao,
    SearchSugestao,
    SearchHistorico,
    ModuloSistema,
} from "@/types/api";

interface UseSearchState {
    resultados: SearchResult[];
    loading: boolean;
    error: string | null;
    total: number;
    tempo: number;
    sugestoes: string[];
    filtrosDisponiveis: SearchResponse["filtrosDisponiveis"];
    sugestoesTermos: SearchSugestao[];
}

interface UseSearchActions {
    buscar: (params: SearchParams) => Promise<void>;
    buscarRapido: (termo: string) => Promise<SearchResult[]>;
    limparResultados: () => void;
    obterSugestoes: (termo: string) => Promise<SearchSugestao[]>;
    aplicarFiltro: (filtros: Partial<SearchFilters>) => void;
    alterarOrdenacao: (ordenacao: SearchOrdenacao) => void;
    proximaPagina: () => Promise<void>;
    paginaAnterior: () => Promise<void>;
    irParaPagina: (pagina: number) => Promise<void>;
}

const INITIAL_STATE: UseSearchState = {
    resultados: [],
    loading: false,
    error: null,
    total: 0,
    tempo: 0,
    sugestoes: [],
    filtrosDisponiveis: undefined,
    sugestoesTermos: [],
};

// Mock historico para demonstração
const mockHistorico: SearchHistorico[] = [];

const MODULOS_LABELS: Record<ModuloSistema, string> = {
    USER: "UsuÃ¡rios",
    CLIENT: "Clientes",
    CONTAINER: "Containers",
    AVERBACAO: "AverbaÃ§Ãµes",
    SEGURADORA: "Seguradoras",
    PERMISSION: "PermissÃµes",
    DASHBOARD: "Dashboard",
};

export function useSearch() {
    const [state, setState] = useState<UseSearchState>(INITIAL_STATE);
    const [parametrosAtivos, setParametrosAtivos] = useState<SearchParams>({
        termo: "",
        page: 1,
        limit: 20,
    });

    const buscar = useCallback(
        async (params: SearchParams) => {
            try {
                setState((prev) => ({ ...prev, loading: true, error: null }));
                setParametrosAtivos(params);

                const response = await apiService.search(params);

                if (response.success && response.data) {
                    setState((prev) => ({
                        ...prev,
                        resultados: response.data.resultados,
                        total: response.data.total,
                        tempo: response.data.tempo,
                        sugestoes: response.data.sugestoes || [],
                        filtrosDisponiveis: response.data.filtrosDisponiveis,
                        loading: false,
                    }));
                } else {
                    setState((prev) => ({
                        ...prev,
                        error: response.message || "Erro ao realizar busca",
                        loading: false,
                    }));
                }
            } catch (error) {
                console.error("Erro na busca:", error);
                setState((prev) => ({
                    ...prev,
                    error: "Erro inesperado ao realizar busca",
                    loading: false,
                }));
            }
        },
        [],
    );

    const buscarRapido = useCallback(async (termo: string): Promise<SearchResult[]> => {
        try {
            const response = await apiService.searchQuick(termo);
            return response.success && response.data ? response.data.resultados : [];
        } catch (error) {
            console.warn("Erro na busca rÃ¡pida:", error);
            return [];
        }
    }, []);

    const obterSugestoes = useCallback(async (termo: string): Promise<SearchSugestao[]> => {
        try {
            const response = await apiService.searchSugestoes(termo);
            if (response.success && response.data) {
                setState((prev) => ({ ...prev, sugestoesTermos: response.data }));
                return response.data;
            }
            return [];
        } catch (error) {
            console.warn("Erro ao obter sugestÃµes:", error);
            return [];
        }
    }, []);

    const limparResultados = useCallback(() => {
        setState(INITIAL_STATE);
        setParametrosAtivos({ termo: "", page: 1, limit: 20 });
    }, []);

    const aplicarFiltro = useCallback(
        (filtros: Partial<SearchFilters>) => {
            const novosParametros = {
                ...parametrosAtivos,
                filtros: { ...parametrosAtivos.filtros, ...filtros },
                page: 1,
            };
            buscar(novosParametros);
        },
        [parametrosAtivos, buscar],
    );

    const alterarOrdenacao = useCallback(
        (ordenacao: SearchOrdenacao) => {
            const novosParametros = {
                ...parametrosAtivos,
                ordenacao,
                page: 1,
            };
            buscar(novosParametros);
        },
        [parametrosAtivos, buscar],
    );

    const proximaPagina = useCallback(async () => {
        const paginaAtual = parametrosAtivos.page || 1;
        const totalPaginas = Math.ceil(state.total / (parametrosAtivos.limit || 20));

        if (paginaAtual < totalPaginas) {
            const novosParametros = {
                ...parametrosAtivos,
                page: paginaAtual + 1,
            };
            await buscar(novosParametros);
        }
    }, [parametrosAtivos, state.total, buscar]);

    const paginaAnterior = useCallback(async () => {
        const paginaAtual = parametrosAtivos.page || 1;

        if (paginaAtual > 1) {
            const novosParametros = {
                ...parametrosAtivos,
                page: paginaAtual - 1,
            };
            await buscar(novosParametros);
        }
    }, [parametrosAtivos, buscar]);

    const irParaPagina = useCallback(
        async (pagina: number) => {
            const totalPaginas = Math.ceil(state.total / (parametrosAtivos.limit || 20));

            if (pagina >= 1 && pagina <= totalPaginas) {
                const novosParametros = {
                    ...parametrosAtivos,
                    page: pagina,
                };
                await buscar(novosParametros);
            }
        },
        [parametrosAtivos, state.total, buscar],
    );

    const paginacao = useMemo(() => {
        const paginaAtual = parametrosAtivos.page || 1;
        const itensPorPagina = parametrosAtivos.limit || 20;
        const totalPaginas = Math.ceil(state.total / itensPorPagina);
        const itemInicial = (paginaAtual - 1) * itensPorPagina + 1;
        const itemFinal = Math.min(paginaAtual * itensPorPagina, state.total);

        return {
            paginaAtual,
            totalPaginas,
            itemInicial,
            itemFinal,
            temProxima: paginaAtual < totalPaginas,
            temAnterior: paginaAtual > 1,
        };
    }, [parametrosAtivos.page, parametrosAtivos.limit, state.total]);

    const estatisticas = useMemo(() => {
        const porModulo = state.resultados.reduce((acc, resultado) => {
            const modulo = resultado.modulo;
            acc[modulo] = (acc[modulo] || 0) + 1;
            return acc;
        }, {} as Record<ModuloSistema, number>);

        return {
            total: state.total,
            exibindo: state.resultados.length,
            tempo: state.tempo,
            porModulo: Object.entries(porModulo).map(([modulo, count]) => ({
                modulo: modulo as ModuloSistema,
                label: MODULOS_LABELS[modulo as ModuloSistema],
                count,
            })),
        };
    }, [state.resultados, state.total, state.tempo]);

    const actions: UseSearchActions = {
        buscar,
        buscarRapido,
        limparResultados,
        obterSugestoes,
        aplicarFiltro,
        alterarOrdenacao,
        proximaPagina,
        paginaAnterior,
        irParaPagina,
    };

    return {
        ...state,
        parametrosAtivos,
        paginacao,
        estatisticas,
        historico: mockHistorico,
        ...actions,
    };
}



