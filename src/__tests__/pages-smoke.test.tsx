"use strict";

import * as React from "react";
import { render, cleanup } from "@testing-library/react";
import type { ReactElement } from "react";
import { useSession } from "next-auth/react";

jest.mock("@/hooks/use-dashboard", () => ({
  useDashboard: jest.fn(() => ({
    dashboardData: {
      metricas: [
        {
          nome: "Total de Averbacoes",
          valor: "0",
          icone: "DocumentTextIcon",
          cor: "blue",
          descricao: "Quantidade total registrada",
          tendencia: { valor: 0, tipo: "stable", periodo: "7d" },
        },
      ],
      graficos: [
        {
          tipo: "bar" as const,
          titulo: "Averbacoes por periodo",
          periodo: "7d" as const,
          dados: [
            { label: "Dia 1", valor: 1, cor: "#3b82f6" },
            { label: "Dia 2", valor: 2, cor: "#10b981" },
          ],
        },
      ],
      operations: [],
      actions: [],
      stats: {
        resumo: {
          totalAverbacoes: 0,
          averbacoesPendentes: 0,
          containersAtivos: 0,
        },
      },
    },
    isLoading: false,
    isRefreshing: false,
    lastUpdate: new Date(),
    refreshData: jest.fn(),
    refetch: jest.fn(),
  })),
}));

let originalUseEffect: typeof React.useEffect;

const pages: Array<{ name: string; path: string }> = [
  { name: "Dashboard", path: "../app/(auth)/dashboard/page" },
  { name: "Averbacoes", path: "../app/(auth)/averbacoes/page" },
  { name: "Containers", path: "../app/(auth)/containers/page" },
  { name: "Clientes", path: "../app/(auth)/clientes/page" },
  { name: "Empresas", path: "../app/(auth)/empresas/page" },
  { name: "Operacoes", path: "../app/(auth)/operacoes/page" },
  { name: "Seguradoras", path: "../app/(auth)/seguradoras/page" },
  { name: "Usuarios", path: "../app/(auth)/usuarios/page" },
  { name: "Relatorios", path: "../app/(auth)/relatorios/page" },
];

beforeAll(() => {
  originalUseEffect = React.useEffect;
  Object.defineProperty(React, "useEffect", {
    configurable: true,
    value: (() => {}) as typeof React.useEffect,
  });

  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation(() => ({
        matches: false,
        media: "",
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  }

  if (!global.ResizeObserver) {
    // @ts-expect-error - ResizeObserver is not defined in jsdom
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  const defaultResponse = {
    success: true,
    data: {
      items: [],
      usuarios: [],
      pagination: {
        page: 1,
        pages: 1,
        limit: 10,
        total: 0,
        hasNext: false,
        hasPrev: false,
      },
    },
  };

  global.fetch = jest.fn().mockImplementation(
    async (input: RequestInfo | URL): Promise<Response> => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : "";

      if (url.includes("/api/relatorios")) {
        const relatorioPayload = JSON.stringify([]);
        return {
          ok: true,
          status: 200,
          headers: {
            get: () => "application/json",
          },
          json: async () => [],
          text: async () => relatorioPayload,
        } as unknown as Response;
      }

      const payload = JSON.stringify(defaultResponse);
      return {
        ok: true,
        status: 200,
        headers: {
          get: () => "application/json",
        },
        json: async () => defaultResponse,
        text: async () => payload,
      } as unknown as Response;
    },
  ) as unknown as typeof fetch;
});

afterAll(() => {
  Object.defineProperty(React, "useEffect", {
    configurable: true,
    value: originalUseEffect,
  });
});

beforeEach(() => {
  jest.clearAllMocks();

  (useSession as jest.Mock).mockReturnValue({
    data: {
      user: { id: 1, name: "Test User", email: "test@example.com" },
      accessToken: "test-token",
    },
    status: "authenticated",
  });
});

afterEach(() => {
  cleanup();
});

describe("Page smoke tests", () => {
  it.each(pages)("renders %s page without throwing errors", async ({ name, path }) => {
    const loadPage = () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require(path);
      return (mod?.default ?? mod) as () => ReactElement;
    };

    const PageComponent = loadPage();
    expect(typeof PageComponent).toBe("function");

    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    const { container } = render(<PageComponent />);
    expect(container).toBeTruthy();
    await new Promise(resolve => setTimeout(resolve, 0));

    const relevantErrors = consoleError.mock.calls.filter(call => {
      const [message] = call;
      return typeof message === "string" && !message.includes("not wrapped in act");
    });

    expect(relevantErrors).toHaveLength(0);

    consoleError.mockRestore();
  });
});
