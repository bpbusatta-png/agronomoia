import * as ImagePicker from 'expo-image-picker'
import { useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { api } from '../lib/api'
import { buildFotoFormData } from '../lib/sync'

type TipoIdentificado = 'praga' | 'doenca' | 'planta_daninha' | 'planta_atipica' | 'indeterminado'

interface ReconhecimentoResult {
  tipo_identificado: TipoIdentificado
  nome_sugerido: string | null
  confianca: number
  observacoes: string
  modelo_versao_id: string
}

const TIPOS_ESPERADOS = [
  { value: null, label: 'Não sei / deixe a IA decidir' },
  { value: 'praga', label: 'Praga' },
  { value: 'doenca', label: 'Doença' },
  { value: 'planta_daninha', label: 'Planta daninha' },
  { value: 'planta_atipica', label: 'Planta atípica' },
] as const

const TIPO_LABELS: Record<TipoIdentificado, string> = {
  praga: 'Praga',
  doenca: 'Doença',
  planta_daninha: 'Planta daninha',
  planta_atipica: 'Planta atípica',
  indeterminado: 'Indeterminado',
}

const TIPO_TABS: Partial<Record<TipoIdentificado, string>> = {
  praga: 'pragas',
  doenca: 'doencas',
  planta_daninha: 'plantas_daninhas',
  planta_atipica: 'atipicas',
}

interface Props {
  onIrParaTab: (tab: string) => void
}

export function ReconhecimentoScreen({ onIrParaTab }: Props) {
  const [pickedUri, setPickedUri] = useState<string | null>(null)
  const [tipoEsperado, setTipoEsperado] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<ReconhecimentoResult | null>(null)

  async function handleTirarFoto() {
    const permissao = await ImagePicker.requestCameraPermissionsAsync()
    if (!permissao.granted) {
      setError('Permissão de câmera negada')
      return
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 })
    if (!result.canceled && result.assets[0]) {
      setPickedUri(result.assets[0].uri)
      setResultado(null)
      setError(null)
    }
  }

  async function handleEscolherGaleria() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permissao.granted) {
      setError('Permissão de galeria negada')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 })
    if (!result.canceled && result.assets[0]) {
      setPickedUri(result.assets[0].uri)
      setResultado(null)
      setError(null)
    }
  }

  async function handleClassificar() {
    if (!pickedUri) return
    setLoading(true)
    setError(null)
    setResultado(null)
    try {
      const formData = await buildFotoFormData(pickedUri)
      if (tipoEsperado) formData.append('tipo_esperado', tipoEsperado)
      const { data } = await api.post<ReconhecimentoResult>('/reconhecimento/classificar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResultado(data)
    } catch (err) {
      setError(mensagemDeErro(err))
    } finally {
      setLoading(false)
    }
  }

  const tabAlvo = resultado ? TIPO_TABS[resultado.tipo_identificado] : undefined

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Reconhecimento por IA</Text>
      <Text style={styles.subtitle}>
        Envie uma foto para receber uma sugestão de classificação. Sempre confirme os dados antes de criar o
        registro oficial da ocorrência.
      </Text>

      <View style={styles.photoRow}>
        <Pressable style={styles.photoButton} onPress={handleTirarFoto} testID="reco-tirar-foto-button">
          <Text style={styles.photoButtonText}>Tirar foto</Text>
        </Pressable>
        <Pressable style={styles.photoButton} onPress={handleEscolherGaleria} testID="reco-escolher-galeria-button">
          <Text style={styles.photoButtonText}>Da galeria</Text>
        </Pressable>
      </View>

      {pickedUri && <Image source={{ uri: pickedUri }} style={styles.preview} testID="reco-foto-preview" />}

      <Text style={styles.label}>O que você espera encontrar? (opcional)</Text>
      <View style={styles.tipoRow}>
        {TIPOS_ESPERADOS.map((t) => (
          <Pressable
            key={t.label}
            style={[styles.tipoChip, tipoEsperado === t.value && styles.tipoChipActive]}
            onPress={() => setTipoEsperado(t.value)}
          >
            <Text style={tipoEsperado === t.value ? styles.tipoChipTextActive : styles.tipoChipText}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[styles.classificarButton, !pickedUri && styles.classificarButtonDisabled]}
        onPress={handleClassificar}
        disabled={!pickedUri || loading}
        testID="reco-classificar-button"
      >
        <Text style={styles.classificarButtonText}>{loading ? 'Classificando...' : 'Classificar'}</Text>
      </Pressable>

      {error && <Text style={styles.error}>{error}</Text>}

      {resultado && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Sugestão da IA</Text>
          <Text style={styles.resultLine}>Tipo: {TIPO_LABELS[resultado.tipo_identificado]}</Text>
          {resultado.nome_sugerido && (
            <Text style={styles.resultLine}>Nome sugerido: {resultado.nome_sugerido}</Text>
          )}
          <Text style={styles.resultLine}>Confiança: {Math.round(resultado.confianca * 100)}%</Text>
          {resultado.observacoes && <Text style={styles.resultObs}>{resultado.observacoes}</Text>}

          {tabAlvo ? (
            <Pressable
              style={styles.irParaButton}
              onPress={() => onIrParaTab(tabAlvo)}
              testID="reco-ir-para-ocorrencia-button"
            >
              <Text style={styles.irParaButtonText}>
                Criar ocorrência de {TIPO_LABELS[resultado.tipo_identificado].toLowerCase()}
              </Text>
            </Pressable>
          ) : (
            <Text style={styles.indeterminado}>
              A IA não conseguiu identificar com confiança suficiente — tente outra foto, com melhor foco no
              problema.
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  )
}

function mensagemDeErro(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const response = (err as { response?: { status?: number; data?: { detail?: string } } }).response
    if (response?.status === 503) {
      return 'Reconhecimento por IA não configurado neste ambiente.'
    }
    if (response?.data?.detail) return response.data.detail
  }
  return 'Erro ao classificar a imagem. Tente novamente.'
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#08060d',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 8,
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
    width: 160,
    height: 160,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'center',
  },
  label: {
    fontSize: 13,
    color: '#4b5563',
    marginTop: 16,
    marginBottom: 4,
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
  classificarButton: {
    backgroundColor: '#15803d',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  classificarButtonDisabled: {
    opacity: 0.5,
  },
  classificarButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  error: {
    color: '#dc2626',
    fontSize: 13,
    marginTop: 8,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#08060d',
    marginBottom: 8,
  },
  resultLine: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  resultObs: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 6,
  },
  indeterminado: {
    fontSize: 13,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 8,
  },
  irParaButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#b45309',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  irParaButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
})
