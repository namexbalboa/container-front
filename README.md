# Front App - Next.js com Autenticação

Este é um projeto de aplicação web front-end usando React.js e Next.js 15 com sistema de autenticação baseado em JWT, páginas protegidas e layout de dashboard.

## Tecnologias Utilizadas

- React.js (versão mais recente estável)
- Next.js 15
- NextAuth.js (versão mais recente estável)
- Tailwind CSS (versão mais recente estável)
- JWT para autenticação

## Pré-requisitos

- Node.js 18.x ou superior
- npm 9.x ou superior

## Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd front-app
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=sua_chave_secreta_nextauth
JWT_SECRET=sua_chave_secreta_jwt
NEXT_PUBLIC_API_URL=http://localhost:3001
```

4. Execute o projeto em modo de desenvolvimento:
```bash
npm run dev
```

O projeto estará disponível em `http://localhost:3000`.

## Estrutura do Projeto

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   └── login/
│   ├── (auth)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (public)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── auth/
│   │   ├── login-form.tsx
│   │   └── register-form.tsx
│   ├── dashboard/
│   │   ├── sidebar.tsx
│   │   ├── navbar.tsx
│   │   └── footer.tsx
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── card.tsx
│   └── shared/
│       ├── loading.tsx
│       └── error.tsx
├── lib/
│   ├── auth.ts
│   └── api.ts
├── types/
│   ├── auth.ts
│   └── api.ts
└── utils/
    ├── jwt.ts
    └── helpers.ts
```

## Funcionalidades

- Autenticação com JWT
- Páginas protegidas
- Layout de dashboard responsivo
- Sistema de navegação com sidebar
- Perfil do usuário
- Configurações
- Design moderno com Tailwind CSS

## Credenciais de Teste

Para testar a aplicação, use as seguintes credenciais:

- Email: teste@exemplo.com
- Senha: 123456

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria a versão de produção
- `npm start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Faça commit das suas alterações (`git commit -m 'Adiciona nova feature'`)
4. Faça push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes.