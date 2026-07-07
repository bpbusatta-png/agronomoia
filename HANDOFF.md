# Handoff — Agrônomo IA

Documento de transição do estado do projeto ao final desta sessão (2026-07-06). Cobre o que foi construído, como rodar tudo localmente, decisões técnicas relevantes e o que ainda falta.

## Visão geral

Plataforma de IA para monitoramento agrícola de cooperativas (pragas, doenças, plantas atípicas, NDVI, produtividade), com validação humana obrigatória em decisões críticas. Especificação completa em [docs/](docs/) (fase 0, arquitetura, schema, pipeline de dados).

Nesta sessão, o projeto foi do zero (só documentação) até três aplicações funcionais e testadas ponta a ponta: **backend**, **dashboard web** e **app mobile de campo**.

## Estrutura do repositório

```
backend/            FastAPI + SQLAlchemy + PostgreSQL/PostGIS
frontend/dashboard/  React + TypeScript + Vite + Tailwind CSS
mobile/app-campo/    React Native + Expo (offline-first)
infra/docker/        docker-compose.yml (alternativa não usada nesta máquina — ver abaixo)
docs/                Documentação de planejamento (fase 0, arquitetura, schema, pipeline)
```

Cada pasta (`backend/`, `frontend/dashboard/`, `mobile/app-campo/`) tem seu próprio `README.md` com detalhes de arquitetura interna. Este documento é o mapa de nível mais alto.

## Ambiente local desta máquina (fora do git)

Nenhum destes é instalado via gerenciador de pacotes do Windows nem precisa de admin recorrente — foram baixados como binários portáteis (zip/exe único) já que **Docker Desktop não funciona nesta máquina** (falta WSL2, e habilitá-lo exige elevação que não pôde ser concedida nesta sessão).

| Serviço | Caminho | Porta | Credenciais |
|---|---|---|---|
| PostgreSQL 16 + PostGIS 3.6 | `C:\Users\User\pgportable` | 5433 | `postgres` / `agronomo`, banco `agronomo_ia` |
| MinIO (storage S3-compatível) | `C:\Users\User\minioportable` | 9000 (API) / 9001 (console) | `minioadmin` / `minioadmin` |
| Python 3.12 | instalado via winget | — | — |
| Node.js LTS | instalado via winget | — | — |

Iniciar Postgres:
```
C:\Users\User\pgportable\pgsql\bin\pg_ctl.exe -D C:\Users\User\pgportable\data -l C:\Users\User\pgportable\server.log start
```
Iniciar MinIO:
```
C:\Users\User\minioportable\minio.exe server C:\Users\User\minioportable\data --address ":9000" --console-address ":9001"
```

Ambos já têm o schema/bucket aplicados (schema.sql rodado; bucket `agronomo-ia` é criado automaticamente pelo backend na inicialização).

## Rodando os 3 apps

Todos registrados em [.claude/launch.json](.claude/launch.json) (usável via ferramenta de preview do Claude Code). Comandos equivalentes manuais:

**Backend** (porta 8000):
```
cd backend
copy .env.example .env   # editar DATABASE_URL/SECRET_KEY — ver backend/README embutido no .env.example
.venv\Scripts\uvicorn main:app --reload
```

**Dashboard** (porta 5173):
```
cd frontend/dashboard
npm install
copy .env.example .env
npm run dev
```

**App mobile** (porta 8081 em modo web):
```
cd mobile/app-campo
npm install
copy .env.example .env
npx expo start --web
```

**Primeiro acesso**: rodar uma vez `backend/scripts/seed_admin.py` para criar os 5 papéis e o usuário `admin@agronomo.ia` / `troque-esta-senha`.

> `.env` de cada app **não está no git** (gitignored) e precisa ser recriado a partir do `.env.example` sempre que clonar/mudar de máquina.

## O que foi construído

### Backend (100% do schema.sql coberto)

- CRUD completo para as ~27 tabelas do schema, organizadas em 4 módulos de rotas (`nucleo.py`, `monitoramento.py`, `inteligencia.py`, `dados.py`) sobre um `crud_router` genérico (`api/routes/factory.py`) parametrizado por permissões de leitura/criação/edição/exclusão.
- **Autenticação JWT** (`/api/auth/login`, `/api/auth/refresh`) + **RBAC** por 5 papéis (`Administrador`, `Agronomo_RT`, `Tecnico_Campo`, `Cooperado`, `Consulta`) — detalhes exatos de quem pode escrever o quê no `README.md` raiz, seção "Autenticação e permissões".
- **Gate humano obrigatório** para plantas atípicas: toda ocorrência nasce `pendente_validacao`; só `POST /plantas-atipicas/{id}/validar` (Administrador/Agronomo_RT) valida, registrando em `validacoes_humanas`.
- **Logging de auditoria**: toda escrita emite log JSON estruturado em stdout.
- **Upload de arquivos**: `POST /api/uploads` (multipart) sobe para o MinIO local, valida tipo/tamanho.

### Dashboard web

- Login JWT + refresh automático, layout com navegação em seções (Núcleo / Monitoramento / Inteligência).
- **Um componente genérico** (`EntityCrudPage.tsx`) cobre CRUD de ~20 entidades via configuração declarativa (`entities/configs.ts`) — adicionar uma entidade nova não exige uma página nova.
- Tela dedicada só para Plantas Atípicas (`PlantasAtipicasPage.tsx`), com o botão "Validar" (ação extra fora do CRUD padrão).
- Fotografias: campo de tipo `file` no componente genérico sobe o arquivo para `POST /api/uploads` antes de criar/editar o registro, preservando o arquivo existente se nenhum novo for escolhido.
- **Testes automatizados**: Vitest + React Testing Library, 30 testes em `AuthContext`, `RequireAuth`, `EntityCrudPage` (o motor genérico — list/create/edit/delete/JSON/upload/erro), `PlantasAtipicasPage` (fluxo de validação) e `ReconhecimentoPage` (upload/classificação/erros). A API é mockada (`vi.mock('../lib/api', ...)`) — nenhum teste depende do backend rodando. `npm test` (usado no CI) ou `npm run test:watch`. Ver seção "Testes automatizados" no `frontend/dashboard/README.md`.
- **Reconhecimento por IA** (novo, ver README.md): página `ReconhecimentoPage.tsx` faz upload de foto para `POST /api/reconhecimento/classificar` e mostra a sugestão (tipo, nome, confiança) com atalho para criar a ocorrência correspondente. Novas entidades `plantas_daninhas_catalogo`/`ocorrencias_plantas_daninhas` (mesmo padrão de pragas/doenças) via `EntityCrudPage`.

### App mobile de campo

- Login JWT (mesmo backend), 11 telas: Talhões (leitura), Inspeções, Fotografias, Aplicações, Análises de Solo, Ocorrências de Pragas, Ocorrências de Doenças, Colheita, NDVI, Produtividade, Validação (plantas atípicas).
- **Offline-first de verdade**: cada cadastro grava local primeiro (SQLite nativo em iOS/Android; `localStorage` só no modo web, usado apenas para testar sem emulador) e sincroniza quando há conexão, com fila de reenvio automático em caso de falha.
- Camada genérica reaproveitada por 5 das 7 telas de cadastro: `reference_cache` (catálogos somente-leitura) e `local_queue` (fila offline) em `db.ts`, `syncQueue()` em `sync.ts`, `CachePickerModal.tsx` para seletores.
- **NDVI/Produtividade**: telas somente-leitura (mesmo papel `Tecnico_Campo` não tem permissão de escrita nessas entidades no backend) — buscam do servidor e cacheiam localmente para consulta offline, sem fila de sincronização (não há o que reenviar).
- **Validação de plantas atípicas**: busca ao vivo a lista de ocorrências `pendente_validacao` e permite decidir manter/eliminar (`POST /plantas-atipicas/{id}/validar`) — sem fila offline (a ação em si exige conexão); visível a todos os papéis, mas o backend rejeita com 403 quem não for Administrador/Agronomo_RT. Mesmo fluxo de decisão do dashboard web (`PlantasAtipicasPage.tsx`).
- Testado apenas via **Expo web** — não há emulador Android/iOS nesta máquina. Ver ressalvas abaixo.

## Decisões e obstáculos técnicos relevantes

- **Docker Desktop não funciona** (falta WSL2, habilitar exige elevação não disponível na sessão) → Postgres e MinIO rodam como binários portáteis, iniciados manualmente. O `docker-compose.yml` em `infra/docker/` existe como alternativa não testada nesta máquina.
- **`expo-secure-store` quebra no modo web** (SDK 57, erro `getValueWithKeyAsync is not a function`) → abstração em `tokenStorage.ts`/`db.ts` usa SecureStore/SQLite reais em iOS/Android e cai para `localStorage` só no web.
- **`expo-file-system` mudou a API principal na SDK 57** (classes síncronas `File`/`Directory` em vez de funções assíncronas) → usado o subpath `expo-file-system/legacy` para manter a API assíncrona mais simples.
- **Diálogo nativo de arquivo não é controlável por ferramentas de preview** → testes de upload de foto usaram injeção de `File` via `DataTransfer` no `<input type="file">` oculto que o `expo-image-picker` cria.
- **Bug real corrigido**: `syncPendingInspecoes`/`syncQueue` só reenviavam itens com status `pendente`; um item que falhasse uma vez (`erro`) nunca mais era reenviado. Corrigido para incluir `erro` no filtro de retry — testado derrubando o backend de propósito.
- **Bug real corrigido**: modal de formulário sem `max-height`/scroll travava o botão "Salvar" fora da área visível em formulários longos (10+ campos). Corrigido com `max-h-[90vh] overflow-y-auto`.
- **Bug real corrigido**: schema original tinha `plantas_atipicas_ocorrencias.validado_por NOT NULL` mas `status` com default `'pendente_validacao'` — contradição lógica (decidido com o usuário: `validado_por` virou opcional, só preenchido pelo endpoint de validação).
- **`backend/.env` some entre sessões** (git-ignorado, como esperado) — se o backend falhar ao subir com `ValidationError: database_url/secret_key Field required`, é só recriar com `copy .env.example .env` e ajustar `DATABASE_URL` para a instância Postgres portátil (porta 5433, usuário `postgres`/`agronomo`, banco `agronomo_ia`) e gerar um `SECRET_KEY` novo.
- **Startup do backend trava em "Waiting for application startup"** se o MinIO não estiver no ar — o `ensure_bucket()` do `@app.on_event("startup")` tenta conectar e demora bastante antes de desistir (mesmo estando dentro de um try/except). Suba o MinIO (`preview_start` "minio" ou o binário direto) antes do backend para evitar a espera.

## O que falta / próximos passos possíveis

- **Mobile**: histórico climático e modelos de IA só existem no dashboard web ainda (dado mais administrativo, sem uso de campo).
- **Testes automatizados**: backend tem suíte pytest (39 testes, `backend/tests/`) cobrindo login/refresh JWT, RBAC do núcleo organizacional, gate de validação humana de plantas atípicas, upload de arquivos e reconhecimento por IA (mockado, sem depender do MinIO/Anthropic rodando) — roda contra banco Postgres real separado (`agronomo_ia_test`) com isolamento por rollback de transação. Dashboard tem suíte Vitest + React Testing Library (30 testes, `frontend/dashboard/src/**/*.test.tsx`) cobrindo autenticação, rota protegida, o motor genérico de CRUD, o fluxo de validação humana e o reconhecimento por IA — API mockada, não depende do backend rodando. Ver seções "Testes automatizados" no `README.md` e em `frontend/dashboard/README.md`. Mobile segue sem testes automatizados; validação continua manual (Expo web).
- **CI/CD**: `.github/workflows/backend-tests.yml` roda a suíte pytest a cada push/PR em `main`/`master` (serviço `postgis/postgis:16-3.4`, schema aplicado via `psql`) e `.github/workflows/frontend-tests.yml` roda a suíte Vitest + build de produção do dashboard — ambos validados localmente simulando os mesmos passos antes de commitar. Ainda não há remote configurado neste repositório, então os workflows só vão rodar de fato quando o repo for publicado no GitHub. Mobile segue sem pipeline de CI (não tem testes automatizados ainda).
- **Storage em produção**: MinIO local funciona para dev; produção exigiria AWS S3/Cloudflare R2 real com URLs assinadas (hoje o bucket é público para simplificar o MVP local).
- **Emulador mobile real**: todo o app mobile foi validado via Expo web; testar em um dispositivo/emulador Android ou iOS de verdade ainda não foi feito.
- **ERP externo** (mencionado pelo usuário): núcleo organizacional hoje só recebe dados via CRUD manual; integração futura com ERP ainda não tem design (ver memória do projeto).

## Commits desta sessão (ordem cronológica)

```
3eb929e Estrutura inicial do repositorio Agronomo IA
97d8964 Adiciona schema.sql e esqueleto do backend FastAPI
d5647f4 Adiciona docker-compose para Postgres+PostGIS local
30263f8 Documenta setup local do banco sem Docker/WSL2
8e5d8b7 Adiciona models, schemas e CRUD do nucleo organizacional (Trilha A)
fb09868 Adiciona launch.json do backend e corrige carregamento do .env
9e57535 Adiciona autenticacao JWT, RBAC e logging de auditoria
e92574f Adiciona CRUD do monitoramento de campo (Trilha B)
4d64d56 Adiciona inteligencia especializada (Trilha B) com gate humano obrigatorio
4ccf7c1 Adiciona ultimas tabelas do schema: B0, Trilha C e Trilha D
d97281a Adiciona dashboard web (React + TypeScript + Tailwind)
d8e22bf Adiciona telas de monitoramento de campo ao dashboard
ef9eff2 Adiciona telas de inteligencia especializada ao dashboard
ce879ba Adiciona app mobile de campo (React Native + Expo)
ab155c2 Adiciona cadastro offline de inspecoes com fila de sincronizacao
994bc47 Adiciona upload de arquivos (MinIO) e fotografias offline no mobile
a9321a5 Adiciona aplicacoes, analises de solo e ocorrencias de pragas/doencas ao mobile
96570af Adiciona documento de handoff da sessao
3d939eb Adiciona upload de foto real ao formulario de Fotografias do dashboard
```
