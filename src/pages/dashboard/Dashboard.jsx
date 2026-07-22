import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'

const ACCESOS_EMPLEADO = [
  { titulo: 'Compras', to: '/compras' },
  { titulo: 'Producción', to: '/produccion' },
  { titulo: 'Ventas', to: '/ventas' },
  { titulo: 'Gastos', to: '/gastos' },
]

const ACCESOS_ADMIN = [
  { titulo: 'Catálogos', to: '/catalogos' },
  { titulo: 'Finanzas', to: '/finanzas' },
  { titulo: 'Recomendaciones', to: '/finanzas/recomendaciones' },
  { titulo: 'Exportar datos', to: '/exportacion' },
  { titulo: 'Usuarios', to: '/usuarios' },
]

function hoyISO() {
  return new Date().toISOString().slice(0, 10)
}

function haceDias(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export default function Dashboard() {
  const { perfil, esAdmin } = useAuth()

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [insumosStockBajo, setInsumosStockBajo] = useState([])
  const [productosStockBajo, setProductosStockBajo] = useState([])
  const [ventasHoy, setVentasHoy] = useState([])
  const [masVendidosSemana, setMasVendidosSemana] = useState([])

  useEffect(() => {
    async function cargar() {
      setCargando(true)
      setError('')

      const [insumosRes, productosRes, ventasHoyRes, ventasSemanaRes] = await Promise.all([
        supabase.from('insumos').select('id, nombre, stock_actual, stock_minimo, unidad_medida'),
        supabase
          .from('productos')
          .select('id, nombre, stock_actual, stock_minimo, unidad_venta')
          .eq('activo', true),
        supabase
          .from('ventas')
          .select('cantidad, total, productos(nombre)')
          .eq('fecha', hoyISO()),
        supabase
          .from('ventas')
          .select('cantidad, productos(nombre)')
          .gte('fecha', haceDias(7)),
      ])

      if (insumosRes.error || productosRes.error || ventasHoyRes.error || ventasSemanaRes.error) {
        setError('No se pudieron cargar algunos datos del panel. Intenta recargar la página.')
      }

      if (insumosRes.data) {
        setInsumosStockBajo(insumosRes.data.filter((i) => i.stock_actual <= i.stock_minimo))
      }
      if (productosRes.data) {
        setProductosStockBajo(productosRes.data.filter((p) => p.stock_actual <= p.stock_minimo))
      }
      if (ventasHoyRes.data) {
        setVentasHoy(ventasHoyRes.data)
      }
      if (ventasSemanaRes.data) {
        const conteo = {}
        ventasSemanaRes.data.forEach((v) => {
          const nombre = v.productos?.nombre || 'Producto eliminado'
          conteo[nombre] = (conteo[nombre] || 0) + Number(v.cantidad)
        })
        const ranking = Object.entries(conteo)
          .map(([nombre, cantidad]) => ({ nombre, cantidad }))
          .sort((a, b) => b.cantidad - a.cantidad)
          .slice(0, 5)
        setMasVendidosSemana(ranking)
      }

      setCargando(false)
    }

    cargar()
  }, [])

  const totalVentasHoy = useMemo(
    () => ventasHoy.reduce((acc, v) => acc + Number(v.total), 0),
    [ventasHoy]
  )
  const unidadesVendidasHoy = useMemo(
    () => ventasHoy.reduce((acc, v) => acc + Number(v.cantidad), 0),
    [ventasHoy]
  )

  const alertasStock = insumosStockBajo.length + productosStockBajo.length

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl text-mama-charcoal mb-1">
        Hola, {perfil?.nombre || '...'}
      </h1>
      <p className="text-mama-gray mb-6">
        {esAdmin ? 'Panel de administrador' : 'Panel operativo'}
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      {/* Accesos rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {ACCESOS_EMPLEADO.map((a) => (
          <TarjetaAcceso key={a.titulo} {...a} />
        ))}
        {esAdmin && ACCESOS_ADMIN.map((a) => <TarjetaAcceso key={a.titulo} {...a} />)}
      </div>

      {cargando ? (
        <p className="text-mama-gray">Cargando resumen del negocio...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Resumen del día */}
          <div className="bg-white rounded-xl shadow-sm border border-mama-gray/10 p-5">
            <h2 className="font-medium text-mama-charcoal mb-4">Resumen de hoy</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-display text-mama-terracotta-dark">
                  ${totalVentasHoy.toLocaleString('es-CO')}
                </p>
                <p className="text-sm text-mama-gray">Ingresado en ventas</p>
              </div>
              <div>
                <p className="text-2xl font-display text-mama-terracotta-dark">
                  {unidadesVendidasHoy}
                </p>
                <p className="text-sm text-mama-gray">Unidades vendidas</p>
              </div>
            </div>
            {ventasHoy.length === 0 && (
              <p className="text-sm text-mama-gray mt-4">Aún no hay ventas registradas hoy.</p>
            )}
          </div>

          {/* Alertas de inventario */}
          <div className="bg-white rounded-xl shadow-sm border border-mama-gray/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium text-mama-charcoal">Alertas de inventario</h2>
              {alertasStock > 0 && (
                <span className="bg-red-50 text-red-600 text-xs px-2 py-0.5 rounded-full">
                  {alertasStock} {alertasStock === 1 ? 'alerta' : 'alertas'}
                </span>
              )}
            </div>

            {alertasStock === 0 ? (
              <p className="text-sm text-mama-gray">
                Todo el inventario está por encima del mínimo. 🎉
              </p>
            ) : (
              <ul className="text-sm space-y-2">
                {insumosStockBajo.map((i) => (
                  <li key={`insumo-${i.id}`} className="flex justify-between">
                    <span className="text-mama-charcoal">{i.nombre} (insumo)</span>
                    <span className="text-red-600 font-medium">
                      {i.stock_actual} {i.unidad_medida}
                    </span>
                  </li>
                ))}
                {productosStockBajo.map((p) => (
                  <li key={`producto-${p.id}`} className="flex justify-between">
                    <span className="text-mama-charcoal">{p.nombre} (producto)</span>
                    <span className="text-red-600 font-medium">
                      {p.stock_actual} {p.unidad_venta}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Más vendidos de la semana */}
          <div className="bg-white rounded-xl shadow-sm border border-mama-gray/10 p-5 lg:col-span-2">
            <h2 className="font-medium text-mama-charcoal mb-4">Más vendidos esta semana</h2>
            {masVendidosSemana.length === 0 ? (
              <p className="text-sm text-mama-gray">Aún no hay ventas en los últimos 7 días.</p>
            ) : (
              <ul className="space-y-2">
                {masVendidosSemana.map((item, i) => (
                  <li key={item.nombre} className="flex items-center gap-3">
                    <span className="text-mama-gray text-sm w-4">{i + 1}</span>
                    <span className="text-mama-charcoal flex-1">{item.nombre}</span>
                    <span className="text-mama-gray text-sm">{item.cantidad} unidades</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
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
