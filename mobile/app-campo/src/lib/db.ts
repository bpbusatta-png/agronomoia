import { Platform } from 'react-native'

export interface TalhaoCache {
  id: string
  codigo: string
  fazenda_nome: string
  cultivar_nome: string | null
  safra_nome: string | null
  area_ha: string | null
}

// expo-sqlite roda nativamente em iOS/Android (banco local real, persistido
// entre sessoes). No modo web (usado apenas para testar este app neste
// ambiente de desenvolvimento, sem emulador disponivel) cai para
// localStorage, mantendo a mesma interface assincrona.

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
  `)
  return db
}

function getSqliteDb() {
  sqliteDbPromise = sqliteDbPromise ?? openSqliteDb()
  return sqliteDbPromise
}

const WEB_STORAGE_KEY = 'agronomo_ia_talhoes_cache'

export async function upsertTalhoes(items: TalhaoCache[]): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(items))
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
    const stored = window.localStorage.getItem(WEB_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  }
  const db = await getSqliteDb()
  return db.getAllAsync<TalhaoCache>('SELECT * FROM talhoes_cache ORDER BY codigo')
}
