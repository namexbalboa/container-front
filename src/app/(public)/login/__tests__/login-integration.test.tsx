import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "../page";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAlert } from "@/contexts/AlertContext";

// Mocks
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseAlert = useAlert as jest.MockedFunction<typeof useAlert>;

const mockPush = jest.fn();
const mockShowAlert = jest.fn();

// Mock do fetch para simular API
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("Login Integration Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        mockUseRouter.mockReturnValue({
            push: mockPush,
            replace: jest.fn(),
            back: jest.fn(),
            forward: jest.fn(),
            refresh: jest.fn(),
            prefetch: jest.fn(),
        });

        mockUseAlert.mockReturnValue({
            showAlert: mockShowAlert,
        });

        process.env.API_URL = "http://localhost:3001";
    });

    it("deve realizar fluxo completo de login com sucesso", async () => {
        const user = userEvent.setup();

        // Mock da resposta da API
        const mockApiResponse = {
            success: true,
            message: "Login realizado com sucesso",
            data: {
                usuario: {
                    id: 1,
                    nome: "Admin Teste",
                    email: "admin@test.com",
                    cpf: "12345678901",
                    telefone: "11999999999",
                    status: "ativo",
                    perfil: {
                        id: 1,
                        nomePerfil: "Administrador",
                        descricao: "Perfil administrativo",
                        perfilPermissoes: []
                    }
                },
                token: "mock-jwt-token"
            }
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockApiResponse
        });

        mockSignIn.mockResolvedValue({ ok: true, error: null } as any);

        render(<LoginPage />);

        // Preenche o formulário
        const emailInput = screen.getByPlaceholderText("Email");
        const passwordInput = screen.getByPlaceholderText("Senha");
        const submitButton = screen.getByRole("button", { name: /entrar/i });

        await user.type(emailInput, "admin@test.com");
        await user.type(passwordInput, "123456");
        await user.click(submitButton);

        // Verifica se o signIn foi chamado corretamente
        expect(mockSignIn).toHaveBeenCalledWith("credentials", {
            email: "admin@test.com",
            senha: "123456",
            redirect: false,
        });

        // Verifica redirecionamento
        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith("/dashboard");
        });
    });

    it("deve tratar erro de credenciais inválidas", async () => {
        const user = userEvent.setup();

        mockSignIn.mockResolvedValue({ 
            ok: false, 
            error: "CredentialsSignin" 
        } as any);

        render(<LoginPage />);

        const emailInput = screen.getByPlaceholderText("Email");
        const passwordInput = screen.getByPlaceholderText("Senha");
        const submitButton = screen.getByRole("button", { name: /entrar/i });

        await user.type(emailInput, "invalid@test.com");
        await user.type(passwordInput, "wrongpassword");
        await user.click(submitButton);

        await waitFor(() => {
            expect(mockShowAlert).toHaveBeenCalledWith("error", "Email ou senha inválidos");
        });

        expect(mockPush).not.toHaveBeenCalled();
    });

    it("deve validar formato de email", async () => {
        const user = userEvent.setup();
        render(<LoginPage />);

        const emailInput = screen.getByPlaceholderText("Email");
        const passwordInput = screen.getByPlaceholderText("Senha");
        const submitButton = screen.getByRole("button", { name: /entrar/i });

        // Tenta com email inválido
        await user.type(emailInput, "email-invalido");
        await user.type(passwordInput, "123456");
        
        // O HTML5 validation deve impedir o submit
        expect(emailInput).toBeInvalid();
    });

    it("deve manter estado do formulário durante loading", async () => {
        const user = userEvent.setup();
        
        let resolveSignIn: (value: any) => void;
        const signInPromise = new Promise((resolve) => {
            resolveSignIn = resolve;
        });
        mockSignIn.mockReturnValue(signInPromise as any);

        render(<LoginPage />);

        const emailInput = screen.getByPlaceholderText("Email");
        const passwordInput = screen.getByPlaceholderText("Senha");
        const submitButton = screen.getByRole("button", { name: /entrar/i });

        await user.type(emailInput, "test@test.com");
        await user.type(passwordInput, "123456");
        await user.click(submitButton);

        // Durante o loading, os campos devem estar desabilitados mas manter valores
        expect(emailInput).toBeDisabled();
        expect(passwordInput).toBeDisabled();
        expect(submitButton).toBeDisabled();
        expect(emailInput).toHaveValue("test@test.com");
        expect(passwordInput).toHaveValue("123456");

        // Finaliza o loading
        resolveSignIn!({ ok: true, error: null });
    });

    it("deve permitir nova tentativa após erro", async () => {
        const user = userEvent.setup();

        // Primeira tentativa com erro
        mockSignIn.mockResolvedValueOnce({ 
            ok: false, 
            error: "CredentialsSignin" 
        } as any);

        render(<LoginPage />);

        const emailInput = screen.getByPlaceholderText("Email");
        const passwordInput = screen.getByPlaceholderText("Senha");
        const submitButton = screen.getByRole("button", { name: /entrar/i });

        await user.type(emailInput, "wrong@test.com");
        await user.type(passwordInput, "wrongpass");
        await user.click(submitButton);

        await waitFor(() => {
            expect(mockShowAlert).toHaveBeenCalledWith("error", "Email ou senha inválidos");
        });

        // Segunda tentativa com sucesso
        mockSignIn.mockResolvedValueOnce({ ok: true, error: null } as any);

        await user.clear(emailInput);
        await user.clear(passwordInput);
        await user.type(emailInput, "correct@test.com");
        await user.type(passwordInput, "correctpass");
        await user.click(submitButton);

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith("/dashboard");
        });
    });

    it("deve ter acessibilidade adequada", () => {
        render(<LoginPage />);

        // Verifica se os campos têm labels adequados via placeholder
        const emailInput = screen.getByPlaceholderText("Email");
        const passwordInput = screen.getByPlaceholderText("Senha");

        expect(emailInput).toHaveAttribute("id", "email");
        expect(passwordInput).toHaveAttribute("id", "senha");
        expect(emailInput).toHaveAttribute("type", "email");
        expect(passwordInput).toHaveAttribute("type", "password");
        expect(emailInput).toBeRequired();
        expect(passwordInput).toBeRequired();
    });

    it("deve ter design responsivo", () => {
        render(<LoginPage />);

        // Verifica se elementos responsivos estão presentes
        expect(screen.getByText("Cargo Insurance")).toBeInTheDocument();
        expect(screen.getByText("Sistema de Gestão")).toBeInTheDocument();
        
        // Verifica se o formulário está presente
        expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
    });
});