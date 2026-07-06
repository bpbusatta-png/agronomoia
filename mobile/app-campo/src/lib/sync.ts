import { getOrCreateDeviceId } from './deviceId'
import { api } from './api'
import { listInspecoesLocais, updateInspecaoLocalStatus } from './db'

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
