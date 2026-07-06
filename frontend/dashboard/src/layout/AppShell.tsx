import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const NAV_SECTIONS = [
  {
    title: null,
    items: [{ to: '/', label: 'Início', end: true }],
  },
  {
    title: 'Núcleo',
    items: [
      { to: '/empresas', label: 'Empresas' },
      { to: '/cooperados', label: 'Cooperados' },
      { to: '/fazendas', label: 'Fazendas' },
      { to: '/safras', label: 'Safras' },
      { to: '/cultivares', label: 'Cultivares' },
      { to: '/talhoes', label: 'Talhões' },
      { to: '/contratos', label: 'Contratos' },
    ],
  },
  {
    title: 'Monitoramento',
    items: [
      { to: '/inspecoes', label: 'Inspeções' },
      { to: '/aplicacoes', label: 'Aplicações' },
      { to: '/historico-climatico', label: 'Histórico Climático' },
      { to: '/analises-solo', label: 'Análises de Solo' },
      { to: '/fotografias', label: 'Fotografias' },
    ],
  },
  {
    title: 'Inteligência',
    items: [
      { to: '/pragas-catalogo', label: 'Catálogo de Pragas' },
      { to: '/ocorrencias-pragas', label: 'Ocorrências de Pragas' },
      { to: '/doencas-catalogo', label: 'Catálogo de Doenças' },
      { to: '/ocorrencias-doencas', label: 'Ocorrências de Doenças' },
      { to: '/plantas-atipicas', label: 'Plantas Atípicas' },
      { to: '/ndvi-leituras', label: 'NDVI' },
      { to: '/produtividade-estimativas', label: 'Produtividade' },
      { to: '/colheita', label: 'Colheita' },
      { to: '/modelos-versoes', label: 'Modelos de IA' },
    ],
  },
]

export function AppShell() {
  const { logout } = useAuth()
  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-56 bg-green-900 text-white flex flex-col">
        <div className="px-4 py-5 text-lg font-semibold border-b border-green-800">Agrônomo IA</div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title ?? 'root'} className="mb-2">
              {section.title && (
                <div className="px-4 pt-3 pb-1 text-xs uppercase tracking-wide text-green-300/80">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={'end' in item ? item.end : false}
                  className={({ isActive }) =>
                    `block px-4 py-2 text-sm ${isActive ? 'bg-green-800 font-medium' : 'hover:bg-green-800/60'}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <button onClick={logout} className="m-4 px-3 py-2 text-sm rounded bg-green-800 hover:bg-green-700">
          Sair
        </button>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
