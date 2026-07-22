import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'

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
        <div className="bg-mama-maroon-50 border border-mama-maroon-200 text-mama-maroon-700 text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      {/* Accesos rápidos: ya viven en el menú lateral */}

      {cargando ? (
        <p className="text-mama-gray">Cargando resumen del negocio...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Resumen del día */}
          <div className="bg-mama-terracotta rounded-2xl shadow-sm p-5 text-mama-cream">
            <h2 className="font-medium mb-4 text-mama-cream/80">Resumen de hoy</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-display">
                  ${totalVentasHoy.toLocaleString('es-CO')}
                </p>
                <p className="text-sm text-mama-cream/60">Ingresado en ventas</p>
              </div>
              <div>
                <p className="text-2xl font-display">{unidadesVendidasHoy}</p>
                <p className="text-sm text-mama-cream/60">Unidades vendidas</p>
              </div>
            </div>
            {ventasHoy.length === 0 && (
              <p className="text-sm text-mama-cream/60 mt-4">
                Aún no hay ventas registradas hoy.
              </p>
            )}
          </div>

          {/* Alertas de inventario */}
          <div className="bg-white rounded-2xl shadow-sm border border-mama-gray/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium text-mama-charcoal">Alertas de inventario</h2>
              {alertasStock > 0 && (
                <span className="bg-mama-maroon-50 text-mama-maroon-600 text-xs px-2.5 py-1 rounded-full font-medium">
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
                    <span className="text-mama-maroon-600 font-medium">
                      {i.stock_actual} {i.unidad_medida}
                    </span>
                  </li>
                ))}
                {productosStockBajo.map((p) => (
                  <li key={`producto-${p.id}`} className="flex justify-between">
                    <span className="text-mama-charcoal">{p.nombre} (producto)</span>
                    <span className="text-mama-maroon-600 font-medium">
                      {p.stock_actual} {p.unidad_venta}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Más vendidos de la semana */}
          <div className="bg-white rounded-2xl shadow-sm border border-mama-gray/10 p-5 lg:col-span-2">
            <h2 className="font-medium text-mama-charcoal mb-4">Más vendidos esta semana</h2>
            {masVendidosSemana.length === 0 ? (
              <p className="text-sm text-mama-gray">Aún no hay ventas en los últimos 7 días.</p>
            ) : (
              <ul className="space-y-2">
                {masVendidosSemana.map((item, i) => (
                  <li key={item.nombre} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-mama-cream text-mama-terracotta text-xs font-medium flex items-center justify-center">
                      {i + 1}
                    </span>
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
