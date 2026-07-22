import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Tarjeta', 'Otro']

const FORM_VACIO = {
  fecha: new Date().toISOString().slice(0, 10),
  producto_id: '',
  cantidad: '',
  precio_unitario: '',
  metodo_pago: 'Efectivo',
}

export default function Ventas() {
  const [ventas, setVentas] = useState([])
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [form, setForm] = useState(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)

  async function cargarDatos() {
    setCargando(true)
    setError('')

    const [ventasRes, productosRes] = await Promise.all([
      supabase
        .from('ventas')
        .select('*, productos(nombre, unidad_venta)')
        .order('fecha', { ascending: false })
        .order('creado_en', { ascending: false })
        .limit(50),
      supabase
        .from('productos')
        .select('id, nombre, unidad_venta, precio_venta_actual, stock_actual')
        .eq('activo', true)
        .order('nombre', { ascending: true }),
    ])

    if (ventasRes.error) {
      setError('No se pudo cargar el historial: ' + ventasRes.error.message)
    } else {
      setVentas(ventasRes.data)
    }
    if (productosRes.data) setProductos(productosRes.data)

    setCargando(false)
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const productoSeleccionado = useMemo(
    () => productos.find((p) => p.id === form.producto_id),
    [productos, form.producto_id]
  )

  // Al elegir un producto, sugiere su precio de venta actual como punto de partida
  function handleSeleccionProducto(id) {
    const producto = productos.find((p) => p.id === id)
    setForm({
      ...form,
      producto_id: id,
      precio_unitario: producto ? producto.precio_venta_actual : '',
    })
  }

  const totalEstimado = useMemo(() => {
    const cantidad = Number(form.cantidad) || 0
    const precio = Number(form.precio_unitario) || 0
    return cantidad * precio
  }, [form.cantidad, form.precio_unitario])

  const excedeStock =
    productoSeleccionado && Number(form.cantidad) > productoSeleccionado.stock_actual

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    setError('')
    setExito('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase.from('ventas').insert({
      fecha: form.fecha,
      producto_id: form.producto_id,
      cantidad: Number(form.cantidad),
      precio_unitario: Number(form.precio_unitario),
      metodo_pago: form.metodo_pago,
      registrado_por: user?.id,
    })

    setGuardando(false)

    if (error) {
      setError('No se pudo registrar la venta: ' + error.message)
      return
    }

    setExito(
      `Venta registrada: ${form.cantidad} × ${productoSeleccionado?.nombre}. Total: $${totalEstimado.toLocaleString('es-CO')}.`
    )
    setForm({ ...FORM_VACIO, fecha: form.fecha })
    cargarDatos()
  }

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl text-mama-charcoal mb-1">Ventas</h1>
      <p className="text-mama-gray mb-6">
        Registra cada venta. El inventario del producto se descuenta automáticamente.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}
      {exito && (
        <div className="bg-mama-green/10 border border-mama-green/30 text-mama-green text-sm rounded-lg p-3 mb-4">
          {exito}
        </div>
      )}

      {productos.length === 0 && !cargando ? (
        <div className="bg-mama-gold/10 border border-mama-gold/30 text-mama-charcoal text-sm rounded-lg p-3 mb-6">
          Aún no hay productos activos. Ve a Catálogos → Productos para crear uno.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-mama-gray/10 p-5 mb-8 space-y-4"
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
              <label className="block text-sm text-mama-charcoal mb-1">Producto vendido</label>
              <select
                required
                value={form.producto_id}
                onChange={(e) => handleSeleccionProducto(e.target.value)}
                className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
              >
                <option value="">Selecciona un producto</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} (stock: {p.stock_actual})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-mama-charcoal mb-1">
                Cantidad
                {productoSeleccionado && (
                  <span className="text-mama-gray font-normal">
                    {' '}
                    ({productoSeleccionado.unidad_venta})
                  </span>
                )}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={form.cantidad}
                onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
              />
              {excedeStock && (
                <p className="text-xs text-red-600 mt-1">
                  Ojo: esto supera el stock disponible ({productoSeleccionado.stock_actual}).
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-mama-charcoal mb-1">
                Precio unitario (COP)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={form.precio_unitario}
                onChange={(e) => setForm({ ...form, precio_unitario: e.target.value })}
                className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
              />
              <p className="text-xs text-mama-gray mt-1">
                Se sugiere el precio actual del catálogo, pero puedes ajustarlo (ej. descuentos).
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm text-mama-charcoal mb-1">Método de pago</label>
              <select
                value={form.metodo_pago}
                onChange={(e) => setForm({ ...form, metodo_pago: e.target.value })}
                className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
              >
                {METODOS_PAGO.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {form.cantidad && form.precio_unitario && (
            <div className="bg-mama-cream rounded-lg p-3 text-sm text-mama-charcoal">
              Total de esta venta: <strong>${totalEstimado.toLocaleString('es-CO')}</strong>
            </div>
          )}

          <button
            type="submit"
            disabled={guardando}
            className="bg-mama-terracotta hover:bg-mama-terracotta-dark transition-colors text-white font-medium px-5 py-2 rounded-lg disabled:opacity-60"
          >
            {guardando ? 'Registrando...' : 'Registrar venta'}
          </button>
        </form>
      )}

      <h2 className="font-medium text-mama-charcoal mb-3">Historial reciente</h2>
      <div className="bg-white rounded-xl shadow-sm border border-mama-gray/10 overflow-hidden">
        {cargando ? (
          <p className="p-5 text-mama-gray">Cargando ventas...</p>
        ) : ventas.length === 0 ? (
          <p className="p-5 text-mama-gray">Aún no hay ventas registradas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-mama-gray border-b border-mama-gray/10">
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Cantidad</th>
                <th className="px-4 py-3 font-medium">Precio unitario</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Método de pago</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((v) => (
                <tr key={v.id} className="border-b border-mama-gray/5 last:border-0">
                  <td className="px-4 py-3 text-mama-gray">
                    {new Date(v.fecha + 'T00:00:00').toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-4 py-3 text-mama-charcoal font-medium">
                    {v.productos?.nombre}
                  </td>
                  <td className="px-4 py-3 text-mama-gray">{v.cantidad}</td>
                  <td className="px-4 py-3 text-mama-gray">
                    ${Number(v.precio_unitario).toLocaleString('es-CO')}
                  </td>
                  <td className="px-4 py-3 text-mama-charcoal font-medium">
                    ${Number(v.total).toLocaleString('es-CO')}
                  </td>
                  <td className="px-4 py-3 text-mama-gray">{v.metodo_pago}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
