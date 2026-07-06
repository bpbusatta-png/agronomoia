// SDK 57 trocou expo-file-system para uma API sincrona baseada em classes
// (File/Directory). Usamos o subpath /legacy para manter a API assincrona
// (documentDirectory/copyAsync/makeDirectoryAsync) mais simples aqui.
import * as FileSystem from 'expo-file-system/legacy'
import * as ImagePicker from 'expo-image-picker'
import { useCallback, useEffect, useState } from 'react'
import { FlatList, Image, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { addFotografiaLocal, getTalhoes, listFotografiasLocais, type FotografiaLocal, type TalhaoCache } from '../lib/db'
import { syncPendingFotografias } from '../lib/sync'

const TIPOS = [
  { value: 'praga', label: 'Praga' },
  { value: 'doenca', label: 'Doença' },
  { value: 'planta_atipica', label: 'Planta atípica' },
  { value: 'geral', label: 'Geral' },
]

async function persistPickedImage(uri: string): Promise<string> {
  if (Platform.OS === 'web') return uri
  const dir = `${FileSystem.documentDirectory}fotos/`
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {})
  const filename = `foto-${Date.now()}.jpg`
  const dest = `${dir}${filename}`
  await FileSystem.copyAsync({ from: uri, to: dest })
  return dest
}

export function FotografiasScreen() {
  const [talhoes, setTalhoes] = useState<TalhaoCache[]>([])
  const [fotografias, setFotografias] = useState<FotografiaLocal[]>([])
  const [selectedTalhao, setSelectedTalhao] = useState<TalhaoCache | null>(null)
  const [tipo, setTipo] = useState<string | null>(null)
  const [pickedUri, setPickedUri] = useState<string | null>(null)
  const [pickerVisible, setPickerVisible] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const [t, f] = await Promise.all([getTalhoes(), listFotografiasLocais()])
    setTalhoes(t)
    setFotografias(f)
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  async function handleEscolherGaleria() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permissao.granted) {
      setSaveError('Permissão de galeria negada')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 })
    if (!result.canceled && result.assets[0]) {
      setPickedUri(await persistPickedImage(result.assets[0].uri))
    }
  }

  async function handleTirarFoto() {
    const permissao = await ImagePicker.requestCameraPermissionsAsync()
    if (!permissao.granted) {
      setSaveError('Permissão de câmera negada')
      return
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 })
    if (!result.canceled && result.assets[0]) {
      setPickedUri(await persistPickedImage(result.assets[0].uri))
    }
  }

  async function handleSalvar() {
    setSaveError(null)
    if (!selectedTalhao) {
      setSaveError('Selecione um talhão')
      return
    }
    if (!pickedUri) {
      setSaveError('Tire ou escolha uma foto')
      return
    }
    await addFotografiaLocal({
      talhao_id: selectedTalhao.id,
      talhao_codigo: selectedTalhao.codigo,
      inspecao_id: null,
      tipo,
      local_uri: pickedUri,
    })
    setSelectedTalhao(null)
    setTipo(null)
    setPickedUri(null)
    await reload()
    handleSincronizar()
  }

  async function handleSincronizar() {
    setSyncing(true)
    setSyncMessage(null)
    try {
      const result = await syncPendingFotografias()
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

  const pendentesCount = fotografias.filter((f) => f.status === 'pendente' || f.status === 'erro').length

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nova fotografia</Text>

      <Text style={styles.label}>Talhão</Text>
      <Pressable style={styles.selectBox} onPress={() => setPickerVisible(true)} testID="talhao-select-foto">
        <Text style={selectedTalhao ? styles.selectText : styles.selectPlaceholder}>
          {selectedTalhao ? selectedTalhao.codigo : 'Selecione...'}
        </Text>
      </Pressable>

      <Text style={styles.label}>Tipo</Text>
      <View style={styles.tipoRow}>
        {TIPOS.map((t) => (
          <Pressable
            key={t.value}
            style={[styles.tipoChip, tipo === t.value && styles.tipoChipActive]}
            onPress={() => setTipo(t.value)}
            testID={`tipo-${t.value}`}
          >
            <Text style={tipo === t.value ? styles.tipoChipTextActive : styles.tipoChipText}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.photoRow}>
        <Pressable style={styles.photoButton} onPress={handleTirarFoto} testID="tirar-foto-button">
          <Text style={styles.photoButtonText}>Tirar foto</Text>
        </Pressable>
        <Pressable style={styles.photoButton} onPress={handleEscolherGaleria} testID="escolher-galeria-button">
          <Text style={styles.photoButtonText}>Da galeria</Text>
        </Pressable>
      </View>

      {pickedUri && <Image source={{ uri: pickedUri }} style={styles.preview} testID="foto-preview" />}

      {saveError && <Text style={styles.error}>{saveError}</Text>}

      <Pressable style={styles.saveButton} onPress={handleSalvar} testID="salvar-foto-button">
        <Text style={styles.saveButtonText}>Salvar (funciona offline)</Text>
      </Pressable>

      <View style={styles.syncRow}>
        <Text style={styles.pendingText}>{pendentesCount} pendente(s) de sincronização</Text>
        <Pressable onPress={handleSincronizar} disabled={syncing} testID="sincronizar-foto-button">
          <Text style={styles.syncLink}>{syncing ? 'Sincronizando...' : 'Sincronizar agora'}</Text>
        </Pressable>
      </View>
      {syncMessage && <Text style={styles.syncMessage}>{syncMessage}</Text>}

      <FlatList
        style={styles.list}
        data={fotografias}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Image source={{ uri: item.local_uri }} style={styles.thumb} />
            <View style={styles.itemInfo}>
              <Text style={styles.itemCodigo}>{item.talhao_codigo}</Text>
              {item.tipo && <Text style={styles.itemLine}>{TIPOS.find((t) => t.value === item.tipo)?.label}</Text>}
              <Text style={statusStyle(item.status)}>{statusLabel(item.status)}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma fotografia registrada ainda</Text>}
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

function statusLabel(status: FotografiaLocal['status']) {
  if (status === 'sincronizado') return 'Sincronizado'
  if (status === 'erro') return 'Erro — será reenviado'
  return 'Pendente'
}

function statusStyle(status: FotografiaLocal['status']) {
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
  tipoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tipoChip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  tipoChipActive: {
    backgroundColor: '#15803d',
    borderColor: '#15803d',
  },
  tipoChipText: {
    fontSize: 13,
    color: '#4b5563',
  },
  tipoChipTextActive: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  photoRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  photoButton: {
    flex: 1,
    backgroundColor: '#1d4ed8',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  photoButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  preview: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginTop: 12,
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
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 6,
    backgroundColor: '#e5e7eb',
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
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
