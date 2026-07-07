import { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { CachePickerModal } from '../components/CachePickerModal'
import { addToQueue, getTalhoes, listQueue, type QueueItem, type TalhaoCache } from '../lib/db'
import { syncPendingPlantasAtipicas, type PlantaAtipicaPayload } from '../lib/sync'

// Mesma lista estatica de entities/configs.ts (plantasAtipicasConfig) no
// dashboard -- caracteristica_avaliada nao vem de um catalogo no banco.
const CARACTERISTICAS = [
  { id: 'arquitetura', nome: 'Arquitetura' },
  { id: 'cor_flor', nome: 'Cor da flor' },
  { id: 'pubescencia', nome: 'Pubescência' },
  { id: 'cor_hilo', nome: 'Cor do hilo' },
  { id: 'formato_folha', nome: 'Formato da folha' },
  { id: 'formato_vagem', nome: 'Formato da vagem' },
  { id: 'porte', nome: 'Porte' },
  { id: 'ramificacoes', nome: 'Ramificações' },
  { id: 'tipo_crescimento', nome: 'Tipo de crescimento' },
]

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function PlantasAtipicasScreen() {
  const [talhoes, setTalhoes] = useState<TalhaoCache[]>([])
  const [ocorrencias, setOcorrencias] = useState<QueueItem<PlantaAtipicaPayload>[]>([])
  const [selectedTalhao, setSelectedTalhao] = useState<TalhaoCache | null>(null)
  const [caracteristica, setCaracteristica] = useState<{ id: string; nome: string } | null>(null)
  const [conformePadrao, setConformePadrao] = useState<boolean | null>(null)
  const [justificativa, setJustificativa] = useState('')
  const [data, setData] = useState(today())
  const [talhaoPickerVisible, setTalhaoPickerVisible] = useState(false)
  const [caracteristicaPickerVisible, setCaracteristicaPickerVisible] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const [t, o] = await Promise.all([getTalhoes(), listQueue<PlantaAtipicaPayload>('plantas_atipicas')])
    setTalhoes(t)
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
    await addToQueue<PlantaAtipicaPayload>('plantas_atipicas', {
      talhao_id: selectedTalhao.id,
      talhao_codigo: selectedTalhao.codigo,
      caracteristica_avaliada: caracteristica?.id ?? null,
      conforme_padrao: conformePadrao,
      justificativa_tecnica: justificativa || null,
      data,
    })
    setSelectedTalhao(null)
    setCaracteristica(null)
    setConformePadrao(null)
    setJustificativa('')
    setData(today())
    await reload()
    handleSincronizar()
  }

  async function handleSincronizar() {
    setSyncing(true)
    setSyncMessage(null)
    try {
      const result = await syncPendingPlantasAtipicas()
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
      <Text style={styles.title}>Nova planta atípica</Text>
      <Text style={styles.subtitle}>
        Nasce pendente de validação — só Administrador/Agrônomo RT confirmam a decisão (aba Validação).
      </Text>

      <Text style={styles.label}>Talhão</Text>
      <Pressable style={styles.selectBox} onPress={() => setTalhaoPickerVisible(true)} testID="talhao-select-atipica">
        <Text style={selectedTalhao ? styles.selectText : styles.selectPlaceholder}>
          {selectedTalhao ? selectedTalhao.codigo : 'Selecione...'}
        </Text>
      </Pressable>

      <Text style={styles.label}>Característica avaliada</Text>
      <Pressable
        style={styles.selectBox}
        onPress={() => setCaracteristicaPickerVisible(true)}
        testID="caracteristica-select"
      >
        <Text style={caracteristica ? styles.selectText : styles.selectPlaceholder}>
          {caracteristica ? caracteristica.nome : 'Selecione... (opcional)'}
        </Text>
      </Pressable>

      <Text style={styles.label}>Conforme padrão?</Text>
      <View style={styles.decisaoRow}>
        <Pressable
          style={conformePadrao === true ? styles.decisaoButtonActive : styles.decisaoButton}
          onPress={() => setConformePadrao(true)}
        >
          <Text style={conformePadrao === true ? styles.decisaoTextActive : styles.decisaoText}>Sim</Text>
        </Pressable>
        <Pressable
          style={conformePadrao === false ? styles.decisaoButtonActive : styles.decisaoButton}
          onPress={() => setConformePadrao(false)}
        >
          <Text style={conformePadrao === false ? styles.decisaoTextActive : styles.decisaoText}>Não</Text>
        </Pressable>
      </View>

      <Text style={styles.label}>Justificativa técnica</Text>
      <TextInput style={styles.input} value={justificativa} onChangeText={setJustificativa} multiline />

      <Text style={styles.label}>Data</Text>
      <TextInput style={styles.input} value={data} onChangeText={setData} placeholder="AAAA-MM-DD" />

      {saveError && <Text style={styles.error}>{saveError}</Text>}

      <Pressable style={styles.saveButton} onPress={handleSalvar} testID="salvar-atipica-button">
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
            {item.payload.caracteristica_avaliada && (
              <Text style={styles.itemLine}>
                Característica: {CARACTERISTICAS.find((c) => c.id === item.payload.caracteristica_avaliada)?.nome}
              </Text>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma planta atípica registrada ainda</Text>}
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
        visible={caracteristicaPickerVisible}
        title="Selecione a característica"
        items={CARACTERISTICAS}
        labelFor={(item) => item.nome}
        onSelect={(item) => {
          setCaracteristica(item)
          setCaracteristicaPickerVisible(false)
        }}
        onClose={() => setCaracteristicaPickerVisible(false)}
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
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
  decisaoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  decisaoButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  decisaoButtonActive: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#15803d',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#15803d',
  },
  decisaoText: {
    fontSize: 14,
    color: '#08060d',
  },
  decisaoTextActive: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
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
