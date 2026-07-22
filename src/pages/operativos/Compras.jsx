import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

const FORM_VACIO = {
  fecha: new Date().toISOString().slice(0, 10),
  insumo_id: '',
  cantidad: '',
  costo_unitario: '',
  proveedor: '',
}

export default function Compras() {
  const [compras, setCompras] = useState([])
  const [insumos, setInsumos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [form, setForm] = useState(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)

  async function cargarDatos() {
    setCargando(true)
    setError('')

    const [comprasRes, insumosRes] = await Promise.all([
      supabase
        .from('compras')
        .select('*, insumos(nombre, unidad_compra, unidad_medida)')
        .order('fecha', { ascending: false })
        .order('creado_en', { ascending: false })
        .limit(50),
      supabase
        .from('insumos')
        .select('id, nombre, unidad_compra, unidad_medida, contenido_por_unidad_compra')
        .order('nombre', { ascending: true }),
    ])

    if (comprasRes.error) {
      setError('No se pudo cargar el historial: ' + comprasRes.error.message)
    } else {
      setCompras(comprasRes.data)
    }
    if (insumosRes.data) setInsumos(insumosRes.data)

    setCargando(false)
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const insumoSeleccionado = useMemo(
    () => insumos.find((i) => i.id === form.insumo_id),
    [insumos, form.insumo_id]
  )

  const costoTotalEstimado = useMemo(() => {
    const cantidad = Number(form.cantidad) || 0
    const costoUnitario = Number(form.costo_unitario) || 0
    return cantidad * costoUnitario
  }, [form.cantidad, form.costo_unitario])

  const kilosLitrosEquivalentes = useMemo(() => {
    if (!insumoSeleccionado) return null
    const cantidad = Number(form.cantidad) || 0
    return cantidad * (insumoSeleccionado.contenido_por_unidad_compra || 1)
  }, [insumoSeleccionado, form.cantidad])

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    setError('')
    setExito('')

    const payload = {
      fecha: form.fecha,
      insumo_id: form.insumo_id,
      cantidad: Number(form.cantidad),
      costo_unitario: Number(form.costo_unitario),
      proveedor: form.proveedor.trim() || null,
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase.from('compras').insert({
      ...payload,
      registrado_por: user?.id,
    })

    setGuardando(false)

    if (error) {
      setError('No se pudo registrar la compra: ' + error.message)
      return
    }

    setExito(
      `Compra registrada. El costo de "${insumoSeleccionado?.nombre}" y su stock ya se actualizaron automáticamente.`
    )
    setForm({ ...FORM_VACIO, fecha: form.fecha })
    cargarDatos()
  }

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl text-mama-charcoal mb-1">Compras</h1>
      <p className="text-mama-gray mb-6">
        Registra cada compra de insumos. El costo y el stock del insumo se actualizan solos.
      </p>

      {error && (
        <div className="bg-mama-maroon-50 border border-mama-maroon-200 text-mama-maroon-700 text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}
      {exito && (
        <div className="bg-mama-green/10 border border-mama-green/30 text-mama-green text-sm rounded-lg p-3 mb-4">
          {exito}
        </div>
      )}

      {insumos.length === 0 && !cargando ? (
        <div className="bg-mama-gold/10 border border-mama-gold/30 text-mama-charcoal text-sm rounded-lg p-3 mb-6">
          Aún no hay insumos registrados. Ve a Catálogos → Insumos para crear el primero.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-mama-gray/10 p-5 mb-8 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <label className="block text-sm text-mama-charcoal mb-1">Insumo comprado</label>
              <select
                required
                value={form.insumo_id}
                onChange={(e) => setForm({ ...form, insumo_id: e.target.value })}
                className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
              >
                <option value="">Selecciona un insumo</option>
                {insumos.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-mama-charcoal mb-1">
                Cantidad comprada
                {insumoSeleccionado && (
                  <span className="text-mama-gray font-normal">
                    {' '}
                    (en {insumoSeleccionado.unidad_compra})
                  </span>
                )}
              </label>
              <input
                type="number"
                min="0"
                step="0.0001"
                required
                value={form.cantidad}
                onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                placeholder={insumoSeleccionado ? `Ej. 2 ${insumoSeleccionado.unidad_compra}` : ''}
                className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
              />
            </div>

            <div>
              <label className="block text-sm text-mama-charcoal mb-1">
                Costo por {insumoSeleccionado?.unidad_compra || 'unidad de compra'} (COP)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={form.costo_unitario}
                onChange={(e) => setForm({ ...form, costo_unitario: e.target.value })}
                className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm text-mama-charcoal mb-1">
                Proveedor (opcional)
              </label>
              <input
                value={form.proveedor}
                onChange={(e) => setForm({ ...form, proveedor: e.target.value })}
                placeholder="Ej. Distribuidora El Trigal"
                className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
              />
            </div>
          </div>

          {insumoSeleccionado && form.cantidad && form.costo_unitario && (
            <div className="bg-mama-cream rounded-lg p-3 text-sm text-mama-charcoal">
              Total de esta compra:{' '}
              <strong>${costoTotalEstimado.toLocaleString('es-CO')}</strong>
              {kilosLitrosEquivalentes !== null && (
                <>
                  {' '}
                  · Equivale a {kilosLitrosEquivalentes} {insumoSeleccionado.unidad_medida} de{' '}
                  {insumoSeleccionado.nombre} sumados al inventario
                </>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={guardando}
            className="bg-mama-terracotta hover:bg-mama-terracotta-dark transition-colors text-white font-medium px-5 py-2 rounded-lg disabled:opacity-60"
          >
            {guardando ? 'Registrando...' : 'Registrar compra'}
          </button>
        </form>
      )}

      <h2 className="font-medium text-mama-charcoal mb-3">Historial reciente</h2>
      <div className="bg-white rounded-2xl shadow-sm border border-mama-gray/10 overflow-hidden">
        {cargando ? (
          <p className="p-5 text-mama-gray">Cargando compras...</p>
        ) : compras.length === 0 ? (
          <p className="p-5 text-mama-gray">Aún no hay compras registradas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-mama-gray border-b border-mama-gray/10">
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Insumo</th>
                <th className="px-4 py-3 font-medium">Cantidad</th>
                <th className="px-4 py-3 font-medium">Costo unitario</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Proveedor</th>
              </tr>
            </thead>
            <tbody>
              {compras.map((c) => (
                <tr key={c.id} className="border-b border-mama-gray/5 last:border-0">
                  <td className="px-4 py-3 text-mama-gray">
                    {new Date(c.fecha + 'T00:00:00').toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-4 py-3 text-mama-charcoal font-medium">
                    {c.insumos?.nombre}
                  </td>
                  <td className="px-4 py-3 text-mama-gray">
                    {c.cantidad} {c.insumos?.unidad_compra}
                  </td>
                  <td className="px-4 py-3 text-mama-gray">
                    ${Number(c.costo_unitario).toLocaleString('es-CO')}
                  </td>
                  <td className="px-4 py-3 text-mama-charcoal font-medium">
                    ${Number(c.costo_total).toLocaleString('es-CO')}
                  </td>
                  <td className="px-4 py-3 text-mama-gray">{c.proveedor || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
