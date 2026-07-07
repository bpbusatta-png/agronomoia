import {
  Bug,
  Building2,
  Camera,
  CalendarRange,
  ClipboardCheck,
  CloudRain,
  Cpu,
  Dna,
  FileText,
  FlaskConical,
  Home,
  LayoutDashboard,
  Leaf,
  LogOut,
  Map,
  Microscope,
  Satellite,
  ScanEye,
  ShieldAlert,
  SprayCan,
  Sprout,
  Stethoscope,
  Users,
  TreeDeciduous,
  TrendingUp,
  Wheat,
  type LucideIcon,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const NAV_SECTIONS: { title: string | null; items: NavItem[] }[] = [
  {
    title: null,
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    title: 'Núcleo',
    items: [
      { to: '/empresas', label: 'Empresas', icon: Building2 },
      { to: '/cooperados', label: 'Cooperados', icon: Users },
      { to: '/fazendas', label: 'Fazendas', icon: Home },
      { to: '/safras', label: 'Safras', icon: CalendarRange },
      { to: '/cultivares', label: 'Cultivares', icon: Sprout },
      { to: '/talhoes', label: 'Talhões', icon: Map },
      { to: '/contratos', label: 'Contratos', icon: FileText },
    ],
  },
  {
    title: 'Monitoramento',
    items: [
      { to: '/inspecoes', label: 'Inspeções', icon: ClipboardCheck },
      { to: '/aplicacoes', label: 'Aplicações', icon: SprayCan },
      { to: '/historico-climatico', label: 'Histórico Climático', icon: CloudRain },
      { to: '/analises-solo', label: 'Análises de Solo', icon: FlaskConical },
      { to: '/fotografias', label: 'Fotografias', icon: Camera },
    ],
  },
  {
    title: 'Inteligência',
    items: [
      { to: '/reconhecimento', label: 'Reconhecimento IA', icon: ScanEye },
      { to: '/pragas-catalogo', label: 'Catálogo de Pragas', icon: Bug },
      { to: '/ocorrencias-pragas', label: 'Ocorrências de Pragas', icon: ShieldAlert },
      { to: '/doencas-catalogo', label: 'Catálogo de Doenças', icon: Microscope },
      { to: '/ocorrencias-doencas', label: 'Ocorrências de Doenças', icon: Stethoscope },
      { to: '/plantas-daninhas-catalogo', label: 'Catálogo de Plantas Daninhas', icon: Leaf },
      { to: '/ocorrencias-plantas-daninhas', label: 'Ocorrências de Plantas Daninhas', icon: TreeDeciduous },
      { to: '/plantas-atipicas', label: 'Plantas Atípicas', icon: Dna },
      { to: '/ndvi-leituras', label: 'NDVI', icon: Satellite },
      { to: '/produtividade-estimativas', label: 'Produtividade', icon: TrendingUp },
      { to: '/colheita', label: 'Colheita', icon: Wheat },
      { to: '/modelos-versoes', label: 'Modelos de IA', icon: Cpu },
    ],
  },
]

export function AppShell() {
  const { logout, userEmail } = useAuth()
  const initials = (userEmail ?? '??').slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-green-700 text-white flex items-center justify-between px-6 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold leading-tight">Agrônomo IA</p>
            <p className="text-xs text-green-100 leading-tight">Plataforma de inteligência agrícola</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-xs font-semibold">
            {initials}
          </div>
          <span className="text-sm text-green-50 hidden sm:inline">{userEmail}</span>
          <button
            onClick={logout}
            title="Sair"
            aria-label="Sair"
            className="p-1.5 rounded hover:bg-white/10 text-green-50"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <nav className="flex-1 py-3 overflow-y-auto">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title ?? 'root'} className="mb-1">
                {section.title && (
                  <div className="px-4 pt-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    {section.title}
                  </div>
                )}
                {section.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end ?? false}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 mx-2 px-3 py-2 rounded-lg text-sm ${
                          isActive ? 'bg-green-700 text-white font-medium' : 'text-gray-600 hover:bg-gray-100'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  )
                })}
              </div>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
