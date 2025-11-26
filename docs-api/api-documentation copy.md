# Documentação da API - Container Management System

## Visão Geral
API REST para gerenciamento de containers, averbações, usuários e seguradoras, com autenticação JWT e sistema de permissões baseado em roles.

**Base URL:** `http://localhost:3001/api`  
**Documentação Swagger:** `http://localhost:3001/api-docs`

## Autenticação
Todas as rotas (exceto login e registro) requerem autenticação via JWT Bearer Token.

```
Authorization: Bearer <token>
```

## Estrutura de Resposta Padrão

### Sucesso
```json
{
  "success": true,
  "data": {},
  "message": "Operação realizada com sucesso"
}
```

### Erro
```json
{
  "success": false,
  "error": "Código do erro",
  "message": "Descrição do erro"
}
```

## Paginação

Todas as rotas de listagem suportam paginação através dos seguintes parâmetros de query:

### Parâmetros de Paginação
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Número de itens por página (padrão: 10, máximo: 100)

### Exemplo de Requisição
```
GET /api/averbacoes?page=2&limit=5&taxa=ICMS
```

### Resposta com Paginação
```json
{
  "success": true,
  "data": {
    "items": [
      // Array de itens da página atual
    ],
    "pagination": {
      "currentPage": 2,
      "totalPages": 15,
      "totalItems": 73,
      "itemsPerPage": 5,
      "hasNextPage": true,
      "hasPreviousPage": true
    }
  },
  "message": "Dados obtidos com sucesso"
}
```

### Filtros
Além da paginação, você pode usar filtros específicos de cada endpoint passando-os como parâmetros de query. Os filtros disponíveis variam por endpoint e são documentados em cada seção específica.

**Exemplo:**
```
GET /api/averbacoes?page=1&limit=10&taxa=ICMS&status=ativo
```

## Endpoints

### 🔐 Autenticação (`/api/auth`)

#### POST `/auth/login`
Autenticação do usuário.

**Body:**
```json
{
  "email": "string",
  "senha": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token",
    "refreshToken": "refresh_token",
    "user": {
      "id": 1,
      "nomeCompleto": "Nome do Usuário",
      "email": "usuario@email.com",
      "perfil": "ADMIN"
    }
  }
}
```

#### POST `/auth/register`
Registro de novo usuário.

**Body:**
```json
{
  "nome": "string",
  "email": "string",
  "password": "string"
}
```

#### GET `/auth/profile`
Obter perfil do usuário autenticado.

#### PUT `/auth/profile`
Atualizar perfil do usuário.

#### POST `/auth/change-password`
Alterar senha do usuário.

**Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

#### POST `/auth/refresh-token`
Renovar token de acesso.

#### POST `/auth/logout`
Logout do usuário.

---

### 👥 Usuários (`/api/usuarios`)

#### GET `/usuarios`
Listar usuários com paginação.
- **Permissão:** `USER_READ`
- **Query Params:** `page`, `limit`

#### GET `/usuarios/:id`
Obter usuário por ID.
- **Permissão:** `USER_READ`

#### POST `/usuarios`
Criar novo usuário.
- **Permissão:** `USER_CREATE`

**Body:**
```json
{
  "nomeCompleto": "string",
  "email": "string",
  "senha": "string",
  "idPerfil": "number"
}
```

#### PUT `/usuarios/:id`
Atualizar usuário.
- **Permissão:** `USER_UPDATE`

#### DELETE `/usuarios/:id`
Excluir usuário.
- **Permissão:** `USER_DELETE`

#### PATCH `/usuarios/:id/status`
Atualizar status do usuário.
- **Permissão:** `USER_UPDATE`

---

### 📦 Containers (`/api/containers`)

#### GET `/containers`
Listar containers com paginação.
- **Permissão:** `CONTAINER_READ`
- **Query Params:** `page`, `limit`, `numero`, `tipo`, `status`

#### GET `/containers/:id`
Obter container por ID.
- **Permissão:** `CONTAINER_READ`

#### POST `/containers`
Criar novo container.
- **Permissão:** `CONTAINER_CREATE`

**Body:**
```json
{
  "numero": "string",
  "tipo": "string",
  "clienteId": "number"
}
```

#### PUT `/containers/:id`
Atualizar container.
- **Permissão:** `CONTAINER_UPDATE`

#### DELETE `/containers/:id`
Excluir container.
- **Permissão:** `CONTAINER_DELETE`

#### GET `/containers/search`
Buscar containers.
- **Permissão:** `CONTAINER_READ`
- **Query Params:** `termo`, `page`, `limit`

#### GET `/containers/status/:status`
Listar containers por status.
- **Permissão:** `CONTAINER_READ`

#### GET `/containers/date-range/filter`
Listar containers por período.
- **Permissão:** `CONTAINER_READ`
- **Query Params:** `dataInicio`, `dataFim`

#### GET `/containers/number/:numero`
Obter container por número.
- **Permissão:** `CONTAINER_READ`

---

### 📋 Averbações (`/api/averbacoes`)

#### GET `/averbacoes`
Listar averbações com paginação.
- **Permissão:** `AVERBACAO_READ`

#### GET `/averbacoes/:id`
Obter averbação por ID.
- **Permissão:** `AVERBACAO_READ`

#### POST `/averbacoes`
Criar nova averbação.
- **Permissão:** `AVERBACAO_CREATE`

**Body:**
```json
{
  "numeroContainer": "string",
  "valorMercadoria": "number",
  "clienteId": "number",
  "seguradoraId": "number"
}
```

#### PUT `/averbacoes/:id`
Atualizar averbação.
- **Permissão:** `AVERBACAO_UPDATE`

#### DELETE `/averbacoes/:id`
Excluir averbação.
- **Permissão:** `AVERBACAO_DELETE`

#### PATCH `/averbacoes/:id/status`
Atualizar status da averbação.
- **Permissão:** `AVERBACAO_UPDATE`

**Body:**
```json
{
  "status": "PENDENTE|EM_ANALISE|APROVADO|REJEITADO|CANCELADO"
}
```

#### GET `/averbacoes/search/query`
Buscar averbações.
- **Permissão:** `AVERBACAO_READ`
- **Query Params:** `termo`, `page`, `limit`

#### GET `/averbacoes/client/:clienteId`
Listar averbações por cliente.
- **Permissão:** `AVERBACAO_READ`
- **Query Params:** `page`, `limit`

#### GET `/averbacoes/status/:status`
Listar averbações por status.
- **Permissão:** `AVERBACAO_READ`
- **Status válidos:** `PENDENTE`, `EM_ANALISE`, `APROVADO`, `REJEITADO`, `CANCELADO`
- **Query Params:** `page`, `limit`

#### GET `/averbacoes/date-range/filter`
Listar averbações por período.
- **Permissão:** `AVERBACAO_READ`
- **Query Params:** `dataInicio`, `dataFim`, `page`, `limit`

#### GET `/averbacoes/statistics/overview`
Obter estatísticas das averbações.
- **Permissão:** `AVERBACAO_READ`

#### GET `/averbacoes/expiring/list`
Listar averbações próximas do vencimento.
- **Permissão:** `AVERBACAO_READ`
- **Query Params:** `page`, `limit`

#### GET `/averbacoes/number/:numero`
Obter averbação por número do container.
- **Permissão:** `AVERBACAO_READ`

#### POST `/averbacoes/:id/documents`
Upload de documento da averbação.
- **Permissão:** `AVERBACAO_UPDATE`
- **Status:** 🚧 Em desenvolvimento

**Body:**
```json
{
  "tipo": "string"
}
```

#### GET `/averbacoes/:id/documents`
Listar documentos da averbação.
- **Permissão:** `AVERBACAO_READ`
- **Status:** 🚧 Em desenvolvimento

#### DELETE `/averbacoes/:id/documents/:documentId`
Excluir documento da averbação.
- **Permissão:** `AVERBACAO_UPDATE`
- **Status:** 🚧 Em desenvolvimento

#### GET `/averbacoes/:id/history`
Obter histórico da averbação.
- **Permissão:** `AVERBACAO_READ`
- **Status:** 🚧 Em desenvolvimento

#### POST `/averbacoes/:id/approve`
Aprovar averbação.
- **Permissão:** `AVERBACAO_APPROVE`
- **Status:** 🚧 Em desenvolvimento

#### POST `/averbacoes/:id/reject`
Rejeitar averbação.
- **Permissão:** `AVERBACAO_APPROVE`
- **Status:** 🚧 Em desenvolvimento

**Body:**
```json
{
  "motivo": "string"
}
```

---

### 🏢 Clientes (`/api/clientes`)

#### GET `/clientes`
Listar clientes com paginação.
- **Permissão:** `CLIENT_READ`

#### GET `/clientes/:id`
Obter cliente por ID.
- **Permissão:** `CLIENT_READ`

#### POST `/clientes`
Criar novo cliente.
- **Permissão:** `CLIENT_CREATE`

**Body:**
```json
{
  "razaoSocial": "string",
  "cnpj": "string",
  "email": "string"
}
```

#### PUT `/clientes/:id`
Atualizar cliente.
- **Permissão:** `CLIENT_UPDATE`

#### DELETE `/clientes/:id`
Excluir cliente.
- **Permissão:** `CLIENT_DELETE`

#### PATCH `/clientes/:id/status`
Atualizar status do cliente.
- **Permissão:** `CLIENT_UPDATE`
- **Status válidos:** `ATIVO`, `INATIVO`, `SUSPENSO`

#### GET `/clientes/:id/filiais`
Obter cliente com filiais.
- **Permissão:** `CLIENT_READ`

#### GET `/clientes/status/ativos`
Listar clientes ativos.
- **Permissão:** `CLIENT_READ`

---

### 🔑 Permissões (`/api/permissoes`)

#### GET `/permissoes`
Listar permissões (Admin apenas).

#### GET `/permissoes/:id`
Obter permissão por ID (Admin apenas).

#### POST `/permissoes`
Criar nova permissão (Admin apenas).

#### PUT `/permissoes/:id`
Atualizar permissão (Admin apenas).

#### DELETE `/permissoes/:id`
Excluir permissão (Admin apenas).

#### GET `/permissoes/modules`
Listar módulos com permissões.
- **Permissão:** `PERMISSION_READ`

#### GET `/permissoes/active/list`
Listar permissões ativas.
- **Permissão:** `PERMISSION_READ`

#### POST `/permissoes/profile/:profileId/assign`
Atribuir permissões a perfil (Admin apenas).

#### DELETE `/permissoes/profile/:profileId/remove`
Remover permissões de perfil (Admin apenas).

---

### 📊 Dashboard (`/api/dashboard`)

#### GET `/dashboard/stats`
Obter estatísticas do dashboard.
- **Permissão:** `DASHBOARD_READ`

#### GET `/dashboard/operations`
Obter operações recentes.
- **Permissão:** `DASHBOARD_READ`

#### GET `/dashboard/actions`
Obter ações pendentes.
- **Permissão:** `DASHBOARD_READ`

---

### 🏦 Seguradoras (`/api/seguradoras`)

#### GET `/seguradoras`
Listar seguradoras.
- **Permissão:** `SEGURADORA_READ`

#### GET `/seguradoras/:id`
Obter seguradora por ID.
- **Permissão:** `SEGURADORA_READ`

#### POST `/seguradoras`
Criar nova seguradora.
- **Permissão:** `SEGURADORA_CREATE`

#### PUT `/seguradoras/:id`
Atualizar seguradora.
- **Permissão:** `SEGURADORA_UPDATE`

#### DELETE `/seguradoras/:id`
Excluir seguradora.
- **Permissão:** `SEGURADORA_DELETE`

---

### 📜 Histórico (`/api/historico`)

#### GET `/historico`
Obter histórico de alterações do sistema com filtros.
- **Permissão:** `HISTORICO_READ`
- **Query Params:** `page`, `limit`, `tabela`, `operacao`, `usuario`, `dataInicio`, `dataFim`

**Parâmetros de Filtro:**
- `tabela` (opcional): Nome da tabela para filtrar
- `operacao` (opcional): Tipo de operação (`CREATE`, `UPDATE`, `DELETE`)
- `usuario` (opcional): ID do usuário que fez a alteração
- `dataInicio` (opcional): Data inicial (formato ISO)
- `dataFim` (opcional): Data final (formato ISO)

**Response:**
```json
{
  "success": true,
  "data": {
    "historico": [
      {
        "idAuditoria": 1,
        "tabela": "averbacoes",
        "idRegistro": 123,
        "operacao": "CREATE",
        "dadosAnteriores": null,
        "dadosNovos": {
          "numeroContainer": "ABCD1234567",
          "valor": 150000.00
        },
        "usuario": {
          "idUsuario": 1,
          "nomeCompleto": "João Silva",
          "email": "joao@empresa.com"
        },
        "dataOperacao": "2025-01-27T10:30:00.000Z",
        "ipOrigem": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "alteracoes": {
          "campos_alterados": ["numeroContainer", "valor"],
          "resumo": "Criação de nova averbação"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 15,
      "totalItems": 150,
      "itemsPerPage": 20,
      "hasNextPage": true,
      "hasPreviousPage": false
    },
    "filtros": {
      "tabela": "averbacoes",
      "operacao": "CREATE",
      "usuario": null,
      "dataInicio": "2025-01-01",
      "dataFim": "2025-01-31"
    }
  }
}
```

#### GET `/historico/stats`
Obter estatísticas do histórico de alterações.
- **Permissão:** `HISTORICO_READ`
- **Query Params:** `periodo` (dias, padrão: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "resumo": {
      "totalOperacoes": 1250,
      "periodo": 30
    },
    "distribuicao": {
      "porTipo": {
        "CREATE": 450,
        "UPDATE": 650,
        "DELETE": 150
      },
      "porTabela": [
        {
          "tabela": "averbacoes",
          "total": 500
        },
        {
          "tabela": "containers",
          "total": 300
        }
      ],
      "usuariosAtivos": [
        {
          "usuario": {
            "idUsuario": 1,
            "nomeCompleto": "João Silva",
            "email": "joao@empresa.com"
          },
          "totalOperacoes": 125
        }
      ]
    },
    "atividade": [
      {
        "data": "2025-01-27",
        "total": 45
      }
    ],
    "periodo": {
      "dias": 30,
      "dataInicio": "2024-12-28T00:00:00.000Z",
      "dataFim": "2025-01-27T23:59:59.000Z"
    }
  }
}
```

---

### 🔔 Notificações (`/api/notificacoes`)

#### GET `/notificacoes/nao-lidas`
Obter notificações não lidas do usuário atual.
- **Permissão:** `NOTIFICACAO_READ`
- **Query Params:** `page`, `limit`, `tipo`, `prioridade`

**Parâmetros de Filtro:**
- `tipo` (opcional): Tipo da notificação (`info`, `alerta`, `erro`, `sucesso`)
- `prioridade` (opcional): Prioridade (`baixa`, `media`, `alta`, `critica`)

**Response:**
```json
{
  "success": true,
  "data": {
    "notificacoes": [
      {
        "idNotificacao": 1,
        "titulo": "Nova averbação pendente",
        "mensagem": "Averbação ABCD1234567 aguarda aprovação",
        "tipo": "alerta",
        "prioridade": "alta",
        "lida": false,
        "dataEnvio": "2025-01-27T10:30:00.000Z",
        "dadosAdicionais": {
          "averbacaoId": 123,
          "numeroContainer": "ABCD1234567"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 25,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

#### GET `/notificacoes/stats`
Obter estatísticas das notificações do usuário atual.
- **Permissão:** `NOTIFICACAO_READ`
- **Query Params:** `periodo` (dias, padrão: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "resumo": {
      "total": 150,
      "naoLidas": 25,
      "lidas": 125,
      "periodo": 30
    },
    "distribuicao": {
      "porTipo": {
        "info": 50,
        "alerta": 60,
        "erro": 20,
        "sucesso": 20
      },
      "porPrioridade": {
        "baixa": 40,
        "media": 70,
        "alta": 30,
        "critica": 10
      }
    },
    "ultimasSemanas": [
      {
        "semana": "2025-01-20",
        "total": 35,
        "naoLidas": 5
      }
    ],
    "tempoMedioLeitura": "2h 30min",
    "taxaLeitura": 83.3
  }
}
```

#### PUT `/notificacoes/:id/lida`
Marcar notificação como lida.
- **Permissão:** `NOTIFICACAO_UPDATE`

**Response:**
```json
{
  "success": true,
  "message": "Notificação marcada como lida",
  "data": {
    "idNotificacao": 1,
    "lida": true,
    "dataLeitura": "2025-01-27T15:45:00.000Z"
  }
}
```

---

### 📁 Upload (`/api/upload`)

Endpoints para upload de arquivos e documentos.

---

## Sistema de Permissões

### Módulos de Permissão
- **USER**: Gerenciamento de usuários
- **CLIENT**: Gerenciamento de clientes
- **CONTAINER**: Gerenciamento de containers
- **AVERBACAO**: Gerenciamento de averbações
- **SEGURADORA**: Gerenciamento de seguradoras
- **PERMISSION**: Gerenciamento de permissões
- **DASHBOARD**: Acesso ao dashboard

### Tipos de Permissão
- **READ**: Visualizar dados
- **CREATE**: Criar novos registros
- **UPDATE**: Atualizar registros existentes
- **DELETE**: Excluir registros
- **APPROVE**: Aprovar/rejeitar (específico para averbações)

### Perfis Padrão
- **ADMIN**: Acesso total ao sistema
- **ANALISTA**: Acesso limitado para análise

## Rate Limiting

- **API Geral**: 100 requests/15min
- **Login**: 5 tentativas/15min
- **Busca**: 50 requests/15min
- **Upload**: 10 requests/15min
- **Reset de Senha**: 3 tentativas/hora

## Códigos de Status HTTP

- **200**: Sucesso
- **201**: Criado com sucesso
- **400**: Erro de validação
- **401**: Não autenticado
- **403**: Sem permissão
- **404**: Não encontrado
- **429**: Rate limit excedido
- **500**: Erro interno do servidor

## Observações Importantes

1. Todas as operações são auditadas e logadas
2. Soft delete é implementado para a maioria das entidades
3. Paginação padrão: 10 itens por página
4. Timestamps automáticos (createdAt, updatedAt)
5. Validação de dados em todas as operações
6. Middleware de segurança aplicado em todas as rotas