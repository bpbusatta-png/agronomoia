# Handoff — Agrônomo IA

Documento de transição do estado do projeto (atualizado em 2026-07-07). Cobre o que foi construído, como rodar tudo localmente, decisões técnicas relevantes e o que ainda falta.

## Visão geral

Plataforma de IA para monitoramento agrícola de cooperativas (pragas, doenças, plantas daninhas, plantas atípicas, NDVI, produtividade), com validação humana obrigatória em decisões críticas e reconhecimento por IA de visão. Especificação completa em [docs/](docs/) (fase 0, arquitetura, schema, pipeline de dados).

O projeto foi do zero (só documentação) até três aplicações funcionais e testadas ponta a ponta — **backend**, **dashboard web** e **app mobile de campo** — todas com suíte de testes automatizados e CI própria.

## Estrutura do repositório

```
backend/            FastAPI + SQLAlchemy + PostgreSQL/PostGIS
frontend/dashboard/  React + TypeScript + Vite + Tailwind CSS
mobile/app-campo/    React Native + Expo (offline-first)
infra/docker/        docker-compose.yml (alternativa não usada nesta máquina — ver abaixo)
docs/                Documentação de planejamento (fase 0, arquitetura, schema, pipeline)
.github/workflows/   CI (GitHub Actions) — um workflow por app
```

Cada pasta (`backend/`, `frontend/dashboard/`, `mobile/app-campo/`) tem seu próprio `README.md` com detalhes de arquitetura interna. Este documento é o mapa de nível mais alto.

## Ambiente local desta máquina (fora do git)

Nenhum destes é instalado via gerenciador de pacotes do Windows nem precisa de admin recorrente — foram baixados como binários portáteis (zip/exe único) já que **Docker Desktop não funciona nesta máquina** (falta WSL2, e habilitá-lo exige elevação que não pôde ser concedida nesta sessão).

| Serviço | Caminho | Porta | Credenciais |
|---|---|---|---|
| PostgreSQL 16 + PostGIS 3.6 | `C:\Users\User\pgportable` | 5433 | `postgres` / `agronomo`, banco `agronomo_ia` (+ `agronomo_ia_test` para os testes do backend) |
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

Ambos já têm o schema/bucket aplicados (schema.sql rodado; bucket `agronomo-ia` é criado automaticamente pelo backend na inicialização — **suba o MinIO antes do backend**, ver ressalva abaixo).

## Rodando os 3 apps

Todos registrados em [.claude/launch.json](.claude/launch.json) (usável via ferramenta de preview do Claude Code). Comandos equivalentes manuais:

**Backend** (porta 8000):
```
cd backend
copy .env.example .env   # editar DATABASE_URL/SECRET_KEY/GEMINI_API_KEY — ver comentários no .env.example
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

### Backend (100% do schema.sql coberto + reconhecimento por IA)

- CRUD completo para as ~29 tabelas do schema (schema original + `plantas_daninhas_catalogo`/`ocorrencias_plantas_daninhas`), organizadas em módulos de rotas (`nucleo.py`, `monitoramento.py`, `inteligencia.py`, `dados.py`, `reconhecimento.py`) sobre um `crud_router` genérico (`api/routes/factory.py`) parametrizado por permissões de leitura/criação/edição/exclusão e por um hook `on_create` opcional.
- **Autenticação JWT** (`/api/auth/login`, `/api/auth/refresh`) + **RBAC** por 5 papéis (`Administrador`, `Agronomo_RT`, `Tecnico_Campo`, `Cooperado`, `Consulta`) — detalhes exatos de quem pode escrever o quê no `README.md` raiz, seção "Autenticação e permissões".
- **Gate humano obrigatório** para plantas atípicas: toda ocorrência nasce `pendente_validacao`; só `POST /plantas-atipicas/{id}/validar` (Administrador/Agronomo_RT) valida, registrando em `validacoes_humanas`.
- **Reconhecimento por IA** (`POST /api/reconhecimento/classificar`): classifica fotos (praga/doença/planta daninha/planta atípica) via API do Google Gemini (`core/ai_vision.py`), sem depender de modelo próprio treinado. Toda chamada é logada em `log_predicoes_ia`. Quando uma ocorrência é criada com `modelo_versao_id` + `fotografia_id` (ou seja, o técnico confirmou uma sugestão da IA), um hook grava automaticamente o valor **confirmado pelo humano** em `dataset_rotulos` — acumulando aos poucos um dataset real para um futuro modelo próprio, sem passo manual extra. Ver seção "Reconhecimento por IA" no `README.md` raiz.
- **Logging de auditoria**: toda escrita emite log JSON estruturado em stdout.
- **Upload de arquivos**: `POST /api/uploads` (multipart) sobe para o MinIO local, valida tipo/tamanho.

### Dashboard web

- Login JWT + refresh automático, layout com navegação em seções (Núcleo / Monitoramento / Inteligência).
- **Visual redesenhado** (`AppShell.tsx`): header verde com logo/título/avatar do usuário, sidebar branca com ícones ([lucide-react](https://lucide.dev/)) por item — reconstrução do estilo a partir de um mockup de referência enviado pelo usuário, adaptado às entidades reais do Agrônomo IA (não ao conceito literal do mockup). `HomePage.tsx` virou um dashboard de verdade: cards de estatística, ações rápidas e últimos registros, tudo calculado no cliente a partir dos endpoints existentes (sem endpoint de agregação novo).
- **Um componente genérico** (`EntityCrudPage.tsx`) cobre CRUD de ~22 entidades via configuração declarativa (`entities/configs.ts`) — adicionar uma entidade nova não exige uma página nova.
- Tela dedicada para Plantas Atípicas (`PlantasAtipicasPage.tsx`), com o botão "Validar" (ação extra fora do CRUD padrão).
- Tela dedicada de **Reconhecimento IA** (`ReconhecimentoPage.tsx`): upload de foto → sugestão (tipo/nome/confiança) → atalho para criar a ocorrência do tipo identificado.
- Fotografias: campo de tipo `file` no componente genérico sobe o arquivo para `POST /api/uploads` antes de criar/editar o registro, preservando o arquivo existente se nenhum novo for escolhido.

### App mobile de campo

- Login JWT (mesmo backend), 14 telas: Talhões (leitura), Reconhecimento IA, Inspeções, Fotografias, Aplicações, Análises de Solo, Ocorrências de Pragas, Ocorrências de Doenças, Ocorrências de Plantas Daninhas, Plantas Atípicas (cadastro), Colheita, NDVI, Produtividade, Validação (plantas atípicas).
- **Offline-first de verdade**: cada cadastro grava local primeiro (SQLite nativo em iOS/Android; `localStorage` só no modo web, usado apenas para testar sem emulador) e sincroniza quando há conexão, com fila de reenvio automático em caso de falha.
- Camada genérica reaproveitada pela maioria das telas de cadastro: `reference_cache` (catálogos somente-leitura) e `local_queue` (fila offline) em `db.ts`, `syncQueue()` em `sync.ts`, `CachePickerModal.tsx` para seletores.
- **NDVI/Produtividade**: telas somente-leitura (mesmo papel `Tecnico_Campo` não tem permissão de escrita nessas entidades no backend) — buscam do servidor e cacheiam localmente para consulta offline, sem fila de sincronização (não há o que reenviar).
- **Validação de plantas atípicas**: busca ao vivo a lista de ocorrências `pendente_validacao` e permite decidir manter/eliminar (`POST /plantas-atipicas/{id}/validar`) — sem fila offline (a ação em si exige conexão); visível a todos os papéis, mas o backend rejeita com 403 quem não for Administrador/Agronomo_RT. Mesmo fluxo de decisão do dashboard web.
- **Reconhecimento IA**: tira/escolhe foto, chama `POST /api/reconhecimento/classificar` (sem fila offline — precisa de conexão com a API de IA) e mostra a sugestão com um botão que pula direto para a aba de cadastro do tipo identificado (`onIrParaTab`, prop vinda de `App.tsx`, que só troca o estado de aba local). Reaproveita `buildFotoFormData()` (exportado de `sync.ts`) para montar o multipart a partir da URI da foto.
- Testado via **Expo web** e via **Expo Go num Android físico** (SDK 54, ver ressalvas abaixo). iOS ainda não testado.
- **Visual alinhado ao redesign do dashboard**: cabeçalho verde fixo em `App.tsx` (logo + "Agrônomo IA" + subtítulo + avatar com iniciais do `userEmail` + botão de logout) e barra de abas inferior com ícones `MaterialCommunityIcons` (`@expo/vector-icons`) além do texto — mesma linguagem visual do `AppShell.tsx` do dashboard. O botão de logout que existia só em `TalhoesScreen` foi removido dali (duplicado) e centralizado no cabeçalho global. Todas as 14 telas tiveram `paddingTop` reduzido de `56` para `16` (o cabeçalho global agora cobre o espaço da status bar, que antes cada tela compensava sozinha).

## Testes automatizados e CI

Os 3 apps têm suíte de testes e workflow de CI próprio (`.github/workflows/`), validados localmente antes de cada commit. **Sem remote configurado neste repositório ainda** — os workflows só disparam de fato quando o repo for publicado no GitHub.

| App | Framework | Testes | O que cobre | CI |
|---|---|---|---|---|
| Backend | pytest | 39 | login/refresh JWT, RBAC do núcleo organizacional, gate de validação humana, upload de arquivos, reconhecimento por IA (mockado) — roda contra `agronomo_ia_test` real com isolamento por rollback de transação | `.github/workflows/backend-tests.yml` |
| Dashboard | Vitest + React Testing Library | 38 | `AuthContext` (incluindo `userEmail`), `RequireAuth`, `EntityCrudPage` (motor genérico de CRUD), `PlantasAtipicasPage`, `ReconhecimentoPage`, `HomePage` (dashboard inicial) — API mockada | `.github/workflows/frontend-tests.yml` |
| Mobile | Jest + React Native Testing Library | 47 | `db.ts` (cache/fila genéricos), `sync.ts` (retry pendente+erro, upload em dois passos), `api.ts` (interceptors via `axios-mock-adapter`), `AuthContext` (incluindo `userEmail`), `ColheitaScreen`, `ReconhecimentoScreen` — `Platform.OS` forçado para `'web'` no setup | `.github/workflows/mobile-tests.yml` |

Detalhes e comandos (`npm test`, `pytest`, etc.) na seção "Testes automatizados" de cada `README.md`.

## Decisões e obstáculos técnicos relevantes

- **Docker Desktop não funciona** (falta WSL2, habilitar exige elevação não disponível na sessão) → Postgres e MinIO rodam como binários portáteis, iniciados manualmente. O `docker-compose.yml` em `infra/docker/` existe como alternativa não testada nesta máquina.
- **`expo-secure-store` quebra no modo web** (SDK 57, erro `getValueWithKeyAsync is not a function`) → abstração em `tokenStorage.ts`/`db.ts` usa SecureStore/SQLite reais em iOS/Android e cai para `localStorage` só no web.
- **`expo-file-system` mudou a API principal na SDK 57** (classes síncronas `File`/`Directory` em vez de funções assíncronas) → usado o subpath `expo-file-system/legacy` para manter a API assíncrona mais simples.
- **Diálogo nativo de arquivo não é controlável por ferramentas de preview** → testes de upload de foto usaram injeção de `File` via `DataTransfer` no `<input type="file">` oculto que o `expo-image-picker` cria.
- **Bug real corrigido**: `syncPendingInspecoes`/`syncQueue` só reenviavam itens com status `pendente`; um item que falhasse uma vez (`erro`) nunca mais era reenviado. Corrigido para incluir `erro` no filtro de retry — testado derrubando o backend de propósito, e hoje coberto por teste automatizado (guarda de regressão) tanto no backend quanto no mobile.
- **Bug real corrigido**: modal de formulário sem `max-height`/scroll travava o botão "Salvar" fora da área visível em formulários longos (10+ campos). Corrigido com `max-h-[90vh] overflow-y-auto`.
- **Bug real corrigido**: schema original tinha `plantas_atipicas_ocorrencias.validado_por NOT NULL` mas `status` com default `'pendente_validacao'` — contradição lógica (decidido com o usuário: `validado_por` virou opcional, só preenchido pelo endpoint de validação).
- **`backend/.env` some entre sessões** (git-ignorado, como esperado) — se o backend falhar ao subir com `ValidationError: database_url/secret_key Field required`, é só recriar com `copy .env.example .env` e ajustar `DATABASE_URL` para a instância Postgres portátil (porta 5433, usuário `postgres`/`agronomo`, banco `agronomo_ia`), gerar um `SECRET_KEY` novo e (opcional) `GEMINI_API_KEY` para o reconhecimento por IA funcionar de verdade.
- **Startup do backend trava em "Waiting for application startup"** se o MinIO não estiver no ar — o `ensure_bucket()` do `@app.on_event("startup")` tenta conectar e demora bastante antes de desistir (mesmo estando dentro de um try/except). Suba o MinIO antes do backend para evitar a espera.
- **Reconhecimento por IA trocou de provider**: a primeira versão usava a API da Anthropic (Claude), mas o usuário não queria pagar créditos de API separados da assinatura de chat (são produtos/faturamentos diferentes — não dá pra usar o crédito de uma assinatura Claude.ai/Claude Code em chamadas de API). Trocado para a API do Google Gemini, que tem cota gratuita (`GEMINI_API_KEY`, gerar em https://aistudio.google.com/apikey). `core/ai_vision.py` isola toda a lógica do provider — trocar de novo no futuro exigiria só reescrever esse arquivo (mesma assinatura de função `classificar_imagem`), sem tocar em rotas/testes/frontend.
- **`gemini-2.0-flash` tem cota gratuita zerada** para a conta/chave usada nesta sessão (erro `429 RESOURCE_EXHAUSTED`, `limit: 0` para os dois quotas de free tier) — trocado para `gemini-2.5-flash` (`GEMINI_VISION_MODEL`), que funcionou. Testado de ponta a ponta com uma chave real: classificação, log em `log_predicoes_ia` e resposta corretas — inclusive reconhecendo corretamente que uma imagem sintética (não-foto) não permitia triagem, em vez de alucinar um diagnóstico.
- **`@testing-library/react-native` v14 (SDK 57/React 19) mudou comportamento de forma não-óbvia**: `render()`, `renderHook()` e todo `fireEvent.*` (`.press`, `.changeText`) agora retornam `Promise` — esquecer o `await` não dá erro, só produz estado desatualizado nas asserções seguintes (falha silenciosa/confusa, não um erro claro). Também não existe mais `UNSAFE_getByType`/`getAllByType`; sem `accessibilityLabel` nos campos, a única forma confiável de mirar um `TextInput` específico é `testID` explícito.
- **Mobile em dispositivo físico exigiu baixar o SDK do Expo duas vezes**: testado via Expo Go num Android real (não só Expo web). Primeiro erro: "Project is incompatible with this version of Expo Go" no SDK 57 — o app da Play Store ainda não suporta esse SDK. Atualizar o Expo Go não resolveu (o app da loja simplesmente não tinha suporte a 57 ainda). Rebaixado para SDK 56 → mesmo erro idêntico mesmo após reiniciar o servidor (sinal de que não era timing/cache). O usuário então informou que o Expo Go instalado é da geração de **SDK 54** — rebaixado para `54.0.35` (`npx expo install expo@54.0.35 && npx expo install --fix`, seguido de `rm -rf node_modules package-lock.json && npm install` pra evitar conflitos de resolução parcial do npm) e conectou. `expo-file-system/legacy` (workaround do SDK 57) continua existindo no 54, sem precisar mudar nada nas telas. Os 44 testes do mobile passaram sem alteração em todas as versões testadas (57/56/54) — só ficaram mais lentos no primeiro run após cada troca de dependências (cache frio, não regressão real). Para conectar um dispositivo físico: `--host 0.0.0.0` no uvicorn (já default em `.claude/launch.json`) + `mobile-app-campo-device` (novo, roda `expo start --lan` em vez de `--web`) + `EXPO_PUBLIC_API_URL` do mobile apontando pro IP LAN da máquina (não `localhost`) + Expo Go conectando em `exp://<ip-lan>:8081`.

## O que falta / próximos passos possíveis

- **Mobile**: histórico climático e modelos de IA só existem no dashboard web ainda (dado mais administrativo, sem uso de campo).
- **iOS real**: mobile testado em Expo web e num Android físico via Expo Go; iOS ainda não testado (sem dispositivo/máquina Mac disponível nesta sessão).
- **Storage em produção**: MinIO local funciona para dev; produção exigiria AWS S3/Cloudflare R2 real com URLs assinadas (hoje o bucket é público para simplificar o MVP local).
- **Dataset de reconhecimento por IA ainda é pequeno**: o acúmulo híbrido em `dataset_rotulos` começou a rodar nesta sessão — ainda não há volume suficiente para considerar treinar um modelo próprio (ver checklist em [docs/02-trilha-b-inteligencia/pipeline-dados-rotulagem.md](docs/02-trilha-b-inteligencia/pipeline-dados-rotulagem.md)).
- **Acessibilidade do dashboard**: `<label>` dos formulários (`EntityCrudPage.tsx`, `LoginPage.tsx`) não têm `htmlFor`/`id` ligando ao input — sinalizado como tarefa separada (ver chip de sugestão gerado durante a sessão).
- **CI ainda não roda de verdade**: os 3 workflows (`backend-tests.yml`, `frontend-tests.yml`, `mobile-tests.yml`) existem e foram validados localmente, mas só disparam quando o repositório for publicado num remote do GitHub (ainda não configurado).
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
1f763e4 Atualiza HANDOFF.md com upload de foto no dashboard
8c6f365 Adiciona suite de testes automatizados pytest ao backend
12c806d Adiciona telas de Colheita, NDVI, Produtividade e Validacao ao mobile
09f9b13 Adiciona CI para rodar a suite pytest do backend a cada push/PR
03492bd Adiciona testes automatizados (Vitest) ao dashboard e CI para eles
b2306a6 Adiciona reconhecimento por IA (pragas/doencas/plantas daninhas/atipicas)
2728335 Adiciona Reconhecimento IA e telas de plantas daninhas/atipicas no mobile
c3f891f Loga a excecao real quando a classificacao por IA falha
47b55d5 Troca o provider de reconhecimento por IA de Anthropic para Gemini
27d3879 Corrige modelo padrao do Gemini para gemini-2.5-flash
9717c21 Adiciona testes automatizados (Jest) ao mobile e CI para eles
```
