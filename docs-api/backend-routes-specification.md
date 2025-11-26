# Especificações das Rotas para Backend

Este documento contém as especificações detalhadas das rotas que precisam ser implementadas no backend para resolver os erros de JSON parsing no frontend.

## Base URL
```
http://localhost:3001
```

## Autenticação
Todas as rotas requerem autenticação via Bearer Token no header:
```
Authorization: Bearer {jwt_token}
```

---

## 1. Dashboard Stats

### `GET /api/dashboard/stats`

**Descrição:** Retorna estatísticas gerais do dashboard para exibição na página principal.

**Permissão Necessária:** `DASHBOARD_READ`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Query Parameters:** Nenhum

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Estatísticas do dashboard obtidas com sucesso",
  "data": {
    "totalAverbacoes": 1247,
    "averbacoesPendentes": 23,
    "averbacaoesAprovadas": 1156,
    "averbacaoesRejeitadas": 68,
    "containeresAtivos": 342,
    "containeresDisponiveis": 89,
    "containeresEmUso": 253,
    "valorTotalAverbado": 15750000.50,
    "taxaAprovacao": 94.5,
    "mediaTempoAprovacao": 2.3,
    "seguradoras": {
      "ativas": 15,
      "total": 18
    },
    "clientes": {
      "ativos": 67,
      "total": 72
    },
    "usuarios": {
      "ativos": 12,
      "total": 15
    }
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Campos da Resposta:**
- `totalAverbacoes` (number): Total de averbações no sistema
- `averbacoesPendentes` (number): Averbações aguardando aprovação
- `averbacaoesAprovadas` (number): Averbações aprovadas
- `averbacaoesRejeitadas` (number): Averbações rejeitadas
- `containeresAtivos` (number): Total de containers ativos
- `containeresDisponiveis` (number): Containers disponíveis para uso
- `containeresEmUso` (number): Containers atualmente em uso
- `valorTotalAverbado` (number): Valor total averbado em reais
- `taxaAprovacao` (number): Taxa de aprovação em porcentagem
- `mediaTempoAprovacao` (number): Tempo médio de aprovação em horas
- `seguradoras` (object): Estatísticas de seguradoras
- `clientes` (object): Estatísticas de clientes
- `usuarios` (object): Estatísticas de usuários

---

## 2. Notificações Não Lidas

### `GET /api/notificacoes/nao-lidas`

**Descrição:** Retorna lista de notificações não lidas do usuário autenticado.

**Permissão Necessária:** `NOTIFICATION_READ`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Query Parameters:**
- `usuarioId` (optional, number): ID do usuário (se não fornecido, usa o usuário autenticado)

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Notificações não lidas obtidas com sucesso",
  "data": [
    {
      "idNotificacao": 1,
      "titulo": "Nova averbação pendente",
      "mensagem": "A averbação #1234 está aguardando aprovação",
      "tipo": "AVERBACAO_PENDENTE",
      "prioridade": "alta",
      "lida": false,
      "dataCriacao": "2025-01-27T10:30:00.000Z",
      "usuarioId": 1,
      "dadosAdicionais": {
        "averbacaoId": 1234,
        "numeroContainer": "ABCD1234567"
      }
    }
  ],
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Tipos de Notificação:**
- `AVERBACAO_PENDENTE`: Averbação aguardando aprovação
- `AVERBACAO_APROVADA`: Averbação foi aprovada
- `AVERBACAO_REJEITADA`: Averbação foi rejeitada
- `CONTAINER_DISPONIVEL`: Container ficou disponível
- `DOCUMENTO_VENCIMENTO`: Documento próximo do vencimento
- `SISTEMA`: Notificações do sistema

**Prioridades:**
- `alta`: Notificação de alta prioridade
- `media`: Notificação de média prioridade
- `baixa`: Notificação de baixa prioridade

---

## 3. Estatísticas de Notificações

### `GET /api/notificacoes/stats`

**Descrição:** Retorna estatísticas detalhadas sobre notificações do usuário.

**Permissão Necessária:** `NOTIFICATION_READ`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Query Parameters:**
- `usuarioId` (optional, number): ID do usuário (se não fornecido, usa o usuário autenticado)

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Estatísticas de notificações obtidas com sucesso",
  "data": {
    "total": 47,
    "naoLidas": 3,
    "lidas": 44,
    "porTipo": {
      "AVERBACAO_PENDENTE": 12,
      "AVERBACAO_APROVADA": 18,
      "AVERBACAO_REJEITADA": 3,
      "CONTAINER_DISPONIVEL": 8,
      "DOCUMENTO_VENCIMENTO": 4,
      "SISTEMA": 2
    },
    "porPrioridade": {
      "alta": 7,
      "media": 23,
      "baixa": 17
    },
    "ultimasSemanas": [
      {
        "semana": "2025-01-20",
        "total": 8,
        "naoLidas": 1
      },
      {
        "semana": "2025-01-13",
        "total": 12,
        "naoLidas": 0
      }
    ],
    "tempoMedioLeitura": "2.5h",
    "taxaLeitura": 93.6
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Campos da Resposta:**
- `total` (number): Total de notificações
- `naoLidas` (number): Notificações não lidas
- `lidas` (number): Notificações lidas
- `porTipo` (object): Breakdown por tipo de notificação
- `porPrioridade` (object): Breakdown por prioridade
- `ultimasSemanas` (array): Dados das últimas 4 semanas
- `tempoMedioLeitura` (string): Tempo médio para leitura
- `taxaLeitura` (number): Taxa de leitura em porcentagem

---

## 4. Histórico de Alterações

### `GET /api/historico`

**Descrição:** Retorna histórico completo de alterações no sistema com paginação e filtros.

**Permissão Necessária:** `HISTORY_READ`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Query Parameters:**
- `page` (optional, number, default: 1): Página atual
- `limit` (optional, number, default: 10, max: 100): Itens por página
- `tipoAlteracao` (optional, string): Filtrar por tipo de alteração
- `usuarioId` (optional, number): Filtrar por usuário
- `entidade` (optional, string): Filtrar por entidade
- `dataInicio` (optional, string, format: YYYY-MM-DD): Data inicial
- `dataFim` (optional, string, format: YYYY-MM-DD): Data final

**Tipos de Alteração:**
- `CRIACAO`: Criação de registro
- `ATUALIZACAO`: Atualização de registro
- `EXCLUSAO`: Exclusão de registro
- `APROVACAO`: Aprovação de processo
- `REJEICAO`: Rejeição de processo

**Entidades:**
- `USUARIO`: Usuários
- `CLIENTE`: Clientes
- `CONTAINER`: Containers
- `AVERBACAO`: Averbações
- `SEGURADORA`: Seguradoras

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Histórico obtido com sucesso",
  "data": {
    "data": [
      {
        "idHistorico": 1,
        "tipoAlteracao": "CRIACAO",
        "entidade": "AVERBACAO",
        "entidadeId": 1234,
        "descricao": "Averbação criada para container ABCD1234567",
        "valorAnterior": null,
        "valorNovo": {
          "numeroContainer": "ABCD1234567",
          "valor": 150000.00,
          "seguradora": "Seguradora XYZ"
        },
        "usuario": {
          "idUsuario": 1,
          "nomeCompleto": "João Silva",
          "email": "joao@empresa.com"
        },
        "dataAlteracao": "2025-01-27T10:30:00.000Z",
        "ip": "192.168.1.100",
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "pages": 15
    }
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Campos da Resposta:**
- `idHistorico` (number): ID único do registro de histórico
- `tipoAlteracao` (string): Tipo da alteração realizada
- `entidade` (string): Entidade que foi alterada
- `entidadeId` (number): ID da entidade alterada
- `descricao` (string): Descrição da alteração
- `valorAnterior` (object|null): Valor antes da alteração
- `valorNovo` (object|null): Valor após a alteração
- `usuario` (object): Dados do usuário que fez a alteração
- `dataAlteracao` (string): Data e hora da alteração (ISO 8601)
- `ip` (string): Endereço IP de origem
- `userAgent` (string): User agent do navegador

---

## Respostas de Erro Padrão

### 401 - Unauthorized
```json
{
  "success": false,
  "message": "Token inválido ou expirado"
}
```

### 403 - Forbidden
```json
{
  "success": false,
  "message": "Acesso negado: permissão insuficiente"
}
```

### 500 - Internal Server Error
```json
{
  "success": false,
  "message": "Erro interno do servidor"
}
```

---

## Considerações de Implementação

### 1. Autenticação
- Todas as rotas devem validar o JWT token
- Verificar permissões específicas para cada endpoint
- Renovar token automaticamente em respostas bem-sucedidas

### 2. Performance
- Implementar cache para dados que não mudam frequentemente (stats)
- Usar índices apropriados no banco de dados
- Limitar resultados de histórico com paginação

### 3. Segurança
- Validar todos os parâmetros de entrada
- Sanitizar dados antes de retornar
- Registrar tentativas de acesso não autorizado

### 4. Logs
- Registrar todas as alterações no histórico
- Capturar IP e User Agent para auditoria
- Implementar logs de erro detalhados

### 5. Banco de Dados
Tabelas necessárias:
- `historico_alteracoes`: Para armazenar o histórico
- `notificacoes`: Para as notificações
- `dashboard_cache`: Para cache das estatísticas (opcional)

### 6. Exemplos de Consulta SQL

**Dashboard Stats:**
```sql
SELECT 
  COUNT(*) as total_averbacoes,
  COUNT(CASE WHEN status = 'pendente' THEN 1 END) as averbacoes_pendentes,
  COUNT(CASE WHEN status = 'aprovada' THEN 1 END) as averbacoes_aprovadas,
  SUM(valor) as valor_total_averbado
FROM averbacoes 
WHERE deleted_at IS NULL;
```

**Notificações Não Lidas:**
```sql
SELECT * FROM notificacoes 
WHERE usuario_id = ? AND lida = false 
ORDER BY data_criacao DESC;
```

**Histórico com Filtros:**
```sql
SELECT h.*, u.nome_completo, u.email 
FROM historico_alteracoes h
JOIN usuarios u ON h.usuario_id = u.id_usuario
WHERE h.data_alteracao BETWEEN ? AND ?
ORDER BY h.data_alteracao DESC
LIMIT ? OFFSET ?;
```

---

## Testes Recomendados

1. **Testes de Autenticação:**
   - Token válido
   - Token expirado
   - Token inválido
   - Sem token

2. **Testes de Permissão:**
   - Usuário com permissão adequada
   - Usuário sem permissão
   - Diferentes níveis de acesso

3. **Testes de Performance:**
   - Grandes volumes de dados
   - Consultas com filtros complexos
   - Cache funcionando corretamente

4. **Testes de Validação:**
   - Parâmetros inválidos
   - Valores fora do range
   - Injeção SQL

Este documento deve fornecer todas as informações necessárias para implementar as rotas no backend e resolver os erros de JSON parsing no frontend.