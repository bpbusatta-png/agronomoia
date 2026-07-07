import { useCallback, useEffect, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { api } from '../lib/api'
import { getCache, getTalhoes, upsertCache, type ProdutividadeEstimativaCache, type TalhaoCache } from '../lib/db'

interface ApiRow {
  id: string
  [key: string]: unknown
}

export function ProdutividadeScreen() {
  const [estimativas, setEstimativas] = useState<ProdutividadeEstimativaCache[]>([])
  const [talhaoCodigos, setTalhaoCodigos] = useState<Map<string, string>>(new Map())
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadedFromCache, setLoadedFromCache] = useState(false)

  const loadFromCache = useCallback(async () => {
    const [cached, talhoes] = await Promise.all([
      getCache<ProdutividadeEstimativaCache>('produtividade_estimativas'),
      getTalhoes(),
    ])
    setEstimativas(cached)
    setTalhaoCodigos(new Map(talhoes.map((t: TalhaoCache) => [t.id, t.codigo])))
    setLoadedFromCache(true)
  }, [])

  const sync = useCallback(async () => {
    setRefreshing(true)
    setError(null)
    try {
      const { data } = await api.get<ApiRow[]>('/produtividade-estimativas')
      const rows: ProdutividadeEstimativaCache[] = data.map((p) => ({
        id: p.id as string,
        talhao_id: p.talhao_id as string,
        safra_id: (p.safra_id as string) ?? null,
        data: (p.data as string) ?? null,
        produtividade_estimada_kg_ha:
          p.produtividade_estimada_kg_ha != null ? String(p.produtividade_estimada_kg_ha) : null,
        intervalo_confianca_min: p.intervalo_confianca_min != null ? String(p.intervalo_confianca_min) : null,
        intervalo_confianca_max: p.intervalo_confianca_max != null ? String(p.intervalo_confianca_max) : null,
      }))
      await upsertCache('produtividade_estimativas', rows)
      setEstimativas(rows)
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
        <Text style={styles.title}>Produtividade</Text>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={estimativas}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={sync} />}
        contentContainerStyle={estimativas.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          loadedFromCache ? <Text style={styles.empty}>Nenhuma estimativa sincronizada ainda</Text> : null
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemCodigo}>{talhaoCodigos.get(item.talhao_id) ?? '—'}</Text>
            {item.data && <Text style={styles.itemLine}>Data: {item.data}</Text>}
            {item.produtividade_estimada_kg_ha && (
              <Text style={styles.itemLine}>Estimativa: {item.produtividade_estimada_kg_ha} kg/ha</Text>
            )}
            {item.intervalo_confianca_min && item.intervalo_confianca_max && (
              <Text style={styles.itemLine}>
                Intervalo de confiança: {item.intervalo_confianca_min} – {item.intervalo_confianca_max} kg/ha
              </Text>
            )}
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
    paddingTop: 16,
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
