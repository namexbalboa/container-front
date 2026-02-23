"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loading } from "@/components/ui/loading";
import { useAlert } from "@/contexts/AlertContext";
import { Input } from "@/components/ui/input";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
  calcularForcaSenha,
} from "@/lib/usuarios/validations";
import { redefinirSenha, solicitarRecuperacaoSenha } from "@/lib/usuarios/api";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    label: string;
    color: string;
  } | null>(null);

  const emailFromQuery = searchParams.get("email") || "";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: emailFromQuery,
      codigo: "",
      novaSenha: "",
      confirmacaoSenha: "",
    },
  });

  // Set email from query params
  useEffect(() => {
    if (emailFromQuery) {
      setValue("email", emailFromQuery);
    }
  }, [emailFromQuery, setValue]);

  // Watch password for strength indicator
  const novaSenha = watch("novaSenha");
  useEffect(() => {
    if (novaSenha) {
      setPasswordStrength(calcularForcaSenha(novaSenha));
    } else {
      setPasswordStrength(null);
    }
  }, [novaSenha]);

  const onSubmit = async (data: ResetPasswordInput) => {
    setLoading(true);

    try {
      const result = await redefinirSenha(data.email, data.codigo, data.novaSenha);

      if (result.success) {
        showAlert("success", result.message);
        router.push("/login");
      } else {
        showAlert("error", result.message);
      }
    } catch (error) {
      console.error("Reset password error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao redefinir sua senha. Tente novamente.";
      showAlert("error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    const email = watch("email");
    if (!email) {
      showAlert("error", "Informe o email para reenviar o codigo");
      return;
    }

    setResendLoading(true);

    try {
      const result = await solicitarRecuperacaoSenha(email);
      showAlert("success", "Codigo reenviado com sucesso");

      // In development, log the code for testing
      if (process.env.NODE_ENV === "development" && result.devCode) {
        console.log("[DEV] Novo codigo de recuperacao:", result.devCode);
      }
    } catch (error) {
      console.error("Resend code error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao reenviar o codigo. Tente novamente.";
      showAlert("error", errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  const getStrengthColor = (color: string) => {
    switch (color) {
      case "red":
        return "bg-red-500";
      case "yellow":
        return "bg-yellow-500";
      case "green":
        return "bg-green-500";
      default:
        return "bg-slate-500";
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
            <div className="mb-6 sm:mb-8 lg:mb-10">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-200 mb-2">
                Redefinir Senha
              </h1>
              <p className="text-slate-400 text-sm sm:text-base">
                Informe o codigo recebido por email e crie uma nova senha
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email (read-only if from query) */}
              <div className="space-y-1">
                <label className="text-slate-400 text-xs sm:text-sm">Email</label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  disabled={loading || !!emailFromQuery}
                  placeholder="Email"
                  className="h-11 sm:h-12"
                />
                {errors.email && (
                  <p className="text-red-400 text-xs sm:text-sm">{errors.email.message}</p>
                )}
              </div>

              {/* Codigo */}
              <div className="space-y-1">
                <label className="text-slate-400 text-xs sm:text-sm">
                  Codigo de Verificacao
                </label>
                <Input
                  id="codigo"
                  type="text"
                  {...register("codigo")}
                  disabled={loading}
                  placeholder="000000"
                  maxLength={6}
                  className="h-11 sm:h-12 text-center tracking-widest text-lg font-mono"
                />
                {errors.codigo && (
                  <p className="text-red-400 text-xs sm:text-sm">{errors.codigo.message}</p>
                )}
                <p className="text-slate-500 text-xs">6 digitos enviados por email</p>
              </div>

              {/* Nova Senha */}
              <div className="space-y-1">
                <label className="text-slate-400 text-xs sm:text-sm">Nova Senha</label>
                <Input
                  id="novaSenha"
                  type="password"
                  {...register("novaSenha")}
                  disabled={loading}
                  placeholder="Nova senha"
                  className="h-11 sm:h-12"
                />
                {errors.novaSenha && (
                  <p className="text-red-400 text-xs sm:text-sm">{errors.novaSenha.message}</p>
                )}
                {/* Password strength indicator */}
                {passwordStrength && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getStrengthColor(passwordStrength.color)} transition-all duration-300`}
                        style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs ${
                        passwordStrength.color === "red"
                          ? "text-red-400"
                          : passwordStrength.color === "yellow"
                            ? "text-yellow-400"
                            : "text-green-400"
                      }`}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirmar Senha */}
              <div className="space-y-1">
                <label className="text-slate-400 text-xs sm:text-sm">Confirmar Senha</label>
                <Input
                  id="confirmacaoSenha"
                  type="password"
                  {...register("confirmacaoSenha")}
                  disabled={loading}
                  placeholder="Confirmar nova senha"
                  className="h-11 sm:h-12"
                />
                {errors.confirmacaoSenha && (
                  <p className="text-red-400 text-xs sm:text-sm">
                    {errors.confirmacaoSenha.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-2.5 sm:py-3 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base mt-2"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <Loading size="sm" className="mr-2" />
                    Redefinindo...
                  </div>
                ) : (
                  "Redefinir Senha"
                )}
              </button>
            </form>

            {/* Resend code link */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendLoading}
                className="text-slate-400 hover:text-slate-300 text-sm transition-colors disabled:opacity-50"
              >
                {resendLoading ? (
                  <span className="flex items-center justify-center">
                    <Loading size="sm" className="mr-2" />
                    Reenviando...
                  </span>
                ) : (
                  "Nao recebeu? Reenviar codigo"
                )}
              </button>
            </div>

            <div className="mt-6 sm:mt-8 text-center">
              <p className="text-slate-400 text-sm sm:text-base">
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
