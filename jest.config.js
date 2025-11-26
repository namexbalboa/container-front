const nextJest = require("next/jest");

const createJestConfig = nextJest({
    // Caminho para o app Next.js para carregar next.config.js e arquivos .env
    dir: "./",
});

// Configuração customizada do Jest
const customJestConfig = {
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
    testEnvironment: "jest-environment-jsdom",
    testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
    },
    collectCoverageFrom: [
        "src/**/*.{js,jsx,ts,tsx}",
        "!src/**/*.d.ts",
        "!src/app/layout.tsx",
        "!src/app/globals.css",
    ],
    testMatch: [
        "<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}",
        "<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}",
    ],
};

// createJestConfig é exportado desta forma para garantir que next/jest possa carregar a configuração do Next.js que é assíncrona
module.exports = createJestConfig(customJestConfig);