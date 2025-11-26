#!/usr/bin/env node

/**
 * Script para executar exclusivamente os testes relacionados ao login
 * Uso: node test-login.js [opções]
 */

const { spawn } = require("child_process");
const path = require("path");

// Configurações dos testes
const testPatterns = [
    "src/lib/__tests__/auth.test.ts",
    "src/components/auth/__tests__/login-form.test.tsx", 
    "src/app/(public)/login/__tests__/login-integration.test.tsx",
    "src/hooks/__tests__/use-permissions.test.ts"
];

// Argumentos do Jest
const jestArgs = [
    `--testPathPattern=(${testPatterns.join("|").replace(/\\/g, "/")})`,
    "--verbose",
    "--coverage",
    "--coverageDirectory=coverage/login",
    "--collectCoverageFrom=src/lib/auth.ts",
    "--collectCoverageFrom=src/components/auth/login-form.tsx",
    "--collectCoverageFrom=src/hooks/use-permissions.ts",
    "--watchAll=false"
];

// Adiciona argumentos passados via linha de comando
const additionalArgs = process.argv.slice(2);
jestArgs.push(...additionalArgs);

console.log("🧪 Executando testes de login...");
console.log("📁 Padrões de teste:", testPatterns);
console.log("⚙️  Argumentos Jest:", jestArgs.join(" "));
console.log("─".repeat(50));

// Executa o Jest
const jest = spawn("npx", ["jest", ...jestArgs], {
    stdio: "inherit",
    shell: true,
    cwd: process.cwd()
});

jest.on("close", (code) => {
    if (code === 0) {
        console.log("─".repeat(50));
        console.log("✅ Todos os testes de login passaram!");
        console.log("📊 Relatório de cobertura disponível em: coverage/login");
    } else {
        console.log("─".repeat(50));
        console.log("❌ Alguns testes falharam. Código de saída:", code);
        process.exit(code);
    }
});

jest.on("error", (error) => {
    console.error("❌ Erro ao executar testes:", error.message);
    process.exit(1);
});