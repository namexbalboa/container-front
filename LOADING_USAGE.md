# Global Loading System - Guia de Uso

## Descrição
Sistema de loading global com animação Lottie do Container Ship durante as transições entre páginas.

## Componentes Criados

### 1. GlobalLoading
Componente que exibe a tela de loading com a animação.

### 2. LoadingProvider
Context provider que gerencia o estado de loading globalmente.

### 3. RouteLoadingMonitor
Monitora mudanças de rota e esconde o loading automaticamente.

### 4. LoadingLink
Wrapper do Link do Next.js que ativa o loading automaticamente.

## Como Usar

### Uso Automático em Links

Para ativar o loading automaticamente ao navegar, use o `LoadingLink` ao invés do `Link` padrão:

```tsx
import { LoadingLink } from "@/components/shared";

function MyComponent() {
  return (
    <LoadingLink href="/dashboard">
      Ir para Dashboard
    </LoadingLink>
  );
}
```

### Uso Manual com Hook

Para controlar o loading manualmente (em formulários, chamadas API, etc.):

```tsx
import { useLoading } from "@/contexts/LoadingContext";

function MyComponent() {
  const { showLoading, hideLoading } = useLoading();

  const handleSubmit = async () => {
    showLoading();
    try {
      await api.submit();
      // Navegação ou ação
    } finally {
      hideLoading();
    }
  };

  return <button onClick={handleSubmit}>Enviar</button>;
}
```

### Uso com Router Programático

```tsx
import { useRouter } from "next/navigation";
import { useLoading } from "@/contexts/LoadingContext";

function MyComponent() {
  const router = useRouter();
  const { showLoading } = useLoading();

  const handleNavigate = () => {
    showLoading();
    router.push("/destination");
    // O RouteLoadingMonitor vai esconder o loading automaticamente
  };

  return <button onClick={handleNavigate}>Navegar</button>;
}
```

## Características

- ✅ Animação Lottie do Container Ship
- ✅ Fade branco suave
- ✅ Detecção automática de mudanças de rota
- ✅ Suporte para navegação programática
- ✅ Ignora links externos e downloads
- ✅ Z-index alto (50) para ficar sobre todo conteúdo
- ✅ Transições suaves de entrada e saída

## Arquivos Criados

- `src/components/shared/GlobalLoading.tsx` - Componente visual
- `src/components/shared/GlobalLoadingWrapper.tsx` - Wrapper client component
- `src/components/shared/RouteLoadingMonitor.tsx` - Monitor de rotas
- `src/components/shared/LoadingLink.tsx` - Link com loading automático
- `src/contexts/LoadingContext.tsx` - Context e Provider
- `src/hooks/useRouteLoading.ts` - Hook customizado

## Configuração no Layout

O loading já está configurado no `src/app/layout.tsx` e funciona globalmente.
