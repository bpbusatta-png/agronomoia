# Arquitetura Base — Agrônomo IA
*Item A1 · Trilha A — Plataforma Central · pasta sugerida: `01-trilha-a-plataforma/`*

## Objetivo
Definir stack tecnológica, estrutura de repositório, autenticação, permissões e logging — dimensionados para o MVP (Onda 1), não para as 15 fases completas de uma vez.

---

## 1. Stack tecnológica sugerida

| Camada | Tecnologia sugerida | Por quê |
|---|---|---|
| Backend / API | Python (FastAPI) | Ecossistema de ML/visão computacional e geoespacial é majoritariamente Python — evita duas linguagens no back |
| Banco de dados | PostgreSQL + PostGIS | Já definido no item A2 — suporte nativo a dados geoespaciais |
| Armazenamento de arquivos | Object storage compatível com S3 (AWS S3, Cloudflare R2, ou MinIO self-hosted) | Fotos e mapas de NDVI não pertencem ao banco relacional |
| Fila / processamento assíncrono | Redis + Celery (ou RQ) | Inferência de IA não deve bloquear a resposta ao usuário |
| Frontend (dashboard web) | React + TypeScript | Integra bem com bibliotecas de mapas (Leaflet/Mapbox) para os agentes Geográfico e NDVI |
| App mobile de campo | Flutter ou React Native, com banco local (SQLite) + sincronização | Ver Trilha D — offline-first é requisito, não opcional |
| Orquestração de agentes | Chamada a modelo de linguagem com function calling para acionar os agentes especializados | Agente Mestre (A4/A9) |
| Hospedagem | Cloud (AWS/GCP/Azure) com contêineres (Docker) | Permite escalar cada agente de forma independente |

*Ponto de partida sugerido — validar contra a experiência prévia da equipe antes de travar a escolha.*

---

## 2. Estrutura de repositório (código)

```
agronomo-ia/
├── backend/
│   ├── api/                   # endpoints REST/GraphQL
│   ├── agentes/
│   │   ├── mestre/            # A4 / A9 — orquestrador
│   │   ├── cadastro/          # A3
│   │   ├── geografico/        # A5
│   │   ├── contratos/         # A6
│   │   └── relatorios/        # A7
│   ├── inteligencia/          # Trilha B — um módulo por agente especializado
│   │   ├── monitoramento/     # B1
│   │   ├── ndvi/              # B2
│   │   ├── produtividade/     # B3
│   │   ├── pragas/            # B4
│   │   ├── doencas/           # B5
│   │   └── plantas_atipicas/  # B6
│   ├── confiabilidade/        # Trilha C — validação humana, auditoria
│   ├── db/
│   │   ├── migrations/
│   │   └── schema.sql         # ver schema-banco-de-dados.md
│   └── core/                  # autenticação, permissões, logging
├── frontend/
│   └── dashboard/              # A8 — Dashboard Gerencial
├── mobile/
│   └── app-campo/              # Trilha D
├── ml/
│   ├── dataset/                # B0 — ver pipeline-dados-rotulagem.md
│   ├── treino/
│   └── modelos/
├── infra/
│   ├── docker/
│   └── terraform/               # se aplicável
└── docs/                        # roadmap, fase 0, schema, este arquivo
```

---

## 3. Autenticação
- JWT (JSON Web Token) com refresh token
- Login por e-mail/senha no MVP; SSO (Google/Microsoft) fica para uma onda posterior
- O token carrega o `papel_id` do usuário (tabelas `usuarios`/`papeis` do schema) para autorizar cada rota

---

## 4. Permissões (RBAC sobre os papéis já definidos no schema)

| Papel | Pode fazer |
|---|---|
| Administrador | Tudo, incluindo gestão de usuários |
| Agronomo_RT | Validar/invalidar ocorrências críticas (plantas atípicas), acessar todos os relatórios |
| Tecnico_Campo | Cadastrar inspeções, fotos, aplicações — sem poder de validação final |
| Cooperado | Consulta somente-leitura dos próprios talhões/contratos |
| Consulta | Somente-leitura geral (ex.: auditor externo) |

---

## 5. Logging
- Toda operação de escrita (criar/editar/excluir) gera log estruturado (JSON): usuário, timestamp, entidade, operação
- Predições de IA vão para a tabela `log_predicoes_ia` (Trilha C) — não só em arquivo de log, para permitir auditoria consultável por SQL
- Logs de sistema (erros, performance) em ferramenta própria (ex.: Grafana Loki, CloudWatch) — separados dos logs de negócio

---

## 6. Deliberadamente fora do MVP (Onda 1)
- SSO corporativo
- Multi-região / alta disponibilidade geográfica
- Cache distribuído sofisticado

*Adicionar apenas quando o volume de uso justificar — reintroduzir cedo demais é complexidade sem retorno ainda.*
