# Correções do Frontend - Averbação Container IDs

## Problema Identificado

O frontend está enviando IDs de CeContainer como se fossem IDs de ContainerTrip, causando erro "Nenhum container encontrado".

**IDs enviados**: 120, 121, 122... (são idCeContainer)
**IDs esperados**: 22, 23, 24... (são idContainerTrip)

## Correção 1: Adicionar campo ceContainerIds ao tipo

**Arquivo**: `src/types/api.ts`

**Linha 504** - Adicionar após `containerTripIds`:

```typescript
export interface AverbacaoCreate {
    clienteId: number;
    seguradoraId?: number;
    apoliceId?: number;
    periodoInicio: string;
    periodoFim: string;
    containerTripIds?: number[];
    ceContainerIds?: number[];  // ← ADICIONAR ESTA LINHA
    observacoes?: string;
    numero?: string;
    valorMercadoriaTotal?: number;
    valorPremioTotal?: number;
    numeroContainer?: string;
}
```

## Correção 2: Enviar ceContainerIds no wizard

**Arquivo**: `src/app/(auth)/averbacoes/components/AverbacaoWizard.tsx`

**Linha 229** - Alterar de `containerTripIds` para `ceContainerIds`:

```typescript
// ANTES:
containerTripIds: wizardData.containerTrips.map((ct) => ct.idContainerTrip),

// DEPOIS:
ceContainerIds: wizardData.containerTrips.map((ct) => ct.idContainerTrip),
```

**Linha 235** (console.log) - Atualizar também:

```typescript
// ANTES:
console.log("🚀 Enviando averbação:", {
  totalContainerTripIds: payload.containerTripIds.length,
  valorMercadoriaTotal: payload.valorMercadoriaTotal,
  valorPremioTotal: payload.valorPremioTotal,
  primeiros10Ids: payload.containerTripIds.slice(0, 10)
});

// DEPOIS:
console.log("🚀 Enviando averbação:", {
  totalCeContainerIds: payload.ceContainerIds.length,
  valorMercadoriaTotal: payload.valorMercadoriaTotal,
  valorPremioTotal: payload.valorPremioTotal,
  primeiros10Ids: payload.ceContainerIds.slice(0, 10)
});
```

## Por que isso funciona?

1. **Step3SelectContainers.tsx linha 134**: Usa `idCeContainer` como `idContainerTrip` (intencional)
2. **Wizard coleta esses IDs** que são na verdade CeContainer IDs
3. **Backend agora aceita** `ceContainerIds` diretamente e valida contra a tabela `ce_container`
4. **Evita a busca falha** por ContainerTrip IDs que não existem

## Aplicar as mudanças

Faça as alterações manualmente nos 2 arquivos acima e teste novamente.
