#!/usr/bin/env node

/**
 * Script para gerar tipos TypeScript a partir do schema OpenAPI
 * Executa: npm run generate:api-types
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SWAGGER_PATH = path.join(__dirname, '../../APIS/API/documentation/api/swagger.json');
const OUTPUT_PATH = path.join(__dirname, '../src/types/api-contract.ts');

console.log('🔄 Gerando tipos TypeScript do contrato da API...\n');

// Verifica se o arquivo swagger existe
if (!fs.existsSync(SWAGGER_PATH)) {
  console.error('❌ Erro: swagger.json não encontrado em:', SWAGGER_PATH);
  process.exit(1);
}

try {
  // Gera os tipos TypeScript
  execSync(
    `npx openapi-typescript "${SWAGGER_PATH}" -o "${OUTPUT_PATH}"`,
    { stdio: 'inherit' }
  );

  console.log('\n✅ Tipos gerados com sucesso em:', OUTPUT_PATH);
} catch (error) {
  console.error('❌ Erro ao gerar tipos:', error.message);
  process.exit(1);
}
