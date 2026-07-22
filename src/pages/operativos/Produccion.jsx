import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

const FORM_VACIO = {
  fecha: new Date().toISOString().slice(0, 10),
  receta_id: '',
  num_lotes: '',
}

export default function Produccion() {
  const [producciones, setProducciones] = useState([])
  const [recetas, setRecetas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [ultimoResultado, setUltimoResultado] = useState(null)
  const [form, setForm] = useState(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)

  async function cargarDatos() {
    setCargando(true)
    setError('')

    const [produccionesRes, recetasRes] = await Promise.all([
      supabase
        .from('producciones')
        .select('*, productos(nombre), recetas(nombre)')
        .order('fecha', { ascending: false })
        .order('creado_en', { ascending: false })
        .limit(50),
      supabase
        .from('recetas')
        .select('id, nombre, rinde_bandejas, producto_id, productos(nombre)')
        .eq('activa', true)
        .order('nombre', { ascending: true }),
    ])

    if (produccionesRes.error) {
      setError('No se pudo cargar el historial: ' + produccionesRes.error.message)
    } else {
      setProducciones(produccionesRes.data)
    }
    if (recetasRes.data) setRecetas(recetasRes.data)

    setCargando(false)
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const recetaSeleccionada = useMemo(
    () => recetas.find((r) => r.id === form.receta_id),
    [recetas, form.receta_id]
  )

  const bandejasEstimadas = useMemo(() => {
    if (!recetaSeleccionada) return null
    return (Number(form.num_lotes) || 0) * recetaSeleccionada.rinde_bandejas
  }, [recetaSeleccionada, form.num_lotes])

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    setError('')
    setUltimoResultado(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('producciones')
      .insert({
        fecha: form.fecha,
        receta_id: form.receta_id,
        producto_id: recetaSeleccionada.producto_id,
        num_lotes: Number(form.num_lotes),
        registrado_por: user?.id,
      })
      .select('*, productos(nombre)')
      .single()

    setGuardando(false)

    if (error) {
      setError(
        'No se pudo registrar la producción. Verifica que haya suficiente stock de insumos. ' +
          error.message
      )
      return
    }

    setUltimoResultado(data)
    setForm({ ...FORM_VACIO, fecha: form.fecha })
    cargarDatos()
  }

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl text-mama-charcoal mb-1">Producción</h1>
      <p className="text-mama-gray mb-6">
        Registra cuántos lotes de una receta se produjeron. El costo se calcula solo.
      </p>

      {error && (
        <div className="bg-mama-maroon-50 border border-mama-maroon-200 text-mama-maroon-700 text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      {ultimoResultado && (
        <div className="bg-mama-green/10 border border-mama-green/30 rounded-lg p-4 mb-4 text-sm text-mama-charcoal">
          <p className="font-medium mb-1">✓ Producción registrada</p>
          <p>
            {ultimoResultado.bandejas_producidas} bandejas de {ultimoResultado.productos?.nombre}{' '}
            · Costo total: ${Number(ultimoResultado.costo_total_calculado).toLocaleString('es-CO')}{' '}
            · Costo por bandeja: $
            {Number(ultimoResultado.costo_por_bandeja).toLocaleString('es-CO')}
          </p>
        </div>
      )}

      {recetas.length === 0 && !cargando ? (
        <div className="bg-mama-gold/10 border border-mama-gold/30 text-mama-charcoal text-sm rounded-lg p-3 mb-6">
          Aún no hay recetas activas. Ve a Catálogos → Recetas para crear una.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-mama-gray/10 p-5 mb-8 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-mama-charcoal mb-1">Fecha</label>
              <input
                type="date"
                required
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
              />
            </div>

            <div>
              <label className="block text-sm text-mama-charcoal mb-1">Receta</label>
              <select
                required
                value={form.receta_id}
                onChange={(e) => setForm({ ...form, receta_id: e.target.value })}
                className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
              >
                <option value="">Selecciona una receta</option>
                {recetas.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre} ({r.productos?.nombre})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-mama-charcoal mb-1">
                Número de lotes producidos
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={form.num_lotes}
                onChange={(e) => setForm({ ...form, num_lotes: e.target.value })}
                className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
              />
            </div>
          </div>

          {recetaSeleccionada && form.num_lotes && (
            <div className="bg-mama-cream rounded-lg p-3 text-sm text-mama-charcoal">
              Esto va a producir aproximadamente <strong>{bandejasEstimadas} bandejas</strong>{' '}
              de {recetaSeleccionada.productos?.nombre}. El costo exacto se calcula al guardar,
              según el costo actual de cada insumo.
            </div>
          )}

          <button
            type="submit"
            disabled={guardando}
            className="bg-mama-terracotta hover:bg-mama-terracotta-dark transition-colors text-white font-medium px-5 py-2 rounded-lg disabled:opacity-60"
          >
            {guardando ? 'Registrando...' : 'Registrar producción'}
          </button>
        </form>
      )}

      <h2 className="font-medium text-mama-charcoal mb-3">Historial reciente</h2>
      <div className="bg-white rounded-2xl shadow-sm border border-mama-gray/10 overflow-hidden">
        {cargando ? (
          <p className="p-5 text-mama-gray">Cargando producciones...</p>
        ) : producciones.length === 0 ? (
          <p className="p-5 text-mama-gray">Aún no hay producciones registradas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-mama-gray border-b border-mama-gray/10">
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Receta</th>
                <th className="px-4 py-3 font-medium">Lotes</th>
                <th className="px-4 py-3 font-medium">Bandejas</th>
                <th className="px-4 py-3 font-medium">Costo total</th>
                <th className="px-4 py-3 font-medium">Costo/bandeja</th>
              </tr>
            </thead>
            <tbody>
              {producciones.map((p) => (
                <tr key={p.id} className="border-b border-mama-gray/5 last:border-0">
                  <td className="px-4 py-3 text-mama-gray">
                    {new Date(p.fecha + 'T00:00:00').toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-4 py-3 text-mama-charcoal font-medium">
                    {p.productos?.nombre}
                  </td>
                  <td className="px-4 py-3 text-mama-gray">{p.recetas?.nombre}</td>
                  <td className="px-4 py-3 text-mama-gray">{p.num_lotes}</td>
                  <td className="px-4 py-3 text-mama-gray">{p.bandejas_producidas}</td>
                  <td className="px-4 py-3 text-mama-charcoal font-medium">
                    ${Number(p.costo_total_calculado).toLocaleString('es-CO')}
                  </td>
                  <td className="px-4 py-3 text-mama-gray">
                    ${Number(p.costo_por_bandeja).toLocaleString('es-CO')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
