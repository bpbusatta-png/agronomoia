import type { EntityConfig } from './types'

export const empresasConfig: EntityConfig = {
  key: 'empresas',
  title: 'Empresas',
  endpoint: '/empresas',
  fields: [
    { name: 'nome', label: 'Nome', type: 'text', required: true },
    { name: 'cnpj', label: 'CNPJ', type: 'text' },
    { name: 'contato', label: 'Contato', type: 'text' },
  ],
  columns: [
    { name: 'nome', label: 'Nome' },
    { name: 'cnpj', label: 'CNPJ' },
    { name: 'contato', label: 'Contato' },
  ],
}

export const cooperadosConfig: EntityConfig = {
  key: 'cooperados',
  title: 'Cooperados',
  endpoint: '/cooperados',
  fields: [
    { name: 'codigo', label: 'Código', type: 'text', required: true },
    { name: 'nome', label: 'Nome', type: 'text', required: true },
    { name: 'contato_telefone', label: 'Telefone', type: 'text' },
    { name: 'contato_email', label: 'E-mail', type: 'text' },
    { name: 'municipio', label: 'Município', type: 'text' },
    { name: 'estado', label: 'Estado (UF)', type: 'text' },
  ],
  columns: [
    { name: 'codigo', label: 'Código' },
    { name: 'nome', label: 'Nome' },
    { name: 'municipio', label: 'Município' },
    { name: 'estado', label: 'UF' },
  ],
}

export const fazendasConfig: EntityConfig = {
  key: 'fazendas',
  title: 'Fazendas',
  endpoint: '/fazendas',
  fields: [
    { name: 'cooperado_id', label: 'Cooperado', type: 'select', required: true, optionsFrom: 'cooperados' },
    { name: 'nome', label: 'Nome', type: 'text', required: true },
    { name: 'municipio', label: 'Município', type: 'text' },
    { name: 'area_ha', label: 'Área (ha)', type: 'number' },
  ],
  columns: [
    { name: 'nome', label: 'Nome' },
    { name: 'cooperado_id', label: 'Cooperado' },
    { name: 'municipio', label: 'Município' },
    { name: 'area_ha', label: 'Área (ha)' },
  ],
  refs: ['cooperados'],
}

export const safrasConfig: EntityConfig = {
  key: 'safras',
  title: 'Safras',
  endpoint: '/safras',
  fields: [
    { name: 'nome', label: 'Nome (ex: 2025/2026)', type: 'text', required: true },
    { name: 'data_inicio', label: 'Início', type: 'date' },
    { name: 'data_fim', label: 'Fim', type: 'date' },
  ],
  columns: [
    { name: 'nome', label: 'Nome' },
    { name: 'data_inicio', label: 'Início' },
    { name: 'data_fim', label: 'Fim' },
  ],
}

export const cultivaresConfig: EntityConfig = {
  key: 'cultivares',
  title: 'Cultivares',
  endpoint: '/cultivares',
  fields: [
    { name: 'nome', label: 'Nome', type: 'text', required: true },
    { name: 'empresa_id', label: 'Empresa', type: 'select', optionsFrom: 'empresas' },
    { name: 'especie', label: 'Espécie', type: 'text' },
    { name: 'ciclo_dias', label: 'Ciclo (dias)', type: 'number' },
  ],
  columns: [
    { name: 'nome', label: 'Nome' },
    { name: 'empresa_id', label: 'Empresa' },
    { name: 'especie', label: 'Espécie' },
    { name: 'ciclo_dias', label: 'Ciclo (dias)' },
  ],
  refs: ['empresas'],
}

export const talhoesConfig: EntityConfig = {
  key: 'talhoes',
  title: 'Talhões',
  endpoint: '/talhoes',
  fields: [
    { name: 'fazenda_id', label: 'Fazenda', type: 'select', required: true, optionsFrom: 'fazendas' },
    { name: 'codigo', label: 'Código', type: 'text', required: true },
    { name: 'area_ha', label: 'Área (ha)', type: 'number' },
    { name: 'empresa_id', label: 'Empresa', type: 'select', optionsFrom: 'empresas' },
    { name: 'cultivar_id', label: 'Cultivar', type: 'select', optionsFrom: 'cultivares' },
    { name: 'safra_id', label: 'Safra', type: 'select', optionsFrom: 'safras' },
    { name: 'classe_semente', label: 'Classe da semente', type: 'text' },
    { name: 'data_plantio', label: 'Data de plantio', type: 'date' },
  ],
  columns: [
    { name: 'codigo', label: 'Código' },
    { name: 'fazenda_id', label: 'Fazenda' },
    { name: 'cultivar_id', label: 'Cultivar' },
    { name: 'safra_id', label: 'Safra' },
    { name: 'area_ha', label: 'Área (ha)' },
  ],
  refs: ['fazendas', 'empresas', 'cultivares', 'safras'],
}

export const contratosConfig: EntityConfig = {
  key: 'contratos',
  title: 'Contratos',
  endpoint: '/contratos',
  fields: [
    { name: 'empresa_id', label: 'Empresa', type: 'select', optionsFrom: 'empresas' },
    { name: 'cultivar_id', label: 'Cultivar', type: 'select', optionsFrom: 'cultivares' },
    { name: 'cooperado_id', label: 'Cooperado', type: 'select', optionsFrom: 'cooperados' },
    { name: 'safra_id', label: 'Safra', type: 'select', optionsFrom: 'safras' },
    { name: 'area_contratada_ha', label: 'Área contratada (ha)', type: 'number' },
    { name: 'area_plantada_ha', label: 'Área plantada (ha)', type: 'number' },
    { name: 'producao_prevista_kg', label: 'Produção prevista (kg)', type: 'number' },
    { name: 'status', label: 'Status', type: 'text' },
  ],
  columns: [
    { name: 'cooperado_id', label: 'Cooperado' },
    { name: 'cultivar_id', label: 'Cultivar' },
    { name: 'safra_id', label: 'Safra' },
    { name: 'area_contratada_ha', label: 'Área contratada (ha)' },
    { name: 'status', label: 'Status' },
  ],
  refs: ['empresas', 'cultivares', 'cooperados', 'safras'],
}

export const inspecoesConfig: EntityConfig = {
  key: 'inspecoes',
  title: 'Inspeções',
  endpoint: '/inspecoes',
  fields: [
    { name: 'talhao_id', label: 'Talhão', type: 'select', required: true, optionsFrom: 'talhoes' },
    { name: 'data', label: 'Data', type: 'date', required: true },
    { name: 'estadio_fenologico', label: 'Estádio fenológico', type: 'text' },
    { name: 'observacoes', label: 'Observações', type: 'text' },
  ],
  columns: [
    { name: 'talhao_id', label: 'Talhão' },
    { name: 'data', label: 'Data' },
    { name: 'estadio_fenologico', label: 'Estádio' },
    { name: 'observacoes', label: 'Observações' },
  ],
  refs: ['talhoes'],
}

export const aplicacoesConfig: EntityConfig = {
  key: 'aplicacoes',
  title: 'Aplicações',
  endpoint: '/aplicacoes',
  fields: [
    { name: 'talhao_id', label: 'Talhão', type: 'select', required: true, optionsFrom: 'talhoes' },
    { name: 'produto', label: 'Produto', type: 'text' },
    { name: 'ingrediente_ativo', label: 'Ingrediente ativo', type: 'text' },
    { name: 'dose', label: 'Dose', type: 'number' },
    { name: 'data', label: 'Data', type: 'date' },
    { name: 'volume_calda_l_ha', label: 'Volume de calda (L/ha)', type: 'number' },
    { name: 'tecnologia_aplicacao', label: 'Tecnologia de aplicação', type: 'text' },
  ],
  columns: [
    { name: 'talhao_id', label: 'Talhão' },
    { name: 'produto', label: 'Produto' },
    { name: 'dose', label: 'Dose' },
    { name: 'data', label: 'Data' },
  ],
  refs: ['talhoes'],
}

export const historicoClimaticoConfig: EntityConfig = {
  key: 'historico_climatico',
  title: 'Histórico Climático',
  endpoint: '/historico-climatico',
  fields: [
    { name: 'talhao_id', label: 'Talhão', type: 'select', required: true, optionsFrom: 'talhoes' },
    { name: 'data', label: 'Data', type: 'date', required: true },
    { name: 'chuva_mm', label: 'Chuva (mm)', type: 'number' },
    { name: 'temp_min', label: 'Temp. mínima (°C)', type: 'number' },
    { name: 'temp_max', label: 'Temp. máxima (°C)', type: 'number' },
    { name: 'umidade_relativa', label: 'Umidade relativa (%)', type: 'number' },
  ],
  columns: [
    { name: 'talhao_id', label: 'Talhão' },
    { name: 'data', label: 'Data' },
    { name: 'chuva_mm', label: 'Chuva (mm)' },
    { name: 'temp_min', label: 'Temp. mín (°C)' },
    { name: 'temp_max', label: 'Temp. máx (°C)' },
  ],
  refs: ['talhoes'],
}

export const analisesSoloConfig: EntityConfig = {
  key: 'analises_solo',
  title: 'Análises de Solo',
  endpoint: '/analises-solo',
  fields: [
    { name: 'talhao_id', label: 'Talhão', type: 'select', required: true, optionsFrom: 'talhoes' },
    { name: 'data', label: 'Data', type: 'date' },
    { name: 'ph', label: 'pH', type: 'number' },
    { name: 'materia_organica', label: 'Matéria orgânica (%)', type: 'number' },
    { name: 'nutrientes', label: 'Nutrientes (JSON, ex: {"P": 12.4, "K": 0.3})', type: 'json' },
  ],
  columns: [
    { name: 'talhao_id', label: 'Talhão' },
    { name: 'data', label: 'Data' },
    { name: 'ph', label: 'pH' },
    { name: 'nutrientes', label: 'Nutrientes' },
  ],
  refs: ['talhoes'],
}

export const fotografiasConfig: EntityConfig = {
  key: 'fotografias',
  title: 'Fotografias',
  endpoint: '/fotografias',
  fields: [
    { name: 'talhao_id', label: 'Talhão', type: 'select', required: true, optionsFrom: 'talhoes' },
    { name: 'inspecao_id', label: 'Inspeção (opcional)', type: 'select', optionsFrom: 'inspecoes' },
    { name: 'url_arquivo', label: 'URL do arquivo', type: 'text', required: true },
    {
      name: 'tipo',
      label: 'Tipo',
      type: 'select',
      staticOptions: [
        { value: 'praga', label: 'Praga' },
        { value: 'doenca', label: 'Doença' },
        { value: 'planta_atipica', label: 'Planta atípica' },
        { value: 'geral', label: 'Geral' },
      ],
    },
    { name: 'localizacao', label: 'Localização (WKT, ex: POINT(-52.4 -28.26))', type: 'text' },
  ],
  columns: [
    { name: 'talhao_id', label: 'Talhão' },
    { name: 'tipo', label: 'Tipo' },
    { name: 'url_arquivo', label: 'URL' },
    { name: 'capturado_em', label: 'Capturado em' },
  ],
  refs: ['talhoes', 'inspecoes'],
}

export const allConfigs: Record<string, EntityConfig> = {
  empresas: empresasConfig,
  cooperados: cooperadosConfig,
  fazendas: fazendasConfig,
  safras: safrasConfig,
  cultivares: cultivaresConfig,
  talhoes: talhoesConfig,
  contratos: contratosConfig,
  inspecoes: inspecoesConfig,
  aplicacoes: aplicacoesConfig,
  historico_climatico: historicoClimaticoConfig,
  analises_solo: analisesSoloConfig,
  fotografias: fotografiasConfig,
}
