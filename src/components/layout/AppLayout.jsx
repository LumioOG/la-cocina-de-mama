import { Outlet, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AppLayout() {
  const { perfil, esAdmin, logout } = useAuth()

  return (
    <div className="min-h-screen bg-mama-cream">
      <header className="bg-white border-b border-mama-gray/10 px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-display text-lg text-mama-terracotta-dark">
          La Cocina de Mamá
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-mama-gray hidden sm:inline">
            {perfil?.nombre} · {esAdmin ? 'Admin' : 'Empleado'}
          </span>
          <button
            onClick={logout}
            className="text-mama-terracotta hover:text-mama-terracotta-dark font-medium"
          >
            Salir
          </button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
