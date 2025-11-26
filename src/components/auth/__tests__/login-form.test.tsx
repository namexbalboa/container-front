import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import LoginForm from "../login-form";
import { useAlert } from "@/contexts/AlertContext";

// Mocks
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseAlert = useAlert as jest.MockedFunction<typeof useAlert>;

const mockPush = jest.fn();
const mockShowAlert = jest.fn();

describe("LoginForm", () => {
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
    });

    it("deve renderizar o formulário de login", () => {
        render(<LoginForm />);
        
        expect(screen.getByRole("heading", { name: "Entrar" })).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Senha")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
    });

    it("deve permitir digitar email e senha", async () => {
        const user = userEvent.setup();
        render(<LoginForm />);

        const emailInput = screen.getByPlaceholderText("Email");
        const passwordInput = screen.getByPlaceholderText("Senha");

        await user.type(emailInput, "test@example.com");
        await user.type(passwordInput, "password123");

        expect(emailInput).toHaveValue("test@example.com");
        expect(passwordInput).toHaveValue("password123");
    });

    it("deve fazer login com sucesso e redirecionar para dashboard", async () => {
        const user = userEvent.setup();
        mockSignIn.mockResolvedValue({ ok: true, error: null } as any);

        render(<LoginForm />);

        const emailInput = screen.getByPlaceholderText("Email");
        const passwordInput = screen.getByPlaceholderText("Senha");
        const submitButton = screen.getByRole("button", { name: /entrar/i });

        await user.type(emailInput, "admin@test.com");
        await user.type(passwordInput, "123456");
        await user.click(submitButton);

        expect(mockSignIn).toHaveBeenCalledWith("credentials", {
            email: "admin@test.com",
            senha: "123456",
            redirect: false,
        });

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith("/dashboard");
        });
    });

    it("deve mostrar erro quando login falha", async () => {
        const user = userEvent.setup();
        mockSignIn.mockResolvedValue({ 
            ok: false, 
            error: "CredentialsSignin" 
        } as any);

        render(<LoginForm />);

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

    it("deve mostrar estado de loading durante o login", async () => {
        const user = userEvent.setup();
        let resolveSignIn: (value: any) => void;
        const signInPromise = new Promise((resolve) => {
            resolveSignIn = resolve;
        });
        mockSignIn.mockReturnValue(signInPromise as any);

        render(<LoginForm />);

        const emailInput = screen.getByPlaceholderText("Email");
        const passwordInput = screen.getByPlaceholderText("Senha");
        const submitButton = screen.getByRole("button", { name: /entrar/i });

        await user.type(emailInput, "test@test.com");
        await user.type(passwordInput, "123456");
        await user.click(submitButton);

        // Verifica se o estado de loading está ativo
        expect(screen.getByText("Entrando...")).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
        expect(emailInput).toBeDisabled();
        expect(passwordInput).toBeDisabled();

        // Resolve o promise para finalizar o loading
        resolveSignIn!({ ok: true, error: null });
    });

    it("deve tratar erro de exceção durante o login", async () => {
        const user = userEvent.setup();
        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
        mockSignIn.mockRejectedValue(new Error("Network error"));

        render(<LoginForm />);

        const emailInput = screen.getByPlaceholderText("Email");
        const passwordInput = screen.getByPlaceholderText("Senha");
        const submitButton = screen.getByRole("button", { name: /entrar/i });

        await user.type(emailInput, "test@test.com");
        await user.type(passwordInput, "123456");
        await user.click(submitButton);

        await waitFor(() => {
            expect(mockShowAlert).toHaveBeenCalledWith("error", "Ocorreu um erro ao tentar fazer login");
        });

        expect(consoleErrorSpy).toHaveBeenCalledWith("Login error:", expect.any(Error));
        consoleErrorSpy.mockRestore();
    });

    it("deve validar campos obrigatórios", async () => {
        const user = userEvent.setup();
        render(<LoginForm />);

        const submitButton = screen.getByRole("button", { name: /entrar/i });
        
        // Tenta submeter sem preencher os campos
        await user.click(submitButton);

        // Verifica se os campos têm o atributo required
        expect(screen.getByPlaceholderText("Email")).toBeRequired();
        expect(screen.getByPlaceholderText("Senha")).toBeRequired();
    });

    it("deve exibir link para registro", () => {
        render(<LoginForm />);
        
        expect(screen.getByText("Não tem uma conta?")).toBeInTheDocument();
        const registerLink = screen.getByText("Registre-se");
        expect(registerLink).toBeInTheDocument();
        expect(registerLink.closest("a")).toHaveAttribute("href", "/register");
    });

    it("deve exibir informações da empresa", () => {
        render(<LoginForm />);
        
        expect(screen.getByText("Cargo Insurance")).toBeInTheDocument();
        expect(screen.getByText("© 2024 Cargo Insurance. Todos os direitos reservados.")).toBeInTheDocument();
    });

    it("deve ter campos de email e senha com tipos corretos", () => {
        render(<LoginForm />);

        const emailInput = screen.getByPlaceholderText("Email");
        const passwordInput = screen.getByPlaceholderText("Senha");

        expect(emailInput).toHaveAttribute("type", "email");
        expect(passwordInput).toHaveAttribute("type", "password");
    });
});