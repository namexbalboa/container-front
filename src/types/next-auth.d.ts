import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";
import { UsuarioAuth, Perfil } from "./api";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      nome: string;
      nomeCompleto: string;
      cpf: string;
      telefone: string;
      status: "ativo" | "inativo" | "bloqueado";
      perfil: Perfil;
    } & DefaultSession["user"];
    token: string;
    accessToken: string;
  }

  interface User extends DefaultUser {
    // Propriedades customizadas para transferir dados do authorize para o JWT
    usuario?: UsuarioAuth;
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    name: string;
    nome: string;
    nomeCompleto: string;
    email: string;
    cpf: string;
    telefone: string;
    status: "ativo" | "inativo" | "bloqueado";
    perfil: Perfil;
    accessToken: string;
  }
}