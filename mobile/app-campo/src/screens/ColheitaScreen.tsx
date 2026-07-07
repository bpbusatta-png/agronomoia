import { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { CachePickerModal } from '../components/CachePickerModal'
import { addToQueue, getCache, getTalhoes, listQueue, type QueueItem, type SafraCache, type TalhaoCache } from '../lib/db'
import { syncPendingColheita, type ColheitaPayload } from '../lib/sync'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function ColheitaScreen() {
  const [talhoes, setTalhoes] = useState<TalhaoCache[]>([])
  const [safras, setSafras] = useState<SafraCache[]>([])
  const [registros, setRegistros] = useState<QueueItem<ColheitaPayload>[]>([])
  const [selectedTalhao, setSelectedTalhao] = useState<TalhaoCache | null>(null)
  const [selectedSafra, setSelectedSafra] = useState<SafraCache | null>(null)
  const [quantidadeKg, setQuantidadeKg] = useState('')
  const [umidade, setUmidade] = useState('')
  const [qualidadeSemente, setQualidadeSemente] = useState('')
  const [data, setData] = useState(today())
  const [talhaoPickerVisible, setTalhaoPickerVisible] = useState(false)
  const [safraPickerVisible, setSafraPickerVisible] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const [t, s, r] = await Promise.all([
      getTalhoes(),
      getCache<SafraCache>('safras'),
      listQueue<ColheitaPayload>('colheita'),
    ])
    setTalhoes(t)
    setSafras(s)
    setRegistros(r)
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  async function handleSalvar() {
    setSaveError(null)
    if (!selectedTalhao) {
      setSaveError('Selecione um talhão')
      return
    }
    await addToQueue<ColheitaPayload>('colheita', {
      talhao_id: selectedTalhao.id,
      talhao_codigo: selectedTalhao.codigo,
      safra_id: selectedSafra?.id ?? null,
      safra_nome: selectedSafra?.nome ?? null,
      quantidade_kg: quantidadeKg || null,
      umidade_colheita: umidade || null,
      qualidade_semente: qualidadeSemente || null,
      data,
    })
    setSelectedTalhao(null)
    setSelectedSafra(null)
    setQuantidadeKg('')
    setUmidade('')
    setQualidadeSemente('')
    setData(today())
    await reload()
    handleSincronizar()
  }

  async function handleSincronizar() {
    setSyncing(true)
    setSyncMessage(null)
    try {
      const result = await syncPendingColheita()
      setSyncMessage(
        result.synced || result.failed
          ? `${result.synced} sincronizada(s)${result.failed ? `, ${result.failed} com falha (tentará de novo)` : ''}`
          : 'Nada pendente para sincronizar',
      )
    } finally {
      setSyncing(false)
      await reload()
    }
  }

  const pendentesCount = registros.filter((r) => r.status === 'pendente' || r.status === 'erro').length

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nova colheita</Text>

      <Text style={styles.label}>Talhão</Text>
      <Pressable style={styles.selectBox} onPress={() => setTalhaoPickerVisible(true)} testID="talhao-select-colheita">
        <Text style={selectedTalhao ? styles.selectText : styles.selectPlaceholder}>
          {selectedTalhao ? selectedTalhao.codigo : 'Selecione...'}
        </Text>
      </Pressable>

      <Text style={styles.label}>Safra</Text>
      <Pressable style={styles.selectBox} onPress={() => setSafraPickerVisible(true)} testID="safra-select-colheita">
        <Text style={selectedSafra ? styles.selectText : styles.selectPlaceholder}>
          {selectedSafra ? selectedSafra.nome : 'Selecione... (opcional)'}
        </Text>
      </Pressable>

      <Text style={styles.label}>Quantidade (kg)</Text>
      <TextInput
        style={styles.input}
        value={quantidadeKg}
        onChangeText={setQuantidadeKg}
        keyboardType="numeric"
        testID="quantidade-kg-input"
      />

      <Text style={styles.label}>Umidade na colheita (%)</Text>
      <TextInput style={styles.input} value={umidade} onChangeText={setUmidade} keyboardType="numeric" />

      <Text style={styles.label}>Qualidade da semente</Text>
      <TextInput style={styles.input} value={qualidadeSemente} onChangeText={setQualidadeSemente} />

      <Text style={styles.label}>Data</Text>
      <TextInput style={styles.input} value={data} onChangeText={setData} placeholder="AAAA-MM-DD" />

      {saveError && <Text style={styles.error}>{saveError}</Text>}

      <Pressable style={styles.saveButton} onPress={handleSalvar} testID="salvar-colheita-button">
        <Text style={styles.saveButtonText}>Salvar (funciona offline)</Text>
      </Pressable>

      <View style={styles.syncRow}>
        <Text style={styles.pendingText}>{pendentesCount} pendente(s) de sincronização</Text>
        <Pressable onPress={handleSincronizar} disabled={syncing}>
          <Text style={styles.syncLink}>{syncing ? 'Sincronizando...' : 'Sincronizar agora'}</Text>
        </Pressable>
      </View>
      {syncMessage && <Text style={styles.syncMessage}>{syncMessage}</Text>}

      <FlatList
        style={styles.list}
        data={registros}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemCodigo}>{item.payload.talhao_codigo}</Text>
              <Text style={statusStyle(item.status)}>{statusLabel(item.status)}</Text>
            </View>
            {item.payload.quantidade_kg && (
              <Text style={styles.itemLine}>Quantidade: {item.payload.quantidade_kg} kg</Text>
            )}
            <Text style={styles.itemLine}>Data: {item.payload.data}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma colheita registrada ainda</Text>}
      />

      <CachePickerModal
        visible={talhaoPickerVisible}
        title="Selecione o talhão"
        items={talhoes}
        labelFor={(item) => `${item.codigo} — ${item.fazenda_nome}`}
        onSelect={(item) => {
          setSelectedTalhao(item)
          setTalhaoPickerVisible(false)
        }}
        onClose={() => setTalhaoPickerVisible(false)}
      />

      <CachePickerModal
        visible={safraPickerVisible}
        title="Selecione a safra"
        items={safras}
        labelFor={(item) => item.nome}
        onSelect={(item) => {
          setSelectedSafra(item)
          setSafraPickerVisible(false)
        }}
        onClose={() => setSafraPickerVisible(false)}
      />
    </View>
  )
}

function statusLabel(status: QueueItem<unknown>['status']) {
  if (status === 'sincronizado') return 'Sincronizado'
  if (status === 'erro') return 'Erro — será reenviado'
  return 'Pendente'
}

function statusStyle(status: QueueItem<unknown>['status']) {
  if (status === 'sincronizado') return styles.statusOk
  if (status === 'erro') return styles.statusErro
  return styles.statusPendente
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#08060d',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: '#4b5563',
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  selectBox: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  selectText: {
    fontSize: 14,
    color: '#08060d',
  },
  selectPlaceholder: {
    fontSize: 14,
    color: '#9ca3af',
  },
  error: {
    color: '#dc2626',
    fontSize: 13,
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#15803d',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  syncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  pendingText: {
    fontSize: 13,
    color: '#4b5563',
  },
  syncLink: {
    color: '#1d4ed8',
    fontSize: 13,
    fontWeight: '600',
  },
  syncMessage: {
    fontSize: 12,
    color: '#4b5563',
    marginTop: 4,
  },
  list: {
    marginTop: 12,
  },
  item: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemCodigo: {
    fontSize: 15,
    fontWeight: '600',
    color: '#08060d',
  },
  itemLine: {
    fontSize: 13,
    color: '#4b5563',
  },
  statusPendente: {
    fontSize: 12,
    color: '#b45309',
    fontWeight: '600',
  },
  statusOk: {
    fontSize: 12,
    color: '#15803d',
    fontWeight: '600',
  },
  statusErro: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
  },
  empty: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
})
