# Agrônomo IA — Dashboard

Dashboard web (React + TypeScript + Vite + Tailwind CSS) para o Agrônomo IA:
- **Núcleo organizacional**: empresas, cooperados, fazendas, safras, cultivares, talhões e contratos
- **Monitoramento de campo**: inspeções, aplicações, histórico climático, análises de solo e fotografias

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
- `src/entities/configs.ts` — configuração declarativa de cada entidade: campos do formulário (`text`/`number`/`date`/`select`/`json`), colunas da tabela, referências de FK para selects (`optionsFrom`) e opções fixas para enums (`staticOptions`, ex: `tipo` de fotografia)
- `src/components/EntityCrudPage.tsx` — componente genérico de CRUD (listar/criar/editar/excluir) reutilizado por todas as entidades, resolvendo IDs de FK para o rótulo legível usando as listas referenciadas; campos `json` (ex: `nutrientes` de análises de solo) validam o JSON antes de enviar

Adicionar uma nova entidade = criar um `EntityConfig` em `entities/configs.ts`, uma rota em `App.tsx` e um item em `layout/AppShell.tsx` — não precisa de uma página nova por entidade.
