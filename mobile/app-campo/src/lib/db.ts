import { Platform } from 'react-native'

export interface TalhaoCache {
  id: string
  codigo: string
  fazenda_nome: string
  cultivar_nome: string | null
  safra_nome: string | null
  area_ha: string | null
}

export interface PragaCatalogoCache {
  id: string
  nome_comum: string
}

export interface DoencaCatalogoCache {
  id: string
  nome: string
}

export interface SafraCache {
  id: string
  nome: string
}

export interface NdviLeituraCache {
  id: string
  talhao_id: string
  data: string | null
  fonte: string | null
  ndvi_medio: string | null
  ndre_medio: string | null
  msavi_medio: string | null
}

export interface ProdutividadeEstimativaCache {
  id: string
  talhao_id: string
  safra_id: string | null
  data: string | null
  produtividade_estimada_kg_ha: string | null
  intervalo_confianca_min: string | null
  intervalo_confianca_max: string | null
}

export type SyncStatus = 'pendente' | 'sincronizado' | 'erro'

export interface InspecaoLocal {
  id: string
  talhao_id: string
  talhao_codigo: string
  data: string
  estadio_fenologico: string | null
  observacoes: string | null
  criado_em_local: string
  status: SyncStatus
  remote_id: string | null
  erro_mensagem: string | null
}

export interface FotografiaLocal {
  id: string
  talhao_id: string
  talhao_codigo: string
  inspecao_id: string | null
  tipo: string | null
  local_uri: string
  criado_em_local: string
  status: SyncStatus
  remote_id: string | null
  erro_mensagem: string | null
}

// expo-sqlite roda nativamente em iOS/Android (banco local real, persistido
// entre sessoes -- inclusive offline). No modo web (usado apenas para testar
// este app neste ambiente de desenvolvimento, sem emulador disponivel) cai
// para localStorage, mantendo a mesma interface assincrona.

let sqliteDbPromise: ReturnType<typeof openSqliteDb> | null = null

async function openSqliteDb() {
  const SQLite = await import('expo-sqlite')
  const db = await SQLite.openDatabaseAsync('agronomo_ia.db')
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS talhoes_cache (
      id TEXT PRIMARY KEY,
      codigo TEXT,
      fazenda_nome TEXT,
      cultivar_nome TEXT,
      safra_nome TEXT,
      area_ha TEXT
    );
    CREATE TABLE IF NOT EXISTS inspecoes_locais (
      id TEXT PRIMARY KEY,
      talhao_id TEXT,
      talhao_codigo TEXT,
      data TEXT,
      estadio_fenologico TEXT,
      observacoes TEXT,
      criado_em_local TEXT,
      status TEXT,
      remote_id TEXT,
      erro_mensagem TEXT
    );
    CREATE TABLE IF NOT EXISTS fotografias_locais (
      id TEXT PRIMARY KEY,
      talhao_id TEXT,
      talhao_codigo TEXT,
      inspecao_id TEXT,
      tipo TEXT,
      local_uri TEXT,
      criado_em_local TEXT,
      status TEXT,
      remote_id TEXT,
      erro_mensagem TEXT
    );
    CREATE TABLE IF NOT EXISTS reference_cache (
      cache_key TEXT NOT NULL,
      id TEXT NOT NULL,
      data TEXT,
      PRIMARY KEY (cache_key, id)
    );
    CREATE TABLE IF NOT EXISTS local_queue (
      queue_key TEXT NOT NULL,
      id TEXT NOT NULL,
      data TEXT,
      criado_em_local TEXT,
      status TEXT,
      remote_id TEXT,
      erro_mensagem TEXT,
      PRIMARY KEY (queue_key, id)
    );
  `)
  return db
}

function getSqliteDb() {
  sqliteDbPromise = sqliteDbPromise ?? openSqliteDb()
  return sqliteDbPromise
}

const WEB_TALHOES_KEY = 'agronomo_ia_talhoes_cache'
const WEB_INSPECOES_KEY = 'agronomo_ia_inspecoes_locais'
const WEB_FOTOGRAFIAS_KEY = 'agronomo_ia_fotografias_locais'

// --- Talhoes (cache somente-leitura, sobrescrito a cada sincronizacao) ---

export async function upsertTalhoes(items: TalhaoCache[]): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(WEB_TALHOES_KEY, JSON.stringify(items))
    }
    return
  }
  const db = await getSqliteDb()
  await db.withTransactionAsync(async () => {
    for (const item of items) {
      await db.runAsync(
        `INSERT OR REPLACE INTO talhoes_cache (id, codigo, fazenda_nome, cultivar_nome, safra_nome, area_ha)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [item.id, item.codigo, item.fazenda_nome, item.cultivar_nome, item.safra_nome, item.area_ha],
      )
    }
  })
}

export async function getTalhoes(): Promise<TalhaoCache[]> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return []
    const stored = window.localStorage.getItem(WEB_TALHOES_KEY)
    return stored ? JSON.parse(stored) : []
  }
  const db = await getSqliteDb()
  return db.getAllAsync<TalhaoCache>('SELECT * FROM talhoes_cache ORDER BY codigo')
}

// --- Inspecoes locais (cadastro offline + fila de sincronizacao) ---

async function readWebInspecoes(): Promise<InspecaoLocal[]> {
  if (typeof window === 'undefined') return []
  const stored = window.localStorage.getItem(WEB_INSPECOES_KEY)
  return stored ? JSON.parse(stored) : []
}

async function writeWebInspecoes(items: InspecaoLocal[]): Promise<void> {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(WEB_INSPECOES_KEY, JSON.stringify(items))
  }
}

export async function addInspecaoLocal(input: {
  talhao_id: string
  talhao_codigo: string
  data: string
  estadio_fenologico: string | null
  observacoes: string | null
}): Promise<InspecaoLocal> {
  const item: InspecaoLocal = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...input,
    criado_em_local: new Date().toISOString(),
    status: 'pendente',
    remote_id: null,
    erro_mensagem: null,
  }

  if (Platform.OS === 'web') {
    const items = await readWebInspecoes()
    items.unshift(item)
    await writeWebInspecoes(items)
    return item
  }

  const db = await getSqliteDb()
  await db.runAsync(
    `INSERT INTO inspecoes_locais
       (id, talhao_id, talhao_codigo, data, estadio_fenologico, observacoes, criado_em_local, status, remote_id, erro_mensagem)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.id,
      item.talhao_id,
      item.talhao_codigo,
      item.data,
      item.estadio_fenologico,
      item.observacoes,
      item.criado_em_local,
      item.status,
      item.remote_id,
      item.erro_mensagem,
    ],
  )
  return item
}

export async function listInspecoesLocais(): Promise<InspecaoLocal[]> {
  if (Platform.OS === 'web') {
    const items = await readWebInspecoes()
    return items.sort((a, b) => b.criado_em_local.localeCompare(a.criado_em_local))
  }
  const db = await getSqliteDb()
  return db.getAllAsync<InspecaoLocal>('SELECT * FROM inspecoes_locais ORDER BY criado_em_local DESC')
}

export async function updateInspecaoLocalStatus(
  id: string,
  status: SyncStatus,
  remoteId?: string,
  erroMensagem?: string,
): Promise<void> {
  if (Platform.OS === 'web') {
    const items = await readWebInspecoes()
    const updated = items.map((i) =>
      i.id === id ? { ...i, status, remote_id: remoteId ?? i.remote_id, erro_mensagem: erroMensagem ?? null } : i,
    )
    await writeWebInspecoes(updated)
    return
  }
  const db = await getSqliteDb()
  await db.runAsync(`UPDATE inspecoes_locais SET status = ?, remote_id = ?, erro_mensagem = ? WHERE id = ?`, [
    status,
    remoteId ?? null,
    erroMensagem ?? null,
    id,
  ])
}

// --- Fotografias locais (mesmo padrao das inspecoes, + arquivo local) ---

async function readWebFotografias(): Promise<FotografiaLocal[]> {
  if (typeof window === 'undefined') return []
  const stored = window.localStorage.getItem(WEB_FOTOGRAFIAS_KEY)
  return stored ? JSON.parse(stored) : []
}

async function writeWebFotografias(items: FotografiaLocal[]): Promise<void> {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(WEB_FOTOGRAFIAS_KEY, JSON.stringify(items))
  }
}

export async function addFotografiaLocal(input: {
  talhao_id: string
  talhao_codigo: string
  inspecao_id: string | null
  tipo: string | null
  local_uri: string
}): Promise<FotografiaLocal> {
  const item: FotografiaLocal = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...input,
    criado_em_local: new Date().toISOString(),
    status: 'pendente',
    remote_id: null,
    erro_mensagem: null,
  }

  if (Platform.OS === 'web') {
    const items = await readWebFotografias()
    items.unshift(item)
    await writeWebFotografias(items)
    return item
  }

  const db = await getSqliteDb()
  await db.runAsync(
    `INSERT INTO fotografias_locais
       (id, talhao_id, talhao_codigo, inspecao_id, tipo, local_uri, criado_em_local, status, remote_id, erro_mensagem)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.id,
      item.talhao_id,
      item.talhao_codigo,
      item.inspecao_id,
      item.tipo,
      item.local_uri,
      item.criado_em_local,
      item.status,
      item.remote_id,
      item.erro_mensagem,
    ],
  )
  return item
}

export async function listFotografiasLocais(): Promise<FotografiaLocal[]> {
  if (Platform.OS === 'web') {
    const items = await readWebFotografias()
    return items.sort((a, b) => b.criado_em_local.localeCompare(a.criado_em_local))
  }
  const db = await getSqliteDb()
  return db.getAllAsync<FotografiaLocal>('SELECT * FROM fotografias_locais ORDER BY criado_em_local DESC')
}

export async function updateFotografiaLocalStatus(
  id: string,
  status: SyncStatus,
  remoteId?: string,
  erroMensagem?: string,
): Promise<void> {
  if (Platform.OS === 'web') {
    const items = await readWebFotografias()
    const updated = items.map((i) =>
      i.id === id ? { ...i, status, remote_id: remoteId ?? i.remote_id, erro_mensagem: erroMensagem ?? null } : i,
    )
    await writeWebFotografias(updated)
    return
  }
  const db = await getSqliteDb()
  await db.runAsync(`UPDATE fotografias_locais SET status = ?, remote_id = ?, erro_mensagem = ? WHERE id = ?`, [
    status,
    remoteId ?? null,
    erroMensagem ?? null,
    id,
  ])
}

// --- Cache de referencia generico (catalogos somente-leitura: pragas,
// doencas, etc. -- mesmo padrao de talhoes_cache, mas sem precisar de uma
// tabela/funcao nova por catalogo) ---

export async function upsertCache<T extends { id: string }>(cacheKey: string, items: T[]): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`agronomo_ia_cache_${cacheKey}`, JSON.stringify(items))
    }
    return
  }
  const db = await getSqliteDb()
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM reference_cache WHERE cache_key = ?', [cacheKey])
    for (const item of items) {
      await db.runAsync('INSERT INTO reference_cache (cache_key, id, data) VALUES (?, ?, ?)', [
        cacheKey,
        item.id,
        JSON.stringify(item),
      ])
    }
  })
}

export async function getCache<T>(cacheKey: string): Promise<T[]> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return []
    const stored = window.localStorage.getItem(`agronomo_ia_cache_${cacheKey}`)
    return stored ? JSON.parse(stored) : []
  }
  const db = await getSqliteDb()
  const rows = await db.getAllAsync<{ data: string }>('SELECT data FROM reference_cache WHERE cache_key = ?', [
    cacheKey,
  ])
  return rows.map((r) => JSON.parse(r.data))
}

// --- Fila offline generica (cadastro offline + sincronizacao para
// entidades novas: aplicacoes, analises de solo, ocorrencias de pragas/
// doencas -- mesmo padrao de inspecoes_locais/fotografias_locais, sem
// precisar de uma tabela/funcao nova por entidade) ---

export interface QueueItem<T> {
  id: string
  payload: T
  criado_em_local: string
  status: SyncStatus
  remote_id: string | null
  erro_mensagem: string | null
}

async function getWebQueueRaw(queueKey: string): Promise<QueueItem<unknown>[]> {
  if (typeof window === 'undefined') return []
  const stored = window.localStorage.getItem(`agronomo_ia_queue_${queueKey}`)
  return stored ? JSON.parse(stored) : []
}

async function setWebQueueRaw(queueKey: string, items: QueueItem<unknown>[]): Promise<void> {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(`agronomo_ia_queue_${queueKey}`, JSON.stringify(items))
  }
}

export async function addToQueue<T extends object>(queueKey: string, payload: T): Promise<QueueItem<T>> {
  const item: QueueItem<T> = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    payload,
    criado_em_local: new Date().toISOString(),
    status: 'pendente',
    remote_id: null,
    erro_mensagem: null,
  }

  if (Platform.OS === 'web') {
    const items = await getWebQueueRaw(queueKey)
    items.unshift(item as QueueItem<unknown>)
    await setWebQueueRaw(queueKey, items)
    return item
  }

  const db = await getSqliteDb()
  await db.runAsync(
    `INSERT INTO local_queue (queue_key, id, data, criado_em_local, status, remote_id, erro_mensagem)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [queueKey, item.id, JSON.stringify(payload), item.criado_em_local, item.status, item.remote_id, item.erro_mensagem],
  )
  return item
}

export async function listQueue<T>(queueKey: string): Promise<QueueItem<T>[]> {
  if (Platform.OS === 'web') {
    const items = (await getWebQueueRaw(queueKey)) as QueueItem<T>[]
    return items.sort((a, b) => b.criado_em_local.localeCompare(a.criado_em_local))
  }
  const db = await getSqliteDb()
  const rows = await db.getAllAsync<{
    id: string
    data: string
    criado_em_local: string
    status: SyncStatus
    remote_id: string | null
    erro_mensagem: string | null
  }>('SELECT * FROM local_queue WHERE queue_key = ? ORDER BY criado_em_local DESC', [queueKey])
  return rows.map((r) => ({
    id: r.id,
    payload: JSON.parse(r.data) as T,
    criado_em_local: r.criado_em_local,
    status: r.status,
    remote_id: r.remote_id,
    erro_mensagem: r.erro_mensagem,
  }))
}

export async function updateQueueStatus(
  queueKey: string,
  id: string,
  status: SyncStatus,
  remoteId?: string,
  erroMensagem?: string,
): Promise<void> {
  if (Platform.OS === 'web') {
    const items = await getWebQueueRaw(queueKey)
    const updated = items.map((i) =>
      i.id === id ? { ...i, status, remote_id: remoteId ?? i.remote_id, erro_mensagem: erroMensagem ?? null } : i,
    )
    await setWebQueueRaw(queueKey, updated)
    return
  }
  const db = await getSqliteDb()
  await db.runAsync(
    'UPDATE local_queue SET status = ?, remote_id = ?, erro_mensagem = ? WHERE queue_key = ? AND id = ?',
    [status, remoteId ?? null, erroMensagem ?? null, queueKey, id],
  )
}
