import { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { CachePickerModal } from '../components/CachePickerModal'
import { addToQueue, getTalhoes, listQueue, type QueueItem, type TalhaoCache } from '../lib/db'
import { syncPendingAplicacoes, type AplicacaoPayload } from '../lib/sync'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function AplicacoesScreen() {
  const [talhoes, setTalhoes] = useState<TalhaoCache[]>([])
  const [aplicacoes, setAplicacoes] = useState<QueueItem<AplicacaoPayload>[]>([])
  const [selectedTalhao, setSelectedTalhao] = useState<TalhaoCache | null>(null)
  const [produto, setProduto] = useState('')
  const [ingredienteAtivo, setIngredienteAtivo] = useState('')
  const [dose, setDose] = useState('')
  const [data, setData] = useState(today())
  const [volumeCalda, setVolumeCalda] = useState('')
  const [tecnologia, setTecnologia] = useState('')
  const [pickerVisible, setPickerVisible] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const [t, a] = await Promise.all([getTalhoes(), listQueue<AplicacaoPayload>('aplicacoes')])
    setTalhoes(t)
    setAplicacoes(a)
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
    await addToQueue<AplicacaoPayload>('aplicacoes', {
      talhao_id: selectedTalhao.id,
      talhao_codigo: selectedTalhao.codigo,
      produto: produto || null,
      ingrediente_ativo: ingredienteAtivo || null,
      dose: dose || null,
      data,
      volume_calda_l_ha: volumeCalda || null,
      tecnologia_aplicacao: tecnologia || null,
    })
    setSelectedTalhao(null)
    setProduto('')
    setIngredienteAtivo('')
    setDose('')
    setData(today())
    setVolumeCalda('')
    setTecnologia('')
    await reload()
    handleSincronizar()
  }

  async function handleSincronizar() {
    setSyncing(true)
    setSyncMessage(null)
    try {
      const result = await syncPendingAplicacoes()
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

  const pendentesCount = aplicacoes.filter((a) => a.status === 'pendente' || a.status === 'erro').length

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nova aplicação</Text>

      <Text style={styles.label}>Talhão</Text>
      <Pressable style={styles.selectBox} onPress={() => setPickerVisible(true)} testID="talhao-select-aplicacao">
        <Text style={selectedTalhao ? styles.selectText : styles.selectPlaceholder}>
          {selectedTalhao ? selectedTalhao.codigo : 'Selecione...'}
        </Text>
      </Pressable>

      <Text style={styles.label}>Produto</Text>
      <TextInput style={styles.input} value={produto} onChangeText={setProduto} testID="produto-input" />

      <Text style={styles.label}>Ingrediente ativo</Text>
      <TextInput style={styles.input} value={ingredienteAtivo} onChangeText={setIngredienteAtivo} />

      <Text style={styles.label}>Dose</Text>
      <TextInput style={styles.input} value={dose} onChangeText={setDose} keyboardType="numeric" />

      <Text style={styles.label}>Data</Text>
      <TextInput style={styles.input} value={data} onChangeText={setData} placeholder="AAAA-MM-DD" />

      <Text style={styles.label}>Volume de calda (L/ha)</Text>
      <TextInput style={styles.input} value={volumeCalda} onChangeText={setVolumeCalda} keyboardType="numeric" />

      <Text style={styles.label}>Tecnologia de aplicação</Text>
      <TextInput style={styles.input} value={tecnologia} onChangeText={setTecnologia} />

      {saveError && <Text style={styles.error}>{saveError}</Text>}

      <Pressable style={styles.saveButton} onPress={handleSalvar} testID="salvar-aplicacao-button">
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
        data={aplicacoes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemCodigo}>{item.payload.talhao_codigo}</Text>
              <Text style={statusStyle(item.status)}>{statusLabel(item.status)}</Text>
            </View>
            {item.payload.produto && <Text style={styles.itemLine}>Produto: {item.payload.produto}</Text>}
            <Text style={styles.itemLine}>Data: {item.payload.data}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma aplicação registrada ainda</Text>}
      />

      <CachePickerModal
        visible={pickerVisible}
        title="Selecione o talhão"
        items={talhoes}
        labelFor={(item) => `${item.codigo} — ${item.fazenda_nome}`}
        onSelect={(item) => {
          setSelectedTalhao(item)
          setPickerVisible(false)
        }}
        onClose={() => setPickerVisible(false)}
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
    paddingTop: 56,
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
