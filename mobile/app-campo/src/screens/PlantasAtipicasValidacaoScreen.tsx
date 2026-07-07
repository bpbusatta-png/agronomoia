import { useCallback, useEffect, useState } from 'react'
import { Alert, FlatList, Modal, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native'
import { api } from '../lib/api'
import { getTalhoes, type TalhaoCache } from '../lib/db'

interface OcorrenciaPendente {
  id: string
  talhao_id: string | null
  caracteristica_avaliada: string | null
  justificativa_tecnica: string | null
  data: string | null
  status: string
}

export function PlantasAtipicasValidacaoScreen() {
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaPendente[]>([])
  const [talhaoCodigos, setTalhaoCodigos] = useState<Map<string, string>>(new Map())
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validandoId, setValidandoId] = useState<string | null>(null)
  const [decisao, setDecisao] = useState<'manter' | 'eliminar'>('manter')
  const [justificativa, setJustificativa] = useState('')
  const [saving, setSaving] = useState(false)

  const carregar = useCallback(async () => {
    setRefreshing(true)
    setError(null)
    try {
      const [ocorrenciasRes, talhoes] = await Promise.all([
        api.get<OcorrenciaPendente[]>('/plantas-atipicas'),
        getTalhoes(),
      ])
      setOcorrencias(ocorrenciasRes.data.filter((o) => o.status === 'pendente_validacao'))
      setTalhaoCodigos(new Map(talhoes.map((t: TalhaoCache) => [t.id, t.codigo])))
    } catch {
      setError('Não foi possível carregar as ocorrências pendentes.')
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  function abrirValidacao(id: string) {
    setValidandoId(id)
    setDecisao('manter')
    setJustificativa('')
  }

  async function confirmarValidacao() {
    if (!validandoId) return
    setSaving(true)
    try {
      await api.post(`/plantas-atipicas/${validandoId}/validar`, {
        decisao,
        justificativa: justificativa || null,
      })
      setValidandoId(null)
      await carregar()
    } catch {
      Alert.alert('Erro ao validar', 'Confirme que seu usuário tem papel Administrador ou Agronomo_RT.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Validação de plantas atípicas</Text>
      </View>
      <Text style={styles.subtitle}>Restrito a Administrador ou Agrônomo RT</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={ocorrencias}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={carregar} />}
        contentContainerStyle={ocorrencias.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma ocorrência pendente de validação</Text>}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemCodigo}>{item.talhao_id ? talhaoCodigos.get(item.talhao_id) ?? '—' : '—'}</Text>
            {item.caracteristica_avaliada && (
              <Text style={styles.itemLine}>Característica: {item.caracteristica_avaliada}</Text>
            )}
            {item.justificativa_tecnica && (
              <Text style={styles.itemLine}>Justificativa técnica: {item.justificativa_tecnica}</Text>
            )}
            {item.data && <Text style={styles.itemLine}>Data: {item.data}</Text>}
            <Pressable style={styles.validarButton} onPress={() => abrirValidacao(item.id)}>
              <Text style={styles.validarButtonText}>Validar</Text>
            </Pressable>
          </View>
        )}
      />

      <Modal visible={validandoId !== null} animationType="slide" transparent onRequestClose={() => setValidandoId(null)}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Validar ocorrência</Text>

            <Text style={styles.label}>Decisão</Text>
            <View style={styles.decisaoRow}>
              <Pressable
                style={decisao === 'manter' ? styles.decisaoButtonActive : styles.decisaoButton}
                onPress={() => setDecisao('manter')}
              >
                <Text style={decisao === 'manter' ? styles.decisaoTextActive : styles.decisaoText}>Manter</Text>
              </Pressable>
              <Pressable
                style={decisao === 'eliminar' ? styles.decisaoButtonActive : styles.decisaoButton}
                onPress={() => setDecisao('eliminar')}
              >
                <Text style={decisao === 'eliminar' ? styles.decisaoTextActive : styles.decisaoText}>Eliminar</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Justificativa</Text>
            <TextInput
              style={styles.textArea}
              value={justificativa}
              onChangeText={setJustificativa}
              multiline
              numberOfLines={3}
            />

            <View style={styles.actionsRow}>
              <Pressable style={styles.cancelButton} onPress={() => setValidandoId(null)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.confirmButton} onPress={confirmarValidacao} disabled={saving}>
                <Text style={styles.confirmButtonText}>{saving ? 'Validando...' : 'Confirmar'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#08060d',
  },
  subtitle: {
    fontSize: 12,
    color: '#9ca3af',
    paddingHorizontal: 16,
    marginTop: 2,
    marginBottom: 8,
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
  validarButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#b45309',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  validarButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#08060d',
  },
  label: {
    fontSize: 13,
    color: '#4b5563',
    marginTop: 8,
    marginBottom: 4,
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
    borderColor: '#b45309',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#b45309',
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
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  cancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    color: '#4b5563',
    fontSize: 14,
  },
  confirmButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#b45309',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
})
