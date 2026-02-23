"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/ui/loading";
import { useAlert } from "@/contexts/AlertContext";
import { Input } from "@/components/ui/input";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/usuarios/validations";
import { solicitarRecuperacaoSenha } from "@/lib/usuarios/api";

export default function ForgotPasswordForm() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setLoading(true);

    try {
      const result = await solicitarRecuperacaoSenha(data.email);

      // Always show success message (security - don't reveal if email exists)
      showAlert(result.message, "success");

      // In development, log the code for testing
      if (process.env.NODE_ENV === "development" && result.devCode) {
        console.log("[DEV] Codigo de recuperacao:", result.devCode);
      }

      // Redirect to reset password page with email pre-filled
      router.push(`/reset-password?email=${encodeURIComponent(data.email)}`);
    } catch (error) {
      console.error("Forgot password error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao processar sua solicitacao. Tente novamente.";
      showAlert(errorMessage);
    } finally {
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

      {/* Lado direito - Formulario (sidebar style) */}
      <div className="w-full lg:w-1/3 xl:w-1/4 min-h-screen bg-slate-900 flex flex-col">
        {/* Header mobile */}
        <div className="lg:hidden bg-slate-800 text-white p-4 text-center">
          <h2 className="text-xl font-bold">Cargo Insurance</h2>
          <p className="text-slate-300 mt-1 text-sm">Sistema de Gestao</p>
        </div>

        {/* Formulario */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 xl:p-12 overflow-y-auto">
          <div className="w-full max-w-sm">
            <div className="mb-6 sm:mb-8 lg:mb-12">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-200 mb-2">
                Recuperar Senha
              </h1>
              <p className="text-slate-400 text-sm sm:text-base">
                Informe seu email para receber um codigo de recuperacao
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
              <div className="space-y-1 sm:space-y-2">
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  disabled={loading}
                  placeholder="Email"
                  className="h-11 sm:h-12"
                />
                {errors.email && (
                  <p className="text-red-400 text-xs sm:text-sm">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-2.5 sm:py-3 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <Loading size="sm" className="mr-2" />
                    Enviando...
                  </div>
                ) : (
                  "Enviar Codigo"
                )}
              </button>
            </form>

            <div className="mt-6 sm:mt-8 text-center">
              <p className="text-slate-400 text-sm sm:text-base">
                Lembrou sua senha?{" "}
                <Link
                  href="/login"
                  className="text-slate-300 hover:text-slate-100 font-medium transition-colors"
                >
                  Voltar para login
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
