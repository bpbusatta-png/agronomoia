import { ClipboardList, MapPin, ScanEye, ShieldAlert, Users, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

interface ApiRow {
  id: string
  [key: string]: unknown
}

interface RegistroRecente {
  id: string
  tipo: 'praga' | 'doenca' | 'planta_daninha' | 'planta_atipica'
  talhaoCodigo: string
  data: string | null
  status: string
}

const TIPO_LABELS: Record<RegistroRecente['tipo'], string> = {
  praga: 'Praga',
  doenca: 'Doença',
  planta_daninha: 'Planta daninha',
  planta_atipica: 'Planta atípica',
}

const STAT_STYLES = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  red: { bg: 'bg-red-50', text: 'text-red-600' },
} as const

export function HomePage() {
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [totalCooperados, setTotalCooperados] = useState(0)
  const [totalTalhoes, setTotalTalhoes] = useState(0)
  const [totalOcorrencias, setTotalOcorrencias] = useState(0)
  const [totalPendentes, setTotalPendentes] = useState(0)
  const [recentes, setRecentes] = useState<RegistroRecente[]>([])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setErro(null)
      try {
        const [cooperadosRes, talhoesRes, pragasRes, doencasRes, daninhasRes, atipicasRes] = await Promise.all([
          api.get<ApiRow[]>('/cooperados'),
          api.get<ApiRow[]>('/talhoes'),
          api.get<ApiRow[]>('/ocorrencias-pragas'),
          api.get<ApiRow[]>('/ocorrencias-doencas'),
          api.get<ApiRow[]>('/ocorrencias-plantas-daninhas'),
          api.get<ApiRow[]>('/plantas-atipicas'),
        ])

        const talhaoCodigos = new Map(talhoesRes.data.map((t) => [t.id, String(t.codigo ?? '—')]))

        const combinados: RegistroRecente[] = [
          ...pragasRes.data.map((o) => ({
            id: o.id,
            tipo: 'praga' as const,
            talhaoCodigo: talhaoCodigos.get(o.talhao_id as string) ?? '—',
            data: (o.data as string) ?? null,
            status: 'registrado',
          })),
          ...doencasRes.data.map((o) => ({
            id: o.id,
            tipo: 'doenca' as const,
            talhaoCodigo: talhaoCodigos.get(o.talhao_id as string) ?? '—',
            data: (o.data as string) ?? null,
            status: 'registrado',
          })),
          ...daninhasRes.data.map((o) => ({
            id: o.id,
            tipo: 'planta_daninha' as const,
            talhaoCodigo: talhaoCodigos.get(o.talhao_id as string) ?? '—',
            data: (o.data as string) ?? null,
            status: 'registrado',
          })),
          ...atipicasRes.data.map((o) => ({
            id: o.id,
            tipo: 'planta_atipica' as const,
            talhaoCodigo: talhaoCodigos.get(o.talhao_id as string) ?? '—',
            data: (o.data as string) ?? null,
            status: String(o.status ?? 'registrado'),
          })),
        ].sort((a, b) => (b.data ?? '').localeCompare(a.data ?? ''))

        setTotalCooperados(cooperadosRes.data.length)
        setTotalTalhoes(talhoesRes.data.length)
        setTotalOcorrencias(
          pragasRes.data.length + doencasRes.data.length + daninhasRes.data.length + atipicasRes.data.length,
        )
        setTotalPendentes(atipicasRes.data.filter((o) => o.status === 'pendente_validacao').length)
        setRecentes(combinados.slice(0, 6))
      } catch {
        setErro('Erro ao carregar o dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalGeral = totalCooperados + totalTalhoes + totalOcorrencias

  const stats: { label: string; value: number; icon: LucideIcon; color: keyof typeof STAT_STYLES }[] = [
    { label: 'Cooperados', value: totalCooperados, icon: Users, color: 'blue' },
    { label: 'Talhões', value: totalTalhoes, icon: MapPin, color: 'teal' },
    { label: 'Ocorrências', value: totalOcorrencias, icon: ClipboardList, color: 'amber' },
    { label: 'Validações pendentes', value: totalPendentes, icon: ShieldAlert, color: 'red' },
  ]

  const acoes: { to: string; label: string; sub: string; icon: LucideIcon; primary?: boolean }[] = [
    { to: '/reconhecimento', label: 'Reconhecimento IA', sub: 'Classificar uma foto', icon: ScanEye, primary: true },
    { to: '/cooperados', label: 'Cooperados', sub: 'Gerenciar cadastro', icon: Users },
    { to: '/talhoes', label: 'Talhões', sub: 'Ver todos', icon: MapPin },
    { to: '/plantas-atipicas', label: 'Validações', sub: 'Pendentes de decisão', icon: ShieldAlert },
  ]

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
      <p className="text-sm text-gray-500 mb-6">
        {erro ? erro : loading ? 'Carregando...' : `${totalGeral} registros no total`}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${STAT_STYLES[s.color].bg} ${STAT_STYLES[s.color].text}`}
            >
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-semibold text-gray-800">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ações rápidas</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {acoes.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className={`rounded-xl border p-4 flex flex-col gap-2 transition-colors ${
              a.primary
                ? 'bg-green-700 border-green-700 text-white hover:bg-green-800'
                : 'bg-white border-gray-200 text-gray-800 hover:border-gray-300'
            }`}
          >
            <a.icon className={`w-5 h-5 ${a.primary ? 'text-white' : 'text-green-700'}`} />
            <div>
              <p className="text-sm font-medium">{a.label}</p>
              <p className={`text-xs ${a.primary ? 'text-green-100' : 'text-gray-500'}`}>{a.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Últimos registros</h2>
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {recentes.length === 0 && !loading && (
          <p className="p-4 text-sm text-gray-400 text-center">Nenhum registro ainda</p>
        )}
        {recentes.map((r) => (
          <div key={r.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                <ClipboardList className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{r.talhaoCodigo}</p>
                <p className="text-xs text-gray-500">{TIPO_LABELS[r.tipo]}</p>
              </div>
            </div>
            <div className="text-right">
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  r.status === 'pendente_validacao' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
                }`}
              >
                {r.status === 'pendente_validacao' ? 'Pendente' : 'Registrado'}
              </span>
              {r.data && <p className="text-xs text-gray-400 mt-1">{r.data}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
