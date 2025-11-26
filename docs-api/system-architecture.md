# 🏗️ Arquitetura do Sistema

## Visão Geral

O sistema de gestão de containers e averbações segue uma arquitetura em camadas baseada no padrão **Model-Service-Controller (MSC)**, garantindo separação de responsabilidades, manutenibilidade e escalabilidade.

## 📐 Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                      │
│                 React + Tailwind CSS                       │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/REST API
┌─────────────────────────▼───────────────────────────────────┐
│                    API GATEWAY                             │
│              Express.js + Middlewares                      │
│         (Auth, Rate Limit, Validation, Logging)            │
├─────────────────────────────────────────────────────────────┤
│                 CAMADA DE CONTROLE                         │
│                   Controllers                              │
│              (BaseController + Específicos)                │
├─────────────────────────────────────────────────────────────┤
│                 CAMADA DE SERVIÇO                          │
│                    Services                                │
│              (BaseService + Específicos)                   │
├─────────────────────────────────────────────────────────────┤
│                CAMADA DE REPOSITÓRIO                       │
│                  Repositories                              │
│              (BaseRepository + Específicos)                │
├─────────────────────────────────────────────────────────────┤
│                   CAMADA DE DADOS                          │
│              Prisma ORM + PostgreSQL                       │
│                  (Aiven Cloud)                             │
└─────────────────────────────────────────────────────────────┘
```

## 🛡️ Middlewares Implementados

### 🔐 Autenticação e Autorização (`auth.js`)
- **verifyToken**: Verificação de JWT tokens
- **checkRole**: Verificação de perfis de usuário
- **checkPermission**: Verificação de permissões específicas
- **checkAllPermissions**: Verificação de múltiplas permissões
- **optionalAuth**: Autenticação opcional
- **adminOnly**: Acesso restrito a administradores

### 🚦 Rate Limiting (`rate-limit.js`)
- **loginRateLimit**: 5 tentativas por 15 minutos
- **apiRateLimit**: 1000 requisições por 15 minutos
- **uploadRateLimit**: 50 uploads por hora
- **searchRateLimit**: 30 buscas por minuto
- **passwordResetRateLimit**: 3 tentativas por hora
- **dynamicRateLimit**: Limites baseados no perfil do usuário

### ✅ Validação (`validation.js`)
- **validateRequiredFields**: Validação de campos obrigatórios
- **validateEmail**: Validação de formato de email
- **validateCPF/CNPJ**: Validação de documentos brasileiros
- **validateDates**: Validação de intervalos de datas
- **validateEnum**: Validação de valores permitidos

### 📊 Logging (`logging.js`)
- **requestLogger**: Log de requisições HTTP
- **auditLogger**: Log de operações críticas
- **errorLogger**: Log de erros do sistema
- **performanceLogger**: Log de requisições lentas
- **securityLogger**: Log de eventos de segurança

## 🎯 Padrão MSC (Model-Service-Controller)

### 📋 Controllers
**Responsabilidade**: Gerenciar requisições HTTP, validações de entrada e respostas.

**Estrutura Base**: Todos os controllers herdam de `BaseController` que fornece:
- Métodos padronizados de resposta (`handleSuccess`, `handleError`)
- Operações CRUD básicas (`create`, `getById`, `update`, `delete`)
- Validação de campos obrigatórios
- Tratamento de erros padronizado

```javascript
class ContainerController extends BaseController {
    constructor() {
        super(containerService);
    }

    async createContainer(req, res) {
        try {
            this.validateRequiredFields(req.body, ["numero", "clienteId", "tipoId"]);
            const containerData = { ...req.body, usuarioId: req.user?.id };
            const container = await this.service.createContainer(containerData);
            return this.handleSuccess(res, container, "Container criado com sucesso", 201);
        } catch (error) {
            return this.handleError(res, error, "Erro ao criar container");
        }
    }
}
```

**Controllers Implementados**: `src/controllers/`
- `base.controller.js` - Classe base com operações comuns
- `auth.controller.js` - Autenticação e gestão de sessões
- `usuario.controller.js` - Gestão de usuários
- `cliente.controller.js` - Gestão de clientes
- `container.controller.js` - Gestão de containers
- `averbacao.controller.js` - Gestão de averbações
- `seguradora.controller.js` - Gestão de seguradoras
- `permissao.controller.js` - Gestão de permissões
- `dashboard.controller.js` - Dashboard e relatórios
- `upload.controller.js` - Upload de arquivos

### ⚙️ Services
**Responsabilidade**: Lógica de negócio, validações complexas e orquestração de operações.

**Estrutura Base**: Todos os services herdam de `BaseService` que fornece:
- Operações CRUD básicas
- Validações comuns
- Tratamento de erros padronizado

```javascript
class ContainerService extends BaseService {
    constructor() {
        super(containerRepository);
    }

    async createContainer(containerData) {
        try {
            await this.validateCreateData(containerData);
            
            // Verificar duplicação
            const existingContainer = await this.repository.findByNumber(containerData.numero);
            if (existingContainer) {
                throw new Error("Número do container já está em uso");
            }

            const novoContainer = await this.repository.create({
                ...containerData,
                status: "REGISTRADO",
                dataRegistro: new Date()
            });

            // Adicionar evento inicial
            await this.addEvent(novoContainer.id, {
                tipoEventoId: "REGISTRO",
                descricao: "Container registrado no sistema",
                dataEvento: new Date(),
                usuarioId: containerData.usuarioId
            });

            return novoContainer;
        } catch (error) {
            throw new Error(`Erro ao criar container: ${error.message}`);
        }
    }
}
```

**Services Implementados**: `src/services/`
- `base.service.js` - Classe base com operações comuns
- `usuario.service.js` - Lógica de usuários e autenticação
- `cliente.service.js` - Lógica de clientes
- `container.service.js` - Lógica de containers e rastreamento
- `averbacao.service.js` - Lógica de averbações
- `seguradora.service.js` - Lógica de seguradoras
- `permissao.service.js` - Lógica de permissões e controle de acesso

### 🗄️ Repositories
**Responsabilidade**: Acesso a dados, queries e operações de persistência.

**Estrutura Base**: Todos os repositories herdam de `BaseRepository` que fornece:
- Operações CRUD básicas com Prisma
- Queries padronizadas
- Tratamento de erros de banco

```javascript
class UsuarioRepository extends BaseRepository {
    constructor() {
        super('usuario');
    
    async findByEmail(email) {
        return await this.prisma.usuario.findUnique({
            where: { email },
            include: { 
                perfil: {
                    include: {
                        perfilPermissoes: {
                            include: {
                                permissao: true
                            }
                        }
                    }
                }
            }
        });
    }
}
```

**Repositories Implementados**: `src/repositories/`
- `base.repository.js` - Classe base com operações Prisma
- `usuario.repository.js` - Operações de usuários
- `cliente.repository.js` - Operações de clientes
- `container.repository.js` - Operações de containers
- `averbacao.repository.js` - Operações de averbações
- `seguradora.repository.js` - Operações de seguradoras
- `permissao.repository.js` - Operações de permissões

## 🗄️ Camada de Dados

### Prisma ORM
```javascript
// database.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
    errorFormat: 'pretty'
});
```

### PostgreSQL
- **Banco Principal**: Dados transacionais
- **Conexão**: Pool de conexões gerenciado pelo Prisma
- **Migrações**: Versionamento automático via Prisma Migrate

## 🔀 Fluxo de Dados

### Requisição Típica:
```
1. Cliente → HTTP Request
2. Express.js → Middlewares (Auth, Validation, Rate Limit)
3. Router → Controller específico
4. Controller → Service (lógica de negócio)
5. Service → Repository (acesso a dados)
6. Repository → Prisma → PostgreSQL
7. Resposta: PostgreSQL → Prisma → Repository → Service → Controller → Cliente
```

### Exemplo Prático - Criar Usuário:
```
POST /api/usuarios
├── Middleware: verificarToken
├── Middleware: validarDados
├── Controller: usuario.controller.criar()
├── Service: usuario.service.criar()
│   ├── Validação: email único
│   ├── Criptografia: senha
│   └── Repository: usuario.repository.criar()
└── Response: 201 Created
```

## 🔐 Segurança

### Autenticação
- **JWT Tokens**: Stateless authentication
- **Refresh Tokens**: Renovação automática
- **Bcrypt**: Hash de senhas

### Autorização
- **RBAC**: Role-Based Access Control
- **Permissões Granulares**: Por módulo e ação
- **Middleware de Verificação**: Em todas as rotas protegidas

### Validação
- **Input Sanitization**: Prevenção de XSS
- **SQL Injection**: Proteção via Prisma ORM
- **Rate Limiting**: Prevenção de ataques DDoS

## 📦 Estrutura de Pastas

```
src/
├── controllers/          # Camada de controle
│   ├── base.controller.js
│   ├── auth.controller.js
│   ├── usuario.controller.js
│   ├── cliente.controller.js
│   ├── container.controller.js
│   ├── averbacao.controller.js
│   ├── seguradora.controller.js
│   ├── permissao.controller.js
│   ├── dashboard.controller.js
│   ├── upload.controller.js
│   └── index.js
├── services/             # Camada de serviço
│   ├── base.service.js
│   ├── usuario.service.js
│   ├── cliente.service.js
│   ├── container.service.js
│   ├── averbacao.service.js
│   ├── seguradora.service.js
│   ├── permissao.service.js
│   └── index.js
├── repositories/         # Camada de repositório
│   ├── base.repository.js
│   ├── usuario.repository.js
│   ├── cliente.repository.js
│   ├── container.repository.js
│   ├── averbacao.repository.js
│   ├── seguradora.repository.js
│   ├── permissao.repository.js
│   └── index.js
├── middlewares/          # Middlewares
│   ├── auth.js
│   ├── validation.js
│   ├── logging.js
│   ├── rate-limit.js
│   └── index.js
├── routes/               # Definição de rotas
│   ├── auth.routes.js
│   ├── usuario.routes.js
│   ├── cliente.routes.js
│   ├── container.routes.js
│   ├── averbacao.routes.js
│   ├── seguradora.routes.js
│   ├── permissao.routes.js
│   ├── dashboard.routes.js
│   ├── upload.routes.js
│   └── index.js
├── config/               # Configurações
│   ├── database.js
│   ├── swagger.js
│   └── constants.js
└── utils/                # Utilitários
    ├── validators.js
    ├── helpers.js
    └── constants.js
```

## 🚀 Tecnologias e Dependências

### Backend Core
- **Node.js 20+**: Runtime JavaScript
- **Express.js**: Framework web
- **Prisma**: ORM para PostgreSQL
- **PostgreSQL**: Banco de dados (Aiven Cloud)

### Autenticação e Segurança
- **JWT**: JSON Web Tokens
- **bcryptjs**: Hash de senhas
- **CORS**: Cross-Origin Resource Sharing

### Documentação e Testes
- **Swagger/OpenAPI**: Documentação da API
- **Jest**: Framework de testes
- **Supertest**: Testes de integração HTTP

### Utilitários
- **dotenv**: Variáveis de ambiente
- **nodemon**: Hot reload em desenvolvimento

## 🔄 Fluxo de Desenvolvimento

### 1. Estrutura de Desenvolvimento
```
1. Criar/Atualizar Model (Prisma Schema)
2. Gerar Migration (prisma migrate)
3. Implementar Repository (acesso a dados)
4. Implementar Service (lógica de negócio)
5. Implementar Controller (HTTP handlers)
6. Definir Routes (endpoints)
7. Adicionar Middlewares (auth, validation)
8. Documentar API (Swagger)
9. Escrever Testes (Jest)
10. Deploy
```

### 2. Padrões de Código
- **Nomenclatura**: camelCase para variáveis/funções, PascalCase para classes
- **Estrutura**: Sempre usar try/catch em controllers
- **Validação**: Campos obrigatórios validados nos controllers
- **Logs**: Registrar operações importantes e erros
- **Documentação**: JSDoc para funções públicas

## 🛡️ Segurança Implementada

### Autenticação JWT
- Tokens com expiração configurável
- Refresh tokens para renovação
- Middleware de verificação em rotas protegidas

### Controle de Acesso (RBAC)
- Perfis de usuário (ADMIN, OPERADOR, CLIENTE, VISUALIZADOR)
- Permissões granulares por módulo
- Verificação de permissões em tempo real

### Rate Limiting
- Limites diferenciados por tipo de operação
- Proteção contra ataques de força bruta
- Bloqueio temporário de IPs suspeitos

### Validação de Dados
- Sanitização de inputs
- Validação de CPF/CNPJ
- Verificação de formatos de email e datas

## 📊 Monitoramento e Logs

### Sistema de Logs
- **Request Logger**: Todas as requisições HTTP
- **Error Logger**: Erros do sistema com stack trace
- **Security Logger**: Eventos de autenticação/autorização
- **Performance Logger**: Requisições lentas (>1000ms)
- **Audit Logger**: Operações críticas do sistema

### Métricas de Performance
- Tempo de resposta por endpoint
- Taxa de erro por operação
- Uso de recursos do sistema
- Estatísticas de rate limiting

## 🔧 Configuração e Deploy

### Variáveis de Ambiente
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=your_jwt_secret
DATABASE_URL=postgresql://user:pass@host:port/db
```

### Scripts NPM Disponíveis
- `npm start`: Produção
- `npm run dev`: Desenvolvimento
- `npm test`: Testes
- `npm run setup`: Setup completo do projeto
- `npm run db:migrate`: Executar migrations
- `npm run db:seed`: Popular banco com dados iniciais
- Facilita testes
- Flexibilidade na configuração

## 🧪 Testabilidade

### Unit Tests
- **Services**: Lógica de negócio isolada
- **Repositories**: Acesso a dados mockado
- **Controllers**: Validação de entrada/saída

### Integration Tests
- **API Endpoints**: Testes end-to-end
- **Database**: Transações reais
- **Authentication**: Fluxos completos

---

*Esta arquitetura garante um sistema robusto, escalável e de fácil manutenção, seguindo as melhores práticas de desenvolvimento backend.*