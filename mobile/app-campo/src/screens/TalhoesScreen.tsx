import { useCallback, useEffect, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { api } from '../lib/api'
import { getTalhoes, upsertCache, upsertTalhoes, type SafraCache, type TalhaoCache } from '../lib/db'

interface ApiRow {
  id: string
  [key: string]: unknown
}

export function TalhoesScreen() {
  const [talhoes, setTalhoes] = useState<TalhaoCache[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadedFromCache, setLoadedFromCache] = useState(false)

  const loadFromCache = useCallback(async () => {
    const cached = await getTalhoes()
    setTalhoes(cached)
    setLoadedFromCache(true)
  }, [])

  const sync = useCallback(async () => {
    setRefreshing(true)
    setError(null)
    try {
      const [talhoesRes, fazendasRes, cultivaresRes, safrasRes, pragasRes, doencasRes, plantasDaninhasRes] =
        await Promise.all([
          api.get<ApiRow[]>('/talhoes'),
          api.get<ApiRow[]>('/fazendas'),
          api.get<ApiRow[]>('/cultivares'),
          api.get<ApiRow[]>('/safras'),
          api.get<ApiRow[]>('/pragas-catalogo'),
          api.get<ApiRow[]>('/doencas-catalogo'),
          api.get<ApiRow[]>('/plantas-daninhas-catalogo'),
        ])

      const fazendaNomes = new Map(fazendasRes.data.map((f) => [f.id, String(f.nome ?? '')]))
      const cultivarNomes = new Map(cultivaresRes.data.map((c) => [c.id, String(c.nome ?? '')]))
      const safraNomes = new Map(safrasRes.data.map((s) => [s.id, String(s.nome ?? '')]))

      const rows: TalhaoCache[] = talhoesRes.data.map((t) => ({
        id: t.id,
        codigo: String(t.codigo ?? ''),
        fazenda_nome: fazendaNomes.get(t.fazenda_id as string) ?? '—',
        cultivar_nome: t.cultivar_id ? (cultivarNomes.get(t.cultivar_id as string) ?? null) : null,
        safra_nome: t.safra_id ? (safraNomes.get(t.safra_id as string) ?? null) : null,
        area_ha: t.area_ha ? String(t.area_ha) : null,
      }))

      await upsertTalhoes(rows)
      await upsertCache(
        'pragas_catalogo',
        pragasRes.data.map((p) => ({ id: p.id, nome_comum: String(p.nome_comum ?? p.id) })),
      )
      await upsertCache(
        'doencas_catalogo',
        doencasRes.data.map((d) => ({ id: d.id, nome: String(d.nome ?? d.id) })),
      )
      await upsertCache<SafraCache>(
        'safras',
        safrasRes.data.map((s) => ({ id: s.id, nome: String(s.nome ?? s.id) })),
      )
      await upsertCache(
        'plantas_daninhas_catalogo',
        plantasDaninhasRes.data.map((p) => ({ id: p.id, nome_comum: String(p.nome_comum ?? p.id) })),
      )
      setTalhoes(rows)
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
        <Text style={styles.title}>Talhões</Text>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={talhoes}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={sync} />}
        contentContainerStyle={talhoes.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          loadedFromCache ? <Text style={styles.empty}>Nenhum talhão sincronizado ainda</Text> : null
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemCodigo}>{item.codigo}</Text>
            <Text style={styles.itemLine}>Fazenda: {item.fazenda_nome}</Text>
            {item.cultivar_nome && <Text style={styles.itemLine}>Cultivar: {item.cultivar_nome}</Text>}
            {item.safra_nome && <Text style={styles.itemLine}>Safra: {item.safra_nome}</Text>}
            {item.area_ha && <Text style={styles.itemLine}>Área: {item.area_ha} ha</Text>}
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
