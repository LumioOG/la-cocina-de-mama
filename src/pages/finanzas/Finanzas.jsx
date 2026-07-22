import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { supabase } from '../../lib/supabaseClient'

const PERIODOS = [
  { id: 'semana', nombre: 'Últimos 7 días', dias: 7 },
  { id: 'mes', nombre: 'Últimos 30 días', dias: 30 },
]

function haceDias(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function formatoCOP(valor) {
  return '$' + Number(valor || 0).toLocaleString('es-CO')
}

export default function Finanzas() {
  const [periodo, setPeriodo] = useState(PERIODOS[0])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [ventas, setVentas] = useState([])
  const [producciones, setProducciones] = useState([])
  const [compras, setCompras] = useState([])
  const [gastos, setGastos] = useState([])

  useEffect(() => {
    async function cargar() {
      setCargando(true)
      setError('')
      const desde = haceDias(periodo.dias)

      const [ventasRes, produccionesRes, comprasRes, gastosRes] = await Promise.all([
        supabase.from('ventas').select('fecha, total').gte('fecha', desde),
        supabase
          .from('producciones')
          .select('fecha, costo_total_calculado')
          .gte('fecha', desde),
        supabase.from('compras').select('fecha, costo_total').gte('fecha', desde),
        supabase.from('gastos_operativos').select('fecha, valor').gte('fecha', desde),
      ])

      if (ventasRes.error || produccionesRes.error || comprasRes.error || gastosRes.error) {
        setError('No se pudieron cargar algunos datos financieros.')
      }

      setVentas(ventasRes.data || [])
      setProducciones(produccionesRes.data || [])
      setCompras(comprasRes.data || [])
      setGastos(gastosRes.data || [])
      setCargando(false)
    }

    cargar()
  }, [periodo])

  const totales = useMemo(() => {
    const totalVentas = ventas.reduce((acc, v) => acc + Number(v.total), 0)
    const totalCostoProduccion = producciones.reduce(
      (acc, p) => acc + Number(p.costo_total_calculado || 0),
      0
    )
    const totalCompras = compras.reduce((acc, c) => acc + Number(c.costo_total), 0)
    const totalGastos = gastos.reduce((acc, g) => acc + Number(g.valor), 0)
    const utilidadEstimada = totalVentas - totalCostoProduccion - totalGastos

    return {
      totalVentas,
      totalCostoProduccion,
      totalCompras,
      totalGastos,
      utilidadEstimada,
      promedioVentaDiaria: totalVentas / periodo.dias,
      promedioGastoInsumosDiario: totalCompras / periodo.dias,
    }
  }, [ventas, producciones, compras, gastos, periodo])

  const datosGrafica = useMemo(() => {
    const porDia = {}
    for (let i = periodo.dias - 1; i >= 0; i--) {
      const fecha = haceDias(i)
      porDia[fecha] = { fecha, ventas: 0 }
    }
    ventas.forEach((v) => {
      if (porDia[v.fecha]) porDia[v.fecha].ventas += Number(v.total)
    })
    return Object.values(porDia).map((d) => ({
      ...d,
      etiqueta: new Date(d.fecha + 'T00:00:00').toLocaleDateString('es-CO', {
        day: '2-digit',
        month: '2-digit',
      }),
    }))
  }, [ventas, periodo])

  return (
    <div className="p-6">
      <Link to="/" className="text-sm text-mama-terracotta hover:underline">
        ← Dashboard
      </Link>
      <div className="flex items-center justify-between mt-1 mb-1 flex-wrap gap-3">
        <h1 className="font-display text-2xl text-mama-charcoal">Finanzas</h1>
        <div className="flex gap-2">
          {PERIODOS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriodo(p)}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                periodo.id === p.id
                  ? 'bg-mama-terracotta text-white'
                  : 'bg-white text-mama-charcoal border border-mama-gray/20 hover:border-mama-terracotta/40'
              }`}
            >
              {p.nombre}
            </button>
          ))}
        </div>
      </div>
      <p className="text-mama-gray mb-6">
        Promedios y totales calculados sobre el período seleccionado.
      </p>

      {error && (
        <div className="bg-mama-maroon-50 border border-mama-maroon-200 text-mama-maroon-700 text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      {cargando ? (
        <p className="text-mama-gray">Cargando datos financieros...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <TarjetaMetrica
              titulo="Ventas totales"
              valor={formatoCOP(totales.totalVentas)}
              nota={`Promedio diario: ${formatoCOP(totales.promedioVentaDiaria)}`}
            />
            <TarjetaMetrica
              titulo="Costo de producción"
              valor={formatoCOP(totales.totalCostoProduccion)}
              nota="Según recetas e insumos usados"
            />
            <TarjetaMetrica
              titulo="Gastado en insumos"
              valor={formatoCOP(totales.totalCompras)}
              nota={`Promedio diario: ${formatoCOP(totales.promedioGastoInsumosDiario)}`}
            />
            <TarjetaMetrica
              titulo="Gastos operativos"
              valor={formatoCOP(totales.totalGastos)}
              nota="Luz, agua, nómina, etc."
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-mama-gray/10 p-5 mb-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-medium text-mama-charcoal">Utilidad estimada del período</h2>
              <span
                className={`text-xl font-display ${
                  totales.utilidadEstimada >= 0 ? 'text-mama-green' : 'text-mama-maroon-600'
                }`}
              >
                {formatoCOP(totales.utilidadEstimada)}
              </span>
            </div>
            <p className="text-xs text-mama-gray">
              Ventas − Costo de producción − Gastos operativos. No incluye compras de insumos
              que aún no se han usado en producción (esas quedan como inventario).
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-mama-gray/10 p-5">
            <h2 className="font-medium text-mama-charcoal mb-4">Tendencia de ventas</h2>
            {ventas.length === 0 ? (
              <p className="text-sm text-mama-gray">No hay ventas en este período.</p>
            ) : (
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <LineChart data={datosGrafica}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#8A817833" />
                    <XAxis dataKey="etiqueta" tick={{ fontSize: 12, fill: '#8A8178' }} />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#8A8178' }}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip formatter={(v) => formatoCOP(v)} labelFormatter={(l) => `Día ${l}`} />
                    <Line
                      type="monotone"
                      dataKey="ventas"
                      stroke="#C0553B"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function TarjetaMetrica({ titulo, valor, nota }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-mama-gray/10 p-4">
      <p className="text-sm text-mama-gray mb-1">{titulo}</p>
      <p className="text-xl font-display text-mama-charcoal">{valor}</p>
      {nota && <p className="text-xs text-mama-gray mt-1">{nota}</p>}
    </div>
  )
}
