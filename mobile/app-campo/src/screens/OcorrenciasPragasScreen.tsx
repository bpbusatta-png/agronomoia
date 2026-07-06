import { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { CachePickerModal } from '../components/CachePickerModal'
import {
  addToQueue,
  getCache,
  getTalhoes,
  listQueue,
  type PragaCatalogoCache,
  type QueueItem,
  type TalhaoCache,
} from '../lib/db'
import { syncPendingOcorrenciasPragas, type OcorrenciaPragaPayload } from '../lib/sync'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function OcorrenciasPragasScreen() {
  const [talhoes, setTalhoes] = useState<TalhaoCache[]>([])
  const [pragas, setPragas] = useState<PragaCatalogoCache[]>([])
  const [ocorrencias, setOcorrencias] = useState<QueueItem<OcorrenciaPragaPayload>[]>([])
  const [selectedTalhao, setSelectedTalhao] = useState<TalhaoCache | null>(null)
  const [selectedPraga, setSelectedPraga] = useState<PragaCatalogoCache | null>(null)
  const [estadio, setEstadio] = useState('')
  const [populacao, setPopulacao] = useState('')
  const [nivelDano, setNivelDano] = useState('')
  const [nivelControle, setNivelControle] = useState('')
  const [data, setData] = useState(today())
  const [talhaoPickerVisible, setTalhaoPickerVisible] = useState(false)
  const [pragaPickerVisible, setPragaPickerVisible] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const [t, p, o] = await Promise.all([
      getTalhoes(),
      getCache<PragaCatalogoCache>('pragas_catalogo'),
      listQueue<OcorrenciaPragaPayload>('ocorrencias_pragas'),
    ])
    setTalhoes(t)
    setPragas(p)
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
    if (!selectedPraga) {
      setSaveError('Selecione uma praga')
      return
    }
    await addToQueue<OcorrenciaPragaPayload>('ocorrencias_pragas', {
      talhao_id: selectedTalhao.id,
      talhao_codigo: selectedTalhao.codigo,
      praga_id: selectedPraga.id,
      praga_nome: selectedPraga.nome_comum,
      estadio: estadio || null,
      populacao_estimada: populacao || null,
      nivel_dano: nivelDano || null,
      nivel_controle: nivelControle || null,
      data,
    })
    setSelectedTalhao(null)
    setSelectedPraga(null)
    setEstadio('')
    setPopulacao('')
    setNivelDano('')
    setNivelControle('')
    setData(today())
    await reload()
    handleSincronizar()
  }

  async function handleSincronizar() {
    setSyncing(true)
    setSyncMessage(null)
    try {
      const result = await syncPendingOcorrenciasPragas()
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
      <Text style={styles.title}>Nova ocorrência de praga</Text>

      <Text style={styles.label}>Talhão</Text>
      <Pressable style={styles.selectBox} onPress={() => setTalhaoPickerVisible(true)} testID="talhao-select-praga">
        <Text style={selectedTalhao ? styles.selectText : styles.selectPlaceholder}>
          {selectedTalhao ? selectedTalhao.codigo : 'Selecione...'}
        </Text>
      </Pressable>

      <Text style={styles.label}>Praga</Text>
      <Pressable style={styles.selectBox} onPress={() => setPragaPickerVisible(true)} testID="praga-select">
        <Text style={selectedPraga ? styles.selectText : styles.selectPlaceholder}>
          {selectedPraga ? selectedPraga.nome_comum : 'Selecione...'}
        </Text>
      </Pressable>

      <Text style={styles.label}>Estádio</Text>
      <TextInput style={styles.input} value={estadio} onChangeText={setEstadio} />

      <Text style={styles.label}>População estimada</Text>
      <TextInput style={styles.input} value={populacao} onChangeText={setPopulacao} keyboardType="numeric" />

      <Text style={styles.label}>Nível de dano</Text>
      <TextInput style={styles.input} value={nivelDano} onChangeText={setNivelDano} />

      <Text style={styles.label}>Nível de controle</Text>
      <TextInput style={styles.input} value={nivelControle} onChangeText={setNivelControle} />

      <Text style={styles.label}>Data</Text>
      <TextInput style={styles.input} value={data} onChangeText={setData} placeholder="AAAA-MM-DD" />

      {saveError && <Text style={styles.error}>{saveError}</Text>}

      <Pressable style={styles.saveButton} onPress={handleSalvar} testID="salvar-praga-button">
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
            <Text style={styles.itemLine}>Praga: {item.payload.praga_nome}</Text>
            {item.payload.nivel_dano && <Text style={styles.itemLine}>Nível de dano: {item.payload.nivel_dano}</Text>}
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
        visible={pragaPickerVisible}
        title="Selecione a praga"
        items={pragas}
        labelFor={(item) => item.nome_comum}
        onSelect={(item) => {
          setSelectedPraga(item)
          setPragaPickerVisible(false)
        }}
        onClose={() => setPragaPickerVisible(false)}
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
