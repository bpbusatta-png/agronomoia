# Agrônomo IA — Dashboard

Dashboard web (React + TypeScript + Vite + Tailwind CSS) para o Agrônomo IA:
- **Núcleo organizacional**: empresas, cooperados, fazendas, safras, cultivares, talhões e contratos
- **Monitoramento de campo**: inspeções, aplicações, histórico climático, análises de solo e fotografias
- **Inteligência especializada**: catálogo/ocorrências de pragas e doenças, plantas atípicas (com validação humana obrigatória), NDVI, produtividade, colheita e modelos de IA

## Rodando localmente

```
npm install
cp .env.example .env   # ajustar VITE_API_URL se o backend não estiver em localhost:8000
npm run dev
```

Acesse http://localhost:5173. Requer o [backend](../../backend) rodando (com CORS liberado para `http://localhost:5173` em `backend/main.py`, e o [MinIO](../../README.md#armazenamento-de-arquivos-fotos) no ar para o upload de fotos funcionar) e um usuário criado via `backend/scripts/seed_admin.py`.

## Arquitetura

- `src/auth/` — login (JWT via `/api/auth/login`), contexto de autenticação (`localStorage`) e proteção de rotas
- `src/lib/api.ts` — cliente Axios com injeção do token e renovação automática via refresh token em respostas 401
- `src/entities/configs.ts` — configuração declarativa de cada entidade: campos do formulário (`text`/`number`/`date`/`select`/`json`/`boolean`/`file`), colunas da tabela, referências de FK para selects (`optionsFrom`) e opções fixas para enums (`staticOptions`, ex: `tipo` de fotografia)
- `src/components/EntityCrudPage.tsx` — componente genérico de CRUD (listar/criar/editar/excluir) reutilizado por todas as entidades, resolvendo IDs de FK para o rótulo legível usando as listas referenciadas; campos `json` (ex: `nutrientes` de análises de solo) validam o JSON antes de enviar; campos `file` (ex: `url_arquivo` de fotografias) sobem o arquivo para `POST /api/uploads` antes de montar o payload, e preservam o arquivo existente se nenhum novo for escolhido ao editar; aceita `renderExtraAction` para ações extras por linha além de Editar/Excluir
- `src/pages/PlantasAtipicasPage.tsx` — única tela que não é um `EntityCrudPage` puro: adiciona o botão "Validar" (gate humano obrigatório) que chama `POST /plantas-atipicas/{id}/validar`, restrito a Administrador/Agronomo_RT

Adicionar uma nova entidade = criar um `EntityConfig` em `entities/configs.ts`, uma rota em `App.tsx` e um item em `layout/AppShell.tsx` — não precisa de uma página nova por entidade.

## Testes automatizados

Suíte Vitest + React Testing Library (25 testes) cobrindo login/logout (`AuthContext`), o gate de rota autenticada (`RequireAuth`), o motor genérico de CRUD (`EntityCrudPage` — listar, criar, editar, excluir, validação de JSON, upload de arquivo, mensagens de erro) e o fluxo de validação humana (`PlantasAtipicasPage`). A API (`../lib/api`) é mockada em cada teste — nenhum teste depende do backend estar no ar.

```
npm test        # roda uma vez (usado no CI)
npm run test:watch   # modo watch, para desenvolvimento
```

Observação: os `<label>` do formulário genérico (`EntityCrudPage`) não têm `htmlFor`/`id` ligando ao input — os testes acham o campo pelo texto do label e navegam até o irmão (`input`/`select`/`textarea`) em vez de usar `getByLabelText`. Vale considerar adicionar essa associação por acessibilidade, não só para testes.

CI: `.github/workflows/frontend-tests.yml` roda essa suíte e o build de produção a cada push/pull request.
