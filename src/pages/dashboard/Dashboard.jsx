import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Dashboard() {
  const { perfil, esAdmin } = useAuth()

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl text-mama-charcoal mb-1">
        Hola, {perfil?.nombre || '...'}
      </h1>
      <p className="text-mama-gray mb-6">
        {esAdmin ? 'Panel de administrador' : 'Panel operativo'}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <TarjetaAcceso titulo="Compras" to="/compras" />
        <TarjetaAcceso titulo="Producción" to="/produccion" />
        <TarjetaAcceso titulo="Ventas" to="/ventas" />
        <TarjetaAcceso titulo="Gastos" to="/gastos" />
        {esAdmin && (
          <>
            <TarjetaAcceso titulo="Catálogos" to="/catalogos" />
            <TarjetaAcceso titulo="Finanzas" to="/finanzas" />
            <TarjetaAcceso titulo="Recomendaciones" to="/finanzas/recomendaciones" />
            <TarjetaAcceso titulo="Usuarios" to="/usuarios" />
          </>
        )}
      </div>

      <p className="text-xs text-mama-gray mt-8">
        (Este dashboard es un esqueleto — los módulos se conectarán a datos reales en los próximos pasos)
      </p>
    </div>
  )
}

function TarjetaAcceso({ titulo, to }) {
  return (
    <Link
      to={to}
      className="block bg-white rounded-xl shadow-sm border border-mama-gray/10 p-5 hover:shadow-md hover:border-mama-terracotta/40 transition-all"
    >
      <span className="font-medium text-mama-charcoal">{titulo}</span>
    </Link>
  )
}
