import { useCallback, useEffect, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { api } from '../lib/api'
import { getCache, getTalhoes, upsertCache, type NdviLeituraCache, type TalhaoCache } from '../lib/db'

interface ApiRow {
  id: string
  [key: string]: unknown
}

export function NdviScreen() {
  const [leituras, setLeituras] = useState<NdviLeituraCache[]>([])
  const [talhaoCodigos, setTalhaoCodigos] = useState<Map<string, string>>(new Map())
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadedFromCache, setLoadedFromCache] = useState(false)

  const loadFromCache = useCallback(async () => {
    const [cached, talhoes] = await Promise.all([getCache<NdviLeituraCache>('ndvi_leituras'), getTalhoes()])
    setLeituras(cached)
    setTalhaoCodigos(new Map(talhoes.map((t: TalhaoCache) => [t.id, t.codigo])))
    setLoadedFromCache(true)
  }, [])

  const sync = useCallback(async () => {
    setRefreshing(true)
    setError(null)
    try {
      const { data } = await api.get<ApiRow[]>('/ndvi-leituras')
      const rows: NdviLeituraCache[] = data.map((n) => ({
        id: n.id as string,
        talhao_id: n.talhao_id as string,
        data: (n.data as string) ?? null,
        fonte: (n.fonte as string) ?? null,
        ndvi_medio: n.ndvi_medio != null ? String(n.ndvi_medio) : null,
        ndre_medio: n.ndre_medio != null ? String(n.ndre_medio) : null,
        msavi_medio: n.msavi_medio != null ? String(n.msavi_medio) : null,
      }))
      await upsertCache('ndvi_leituras', rows)
      setLeituras(rows)
    } catch {
      setError('Não foi possível sincronizar. Mostrando dados salvos localmente.')
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadFromCache().then(() => sync())
  }, [loadFromCache, sync])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>NDVI</Text>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={leituras}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={sync} />}
        contentContainerStyle={leituras.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          loadedFromCache ? <Text style={styles.empty}>Nenhuma leitura de NDVI sincronizada ainda</Text> : null
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemCodigo}>{talhaoCodigos.get(item.talhao_id) ?? '—'}</Text>
            {item.data && <Text style={styles.itemLine}>Data: {item.data}</Text>}
            {item.fonte && <Text style={styles.itemLine}>Fonte: {item.fonte}</Text>}
            {item.ndvi_medio && <Text style={styles.itemLine}>NDVI médio: {item.ndvi_medio}</Text>}
            {item.ndre_medio && <Text style={styles.itemLine}>NDRE médio: {item.ndre_medio}</Text>}
            {item.msavi_medio && <Text style={styles.itemLine}>MSAVI médio: {item.msavi_medio}</Text>}
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    paddingTop: 56,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#08060d',
  },
  error: {
    color: '#b45309',
    fontSize: 13,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    color: '#9ca3af',
    fontSize: 14,
  },
  item: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
  },
  itemCodigo: {
    fontSize: 15,
    fontWeight: '600',
    color: '#08060d',
    marginBottom: 2,
  },
  itemLine: {
    fontSize: 13,
    color: '#4b5563',
  },
})
