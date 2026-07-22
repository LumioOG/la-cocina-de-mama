import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  ChefHat,
  TrendingUp,
  Receipt,
  BookOpen,
  PiggyBank,
  Lightbulb,
  Download,
  Users,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV_EMPLEADO = [
  { titulo: 'Dashboard', to: '/', icono: LayoutDashboard, exact: true },
  { titulo: 'Compras', to: '/compras', icono: ShoppingCart },
  { titulo: 'Producción', to: '/produccion', icono: ChefHat },
  { titulo: 'Ventas', to: '/ventas', icono: TrendingUp },
  { titulo: 'Gastos', to: '/gastos', icono: Receipt },
]

const NAV_ADMIN = [
  { titulo: 'Catálogos', to: '/catalogos', icono: BookOpen },
  { titulo: 'Finanzas', to: '/finanzas', icono: PiggyBank },
  { titulo: 'Recomendaciones', to: '/finanzas/recomendaciones', icono: Lightbulb },
  { titulo: 'Exportar datos', to: '/exportacion', icono: Download },
  { titulo: 'Usuarios', to: '/usuarios', icono: Users },
]

function iniciales(nombre) {
  if (!nombre) return '?'
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export default function AppLayout() {
  const { perfil, esAdmin, logout } = useAuth()
  const location = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)

  const items = esAdmin ? [...NAV_EMPLEADO, ...NAV_ADMIN] : NAV_EMPLEADO

  function estaActivo(item) {
    return item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to)
  }

  const contenidoSidebar = (
    <div className="h-full flex flex-col bg-mama-terracotta text-mama-cream rounded-3xl p-5">
      <div className="flex flex-col items-center text-center pb-6 mb-2 border-b border-mama-cream/10">
        <span className="w-16 h-16 rounded-full bg-mama-cream/15 flex items-center justify-center font-display text-xl mb-3">
          {iniciales(perfil?.nombre)}
        </span>
        <p className="font-medium">{perfil?.nombre}</p>
        <p className="text-xs text-mama-cream/60">{esAdmin ? 'Administrador' : 'Empleado'}</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const Icono = item.icono
          const activo = estaActivo(item)
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMenuAbierto(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                activo
                  ? 'bg-mama-maroon-600 text-white'
                  : 'text-mama-cream/80 hover:bg-mama-cream/10'
              }`}
            >
              <Icono size={18} strokeWidth={2} />
              {item.titulo}
            </Link>
          )
        })}
      </nav>

      <button
        onClick={logout}
        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-mama-cream/70 hover:bg-mama-cream/10 mt-2"
      >
        <LogOut size={18} strokeWidth={2} />
        Salir
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-mama-cream md:flex md:p-4 md:gap-4">
      {/* Sidebar — fijo en escritorio */}
      <aside className="hidden md:block md:w-64 md:shrink-0">
        <div className="sticky top-4 h-[calc(100vh-2rem)]">{contenidoSidebar}</div>
      </aside>

      {/* Barra superior — solo en móvil */}
      <header className="md:hidden bg-mama-terracotta text-mama-cream px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-display text-lg">
          La Cocina de Mamá
        </Link>
        <button onClick={() => setMenuAbierto(true)} aria-label="Abrir menú">
          <Menu size={22} />
        </button>
      </header>

      {/* Menú deslizable — solo en móvil */}
      {menuAbierto && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-72 p-3">
            <div className="relative h-full">
              <button
                onClick={() => setMenuAbierto(false)}
                className="absolute -right-1 -top-1 z-10 bg-mama-cream text-mama-terracotta rounded-full p-1.5 shadow-md"
                aria-label="Cerrar menú"
              >
                <X size={18} />
              </button>
              {contenidoSidebar}
            </div>
          </div>
          <div
            className="flex-1 bg-black/30"
            onClick={() => setMenuAbierto(false)}
            aria-hidden="true"
          />
        </div>
      )}

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
