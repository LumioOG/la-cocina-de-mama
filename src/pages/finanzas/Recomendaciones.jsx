import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

const MARGEN_OBJETIVO = 0.35 // 35% — margen saludable de referencia
const MARGEN_MINIMO_ACEPTABLE = 0.2 // debajo de esto, se considera "en riesgo"

function formatoCOP(valor) {
  return '$' + Number(valor || 0).toLocaleString('es-CO')
}

export default function Recomendaciones() {
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [recomendaciones, setRecomendaciones] = useState([])
  const [sinDatos, setSinDatos] = useState([])

  useEffect(() => {
    async function analizar() {
      setCargando(true)
      setError('')

      const [productosRes, produccionesRes] = await Promise.all([
        supabase.from('productos').select('id, nombre, precio_venta_actual').eq('activo', true),
        supabase
          .from('producciones')
          .select('producto_id, fecha, costo_por_bandeja')
          .order('fecha', { ascending: true }),
      ])

      if (productosRes.error || produccionesRes.error) {
        setError('No se pudieron cargar los datos para el análisis.')
        setCargando(false)
        return
      }

      const productos = productosRes.data || []
      const producciones = produccionesRes.data || []

      const analisis = []
      const faltantes = []

      productos.forEach((producto) => {
        const historial = producciones.filter((p) => p.producto_id === producto.id)

        if (historial.length === 0) {
          faltantes.push(producto.nombre)
          return
        }

        const ultimoCosto = Number(historial[historial.length - 1].costo_por_bandeja)
        const precio = Number(producto.precio_venta_actual)

        const margenActual = precio > 0 ? (precio - ultimoCosto) / precio : 0

        // Tendencia de costo: compara el primer costo registrado vs el más reciente
        const primerCosto = Number(historial[0].costo_por_bandeja)
        const variacionCosto =
          primerCosto > 0 ? ((ultimoCosto - primerCosto) / primerCosto) * 100 : 0

        const precioSugerido = ultimoCosto / (1 - MARGEN_OBJETIVO)

        analisis.push({
          producto: producto.nombre,
          costoActual: ultimoCosto,
          precioActual: precio,
          margenActual,
          variacionCosto,
          precioSugerido,
          enRiesgo: margenActual < MARGEN_MINIMO_ACEPTABLE,
          huboVariosLotes: historial.length > 1,
        })
      })

      analisis.sort((a, b) => a.margenActual - b.margenActual)

      setRecomendaciones(analisis)
      setSinDatos(faltantes)
      setCargando(false)
    }

    analizar()
  }, [])

  const enRiesgo = useMemo(
    () => recomendaciones.filter((r) => r.enRiesgo),
    [recomendaciones]
  )
  const saludables = useMemo(
    () => recomendaciones.filter((r) => !r.enRiesgo),
    [recomendaciones]
  )

  return (
    <div className="p-6">
      <Link to="/finanzas" className="text-sm text-mama-terracotta hover:underline">
        ← Finanzas
      </Link>
      <h1 className="font-display text-2xl text-mama-charcoal mt-1 mb-1">
        Recomendaciones inteligentes
      </h1>
      <p className="text-mama-gray mb-6">
        Comparamos el costo real de producción (según tus recetas e insumos) contra el precio
        de venta actual, para detectar dónde el margen se está achicando.
      </p>

      {error && (
        <div className="bg-mama-maroon-50 border border-mama-maroon-200 text-mama-maroon-700 text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      {cargando ? (
        <p className="text-mama-gray">Analizando costos y precios...</p>
      ) : recomendaciones.length === 0 ? (
        <div className="bg-mama-gold/10 border border-mama-gold/30 text-mama-charcoal text-sm rounded-lg p-4">
          Todavía no hay suficientes producciones registradas para generar recomendaciones.
          Registra al menos una producción por producto en el módulo de Producción.
        </div>
      ) : (
        <>
          {enRiesgo.length > 0 && (
            <div className="mb-8">
              <h2 className="font-medium text-mama-charcoal mb-3">
                ⚠️ Productos con margen en riesgo (menos del {MARGEN_MINIMO_ACEPTABLE * 100}%)
              </h2>
              <div className="space-y-3">
                {enRiesgo.map((r) => (
                  <TarjetaRecomendacion key={r.producto} r={r} />
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="font-medium text-mama-charcoal mb-3">
              Resto de productos ({saludables.length})
            </h2>
            {saludables.length === 0 ? (
              <p className="text-sm text-mama-gray">
                Todos tus productos con datos suficientes están en la lista de riesgo de arriba.
              </p>
            ) : (
              <div className="space-y-3">
                {saludables.map((r) => (
                  <TarjetaRecomendacion key={r.producto} r={r} />
                ))}
              </div>
            )}
          </div>

          {sinDatos.length > 0 && (
            <div className="mt-8 bg-white rounded-xl border border-mama-gray/10 p-4">
              <p className="text-sm text-mama-charcoal font-medium mb-1">
                Sin datos suficientes todavía:
              </p>
              <p className="text-sm text-mama-gray">{sinDatos.join(', ')}</p>
              <p className="text-xs text-mama-gray mt-1">
                Registra al menos una producción de estos productos para incluirlos en el
                análisis.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function TarjetaRecomendacion({ r }) {
  const margenPct = (r.margenActual * 100).toFixed(1)
  const colorMargen = r.enRiesgo ? 'text-mama-maroon-600' : 'text-mama-green'

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border p-5 ${
        r.enRiesgo ? 'border-mama-maroon-200' : 'border-mama-gray/10'
      }`}
    >
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <p className="font-medium text-mama-charcoal">{r.producto}</p>
          <p className="text-sm text-mama-gray">
            Costo actual: {formatoCOP(r.costoActual)} · Precio actual: {formatoCOP(r.precioActual)}
          </p>
        </div>
        <span className={`text-sm font-medium ${colorMargen}`}>Margen: {margenPct}%</span>
      </div>

      {r.enRiesgo && (
        <div className="mt-3 bg-mama-maroon-50 rounded-lg p-3 text-sm text-mama-charcoal">
          Recomendamos subir el precio de <strong>{r.producto}</strong> a{' '}
          <strong>{formatoCOP(r.precioSugerido)}</strong>
          {r.huboVariosLotes && r.variacionCosto > 0 && (
            <>
              {' '}
              porque el costo de producción ha subido un{' '}
              <strong>{r.variacionCosto.toFixed(1)}%</strong> desde tu primer registro
            </>
          )}
          {(!r.huboVariosLotes || r.variacionCosto <= 0) && (
            <> para alcanzar un margen saludable del {MARGEN_OBJETIVO * 100}%</>
          )}
          .
        </div>
      )}
    </div>
  )
}
