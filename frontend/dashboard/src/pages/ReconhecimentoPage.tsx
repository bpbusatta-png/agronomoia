import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

interface ReconhecimentoResult {
  tipo_identificado: 'praga' | 'doenca' | 'planta_daninha' | 'planta_atipica' | 'indeterminado'
  nome_sugerido: string | null
  confianca: number
  observacoes: string
  modelo_versao_id: string
}

const TIPO_LABELS: Record<ReconhecimentoResult['tipo_identificado'], string> = {
  praga: 'Praga',
  doenca: 'Doença',
  planta_daninha: 'Planta daninha',
  planta_atipica: 'Planta atípica',
  indeterminado: 'Indeterminado',
}

const TIPO_ROTAS: Partial<Record<ReconhecimentoResult['tipo_identificado'], string>> = {
  praga: '/ocorrencias-pragas',
  doenca: '/ocorrencias-doencas',
  planta_daninha: '/ocorrencias-plantas-daninhas',
  planta_atipica: '/plantas-atipicas',
}

export function ReconhecimentoPage() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [tipoEsperado, setTipoEsperado] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<ReconhecimentoResult | null>(null)

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    setFile(selected)
    setResultado(null)
    setError(null)
    setPreviewUrl(selected ? URL.createObjectURL(selected) : null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError(null)
    setResultado(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
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

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-800 mb-1">Reconhecimento por IA</h1>
      <p className="text-sm text-gray-500 mb-4">
        Envie uma foto de campo para receber uma sugestão de classificação (praga, doença, planta daninha ou planta
        atípica). A sugestão é só um ponto de partida — sempre confirme os dados antes de criar o registro oficial da
        ocorrência.
      </p>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-lg space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Foto</label>
          <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm" />
        </div>

        {previewUrl && (
          <img src={previewUrl} alt="Pré-visualização" className="max-h-48 rounded border border-gray-200" />
        )}

        <div>
          <label className="block text-sm text-gray-600 mb-1">O que você espera encontrar? (opcional)</label>
          <select
            value={tipoEsperado}
            onChange={(e) => setTipoEsperado(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="">Não sei / deixe a IA decidir</option>
            <option value="praga">Praga</option>
            <option value="doenca">Doença</option>
            <option value="planta_daninha">Planta daninha</option>
            <option value="planta_atipica">Planta atípica</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={!file || loading}
          className="px-4 py-2 text-sm rounded bg-green-700 text-white hover:bg-green-800 disabled:opacity-50"
        >
          {loading ? 'Classificando...' : 'Classificar'}
        </button>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      {resultado && (
        <div className="bg-white rounded-lg shadow p-6 max-w-lg mt-4 space-y-2">
          <h2 className="text-lg font-semibold text-gray-800">Sugestão da IA</h2>
          <p className="text-sm text-gray-700">
            <span className="font-medium">Tipo:</span> {TIPO_LABELS[resultado.tipo_identificado]}
          </p>
          {resultado.nome_sugerido && (
            <p className="text-sm text-gray-700">
              <span className="font-medium">Nome sugerido:</span> {resultado.nome_sugerido}
            </p>
          )}
          <p className="text-sm text-gray-700">
            <span className="font-medium">Confiança:</span> {Math.round(resultado.confianca * 100)}%
          </p>
          {resultado.observacoes && <p className="text-sm text-gray-500">{resultado.observacoes}</p>}

          {TIPO_ROTAS[resultado.tipo_identificado] ? (
            <Link
              to={TIPO_ROTAS[resultado.tipo_identificado]!}
              className="inline-block mt-2 px-3 py-2 text-sm rounded bg-amber-700 text-white hover:bg-amber-800"
            >
              Criar ocorrência de {TIPO_LABELS[resultado.tipo_identificado].toLowerCase()}
            </Link>
          ) : (
            <p className="text-sm text-gray-500 italic">
              A IA não conseguiu identificar com confiança suficiente — tente outra foto, com melhor foco no
              problema.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function mensagemDeErro(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const response = (err as { response?: { status?: number; data?: { detail?: string } } }).response
    if (response?.status === 503) {
      return 'Reconhecimento por IA não configurado neste ambiente (falta ANTHROPIC_API_KEY no backend).'
    }
    if (response?.data?.detail) return response.data.detail
  }
  return 'Erro ao classificar a imagem. Tente novamente.'
}
