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
        <TarjetaAcceso titulo="Compras" href="/compras" />
        <TarjetaAcceso titulo="Producción" href="/produccion" />
        <TarjetaAcceso titulo="Ventas" href="/ventas" />
        <TarjetaAcceso titulo="Gastos" href="/gastos" />
        {esAdmin && (
          <>
            <TarjetaAcceso titulo="Catálogos" href="/catalogos" />
            <TarjetaAcceso titulo="Finanzas" href="/finanzas" />
            <TarjetaAcceso titulo="Recomendaciones" href="/finanzas/recomendaciones" />
            <TarjetaAcceso titulo="Usuarios" href="/usuarios" />
          </>
        )}
      </div>

      <p className="text-xs text-mama-gray mt-8">
        (Este dashboard es un esqueleto — los módulos se conectarán a datos reales en los próximos pasos)
      </p>
    </div>
  )
}

function TarjetaAcceso({ titulo, href }) {
  return (
    <a
      href={href}
      className="block bg-white rounded-xl shadow-sm border border-mama-gray/10 p-5 hover:shadow-md hover:border-mama-terracotta/40 transition-all"
    >
      <span className="font-medium text-mama-charcoal">{titulo}</span>
    </a>
  )
}
