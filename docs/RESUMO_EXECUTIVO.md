# Resumo Executivo — Cargo Insurance

**Sistema de Gestão de Seguros de Carga para Containers**

---

## 1. Visão Geral

O **Cargo Insurance** é um sistema web completo para gerenciamento de seguros de carga marítima/terrestre/aérea de containers. Ele permite o controle de todo o ciclo de vida de averbações de seguro — desde o cadastro de containers e viagens, passando pela configuração de parâmetros de seguro e emissão de averbações, até o acompanhamento por dashboard com métricas em tempo real.

O sistema é composto por dois projetos:

| Projeto | Tecnologia | Porta |
|---------|-----------|-------|
| **container-front** | Next.js 14, TypeScript, Tailwind CSS | 3000 |
| **container-api** | Express.js, Prisma ORM, PostgreSQL (Supabase) | 8000 |

---

## 2. Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 14)                │
│  App Router │ NextAuth (JWT) │ Tailwind │ React Hook Form│
└──────────────────────┬──────────────────────────────────┘
                       │ REST API (HTTP/JSON)
┌──────────────────────▼──────────────────────────────────┐
│                    BACKEND (Express.js)                  │
│  Controllers → Services → Repositories → Prisma ORM     │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                PostgreSQL (Supabase)                     │
│            30+ tabelas │ Soft deletes │ Versionamento    │
└─────────────────────────────────────────────────────────┘
```

**Padrão de 3 camadas no backend:**
- **Controllers** — Recebem requisições HTTP, validam entrada, retornam respostas
- **Services** — Lógica de negócio, validações complexas, cálculos
- **Repositories** — Acesso ao banco via Prisma ORM, queries otimizadas

Todas as camadas herdam de classes base (`BaseController`, `BaseService`, `BaseRepository`) que fornecem CRUD padrão, paginação, validação de CPF/CNPJ e tratamento de erros.

---

## 3. Módulos do Sistema

### 3.1 Autenticação e Autorização

| Recurso | Descrição |
|---------|-----------|
| **Login** | Email + senha, JWT com expiração de 24h |
| **Refresh Token** | Token de renovação com validade de 7 dias |
| **Auto-logout** | Redirecionamento automático em respostas 401 ou usuário inativo |
| **Perfis e Permissões** | Sistema RBAC (Role-Based Access Control) com módulos e ações |
| **Middleware de Permissão** | Verificação por rota: `checkPermission('CONTAINER_READ')` |
| **Admin bypass** | Perfil ADMIN tem acesso irrestrito a todos os recursos |

**Módulos de permissão:** CONTAINER, AVERBACAO, CLIENT, USER, SEGURADORA, PARAMETROS, DASHBOARD, NOTIFICACAO, HISTORICO, UPLOAD, PERMISSION

**Ações por módulo:** READ, CREATE, UPDATE, DELETE, APPROVE, EXPORT, ALL

### 3.2 Containers

Cadastro e gestão de containers físicos.

- **30 tipos de container** cadastrados: DC (Dry), HC (High Cube), RF (Refrigerado), OT (Open Top), FR (Flat Rack), PL (Platform), TK (Tank), SD (Side Door), DD (Double Door), VT (Ventilado), IN (Isolado), BK (Graneleiro), HH (Meia Altura), PW (Pallet Wide), SW (Swap Body) — cada um em versões 20 e 40 pés
- **Campos:** número do container, tipo, valor, proprietário, ano de fabricação, status
- **Status:** Ativo, Em Trânsito, Entregue, Inativo
- **Busca por:** número, status, cliente, período

### 3.3 Viagens (Container Trips)

Registro de viagens/embarques com dados logísticos completos.

- **Dados Siscomex:** Número CE Mercante, conhecimento de embarque, tipo de conhecimento
- **Transporte:** navio, número da viagem, IMO, armador, booking, BL number
- **Portos:** origem, destino, com códigos de país
- **Mercadoria:** descrição, volumes, cubagem, peso bruto, valor, moeda
- **Partes:** embarcador, consignatário, notify party (CNPJ e nome)
- **Frete:** valor, moeda, modalidade, tipo de pagamento, taxas adicionais
- **Transbordo:** indicação, dados do navio original, porto de transbordo
- **Integração Siscomex:** campos de sincronização e registro de erros

### 3.4 Averbações (Endorsements)

O módulo principal do sistema — emissão de averbações de seguro de carga.

**Fluxo de criação (Wizard de 5 etapas):**

1. **Informações Gerais** — Cliente, seguradora, período de vigência
2. **Seleção de Viagens** — Busca viagens do cliente no período, seleção múltipla
3. **Seleção de Containers** — Dentro das viagens selecionadas, escolha de containers
4. **Resumo e Cálculo** — Cálculo automático de prêmio por container usando parâmetros de seguro do cliente; exibe importância segurada e prêmio total
5. **Emissão** — Confirmação e registro final

**Campos financeiros calculados:**
- Importância segurada
- Prêmio base e comercial
- IOF (padrão 7,38%)
- Adicional de fracionamento
- Custo de apólice
- Prêmio total

**Status do workflow:** Pendente → Em Análise → Aprovado / Rejeitado / Cancelado

**Recursos adicionais:** recálculo, geração de PDF, upload de documentos, histórico de alterações

### 3.5 Clientes (Empresas)

Cadastro de empresas clientes com:

- Razão social, nome fantasia, CNPJ (validado), inscrição estadual
- Endereço completo (integração com API de CEP)
- Contatos (telefone, email)
- Filiais (subsidiárias com CNPJ próprio)
- Parâmetros de seguro por tipo de container (versionados com histórico)

### 3.6 Seguradoras

Cadastro de companhias seguradoras com:

- Dados cadastrais (nome, CNPJ, registro SUSEP)
- Contatos (múltiplos, com indicação de principal)
- Documentos (upload de arquivos)
- Estatísticas de uso
- Apólices vinculadas

### 3.7 Parâmetros de Seguro

Dois níveis de configuração de taxas:

**A) Parâmetros Gerais (`ParametrosSeguro`)**
- Taxas globais: seguro, prêmio, IOF
- Custo de apólice, adicional de fracionamento
- Valores mínimo e máximo de seguro
- Modal de transporte (Terrestre/Marítimo/Aéreo)
- Vigência (início/fim)
- **Criação em lote:** seleção de múltiplos tipos de container com atalhos rápidos (todos, 20 pés, 40 pés, por categoria)

**B) Parâmetros por Cliente (`ClienteContainerSeguro`)**
- Taxas específicas por cliente + tipo de container
- Versionamento (soft delete + versão numérica)
- Histórico completo de alterações
- Carência em dias, franquia

### 3.8 Usuários e Perfis

- CRUD completo de usuários (nome, email, CPF, telefone, foto)
- Perfis com conjuntos de permissões configuráveis
- Ativação/desativação de usuários
- Alteração de senha (própria e administrativa)
- Vínculo opcional com cliente (1:1)

### 3.9 Dashboard

Painel com métricas em tempo real (atualização a cada 30 segundos):

- Cards de KPIs (totais, ativos, por status)
- Gráficos de tendência
- Operações recentes
- Ações rápidas para as funcionalidades mais usadas

### 3.10 Busca Global

Sistema de busca full-text que pesquisa em todos os módulos:

- Busca rápida (autocomplete)
- Busca avançada com filtros
- Sugestões inteligentes
- Histórico de buscas
- Paginação nos resultados

### 3.11 Histórico de Alterações (Auditoria)

Registro completo de todas as operações do sistema:

- Tipo de ação (CREATE, UPDATE, DELETE)
- Usuário responsável
- Data/hora
- Dados anteriores e novos
- Filtragem e estatísticas

---

## 4. Banco de Dados

O sistema utiliza **PostgreSQL** hospedado no **Supabase**, com **Prisma ORM** para acesso ao banco.

### Principais Tabelas (30+)

| Categoria | Tabelas |
|-----------|---------|
| **Containers** | `container_registro`, `containers_tipo`, `container_trip`, `ce_container`, `container_track`, `container_eventos`, `tipo_evento`, `historico_eventos` |
| **Seguros** | `averbacoes`, `averbacao_container`, `apolice`, `parametros_seguro`, `cliente_container_seguro`, `fatura` |
| **Entidades** | `cliente`, `filial`, `seguradora`, `seguradora_contato`, `seguradora_documento`, `corretor` |
| **Usuários** | `usuario`, `perfil_usuario`, `permissoes`, `perfil_permissoes` |
| **Operacional** | `notificacoes`, `emails_enviados`, `templates_email`, `dashboards`, `relatorios`, `tarefas` |

### Convenções

- **Chaves primárias:** `idNomeTabela` (ex: `idContainerRegistro`, `idParametro`)
- **Soft deletes:** campo `deletedAt` + `deletedBy` (em `ClienteContainerSeguro`)
- **Versionamento:** campo `versao` para histórico de parâmetros
- **Valores monetários:** dual — centavos (inteiro) + decimal (Prisma Decimal)
- **Datas:** `dataCriacao`, `dataAtualizacao` com defaults automáticos
- **Status:** enums string (ex: `ativo`, `inativo`, `pendente`, `aprovada`)

---

## 5. Integrações

| Integração | Descrição | Status |
|-----------|-----------|--------|
| **Siscomex** | Importação de dados do sistema de comércio exterior brasileiro (CE Mercante, BL, dados de navio/porto) | Estrutura pronta, campos de sync no model |
| **Webhooks** | Rotas de webhook com autenticação por API Key e whitelist de IP | Definidas, não montadas no app.js |
| **MailerSend** | Envio de emails (boas-vindas, templates) | Funcional |
| **API de CEP** | Busca de endereço por CEP | Funcional |
| **Supabase** | Banco PostgreSQL hospedado | Funcional |

---

## 6. Segurança

| Recurso | Implementação |
|---------|---------------|
| **Autenticação** | JWT (24h access + 7d refresh) |
| **RBAC** | Perfis com permissões granulares por módulo/ação |
| **Rate Limiting** | Login: 5/15min, API: 1000/15min, Upload: 50/h, Busca: 30/min |
| **Validação** | CPF/CNPJ com algoritmo completo, email regex, sanitização XSS |
| **Auditoria** | Logger de requisições, operações DB, eventos de segurança |
| **Bloqueio de IP** | Auto-bloqueio quando limite é excedido em 2x |
| **Proteção de rotas** | Middleware `verifyToken` + `checkPermission` em todas as rotas protegidas |

---

## 7. Stack Tecnológico Completo

### Frontend

| Tecnologia | Uso |
|-----------|-----|
| Next.js 14.2 | Framework React com App Router |
| TypeScript 5.3 | Tipagem estática |
| Tailwind CSS | Estilização utility-first |
| NextAuth v4 | Autenticação (JWT + CredentialsProvider) |
| React Hook Form + Zod | Formulários + validação |
| Radix UI | Componentes acessíveis (Dialog, Select, etc.) |
| Lucide React | Ícones |
| Framer Motion + Lottie | Animações |
| jsPDF | Geração de PDF no cliente |
| react-hot-toast + Sonner | Notificações toast |
| next-themes | Tema claro/escuro |
| date-fns | Manipulação de datas |

### Backend

| Tecnologia | Uso |
|-----------|-----|
| Express.js 4.21 | Framework HTTP |
| Prisma 6.15 | ORM para PostgreSQL |
| jsonwebtoken | Geração e validação de JWT |
| bcryptjs | Hash de senhas |
| MailerSend | Envio de emails |
| Swagger/OpenAPI | Documentação automática de API |
| Jest 30 + Supertest | Testes unitários e de integração |

### Infraestrutura

| Recurso | Tecnologia |
|---------|-----------|
| Banco de dados | PostgreSQL (Supabase) |
| Deploy | AWS App Runner (Docker) |
| CI/CD | Docker + docker-compose |

---

## 8. Endpoints da API (Resumo)

A API REST possui **19 grupos de rotas** sob o prefixo `/api/`:

| Grupo | Prefixo | Descrição |
|-------|---------|-----------|
| Auth | `/auth` | Login, registro, refresh, perfil, senha |
| Containers | `/containers` | CRUD, busca, status, eventos, tracking |
| Tipos Container | `/containers/tipos` | Tipos, valores padrão, estatísticas |
| Viagens | `/trips` | CRUD, busca, por cliente, por CE, eventos, timeline |
| Averbações | `/averbacoes` | CRUD, workflow de status, cálculo, relatório, documentos |
| Clientes | `/clientes` | CRUD, filiais, busca por CNPJ |
| Seguradoras | `/seguradoras` | CRUD, contatos, documentos, stats |
| Parâmetros Seguro | `/parametros-seguro` | CRUD, batch, cálculo, parâmetros por cliente |
| Usuários | `/usuarios` | CRUD, status, senha |
| Perfis | `/perfis` | CRUD, sincronização de permissões |
| Permissões | `/permissoes` | CRUD, por módulo, por usuário |
| Portos | `/portos` | CRUD, busca, filtro por país |
| Tipos Evento | `/tipos-evento` | CRUD, por categoria |
| Dashboard | `/dashboard` | Stats, operações recentes |
| Histórico | `/historico` | Log de alterações, stats |
| Notificações | `/notificacoes` | Não lidas, marcar como lida |
| Upload | `/upload` | Upload de documentos |
| Busca | `/search` | Busca full-text global |
| Webhooks | `/webhooks` | Integração Siscomex (não montado) |

**Documentação interativa:** disponível em `http://localhost:8000/api-docs` (Swagger UI)

---

## 9. Fluxo Principal de Negócio

```
Cadastro de         Cadastro de          Configuração de
Containers   ──►    Viagens      ──►     Parâmetros de Seguro
     │                  │                       │
     │                  │                       │
     ▼                  ▼                       ▼
┌─────────────────────────────────────────────────────┐
│              WIZARD DE AVERBAÇÃO                     │
│                                                      │
│  1. Seleciona cliente + seguradora + período         │
│  2. Busca viagens do cliente no período              │
│  3. Seleciona containers das viagens                 │
│  4. Calcula prêmio por container (taxas × valor)     │
│  5. Emite averbação                                  │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
              Workflow de Aprovação
         (Pendente → Aprovada/Rejeitada)
                      │
                      ▼
              Dashboard com Métricas
```

---

## 10. Funcionalidades Pendentes (TODO/501)

| Funcionalidade | Status |
|---------------|--------|
| Recuperação de senha (forgot/reset) | Frontend pronto, backend retorna 501 |
| Aprovação/rejeição de averbações via API | Endpoint retorna 501 |
| Download/preview de documentos | Endpoint retorna 501 |
| Widgets e alertas do dashboard | Endpoints retornam 501 |
| Histórico de averbações via API | Endpoint retorna 501 |
| Montagem de rotas de webhook | Rotas definidas mas não montadas no app.js |
| Rate limiting persistente | Atualmente in-memory (perde estado ao reiniciar) |

---

*Documento gerado em Fevereiro/2026*
