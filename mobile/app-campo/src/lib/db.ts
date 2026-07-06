import { Platform } from 'react-native'

export interface TalhaoCache {
  id: string
  codigo: string
  fazenda_nome: string
  cultivar_nome: string | null
  safra_nome: string | null
  area_ha: string | null
}

export type InspecaoStatus = 'pendente' | 'sincronizado' | 'erro'

export interface InspecaoLocal {
  id: string
  talhao_id: string
  talhao_codigo: string
  data: string
  estadio_fenologico: string | null
  observacoes: string | null
  criado_em_local: string
  status: InspecaoStatus
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
  `)
  return db
}

function getSqliteDb() {
  sqliteDbPromise = sqliteDbPromise ?? openSqliteDb()
  return sqliteDbPromise
}

const WEB_TALHOES_KEY = 'agronomo_ia_talhoes_cache'
const WEB_INSPECOES_KEY = 'agronomo_ia_inspecoes_locais'

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
  status: InspecaoStatus,
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
