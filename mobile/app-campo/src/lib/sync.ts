import { Platform } from 'react-native'
import { getOrCreateDeviceId } from './deviceId'
import { api } from './api'
import {
  listFotografiasLocais,
  listInspecoesLocais,
  listQueue,
  updateFotografiaLocalStatus,
  updateInspecaoLocalStatus,
  updateQueueStatus,
} from './db'

export interface SyncResult {
  synced: number
  failed: number
}

// Envia as inspecoes criadas offline (status 'pendente' ou 'erro' de uma
// tentativa anterior) para o backend, uma a uma. Cada sucesso tambem grava
// um registro em sincronizacao_log, exatamente como o schema (Trilha D)
// prevê para reconciliar operacoes feitas offline. Falhas de rede marcam
// o item como 'erro' sem descartar os dados -- a proxima sincronizacao
// tenta de novo (por isso 'erro' tambem entra no filtro abaixo).
export async function syncPendingInspecoes(): Promise<SyncResult> {
  const pendentes = (await listInspecoesLocais()).filter((i) => i.status === 'pendente' || i.status === 'erro')
  const dispositivoId = await getOrCreateDeviceId()

  let synced = 0
  let failed = 0

  for (const item of pendentes) {
    try {
      const { data } = await api.post('/inspecoes', {
        talhao_id: item.talhao_id,
        data: item.data,
        estadio_fenologico: item.estadio_fenologico,
        observacoes: item.observacoes,
      })

      await api.post('/sincronizacao-log', {
        dispositivo_id: dispositivoId,
        entidade_referenciada: 'inspecoes',
        entidade_id: data.id,
        operacao: 'criar',
        timestamp_local: item.criado_em_local,
      })

      await updateInspecaoLocalStatus(item.id, 'sincronizado', data.id)
      synced++
    } catch {
      await updateInspecaoLocalStatus(item.id, 'erro', undefined, 'Falha ao sincronizar — será reenviada')
      failed++
    }
  }

  return { synced, failed }
}

// No React Native nativo, FormData aceita um objeto {uri,name,type} no lugar
// de um Blob (a propria ponte de rede le o arquivo local pelo uri). No modo
// web (react-native-web), local_uri e uma data:/blob: URI e precisa virar
// um Blob de verdade via fetch antes de anexar ao FormData.
export async function buildFotoFormData(localUri: string): Promise<FormData> {
  const formData = new FormData()
  if (Platform.OS === 'web') {
    const response = await fetch(localUri)
    const blob = await response.blob()
    formData.append('file', blob, 'foto.jpg')
  } else {
    formData.append('file', {
      uri: localUri,
      name: 'foto.jpg',
      type: 'image/jpeg',
    } as unknown as Blob)
  }
  return formData
}

// Mesmo padrao de syncPendingInspecoes, com um passo a mais: sobe o arquivo
// para /uploads (MinIO/S3) antes de criar o registro de fotografia com a
// URL retornada.
export async function syncPendingFotografias(): Promise<SyncResult> {
  const pendentes = (await listFotografiasLocais()).filter((i) => i.status === 'pendente' || i.status === 'erro')
  const dispositivoId = await getOrCreateDeviceId()

  let synced = 0
  let failed = 0

  for (const item of pendentes) {
    try {
      const formData = await buildFotoFormData(item.local_uri)
      const { data: uploadData } = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const { data } = await api.post('/fotografias', {
        talhao_id: item.talhao_id,
        inspecao_id: item.inspecao_id,
        tipo: item.tipo,
        url_arquivo: uploadData.url,
      })

      await api.post('/sincronizacao-log', {
        dispositivo_id: dispositivoId,
        entidade_referenciada: 'fotografias',
        entidade_id: data.id,
        operacao: 'criar',
        timestamp_local: item.criado_em_local,
      })

      await updateFotografiaLocalStatus(item.id, 'sincronizado', data.id)
      synced++
    } catch {
      await updateFotografiaLocalStatus(item.id, 'erro', undefined, 'Falha ao sincronizar — será reenviada')
      failed++
    }
  }

  return { synced, failed }
}

// Versao generica de syncPendingInspecoes/Fotografias para as entidades mais
// novas (aplicacoes, analises de solo, ocorrencias de pragas/doencas): mesmo
// padrao (pendente/erro -> POST no endpoint -> POST em sincronizacao-log),
// parametrizado para nao repetir o for-loop 4 vezes.
async function syncQueue<T>(
  queueKey: string,
  entidadeReferenciada: string,
  endpoint: string,
  buildPayload: (payload: T) => Record<string, unknown>,
): Promise<SyncResult> {
  const pendentes = (await listQueue<T>(queueKey)).filter((i) => i.status === 'pendente' || i.status === 'erro')
  const dispositivoId = await getOrCreateDeviceId()

  let synced = 0
  let failed = 0

  for (const item of pendentes) {
    try {
      const { data } = await api.post(endpoint, buildPayload(item.payload))

      await api.post('/sincronizacao-log', {
        dispositivo_id: dispositivoId,
        entidade_referenciada: entidadeReferenciada,
        entidade_id: data.id,
        operacao: 'criar',
        timestamp_local: item.criado_em_local,
      })

      await updateQueueStatus(queueKey, item.id, 'sincronizado', data.id)
      synced++
    } catch {
      await updateQueueStatus(queueKey, item.id, 'erro', undefined, 'Falha ao sincronizar — será reenviada')
      failed++
    }
  }

  return { synced, failed }
}

export interface AplicacaoPayload {
  talhao_id: string
  talhao_codigo: string
  produto: string | null
  ingrediente_ativo: string | null
  dose: string | null
  data: string | null
  volume_calda_l_ha: string | null
  tecnologia_aplicacao: string | null
}

export function syncPendingAplicacoes(): Promise<SyncResult> {
  return syncQueue<AplicacaoPayload>('aplicacoes', 'aplicacoes', '/aplicacoes', (p) => ({
    talhao_id: p.talhao_id,
    produto: p.produto,
    ingrediente_ativo: p.ingrediente_ativo,
    dose: p.dose ? Number(p.dose) : null,
    data: p.data,
    volume_calda_l_ha: p.volume_calda_l_ha ? Number(p.volume_calda_l_ha) : null,
    tecnologia_aplicacao: p.tecnologia_aplicacao,
  }))
}

export interface AnaliseSoloPayload {
  talhao_id: string
  talhao_codigo: string
  data: string | null
  ph: string | null
  materia_organica: string | null
}

export function syncPendingAnalisesSolo(): Promise<SyncResult> {
  return syncQueue<AnaliseSoloPayload>('analises_solo', 'analises_solo', '/analises-solo', (p) => ({
    talhao_id: p.talhao_id,
    data: p.data,
    ph: p.ph ? Number(p.ph) : null,
    materia_organica: p.materia_organica ? Number(p.materia_organica) : null,
  }))
}

export interface OcorrenciaPragaPayload {
  talhao_id: string
  talhao_codigo: string
  praga_id: string
  praga_nome: string
  estadio: string | null
  populacao_estimada: string | null
  nivel_dano: string | null
  nivel_controle: string | null
  data: string | null
}

export function syncPendingOcorrenciasPragas(): Promise<SyncResult> {
  return syncQueue<OcorrenciaPragaPayload>('ocorrencias_pragas', 'ocorrencias_pragas', '/ocorrencias-pragas', (p) => ({
    talhao_id: p.talhao_id,
    praga_id: p.praga_id,
    estadio: p.estadio,
    populacao_estimada: p.populacao_estimada ? Number(p.populacao_estimada) : null,
    nivel_dano: p.nivel_dano,
    nivel_controle: p.nivel_controle,
    data: p.data,
  }))
}

export interface OcorrenciaDoencaPayload {
  talhao_id: string
  talhao_codigo: string
  doenca_id: string
  doenca_nome: string
  severidade_percentual: string | null
  estadio_cultura: string | null
  data: string | null
}

export function syncPendingOcorrenciasDoencas(): Promise<SyncResult> {
  return syncQueue<OcorrenciaDoencaPayload>(
    'ocorrencias_doencas',
    'ocorrencias_doencas',
    '/ocorrencias-doencas',
    (p) => ({
      talhao_id: p.talhao_id,
      doenca_id: p.doenca_id,
      severidade_percentual: p.severidade_percentual ? Number(p.severidade_percentual) : null,
      estadio_cultura: p.estadio_cultura,
      data: p.data,
    }),
  )
}

export interface OcorrenciaPlantaDaninhaPayload {
  talhao_id: string
  talhao_codigo: string
  planta_daninha_id: string
  planta_daninha_nome: string
  nivel_infestacao: string | null
  estadio_cultura: string | null
  data: string | null
}

export function syncPendingOcorrenciasPlantasDaninhas(): Promise<SyncResult> {
  return syncQueue<OcorrenciaPlantaDaninhaPayload>(
    'ocorrencias_plantas_daninhas',
    'ocorrencias_plantas_daninhas',
    '/ocorrencias-plantas-daninhas',
    (p) => ({
      talhao_id: p.talhao_id,
      planta_daninha_id: p.planta_daninha_id,
      nivel_infestacao: p.nivel_infestacao,
      estadio_cultura: p.estadio_cultura,
      data: p.data,
    }),
  )
}

export interface PlantaAtipicaPayload {
  talhao_id: string
  talhao_codigo: string
  caracteristica_avaliada: string | null
  conforme_padrao: boolean | null
  justificativa_tecnica: string | null
  data: string | null
}

export function syncPendingPlantasAtipicas(): Promise<SyncResult> {
  return syncQueue<PlantaAtipicaPayload>('plantas_atipicas', 'plantas_atipicas_ocorrencias', '/plantas-atipicas', (p) => ({
    talhao_id: p.talhao_id,
    caracteristica_avaliada: p.caracteristica_avaliada,
    conforme_padrao: p.conforme_padrao,
    justificativa_tecnica: p.justificativa_tecnica,
    data: p.data,
  }))
}

export interface ColheitaPayload {
  talhao_id: string
  talhao_codigo: string
  safra_id: string | null
  safra_nome: string | null
  data: string | null
  quantidade_kg: string | null
  umidade_colheita: string | null
  qualidade_semente: string | null
}

export function syncPendingColheita(): Promise<SyncResult> {
  return syncQueue<ColheitaPayload>('colheita', 'colheita', '/colheita', (p) => ({
    talhao_id: p.talhao_id,
    safra_id: p.safra_id,
    data: p.data,
    quantidade_kg: p.quantidade_kg ? Number(p.quantidade_kg) : null,
    umidade_colheita: p.umidade_colheita ? Number(p.umidade_colheita) : null,
    qualidade_semente: p.qualidade_semente,
  }))
}
