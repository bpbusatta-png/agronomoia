import { Platform } from 'react-native'
import { getOrCreateDeviceId } from './deviceId'
import { api } from './api'
import {
  listFotografiasLocais,
  listInspecoesLocais,
  updateFotografiaLocalStatus,
  updateInspecaoLocalStatus,
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
async function buildFotoFormData(localUri: string): Promise<FormData> {
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
