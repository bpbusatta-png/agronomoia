import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const NAV_ITEMS = [
  { to: '/', label: 'Início', end: true },
  { to: '/empresas', label: 'Empresas' },
  { to: '/cooperados', label: 'Cooperados' },
  { to: '/fazendas', label: 'Fazendas' },
  { to: '/safras', label: 'Safras' },
  { to: '/cultivares', label: 'Cultivares' },
  { to: '/talhoes', label: 'Talhões' },
  { to: '/contratos', label: 'Contratos' },
]

export function AppShell() {
  const { logout } = useAuth()
  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-56 bg-green-900 text-white flex flex-col">
        <div className="px-4 py-5 text-lg font-semibold border-b border-green-800">Agrônomo IA</div>
        <nav className="flex-1 py-4">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block px-4 py-2 text-sm ${isActive ? 'bg-green-800 font-medium' : 'hover:bg-green-800/60'}`
              }
            >
              {item.label}
            </NavLink>
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
