"use strict";

import { NextRequest, NextResponse } from "next/server";

// Proxy de login: encaminha requisição ao backend real
export async function POST(request: NextRequest) {
  try {
    const { email, senha } = await request.json();

    if (!email || !senha) {
      return NextResponse.json(
        { success: false, message: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const url = base.endsWith("/api")
      ? `${base}/auth/login`
      : `${base}/api/auth/login`;

    console.log("[API] Proxy login ->", url);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });

    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("[API] Resposta não-JSON do backend:", parseError);
      data = { success: false, message: "Resposta inválida do backend", raw: text };
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[API] Login proxy error:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}