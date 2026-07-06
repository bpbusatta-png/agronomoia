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

### API

```
cd backend
.venv\Scripts\activate
copy .env.example .env   # ajustar DATABASE_URL conforme a opção de banco escolhida acima
uvicorn main:app --reload
```
`GET /api/health` deve responder `200 {"status":"ok"}` com o banco no ar.

## Status

Fase 0 (fundação e governança), estrutura do repositório, schema de banco de dados aplicado e esqueleto do backend FastAPI validados localmente. Próximos passos em [docs/00-fundacao/fase-0-fundacao-e-governanca.md](docs/00-fundacao/fase-0-fundacao-e-governanca.md).
