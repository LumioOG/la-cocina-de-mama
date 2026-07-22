import { Outlet, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

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

  return (
    <div className="min-h-screen bg-mama-cream">
      <header className="relative bg-mama-terracotta">
        <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-display text-lg text-mama-cream tracking-wide">
            La Cocina de Mamá
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-mama-cream/15 text-mama-cream text-xs font-medium flex items-center justify-center">
                {iniciales(perfil?.nombre)}
              </span>
              <div className="text-sm leading-tight">
                <p className="text-mama-cream font-medium">{perfil?.nombre}</p>
                <p className="text-mama-cream/60 text-xs">
                  {esAdmin ? 'Administrador' : 'Empleado'}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className="text-sm bg-mama-cream/10 hover:bg-mama-cream/20 text-mama-cream px-3 py-1.5 rounded-full font-medium"
            >
              Salir
            </button>
          </div>
        </div>

        {/* Firma visual: borde ondulado tipo toldo de puesto de comida */}
        <svg
          className="w-full block"
          style={{ height: '14px' }}
          viewBox="0 0 240 14"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,0 C10,14 20,14 30,0 C40,14 50,14 60,0 C70,14 80,14 90,0 C100,14 110,14 120,0 C130,14 140,14 150,0 C160,14 170,14 180,0 C190,14 200,14 210,0 C220,14 230,14 240,0 L240,0 L0,0 Z"
            fill="var(--color-mama-terracotta)"
          />
        </svg>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  )
}
