"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Loading } from "@/components/ui/loading";
import { useRouter } from "next/navigation";
import { useAlert } from "@/contexts/AlertContext";
import { Input } from "@/components/ui/input";

export default function LoginForm() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        senha,
        redirect: false,
      });

      if (result?.error) {
        // Provide more specific error messages based on the error
        let errorMessage = "Email ou senha inválidos";

        if (result.error.includes("CredentialsSignin")) {
          errorMessage = "Email ou senha inválidos. Verifique suas credenciais e tente novamente.";
        } else if (result.error.includes("UserNotFound")) {
          errorMessage = "Usuário não encontrado ou inativo no sistema.";
        } else if (result.error.includes("401") || result.error.toLowerCase().includes("unauthorized")) {
          errorMessage = "Credenciais inválidas. Verifique seu email e senha.";
        } else if (result.error.includes("500")) {
          errorMessage = "Erro no servidor. Tente novamente mais tarde.";
        }

        showAlert("error", errorMessage);
        setLoading(false);
        return;
      }

      if (!result?.ok) {
        showAlert("error", "Não foi possível completar o login. Tente novamente.");
        setLoading(false);
        return;
      }

      // Successfully logged in - aguarda um pouco para a sessão ser estabelecida
      showAlert("success", "Login realizado com sucesso!");

      // Pequeno delay para garantir que a sessão NextAuth esteja pronta
      await new Promise(resolve => setTimeout(resolve, 500));

      router.push("/dashboard");
      // O loading permanece true até o redirect completar
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : "Ocorreu um erro ao tentar fazer login. Tente novamente.";
      showAlert("error", errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col lg:flex-row overflow-x-hidden">
      {/* Lado esquerdo - Imagem do navio cargueiro (apenas desktop) */}
      <div className="hidden lg:flex lg:w-2/3 xl:w-3/4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
        <div className="absolute inset-0 flex items-center justify-center">
          <img 
            src="/cargo-logo.png" 
            alt="Navio Cargueiro" 
            className="w-full h-full object-cover opacity-90"
          />
        </div>
      </div>

      {/* Lado direito - Formulário (sidebar style) */}
      <div className="w-full lg:w-1/3 xl:w-1/4 min-h-screen bg-slate-900 flex flex-col">
        {/* Header mobile */}
        <div className="lg:hidden bg-slate-800 text-white p-4 text-center">
          <h2 className="text-xl font-bold">Cargo Insurance</h2>
          <p className="text-slate-300 mt-1 text-sm">Sistema de Gestão</p>
        </div>

        {/* Formulário */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 xl:p-12 overflow-y-auto">
          <div className="w-full max-w-sm">
            <div className="mb-6 sm:mb-8 lg:mb-12">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-200 mb-2">
                Entrar
              </h1>
              <p className="text-slate-400 text-sm sm:text-base">
                Insira suas credenciais para acessar
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="space-y-1 sm:space-y-2">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Email"
                  className="h-11 sm:h-12"
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Input
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Senha"
                  className="h-11 sm:h-12"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-2.5 sm:py-3 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <Loading size="sm" className="mr-2" />
                    Entrando...
                  </div>
                ) : (
                  "Entrar"
                )}
              </button>
            </form>

            <div className="mt-6 sm:mt-8 text-center">
              <p className="text-slate-400 text-sm sm:text-base">
                Não tem uma conta?{" "}
                <Link 
                  href="/register" 
                  className="text-slate-300 hover:text-slate-100 font-medium transition-colors"
                >
                  Registre-se
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 lg:p-8 border-t border-slate-700 mt-auto">
          <p className="text-xs text-slate-400 text-center">
            © 2024 Cargo Insurance. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}