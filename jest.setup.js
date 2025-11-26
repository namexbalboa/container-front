import "@testing-library/jest-dom";

// Mock do NextAuth
jest.mock("next-auth/react", () => ({
    useSession: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
}));

// Mock do next/navigation
jest.mock("next/navigation", () => ({
    useRouter: jest.fn(() => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
        prefetch: jest.fn(),
    })),
    useSearchParams: jest.fn(() => ({
        get: jest.fn(),
        has: jest.fn(),
        toString: jest.fn(),
    })),
    usePathname: jest.fn(() => "/"),
}));

// Mock do AlertContext
jest.mock("@/contexts/AlertContext", () => ({
    useAlert: jest.fn(() => ({
        showAlert: jest.fn(),
    })),
    AlertProvider: ({ children }) => children,
}));

// Mock de fetch global será configurado nos testes individuais

// Mock de variáveis de ambiente
process.env.API_URL = "http://localhost:3001";
process.env.NEXTAUTH_SECRET = "test-secret";
process.env.NEXTAUTH_URL = "http://localhost:3001";