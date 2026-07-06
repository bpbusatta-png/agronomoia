# Agrônomo IA — Dashboard

Dashboard web (React + TypeScript + Vite + Tailwind CSS) para o núcleo organizacional do Agrônomo IA: empresas, cooperados, fazendas, safras, cultivares, talhões e contratos.

## Rodando localmente

```
npm install
cp .env.example .env   # ajustar VITE_API_URL se o backend não estiver em localhost:8000
npm run dev
```

Acesse http://localhost:5173. Requer o [backend](../../backend) rodando (com CORS liberado para `http://localhost:5173` em `backend/main.py`) e um usuário criado via `backend/scripts/seed_admin.py`.

## Arquitetura

- `src/auth/` — login (JWT via `/api/auth/login`), contexto de autenticação (`localStorage`) e proteção de rotas
- `src/lib/api.ts` — cliente Axios com injeção do token e renovação automática via refresh token em respostas 401
- `src/entities/configs.ts` — configuração declarativa de cada entidade (campos do formulário, colunas da tabela, referências de FK para selects)
- `src/components/EntityCrudPage.tsx` — componente genérico de CRUD (listar/criar/editar/excluir) reutilizado por todas as entidades, resolvendo IDs de FK para o rótulo legível usando as listas referenciadas

Adicionar uma nova entidade = criar um `EntityConfig` em `entities/configs.ts` e uma rota em `App.tsx` — não precisa de uma página nova por entidade.
