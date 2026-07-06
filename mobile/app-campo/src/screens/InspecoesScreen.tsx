import { useCallback, useEffect, useState } from 'react'
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { addInspecaoLocal, getTalhoes, listInspecoesLocais, type InspecaoLocal, type TalhaoCache } from '../lib/db'
import { syncPendingInspecoes } from '../lib/sync'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function InspecoesScreen() {
  const [talhoes, setTalhoes] = useState<TalhaoCache[]>([])
  const [inspecoes, setInspecoes] = useState<InspecaoLocal[]>([])
  const [selectedTalhao, setSelectedTalhao] = useState<TalhaoCache | null>(null)
  const [data, setData] = useState(today())
  const [estadio, setEstadio] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [pickerVisible, setPickerVisible] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const [t, i] = await Promise.all([getTalhoes(), listInspecoesLocais()])
    setTalhoes(t)
    setInspecoes(i)
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
    if (!data) {
      setSaveError('Informe a data')
      return
    }
    await addInspecaoLocal({
      talhao_id: selectedTalhao.id,
      talhao_codigo: selectedTalhao.codigo,
      data,
      estadio_fenologico: estadio || null,
      observacoes: observacoes || null,
    })
    setSelectedTalhao(null)
    setData(today())
    setEstadio('')
    setObservacoes('')
    await reload()
    handleSincronizar()
  }

  async function handleSincronizar() {
    setSyncing(true)
    setSyncMessage(null)
    try {
      const result = await syncPendingInspecoes()
      if (result.synced || result.failed) {
        setSyncMessage(
          `${result.synced} sincronizada(s)${result.failed ? `, ${result.failed} com falha (tentará de novo)` : ''}`,
        )
      } else {
        setSyncMessage('Nada pendente para sincronizar')
      }
    } finally {
      setSyncing(false)
      await reload()
    }
  }

  const pendentesCount = inspecoes.filter((i) => i.status === 'pendente' || i.status === 'erro').length

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nova inspeção</Text>

      <Text style={styles.label}>Talhão</Text>
      <Pressable style={styles.selectBox} onPress={() => setPickerVisible(true)} testID="talhao-select">
        <Text style={selectedTalhao ? styles.selectText : styles.selectPlaceholder}>
          {selectedTalhao ? selectedTalhao.codigo : 'Selecione...'}
        </Text>
      </Pressable>

      <Text style={styles.label}>Data</Text>
      <TextInput style={styles.input} value={data} onChangeText={setData} placeholder="AAAA-MM-DD" testID="data-input" />

      <Text style={styles.label}>Estádio fenológico</Text>
      <TextInput style={styles.input} value={estadio} onChangeText={setEstadio} testID="estadio-input" />

      <Text style={styles.label}>Observações</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={observacoes}
        onChangeText={setObservacoes}
        multiline
        testID="observacoes-input"
      />

      {saveError && <Text style={styles.error}>{saveError}</Text>}

      <Pressable style={styles.saveButton} onPress={handleSalvar} testID="salvar-inspecao-button">
        <Text style={styles.saveButtonText}>Salvar (funciona offline)</Text>
      </Pressable>

      <View style={styles.syncRow}>
        <Text style={styles.pendingText}>{pendentesCount} pendente(s) de sincronização</Text>
        <Pressable onPress={handleSincronizar} disabled={syncing} testID="sincronizar-button">
          <Text style={styles.syncLink}>{syncing ? 'Sincronizando...' : 'Sincronizar agora'}</Text>
        </Pressable>
      </View>
      {syncMessage && <Text style={styles.syncMessage}>{syncMessage}</Text>}

      <FlatList
        style={styles.list}
        data={inspecoes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemCodigo}>{item.talhao_codigo}</Text>
              <Text style={statusStyle(item.status)}>{statusLabel(item.status)}</Text>
            </View>
            <Text style={styles.itemLine}>Data: {item.data}</Text>
            {item.estadio_fenologico && <Text style={styles.itemLine}>Estádio: {item.estadio_fenologico}</Text>}
            {item.observacoes && <Text style={styles.itemLine}>{item.observacoes}</Text>}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma inspeção registrada ainda</Text>}
      />

      <Modal visible={pickerVisible} animationType="slide" transparent onRequestClose={() => setPickerVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Selecione o talhão</Text>
            <FlatList
              data={talhoes}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedTalhao(item)
                    setPickerVisible(false)
                  }}
                >
                  <Text style={styles.modalItemText}>
                    {item.codigo} — {item.fazenda_nome}
                  </Text>
                </Pressable>
              )}
              ListEmptyComponent={<Text style={styles.empty}>Nenhum talhão sincronizado ainda</Text>}
            />
            <Pressable style={styles.modalClose} onPress={() => setPickerVisible(false)}>
              <Text style={styles.modalCloseText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  )
}

function statusLabel(status: InspecaoLocal['status']) {
  if (status === 'sincronizado') return 'Sincronizado'
  if (status === 'erro') return 'Erro — será reenviado'
  return 'Pendente'
}

function statusStyle(status: InspecaoLocal['status']) {
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
  textarea: {
    minHeight: 60,
    textAlignVertical: 'top',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalItemText: {
    fontSize: 14,
    color: '#08060d',
  },
  modalClose: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 10,
  },
  modalCloseText: {
    color: '#dc2626',
    fontSize: 14,
  },
})
