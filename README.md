# Agrônomo IA

Plataforma de inteligência artificial para monitoramento agrícola de cooperativas — pragas, doenças, plantas atípicas, NDVI e produtividade, com validação humana obrigatória em decisões críticas.

## Estrutura do repositório

```
agronomo-ia/
├── backend/
│   ├── api/                   # endpoints REST/GraphQL
│   ├── agentes/                # Trilha A — orquestrador e agentes de domínio
│   │   ├── mestre/             # A4 / A9 — orquestrador
│   │   ├── cadastro/           # A3
│   │   ├── geografico/         # A5
│   │   ├── contratos/          # A6
│   │   └── relatorios/         # A7
│   ├── inteligencia/           # Trilha B — um módulo por agente especializado
│   │   ├── monitoramento/      # B1
│   │   ├── ndvi/               # B2
│   │   ├── produtividade/      # B3
│   │   ├── pragas/              # B4
│   │   ├── doencas/            # B5
│   │   └── plantas_atipicas/   # B6
│   ├── confiabilidade/         # Trilha C — validação humana, auditoria
│   ├── db/
│   │   ├── migrations/
│   │   └── schema.sql          # ver docs/01-trilha-a-plataforma/schema-banco-de-dados.md
│   └── core/                   # autenticação, permissões, logging
├── frontend/
│   └── dashboard/               # A8 — Dashboard Gerencial
├── mobile/
│   └── app-campo/               # Trilha D — app de campo offline-first
├── ml/
│   ├── dataset/                 # B0 — ver docs/02-trilha-b-inteligencia/pipeline-dados-rotulagem.md
│   ├── treino/
│   └── modelos/
├── infra/
│   ├── docker/
│   └── terraform/
└── docs/
    ├── 00-fundacao/              # equipe, orçamento, KPIs, compliance, escopo do MVP
    ├── 01-trilha-a-plataforma/   # arquitetura base e schema de banco de dados
    └── 02-trilha-b-inteligencia/ # pipeline de dados e rotulagem
```

## Stack tecnológica

| Camada | Tecnologia |
|---|---|
| Backend / API | Python (FastAPI) |
| Banco de dados | PostgreSQL + PostGIS |
| Armazenamento de arquivos | Object storage compatível com S3 |
| Fila / processamento assíncrono | Redis + Celery |
| Frontend (dashboard web) | React + TypeScript |
| App mobile de campo | Flutter ou React Native (SQLite local + sincronização) |

Detalhes completos em [docs/01-trilha-a-plataforma/arquitetura-base.md](docs/01-trilha-a-plataforma/arquitetura-base.md).

## Rodando o backend localmente

### Banco de dados

**Opção A — Docker (`infra/docker/docker-compose.yml`)**: requer Docker Desktop com WSL2 habilitado.
```
cd infra/docker
docker compose up -d
```

**Opção B — PostgreSQL portátil (sem Docker/WSL2)**: usada nesta máquina, já que o WSL2 não está disponível. PostgreSQL 16 + PostGIS 3.6 foram extraídos (zip, sem instalador/serviço) em `C:\Users\User\pgportable`, fora do repositório.

Iniciar o servidor (porta 5433):
```
C:\Users\User\pgportable\pgsql\bin\pg_ctl.exe -D C:\Users\User\pgportable\data -l C:\Users\User\pgportable\server.log start
```
Parar o servidor:
```
C:\Users\User\pgportable\pgsql\bin\pg_ctl.exe -D C:\Users\User\pgportable\data stop
```
Usuário `postgres`, senha `agronomo`, banco `agronomo_ia` — já criado e com o `backend/db/schema.sql` aplicado (tabelas + extensões `postgis`/`pgcrypto`).

### Armazenamento de arquivos (fotos)

MinIO (compatível com S3, self-hosted) rodando localmente em `C:\Users\User\minioportable`, mesmo padrão do Postgres portátil (binário único, sem instalador).

Iniciar:
```
C:\Users\User\minioportable\minio.exe server C:\Users\User\minioportable\data --address ":9000" --console-address ":9001"
```
Credenciais padrão `minioadmin`/`minioadmin` (aceitável para dev local — trocar via `MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD` em produção). O backend cria o bucket `agronomo-ia` automaticamente na inicialização (com política de leitura pública, para as URLs retornadas funcionarem direto — em produção com S3/R2 real, usar URLs assinadas).

### API

```
cd backend
.venv\Scripts\activate
copy .env.example .env   # ajustar DATABASE_URL conforme a opção de banco escolhida acima
uvicorn main:app --reload
```
`GET /api/health` deve responder `200 {"status":"ok"}` com o banco no ar.

### Testes automatizados (backend)

Suíte pytest cobrindo autenticação/JWT, RBAC e o gate de validação humana de plantas atípicas, rodando contra um banco Postgres real (mesma instância portátil, banco separado) com isolamento por transação (cada teste faz rollback ao final — não precisa recriar o schema entre execuções).

Criar o banco de testes uma vez:
```
C:\Users\User\pgportable\pgsql\bin\createdb.exe -h 127.0.0.1 -p 5433 -U postgres agronomo_ia_test
C:\Users\User\pgportable\pgsql\bin\psql.exe -h 127.0.0.1 -p 5433 -U postgres -d agronomo_ia_test -f backend\db\schema.sql
```

Instalar dependências de teste e rodar:
```
cd backend
.venv\Scripts\activate
pip install -r requirements-dev.txt
pytest
```
Por padrão os testes usam `agronomo_ia_test` na porta 5433 (mesmo servidor portátil do dev); para apontar para outro banco, defina `TEST_DATABASE_URL` antes de rodar.

**CI**: `.github/workflows/backend-tests.yml` roda essa mesma suíte a cada push/pull request (serviço Postgres com PostGIS via container, schema aplicado com `psql`).

### Primeiro acesso (seed)

Como a criação de usuários exige um Administrador autenticado, rode uma vez em um banco novo:
```
cd backend
.venv\Scripts\python scripts\seed_admin.py
```
Cria os 5 papéis (`Administrador`, `Agronomo_RT`, `Tecnico_Campo`, `Cooperado`, `Consulta`) e o usuário `admin@agronomo.ia` / `troque-esta-senha` (troque a senha em produção).

### Dashboard (frontend)

```
cd frontend/dashboard
npm install
cp .env.example .env
npm run dev
```
Acesse http://localhost:5173 — login com o usuário criado pelo seed. Detalhes em [frontend/dashboard/README.md](frontend/dashboard/README.md).

### App de campo (mobile)

```
cd mobile/app-campo
npm install
cp .env.example .env
npx expo start
```
Escaneie o QR code com o Expo Go (Android/iOS) ou pressione `w` para abrir no navegador. Primeira leva: login + lista de talhões (somente leitura), com cache local. Detalhes em [mobile/app-campo/README.md](mobile/app-campo/README.md).

## Autenticação e permissões

- **JWT**: `POST /api/auth/login` (form `username`/`password`, padrão OAuth2) retorna `access_token` (30 min) + `refresh_token` (7 dias). `POST /api/auth/refresh` renova o par a partir do refresh token.
- **RBAC**: todo endpoint exige autenticação (`Authorization: Bearer <token>`). Leitura (`GET`) é liberada a qualquer papel autenticado. Escrita (`POST`/`PUT`/`DELETE`):
  - `papeis`/`usuarios`: `Administrador`
  - `cooperados`/`empresas`/`fazendas`/`safras`/`cultivares`/`talhoes`/`contratos`/`historico-climatico`/`modelos-versoes`/`pragas-catalogo`/`doencas-catalogo`/`ndvi-leituras`/`produtividade-estimativas`: `Administrador` ou `Agronomo_RT`
  - `inspecoes`/`aplicacoes`/`analises-solo`/`fotografias`/`colheita`: `Administrador`, `Agronomo_RT` ou `Tecnico_Campo`
  - `ocorrencias-pragas`/`ocorrencias-doencas`/`ocorrencias-plantas-daninhas`/`plantas-atipicas`: `Tecnico_Campo` pode **criar** (`POST`); editar/excluir fica restrito a `Administrador`/`Agronomo_RT` — reflete "técnico cadastra, sem poder de validação final" ([arquitetura-base.md](docs/01-trilha-a-plataforma/arquitetura-base.md))
  - `plantas-daninhas-catalogo`: `Administrador` ou `Agronomo_RT` (mesmo padrão de `pragas-catalogo`/`doencas-catalogo`)
  - `dataset-rotulos`: `Tecnico_Campo`/`Agronomo_RT`/`Administrador` rotulam; só `Administrador`/`Agronomo_RT` revisam (`revisado_por`, via `PUT`)
  - `log-predicoes-ia`: imutável (sem `PUT`/`DELETE`), escrita e leitura restritas a `Administrador`/`Agronomo_RT`
  - `consentimentos-lgpd`: dado pessoal sensível — gestão e leitura exclusivas de `Administrador`
  - `sincronizacao-log`: qualquer papel autenticado pode registrar sua própria sincronização (`usuario_id` do token); sem `DELETE`; leitura/ajuste de conflito restritos a `Administrador`/`Agronomo_RT`
  - `uploads`: `Administrador`, `Agronomo_RT` ou `Tecnico_Campo` (mesmo papel de quem cria fotografias); imagens até 15 MB (`jpeg`/`png`/`webp`/`heic`)
  - `reconhecimento/classificar`: `Administrador`, `Agronomo_RT` ou `Tecnico_Campo` (mesmo papel de `uploads`) — ver seção "Reconhecimento por IA" abaixo
- Em `inspecoes`, `fotografias`, `dataset-rotulos` e `sincronizacao-log`, o campo que identifica "quem fez" (`usuario_id`/`rotulado_por`) é preenchido a partir do usuário autenticado (token), nunca aceito do cliente.
- **Gate humano obrigatório (plantas atípicas)**: toda ocorrência nasce `status='pendente_validacao'` com `validado_por=NULL` — nem o `POST` nem o `PUT` de `/plantas-atipicas` aceitam esses dois campos do cliente. Só `POST /plantas-atipicas/{id}/validar` (restrito a `Administrador`/`Agronomo_RT`) define `validado_por`/`status`/`recomendacao`, e registra a decisão em `validacoes_humanas` (auditável via `GET /validacoes-humanas`, também restrito a `Administrador`/`Agronomo_RT`).
- **Logging de auditoria**: toda operação de escrita emite um log JSON estruturado em stdout (`usuario_id`, `usuario_email`, `entidade`, `entidade_id`, `operacao`, `timestamp`) — ver `core/logging.py`.
- `SECRET_KEY` é obrigatória no `.env` (gerar com `python -c "import secrets; print(secrets.token_hex(32))"`).

## Reconhecimento por IA (pragas, doenças, plantas daninhas, plantas atípicas)

Abordagem híbrida (decisão registrada em [HANDOFF.md](HANDOFF.md)): como ainda não existe um dataset rotulado suficiente para treinar modelos próprios (ver checklist em [docs/02-trilha-b-inteligencia/pipeline-dados-rotulagem.md](docs/02-trilha-b-inteligencia/pipeline-dados-rotulagem.md)), o reconhecimento hoje usa a API do Google Gemini (multimodal, com cota gratuita) para classificar fotos sob demanda — sem treino prévio — enquanto acumula um dataset real em paralelo para uma futura migração para modelo customizado.

- `POST /api/reconhecimento/classificar` — recebe uma foto (multipart, mesmas regras de tipo/tamanho de `/uploads`) e um `tipo_esperado` opcional (`praga`/`doenca`/`planta_daninha`/`planta_atipica`); retorna `tipo_identificado`, `nome_sugerido`, `confianca` (0-1) e `observacoes`. Toda chamada é registrada em `log_predicoes_ia` (auditoria/drift), associada a uma entrada fixa em `modelos_versoes` (`tipo_modelo='reconhecimento_visual'`) criada automaticamente no primeiro uso.
- Requer `GEMINI_API_KEY` no `.env` do backend (gerar gratuitamente em https://aistudio.google.com/apikey); sem a chave, o endpoint responde `503` e o resto do sistema continua funcionando normalmente.
- **Acúmulo de dataset (parte híbrida)**: ao criar uma ocorrência de praga/doença/planta daninha/planta atípica com `modelo_versao_id` e `fotografia_id` preenchidos (ou seja, o técnico confirmou uma sugestão da IA), um hook (`on_create` em `api/routes/factory.py`, ligado em `api/routes/inteligencia.py`) grava automaticamente um rótulo em `dataset_rotulos` com o valor **confirmado pelo humano** — sem passo manual extra. Isso acumula aos poucos um dataset real, rotulado por gente de verdade, para treinar um modelo próprio no futuro.
- Dashboard: página "Reconhecimento IA" (upload de foto + resultado + atalho para criar a ocorrência do tipo identificado).

## Status

Todo o schema de banco de dados (schema.sql) tem CRUD implementado e validado: Trilha A (núcleo organizacional), Trilha B (monitoramento de campo + inteligência especializada, com gate humano obrigatório para plantas atípicas), Trilha C (validações humanas, log de predições de IA, consentimentos LGPD) e Trilha D (log de sincronização mobile). Autenticação JWT, RBAC e logging de auditoria cobrem todos os endpoints. Upload de arquivos (fotos) via MinIO local (S3-compatível). Dashboard web (React + TypeScript + Tailwind, com [lucide-react](https://lucide.dev/) para ícones) com login, dashboard inicial (cards de estatística, ações rápidas, últimos registros) e CRUD completo de todas as trilhas — núcleo organizacional, monitoramento de campo e inteligência especializada (incluindo o fluxo de validação humana obrigatória de plantas atípicas) — validado no navegador. App de campo (React Native + Expo) com login, lista de talhões (somente leitura, cache local), cadastro offline-first de inspeções, fotografias, aplicações, análises de solo, ocorrências de pragas/doenças/plantas daninhas, plantas atípicas e colheita (fila de sincronização genérica com reenvio automático contra `sincronizacao_log`), telas analíticas somente-leitura de NDVI/produtividade, validação de plantas atípicas (manter/eliminar, restrita a Administrador/Agronomo_RT) e reconhecimento por IA (tira/escolhe foto → sugestão → atalho para a aba de cadastro) — todo validado via Expo web. Backend com suíte automatizada pytest (39 testes: autenticação/JWT, RBAC, gate de validação humana, upload de arquivos, reconhecimento por IA) rodando contra banco de testes real com isolamento por transação, e CI (GitHub Actions) rodando essa suíte a cada push/PR. Dashboard com suíte Vitest + React Testing Library (38 testes: login/logout, rota autenticada, motor genérico de CRUD, validação humana, reconhecimento por IA, dashboard inicial), também com CI própria rodando testes + build a cada push/PR. Mobile com suíte Jest + React Native Testing Library (44 testes: cache/fila offline genéricos, retry de sincronização, interceptors de autenticação, tela de colheita e de reconhecimento por IA) e CI própria (`tsc` + Jest a cada push/PR). Reconhecimento por IA (pragas, doenças, plantas daninhas, plantas atípicas) via API do Google Gemini (cota gratuita), com acúmulo automático de dataset rotulado para um futuro modelo próprio (ver seção acima) — dashboard e mobile têm tela dedicada ("Reconhecimento IA"). Próximos passos: histórico climático e modelos de IA permanecem só no dashboard web; testar o mobile em emulador/dispositivo real (só validado via Expo web); ou revisão/ajustes do que já existe. Contexto geral em [docs/00-fundacao/fase-0-fundacao-e-governanca.md](docs/00-fundacao/fase-0-fundacao-e-governanca.md).
