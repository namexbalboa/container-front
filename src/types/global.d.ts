// Arquivo para garantir que os tipos customizados sejam reconhecidos globalmente
import "./next-auth.d.ts";
import "./api";

// Re-exportar tipos para garantir disponibilidade global
export * from "./api";
export * from "./next-auth.d.ts";