import { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { CachePickerModal } from '../components/CachePickerModal'
import {
  addToQueue,
  getCache,
  getTalhoes,
  listQueue,
  type DoencaCatalogoCache,
  type QueueItem,
  type TalhaoCache,
} from '../lib/db'
import { syncPendingOcorrenciasDoencas, type OcorrenciaDoencaPayload } from '../lib/sync'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function OcorrenciasDoencasScreen() {
  const [talhoes, setTalhoes] = useState<TalhaoCache[]>([])
  const [doencas, setDoencas] = useState<DoencaCatalogoCache[]>([])
  const [ocorrencias, setOcorrencias] = useState<QueueItem<OcorrenciaDoencaPayload>[]>([])
  const [selectedTalhao, setSelectedTalhao] = useState<TalhaoCache | null>(null)
  const [selectedDoenca, setSelectedDoenca] = useState<DoencaCatalogoCache | null>(null)
  const [severidade, setSeveridade] = useState('')
  const [estadioCultura, setEstadioCultura] = useState('')
  const [data, setData] = useState(today())
  const [talhaoPickerVisible, setTalhaoPickerVisible] = useState(false)
  const [doencaPickerVisible, setDoencaPickerVisible] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const [t, d, o] = await Promise.all([
      getTalhoes(),
      getCache<DoencaCatalogoCache>('doencas_catalogo'),
      listQueue<OcorrenciaDoencaPayload>('ocorrencias_doencas'),
    ])
    setTalhoes(t)
    setDoencas(d)
    setOcorrencias(o)
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
    if (!selectedDoenca) {
      setSaveError('Selecione uma doença')
      return
    }
    await addToQueue<OcorrenciaDoencaPayload>('ocorrencias_doencas', {
      talhao_id: selectedTalhao.id,
      talhao_codigo: selectedTalhao.codigo,
      doenca_id: selectedDoenca.id,
      doenca_nome: selectedDoenca.nome,
      severidade_percentual: severidade || null,
      estadio_cultura: estadioCultura || null,
      data,
    })
    setSelectedTalhao(null)
    setSelectedDoenca(null)
    setSeveridade('')
    setEstadioCultura('')
    setData(today())
    await reload()
    handleSincronizar()
  }

  async function handleSincronizar() {
    setSyncing(true)
    setSyncMessage(null)
    try {
      const result = await syncPendingOcorrenciasDoencas()
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

  const pendentesCount = ocorrencias.filter((o) => o.status === 'pendente' || o.status === 'erro').length

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nova ocorrência de doença</Text>

      <Text style={styles.label}>Talhão</Text>
      <Pressable style={styles.selectBox} onPress={() => setTalhaoPickerVisible(true)} testID="talhao-select-doenca">
        <Text style={selectedTalhao ? styles.selectText : styles.selectPlaceholder}>
          {selectedTalhao ? selectedTalhao.codigo : 'Selecione...'}
        </Text>
      </Pressable>

      <Text style={styles.label}>Doença</Text>
      <Pressable style={styles.selectBox} onPress={() => setDoencaPickerVisible(true)} testID="doenca-select">
        <Text style={selectedDoenca ? styles.selectText : styles.selectPlaceholder}>
          {selectedDoenca ? selectedDoenca.nome : 'Selecione...'}
        </Text>
      </Pressable>

      <Text style={styles.label}>Severidade (%)</Text>
      <TextInput style={styles.input} value={severidade} onChangeText={setSeveridade} keyboardType="numeric" />

      <Text style={styles.label}>Estádio da cultura</Text>
      <TextInput style={styles.input} value={estadioCultura} onChangeText={setEstadioCultura} />

      <Text style={styles.label}>Data</Text>
      <TextInput style={styles.input} value={data} onChangeText={setData} placeholder="AAAA-MM-DD" />

      {saveError && <Text style={styles.error}>{saveError}</Text>}

      <Pressable style={styles.saveButton} onPress={handleSalvar} testID="salvar-doenca-button">
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
        data={ocorrencias}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemCodigo}>{item.payload.talhao_codigo}</Text>
              <Text style={statusStyle(item.status)}>{statusLabel(item.status)}</Text>
            </View>
            <Text style={styles.itemLine}>Doença: {item.payload.doenca_nome}</Text>
            {item.payload.severidade_percentual && (
              <Text style={styles.itemLine}>Severidade: {item.payload.severidade_percentual}%</Text>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma ocorrência registrada ainda</Text>}
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
        visible={doencaPickerVisible}
        title="Selecione a doença"
        items={doencas}
        labelFor={(item) => item.nome}
        onSelect={(item) => {
          setSelectedDoenca(item)
          setDoencaPickerVisible(false)
        }}
        onClose={() => setDoencaPickerVisible(false)}
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
