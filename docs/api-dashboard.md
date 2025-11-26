# Documentação da API do Dashboard

## Endpoints

### GET /dashboard/stats

Retorna estatísticas gerais do sistema.

#### Resposta
```json
[
  {
    "name": "Containers em Trânsito",
    "value": "12",
    "icon": "TruckIcon",
    "color": "bg-blue-500",
    "description": "Containers atualmente em movimento"
  },
  {
    "name": "Operações Ativas",
    "value": "8",
    "icon": "GlobeAltIcon",
    "color": "bg-green-500",
    "description": "Operações em andamento"
  },
  {
    "name": "Tempo Médio",
    "value": "4.5 dias",
    "icon": "ClockIcon",
    "color": "bg-yellow-500",
    "description": "Tempo médio de entrega"
  },
  {
    "name": "Alertas",
    "value": "2",
    "icon": "ExclamationTriangleIcon",
    "color": "bg-red-500",
    "description": "Alertas que requerem atenção"
  }
]
```

### GET /dashboard/operations

Retorna a lista de operações recentes.

#### Resposta
```json
[
  {
    "id": 1,
    "container": "CONT123456",
    "origem": "Shanghai",
    "destino": "Santos",
    "status": "Em Trânsito",
    "data": "2024-03-20"
  },
  {
    "id": 2,
    "container": "CONT789012",
    "origem": "Rotterdam",
    "destino": "Rio de Janeiro",
    "status": "Aguardando Despacho",
    "data": "2024-03-19"
  },
  {
    "id": 3,
    "container": "CONT345678",
    "origem": "Los Angeles",
    "destino": "São Paulo",
    "status": "Em Trânsito",
    "data": "2024-03-18"
  }
]
```

### GET /dashboard/actions

Retorna as ações rápidas disponíveis no dashboard.

#### Resposta
```json
[
  {
    "name": "Nova Operação",
    "value": "Criar",
    "icon": "DocumentTextIcon",
    "color": "bg-blue-500"
  },
  {
    "name": "Relatório",
    "value": "Gerar",
    "icon": "ChartBarIcon",
    "color": "bg-green-500"
  },
  {
    "name": "Agenda",
    "value": "Ver",
    "icon": "CalendarIcon",
    "color": "bg-yellow-500"
  },
  {
    "name": "Financeiro",
    "value": "Acessar",
    "icon": "CurrencyDollarIcon",
    "color": "bg-purple-500"
  }
]
```

## Descrição dos Campos

### Stats
- `name`: Nome da estatística
- `value`: Valor numérico ou texto da estatística
- `icon`: Nome do ícone a ser usado (deve corresponder aos ícones do Heroicons)
- `color`: Classe CSS para a cor de fundo do ícone
- `description`: Descrição detalhada da estatística

### Operations
- `id`: Identificador único da operação
- `container`: Número do container
- `origem`: Cidade/porto de origem
- `destino`: Cidade/porto de destino
- `status`: Status atual da operação
- `data`: Data da operação no formato YYYY-MM-DD

### Actions
- `name`: Nome da ação
- `value`: Texto do botão/ação
- `icon`: Nome do ícone a ser usado (deve corresponder aos ícones do Heroicons)
- `color`: Classe CSS para a cor de fundo do ícone

## Ícones Disponíveis
Os ícones devem corresponder aos nomes dos componentes do Heroicons:
- TruckIcon
- GlobeAltIcon
- ClockIcon
- ExclamationTriangleIcon
- CurrencyDollarIcon
- DocumentTextIcon
- ChartBarIcon
- CalendarIcon

## Cores Disponíveis
As cores devem ser classes do Tailwind CSS:
- bg-blue-500
- bg-green-500
- bg-yellow-500
- bg-red-500
- bg-purple-500 