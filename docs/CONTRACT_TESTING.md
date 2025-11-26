# Contract Testing - Documentação

## O que é Contract Testing?

Contract Testing é uma técnica de teste que **valida se o contrato (interface) entre o frontend e o backend está sendo respeitado**. Em vez de testar a integração real com o backend, você valida se:

1. **As requisições que o frontend envia** estão no formato correto (schema)
2. **As respostas que o backend retorna** estão no formato esperado (schema)

Isso garante que ambos os lados (frontend e backend) estão "falando a mesma língua", evitando quebras na integração.

---

## Como funciona neste projeto?

### 1. **Schema OpenAPI/Swagger**
O backend já possui um arquivo `swagger.json` que define todos os endpoints, schemas, requests e responses da API.

Localização: `../APIS/API/documentation/api/swagger.json`

### 2. **Geração de Tipos TypeScript**
Usamos `openapi-typescript` para gerar automaticamente tipos TypeScript a partir do schema OpenAPI.

```bash
npm run generate:api-types
```

Isso gera o arquivo: `src/types/api-contract.ts` com todos os tipos da API.

### 3. **Validação de Contratos com Ajv**
Usamos a biblioteca **Ajv** (JSON Schema validator) para validar:
- Request bodies antes de enviar ao backend
- Response bodies recebidos do backend

### 4. **Testes Automatizados**
Os testes verificam se os dados estão de acordo com o contrato OpenAPI:

```bash
npm run test:contract        # Rodar testes
npm run test:contract:watch  # Rodar em modo watch
```

---

## Estrutura dos Arquivos

```
src/tests/contract/
├── contract-validator.ts       # Classe que valida contratos usando Ajv
├── api-contract.test.ts       # Testes de contrato para todos os endpoints
└── schemas/
    └── swagger.json           # Cópia do schema OpenAPI do backend
```

---

## Como usar no código

### Validar Request Body

```typescript
import { contractValidator } from '@/tests/contract/contract-validator';

const requestBody = {
  email: 'user@example.com',
  senha: '123456',
};

const result = contractValidator.validateRequestBody(
  '/api/auth/login',
  'POST',
  requestBody
);

if (!result.valid) {
  console.error('Request inválido:', result.errors);
}
```

### Validar Response

```typescript
const response = await fetch('/api/usuarios');
const data = await response.json();

const result = contractValidator.validateResponse(
  '/api/usuarios',
  'GET',
  200,
  data
);

if (!result.valid) {
  console.error('Response não está de acordo com o contrato:', result.errors);
}
```

### Listar todos os endpoints

```typescript
const endpoints = contractValidator.listEndpoints();
console.log(endpoints);
// [
//   { path: '/api/auth/login', method: 'POST', summary: 'Login de usuário' },
//   { path: '/api/usuarios', method: 'GET', summary: 'Listar usuários' },
//   ...
// ]
```

---

## Endpoints Testados

Os testes cobrem os seguintes módulos:

### Autenticação
- ✅ `POST /api/auth/login` - Login com validação de request e responses (200, 401)

### Usuários
- ✅ `GET /api/usuarios` - Listar usuários
- ✅ `POST /api/usuarios` - Criar usuário

### Containers
- ✅ `GET /api/containers` - Listar containers
- ✅ `POST /api/containers` - Criar container

### Averbações
- ✅ `GET /api/averbacoes` - Listar averbações
- ✅ `POST /api/averbacoes` - Criar averbação

### Clientes
- ✅ `GET /api/clientes` - Listar clientes

### Seguradoras
- ✅ `GET /api/seguradoras` - Listar seguradoras

### Histórico
- ✅ `GET /api/historico` - Listar histórico de alterações

---

## Benefícios

### 1. **Detecção Precoce de Quebras**
Se o backend mudar o formato de uma resposta, os testes de contrato vão falhar imediatamente.

### 2. **Documentação Viva**
Os schemas OpenAPI servem como documentação atualizada da API.

### 3. **Desenvolvimento Paralelo**
Frontend e backend podem ser desenvolvidos em paralelo, desde que ambos respeitem o contrato.

### 4. **Menos Bugs em Produção**
Valida que a integração está correta antes mesmo de fazer chamadas reais.

### 5. **Testes Rápidos**
Testes de contrato são mais rápidos que testes de integração, pois não precisam de um backend rodando.

---

## Fluxo de Trabalho

### Quando atualizar o schema da API:

1. **Backend atualiza o swagger.json**
2. **Frontend copia o novo schema:**
   ```bash
   cp ../APIS/API/documentation/api/swagger.json src/tests/contract/schemas/
   ```
3. **Gera novos tipos TypeScript:**
   ```bash
   npm run generate:api-types
   ```
4. **Roda os testes de contrato:**
   ```bash
   npm run test:contract
   ```
5. **Se os testes falharem:**
   - Verifique se o frontend precisa ser atualizado
   - Ou se o backend quebrou o contrato (breaking change)

---

## Comparação com outras abordagens

| Abordagem | Vantagens | Desvantagens |
|-----------|-----------|--------------|
| **Contract Testing** ✅ | - Rápido<br>- Não precisa de backend rodando<br>- Valida o contrato | - Não testa lógica de negócio<br>- Não testa integração real |
| **Testes de Integração** | - Testa fluxo completo<br>- Testa lógica real | - Mais lento<br>- Precisa de backend rodando<br>- Mais complexo de configurar |
| **Testes E2E** | - Testa experiência real do usuário | - Muito lento<br>- Frágil<br>- Difícil de debugar |

**Recomendação**: Use os 3 tipos em conjunto:
1. Contract testing para validar a interface
2. Integration testing para fluxos críticos
3. E2E testing para user journeys importantes

---

## Scripts Disponíveis

```bash
# Gerar tipos TypeScript do OpenAPI
npm run generate:api-types

# Rodar testes de contrato
npm run test:contract

# Rodar testes de contrato em modo watch
npm run test:contract:watch

# Rodar todos os testes
npm test
```

---

## Dependências Utilizadas

- **openapi-typescript**: Gera tipos TypeScript do OpenAPI
- **ajv**: JSON Schema validator
- **ajv-formats**: Formatos adicionais (date, email, etc) para Ajv

---

## Próximos Passos

### 1. **Adicionar mais testes**
Cobrir todos os endpoints da API com testes de contrato.

### 2. **Integrar no CI/CD**
Rodar os testes de contrato automaticamente no pipeline.

### 3. **Validar em runtime**
Adicionar validação de contrato em desenvolvimento para alertar sobre respostas inválidas.

### 4. **Sincronização automática**
Automatizar a cópia do swagger.json quando o backend for atualizado.

---

## Referências

- [OpenAPI Specification](https://swagger.io/specification/)
- [Contract Testing](https://martinfowler.com/bliki/ContractTest.html)
- [Ajv JSON Schema Validator](https://ajv.js.org/)
- [openapi-typescript](https://github.com/openapi-ts/openapi-typescript)
