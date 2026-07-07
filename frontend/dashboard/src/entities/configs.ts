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
    { name: 'url_arquivo', label: 'Foto', type: 'file', required: true },
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

export const modelosVersoesConfig: EntityConfig = {
  key: 'modelos_versoes',
  title: 'Modelos de IA (Versões)',
  endpoint: '/modelos-versoes',
  fields: [
    {
      name: 'tipo_modelo',
      label: 'Tipo de modelo',
      type: 'select',
      staticOptions: [
        { value: 'pragas', label: 'Pragas' },
        { value: 'doencas', label: 'Doenças' },
        { value: 'plantas_atipicas', label: 'Plantas atípicas' },
        { value: 'ndvi', label: 'NDVI' },
      ],
    },
    { name: 'versao', label: 'Versão', type: 'text' },
    { name: 'data_treino', label: 'Data de treino', type: 'date' },
    { name: 'metricas_validacao', label: 'Métricas de validação (JSON, ex: {"acuracia": 0.91})', type: 'json' },
    { name: 'em_producao', label: 'Em produção?', type: 'boolean' },
  ],
  columns: [
    { name: 'tipo_modelo', label: 'Tipo' },
    { name: 'versao', label: 'Versão' },
    { name: 'em_producao', label: 'Em produção' },
  ],
}

export const pragasCatalogoConfig: EntityConfig = {
  key: 'pragas_catalogo',
  title: 'Catálogo de Pragas',
  endpoint: '/pragas-catalogo',
  fields: [
    { name: 'nome_comum', label: 'Nome comum', type: 'text' },
    { name: 'nome_cientifico', label: 'Nome científico', type: 'text' },
    { name: 'grupo_irac_recomendado', label: 'Grupo IRAC recomendado', type: 'text' },
  ],
  columns: [
    { name: 'nome_comum', label: 'Nome comum' },
    { name: 'nome_cientifico', label: 'Nome científico' },
    { name: 'grupo_irac_recomendado', label: 'Grupo IRAC' },
  ],
}

export const doencasCatalogoConfig: EntityConfig = {
  key: 'doencas_catalogo',
  title: 'Catálogo de Doenças',
  endpoint: '/doencas-catalogo',
  fields: [
    { name: 'nome', label: 'Nome', type: 'text' },
    { name: 'grupo_frac_recomendado', label: 'Grupo FRAC recomendado', type: 'text' },
  ],
  columns: [
    { name: 'nome', label: 'Nome' },
    { name: 'grupo_frac_recomendado', label: 'Grupo FRAC' },
  ],
}

export const ocorrenciasPragasConfig: EntityConfig = {
  key: 'ocorrencias_pragas',
  title: 'Ocorrências de Pragas',
  endpoint: '/ocorrencias-pragas',
  fields: [
    { name: 'talhao_id', label: 'Talhão', type: 'select', required: true, optionsFrom: 'talhoes' },
    { name: 'praga_id', label: 'Praga', type: 'select', optionsFrom: 'pragas_catalogo' },
    { name: 'fotografia_id', label: 'Fotografia (opcional)', type: 'select', optionsFrom: 'fotografias' },
    { name: 'modelo_versao_id', label: 'Modelo de IA (opcional)', type: 'select', optionsFrom: 'modelos_versoes' },
    { name: 'estadio', label: 'Estádio', type: 'text' },
    { name: 'populacao_estimada', label: 'População estimada', type: 'number' },
    { name: 'nivel_dano', label: 'Nível de dano', type: 'text' },
    { name: 'nivel_controle', label: 'Nível de controle', type: 'text' },
    { name: 'confianca_modelo', label: 'Confiança do modelo (0-1)', type: 'number' },
    { name: 'data', label: 'Data', type: 'date' },
  ],
  columns: [
    { name: 'talhao_id', label: 'Talhão' },
    { name: 'praga_id', label: 'Praga' },
    { name: 'nivel_dano', label: 'Nível de dano' },
    { name: 'data', label: 'Data' },
  ],
  refs: ['talhoes', 'pragas_catalogo', 'fotografias', 'modelos_versoes'],
}

export const ocorrenciasDoencasConfig: EntityConfig = {
  key: 'ocorrencias_doencas',
  title: 'Ocorrências de Doenças',
  endpoint: '/ocorrencias-doencas',
  fields: [
    { name: 'talhao_id', label: 'Talhão', type: 'select', required: true, optionsFrom: 'talhoes' },
    { name: 'doenca_id', label: 'Doença', type: 'select', optionsFrom: 'doencas_catalogo' },
    { name: 'fotografia_id', label: 'Fotografia (opcional)', type: 'select', optionsFrom: 'fotografias' },
    { name: 'modelo_versao_id', label: 'Modelo de IA (opcional)', type: 'select', optionsFrom: 'modelos_versoes' },
    { name: 'severidade_percentual', label: 'Severidade (%)', type: 'number' },
    { name: 'estadio_cultura', label: 'Estádio da cultura', type: 'text' },
    { name: 'confianca_modelo', label: 'Confiança do modelo (0-1)', type: 'number' },
    { name: 'data', label: 'Data', type: 'date' },
  ],
  columns: [
    { name: 'talhao_id', label: 'Talhão' },
    { name: 'doenca_id', label: 'Doença' },
    { name: 'severidade_percentual', label: 'Severidade (%)' },
    { name: 'data', label: 'Data' },
  ],
  refs: ['talhoes', 'doencas_catalogo', 'fotografias', 'modelos_versoes'],
}

export const plantasDaninhasCatalogoConfig: EntityConfig = {
  key: 'plantas_daninhas_catalogo',
  title: 'Catálogo de Plantas Daninhas',
  endpoint: '/plantas-daninhas-catalogo',
  fields: [
    { name: 'nome_comum', label: 'Nome comum', type: 'text' },
    { name: 'nome_cientifico', label: 'Nome científico', type: 'text' },
    {
      name: 'ciclo',
      label: 'Ciclo',
      type: 'select',
      staticOptions: [
        { value: 'anual', label: 'Anual' },
        { value: 'perene', label: 'Perene' },
      ],
    },
  ],
  columns: [
    { name: 'nome_comum', label: 'Nome comum' },
    { name: 'nome_cientifico', label: 'Nome científico' },
    { name: 'ciclo', label: 'Ciclo' },
  ],
}

export const ocorrenciasPlantasDaninhasConfig: EntityConfig = {
  key: 'ocorrencias_plantas_daninhas',
  title: 'Ocorrências de Plantas Daninhas',
  endpoint: '/ocorrencias-plantas-daninhas',
  fields: [
    { name: 'talhao_id', label: 'Talhão', type: 'select', required: true, optionsFrom: 'talhoes' },
    { name: 'planta_daninha_id', label: 'Planta daninha', type: 'select', optionsFrom: 'plantas_daninhas_catalogo' },
    { name: 'fotografia_id', label: 'Fotografia (opcional)', type: 'select', optionsFrom: 'fotografias' },
    { name: 'modelo_versao_id', label: 'Modelo de IA (opcional)', type: 'select', optionsFrom: 'modelos_versoes' },
    { name: 'nivel_infestacao', label: 'Nível de infestação', type: 'text' },
    { name: 'estadio_cultura', label: 'Estádio da cultura', type: 'text' },
    { name: 'confianca_modelo', label: 'Confiança do modelo (0-1)', type: 'number' },
    { name: 'data', label: 'Data', type: 'date' },
  ],
  columns: [
    { name: 'talhao_id', label: 'Talhão' },
    { name: 'planta_daninha_id', label: 'Planta daninha' },
    { name: 'nivel_infestacao', label: 'Nível de infestação' },
    { name: 'data', label: 'Data' },
  ],
  refs: ['talhoes', 'plantas_daninhas_catalogo', 'fotografias', 'modelos_versoes'],
}

export const plantasAtipicasConfig: EntityConfig = {
  key: 'plantas_atipicas',
  title: 'Plantas Atípicas',
  endpoint: '/plantas-atipicas',
  fields: [
    { name: 'talhao_id', label: 'Talhão', type: 'select', required: true, optionsFrom: 'talhoes' },
    { name: 'fotografia_id', label: 'Fotografia (opcional)', type: 'select', optionsFrom: 'fotografias' },
    {
      name: 'caracteristica_avaliada',
      label: 'Característica avaliada',
      type: 'select',
      staticOptions: [
        { value: 'arquitetura', label: 'Arquitetura' },
        { value: 'cor_flor', label: 'Cor da flor' },
        { value: 'pubescencia', label: 'Pubescência' },
        { value: 'cor_hilo', label: 'Cor do hilo' },
        { value: 'formato_folha', label: 'Formato da folha' },
        { value: 'formato_vagem', label: 'Formato da vagem' },
        { value: 'porte', label: 'Porte' },
        { value: 'ramificacoes', label: 'Ramificações' },
        { value: 'tipo_crescimento', label: 'Tipo de crescimento' },
      ],
    },
    { name: 'conforme_padrao', label: 'Conforme padrão?', type: 'boolean' },
    { name: 'justificativa_tecnica', label: 'Justificativa técnica', type: 'text' },
    { name: 'modelo_versao_id', label: 'Modelo de IA (opcional)', type: 'select', optionsFrom: 'modelos_versoes' },
    { name: 'confianca_modelo', label: 'Confiança do modelo (0-1)', type: 'number' },
    { name: 'data', label: 'Data', type: 'date' },
  ],
  columns: [
    { name: 'talhao_id', label: 'Talhão' },
    { name: 'caracteristica_avaliada', label: 'Característica' },
    { name: 'status', label: 'Status' },
    { name: 'recomendacao', label: 'Recomendação' },
  ],
  refs: ['talhoes', 'fotografias', 'modelos_versoes'],
}

export const ndviLeiturasConfig: EntityConfig = {
  key: 'ndvi_leituras',
  title: 'Leituras NDVI',
  endpoint: '/ndvi-leituras',
  fields: [
    { name: 'talhao_id', label: 'Talhão', type: 'select', required: true, optionsFrom: 'talhoes' },
    { name: 'data', label: 'Data', type: 'date' },
    {
      name: 'fonte',
      label: 'Fonte',
      type: 'select',
      staticOptions: [
        { value: 'sentinel', label: 'Sentinel' },
        { value: 'planet', label: 'Planet' },
        { value: 'drone', label: 'Drone' },
      ],
    },
    { name: 'ndvi_medio', label: 'NDVI médio', type: 'number' },
    { name: 'ndre_medio', label: 'NDRE médio', type: 'number' },
    { name: 'msavi_medio', label: 'MSAVI médio', type: 'number' },
    { name: 'url_mapa', label: 'URL do mapa', type: 'text' },
  ],
  columns: [
    { name: 'talhao_id', label: 'Talhão' },
    { name: 'data', label: 'Data' },
    { name: 'fonte', label: 'Fonte' },
    { name: 'ndvi_medio', label: 'NDVI médio' },
  ],
  refs: ['talhoes'],
}

export const produtividadeEstimativasConfig: EntityConfig = {
  key: 'produtividade_estimativas',
  title: 'Estimativas de Produtividade',
  endpoint: '/produtividade-estimativas',
  fields: [
    { name: 'talhao_id', label: 'Talhão', type: 'select', required: true, optionsFrom: 'talhoes' },
    { name: 'safra_id', label: 'Safra', type: 'select', optionsFrom: 'safras' },
    { name: 'populacao_plantas_ha', label: 'População de plantas/ha', type: 'number' },
    { name: 'vagens_por_planta', label: 'Vagens por planta', type: 'number' },
    { name: 'graos_por_vagem', label: 'Grãos por vagem', type: 'number' },
    { name: 'pmg', label: 'PMG (peso de mil grãos)', type: 'number' },
    { name: 'produtividade_estimada_kg_ha', label: 'Produtividade estimada (kg/ha)', type: 'number' },
    { name: 'intervalo_confianca_min', label: 'Intervalo de confiança (mín)', type: 'number' },
    { name: 'intervalo_confianca_max', label: 'Intervalo de confiança (máx)', type: 'number' },
    { name: 'data', label: 'Data', type: 'date' },
  ],
  columns: [
    { name: 'talhao_id', label: 'Talhão' },
    { name: 'safra_id', label: 'Safra' },
    { name: 'produtividade_estimada_kg_ha', label: 'Produtividade (kg/ha)' },
    { name: 'data', label: 'Data' },
  ],
  refs: ['talhoes', 'safras'],
}

export const colheitaConfig: EntityConfig = {
  key: 'colheita',
  title: 'Colheita',
  endpoint: '/colheita',
  fields: [
    { name: 'talhao_id', label: 'Talhão', type: 'select', required: true, optionsFrom: 'talhoes' },
    { name: 'safra_id', label: 'Safra', type: 'select', optionsFrom: 'safras' },
    { name: 'data', label: 'Data', type: 'date' },
    { name: 'quantidade_kg', label: 'Quantidade (kg)', type: 'number' },
    { name: 'umidade_colheita', label: 'Umidade na colheita (%)', type: 'number' },
    { name: 'qualidade_semente', label: 'Qualidade da semente', type: 'text' },
  ],
  columns: [
    { name: 'talhao_id', label: 'Talhão' },
    { name: 'safra_id', label: 'Safra' },
    { name: 'quantidade_kg', label: 'Quantidade (kg)' },
    { name: 'data', label: 'Data' },
  ],
  refs: ['talhoes', 'safras'],
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
  modelos_versoes: modelosVersoesConfig,
  pragas_catalogo: pragasCatalogoConfig,
  doencas_catalogo: doencasCatalogoConfig,
  ocorrencias_pragas: ocorrenciasPragasConfig,
  ocorrencias_doencas: ocorrenciasDoencasConfig,
  plantas_daninhas_catalogo: plantasDaninhasCatalogoConfig,
  ocorrencias_plantas_daninhas: ocorrenciasPlantasDaninhasConfig,
  plantas_atipicas: plantasAtipicasConfig,
  ndvi_leituras: ndviLeiturasConfig,
  produtividade_estimativas: produtividadeEstimativasConfig,
  colheita: colheitaConfig,
}
