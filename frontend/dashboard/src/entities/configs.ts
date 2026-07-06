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

export const allConfigs: Record<string, EntityConfig> = {
  empresas: empresasConfig,
  cooperados: cooperadosConfig,
  fazendas: fazendasConfig,
  safras: safrasConfig,
  cultivares: cultivaresConfig,
  talhoes: talhoesConfig,
  contratos: contratosConfig,
}
