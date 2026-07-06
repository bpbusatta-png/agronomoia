-- Schema de Banco de Dados — Agrônomo IA
-- Gerado a partir de docs/01-trilha-a-plataforma/schema-banco-de-dados.md
-- Ordem de criação ajustada para respeitar as foreign keys (ver nota original:
-- modelos_versoes precisa existir antes de ocorrencias_pragas/ocorrencias_doencas/
-- plantas_atipicas_ocorrencias; dataset_rotulos precisa existir depois de fotografias).

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS postgis;  -- tipos geometry (Point, Polygon)

-- =========================================================================
-- Núcleo organizacional (Trilha A)
-- =========================================================================

CREATE TABLE papeis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(50) NOT NULL, -- Administrador, Agronomo_RT, Tecnico_Campo, Cooperado, Consulta
  descricao TEXT
);

CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(200) NOT NULL,
  email VARCHAR(200) UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  papel_id UUID REFERENCES papeis(id),
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT now()
);

CREATE TABLE cooperados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(30) UNIQUE NOT NULL,
  nome VARCHAR(200) NOT NULL,
  contato_telefone VARCHAR(30),
  contato_email VARCHAR(200),
  municipio VARCHAR(120),
  estado CHAR(2),
  localizacao geometry(Point, 4326),
  criado_em TIMESTAMP DEFAULT now()
);

CREATE TABLE empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(200) NOT NULL,
  cnpj VARCHAR(20) UNIQUE,
  contato VARCHAR(200)
);

CREATE TABLE fazendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cooperado_id UUID REFERENCES cooperados(id),
  nome VARCHAR(200) NOT NULL,
  municipio VARCHAR(120),
  area_ha NUMERIC(10,2)
);

CREATE TABLE safras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(20) NOT NULL, -- ex: '2025/2026'
  data_inicio DATE,
  data_fim DATE
);

CREATE TABLE cultivares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(120) NOT NULL,
  empresa_id UUID REFERENCES empresas(id),
  especie VARCHAR(60), -- soja, milho, trigo...
  ciclo_dias INT
);

CREATE TABLE talhoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fazenda_id UUID REFERENCES fazendas(id),
  codigo VARCHAR(30) NOT NULL,
  area_ha NUMERIC(10,2),
  contorno geometry(Polygon, 4326),
  empresa_id UUID REFERENCES empresas(id),
  cultivar_id UUID REFERENCES cultivares(id),
  safra_id UUID REFERENCES safras(id),
  classe_semente VARCHAR(40), -- Basica, C1, C2...
  data_plantio DATE,
  criado_em TIMESTAMP DEFAULT now()
);

CREATE TABLE contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id),
  cultivar_id UUID REFERENCES cultivares(id),
  cooperado_id UUID REFERENCES cooperados(id),
  safra_id UUID REFERENCES safras(id),
  area_contratada_ha NUMERIC(10,2),
  area_plantada_ha NUMERIC(10,2) DEFAULT 0,
  producao_prevista_kg NUMERIC(12,2),
  status VARCHAR(30) DEFAULT 'aberto' -- aberto, cumprido, em_risco
);

-- =========================================================================
-- Monitoramento e campo (Trilha B — dados estruturados)
-- =========================================================================

CREATE TABLE inspecoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talhao_id UUID REFERENCES talhoes(id),
  usuario_id UUID REFERENCES usuarios(id),
  data DATE NOT NULL,
  estadio_fenologico VARCHAR(20),
  observacoes TEXT
);

CREATE TABLE aplicacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talhao_id UUID REFERENCES talhoes(id),
  produto VARCHAR(150),
  ingrediente_ativo VARCHAR(150),
  dose NUMERIC(8,3),
  data DATE,
  volume_calda_l_ha NUMERIC(8,2),
  tecnologia_aplicacao VARCHAR(100)
);

CREATE TABLE historico_climatico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talhao_id UUID REFERENCES talhoes(id),
  data DATE NOT NULL,
  chuva_mm NUMERIC(6,2),
  temp_min NUMERIC(4,1),
  temp_max NUMERIC(4,1),
  umidade_relativa NUMERIC(5,2)
);

CREATE TABLE analises_solo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talhao_id UUID REFERENCES talhoes(id),
  data DATE,
  ph NUMERIC(3,1),
  materia_organica NUMERIC(5,2),
  nutrientes JSONB -- {"P": 12.4, "K": 0.3, "Ca": 4.1, ...}
);

CREATE TABLE fotografias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talhao_id UUID REFERENCES talhoes(id),
  inspecao_id UUID REFERENCES inspecoes(id),
  usuario_id UUID REFERENCES usuarios(id),
  url_arquivo TEXT NOT NULL,
  localizacao geometry(Point, 4326),
  tipo VARCHAR(30), -- praga, doenca, planta_atipica, geral
  capturado_em TIMESTAMP DEFAULT now()
);

-- =========================================================================
-- Dados e rotulagem — pré-requisito de ML (Trilha B0)
-- criada antes de "Inteligência especializada" pois modelos_versoes é
-- referenciada por ocorrencias_pragas, ocorrencias_doencas e
-- plantas_atipicas_ocorrencias.
-- =========================================================================

CREATE TABLE modelos_versoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_modelo VARCHAR(30), -- pragas, doencas, plantas_atipicas, ndvi
  versao VARCHAR(20),
  data_treino DATE,
  metricas_validacao JSONB, -- {"acuracia": 0.91, "precisao": 0.88, ...}
  em_producao BOOLEAN DEFAULT FALSE
);

-- =========================================================================
-- Inteligência especializada (Trilha B)
-- =========================================================================

CREATE TABLE pragas_catalogo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_comum VARCHAR(150),
  nome_cientifico VARCHAR(150),
  grupo_irac_recomendado VARCHAR(20)
);

CREATE TABLE ocorrencias_pragas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fotografia_id UUID REFERENCES fotografias(id),
  talhao_id UUID REFERENCES talhoes(id),
  praga_id UUID REFERENCES pragas_catalogo(id),
  estadio VARCHAR(30),
  populacao_estimada NUMERIC(8,2),
  nivel_dano VARCHAR(20),
  nivel_controle VARCHAR(20),
  modelo_versao_id UUID REFERENCES modelos_versoes(id),
  confianca_modelo NUMERIC(4,3),
  validado_por UUID REFERENCES usuarios(id),
  data DATE DEFAULT CURRENT_DATE
);

CREATE TABLE doencas_catalogo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(150),
  grupo_frac_recomendado VARCHAR(20)
);

CREATE TABLE ocorrencias_doencas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fotografia_id UUID REFERENCES fotografias(id),
  talhao_id UUID REFERENCES talhoes(id),
  doenca_id UUID REFERENCES doencas_catalogo(id),
  severidade_percentual NUMERIC(5,2),
  estadio_cultura VARCHAR(30),
  modelo_versao_id UUID REFERENCES modelos_versoes(id),
  confianca_modelo NUMERIC(4,3),
  validado_por UUID REFERENCES usuarios(id),
  data DATE DEFAULT CURRENT_DATE
);

-- Tabela mais sensivel do sistema: toda ocorrencia nasce 'pendente_validacao'
-- (validado_por NULL) e so recebe validado_por quando um Administrador/RT
-- valida via endpoint dedicado (ver validacoes_humanas, Trilha C). Nao e
-- possivel setar validado_por na criacao nem em updates diretos.
CREATE TABLE plantas_atipicas_ocorrencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fotografia_id UUID REFERENCES fotografias(id),
  talhao_id UUID REFERENCES talhoes(id),
  caracteristica_avaliada VARCHAR(50), -- arquitetura, cor_flor, pubescencia, cor_hilo, formato_folha, formato_vagem, porte, ramificacoes, tipo_crescimento
  conforme_padrao BOOLEAN,
  justificativa_tecnica TEXT,
  recomendacao VARCHAR(30), -- manter, eliminar
  modelo_versao_id UUID REFERENCES modelos_versoes(id),
  confianca_modelo NUMERIC(4,3),
  validado_por UUID REFERENCES usuarios(id),
  status VARCHAR(20) DEFAULT 'pendente_validacao',
  data DATE DEFAULT CURRENT_DATE
);

CREATE TABLE ndvi_leituras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talhao_id UUID REFERENCES talhoes(id),
  data DATE,
  fonte VARCHAR(20), -- sentinel, planet, drone
  ndvi_medio NUMERIC(4,3),
  ndre_medio NUMERIC(4,3),
  msavi_medio NUMERIC(4,3),
  url_mapa TEXT
);

CREATE TABLE produtividade_estimativas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talhao_id UUID REFERENCES talhoes(id),
  safra_id UUID REFERENCES safras(id),
  populacao_plantas_ha NUMERIC(10,2),
  vagens_por_planta NUMERIC(6,2),
  graos_por_vagem NUMERIC(5,2),
  pmg NUMERIC(6,2), -- peso de mil graos
  produtividade_estimada_kg_ha NUMERIC(10,2),
  intervalo_confianca_min NUMERIC(10,2),
  intervalo_confianca_max NUMERIC(10,2),
  data DATE DEFAULT CURRENT_DATE
);

CREATE TABLE colheita (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talhao_id UUID REFERENCES talhoes(id),
  safra_id UUID REFERENCES safras(id),
  data DATE,
  quantidade_kg NUMERIC(12,2),
  umidade_colheita NUMERIC(5,2),
  qualidade_semente VARCHAR(30)
);

CREATE TABLE dataset_rotulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fotografia_id UUID REFERENCES fotografias(id),
  tipo_rotulo VARCHAR(30),
  rotulo_valor JSONB,
  rotulado_por UUID REFERENCES usuarios(id),
  revisado_por UUID REFERENCES usuarios(id),
  usado_em_treino BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMP DEFAULT now()
);

-- =========================================================================
-- Confiabilidade e conformidade (Trilha C)
-- =========================================================================

-- Auditoria central: toda acao irreversivel passa por aqui
CREATE TABLE validacoes_humanas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade_referenciada VARCHAR(60), -- ex: 'plantas_atipicas_ocorrencias'
  entidade_id UUID,
  usuario_validador_id UUID REFERENCES usuarios(id),
  decisao VARCHAR(30),
  justificativa TEXT,
  criado_em TIMESTAMP DEFAULT now()
);

-- Log de toda predicao de IA, mesmo as nao-criticas, para auditoria e deteccao de drift
CREATE TABLE log_predicoes_ia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modelo_versao_id UUID REFERENCES modelos_versoes(id),
  entidade_referenciada VARCHAR(60),
  entidade_id UUID,
  entrada_resumo JSONB,
  saida_predita JSONB,
  confianca NUMERIC(4,3),
  criado_em TIMESTAMP DEFAULT now()
);

CREATE TABLE consentimentos_lgpd (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cooperado_id UUID REFERENCES cooperados(id),
  finalidade VARCHAR(150),
  base_legal VARCHAR(60),
  data_consentimento DATE,
  data_expiracao DATE
);

-- =========================================================================
-- Sincronização mobile (Trilha D)
-- =========================================================================

CREATE TABLE sincronizacao_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispositivo_id VARCHAR(100),
  usuario_id UUID REFERENCES usuarios(id),
  entidade_referenciada VARCHAR(60),
  entidade_id UUID,
  operacao VARCHAR(20), -- criar, editar, excluir
  timestamp_local TIMESTAMP,
  timestamp_servidor TIMESTAMP DEFAULT now(),
  status_conflito VARCHAR(20) DEFAULT 'ok' -- ok, resolvido_servidor, resolvido_cliente, pendente
);
