import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

const FORM_VACIO = {
  id: null,
  nombre: '',
  unidad_venta: '',
  precio_venta_actual: '',
  stock_actual: '',
  stock_minimo: '',
  activo: true,
}

export default function Productos() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)

  async function cargarProductos() {
    setCargando(true)
    setError('')
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('nombre', { ascending: true })

    if (error) {
      setError('No se pudieron cargar los productos: ' + error.message)
    } else {
      setProductos(data)
    }
    setCargando(false)
  }

  useEffect(() => {
    cargarProductos()
  }, [])

  function abrirNuevo() {
    setForm(FORM_VACIO)
    setMostrarForm(true)
  }

  function abrirEditar(producto) {
    setForm({
      id: producto.id,
      nombre: producto.nombre,
      unidad_venta: producto.unidad_venta,
      precio_venta_actual: producto.precio_venta_actual,
      stock_actual: producto.stock_actual,
      stock_minimo: producto.stock_minimo,
      activo: producto.activo,
    })
    setMostrarForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    setError('')

    const payload = {
      nombre: form.nombre.trim(),
      unidad_venta: form.unidad_venta.trim(),
      precio_venta_actual: Number(form.precio_venta_actual) || 0,
      stock_actual: Number(form.stock_actual) || 0,
      stock_minimo: Number(form.stock_minimo) || 0,
      activo: form.activo,
    }

    let resultado
    if (form.id) {
      resultado = await supabase.from('productos').update(payload).eq('id', form.id)
    } else {
      resultado = await supabase.from('productos').insert(payload)
    }

    setGuardando(false)

    if (resultado.error) {
      setError('No se pudo guardar: ' + resultado.error.message)
      return
    }

    setMostrarForm(false)
    setForm(FORM_VACIO)
    cargarProductos()
  }

  async function handleEliminar(producto) {
    const confirmar = window.confirm(
      `¿Eliminar el producto "${producto.nombre}"? Esta acción no se puede deshacer.`
    )
    if (!confirmar) return

    const { error } = await supabase.from('productos').delete().eq('id', producto.id)
    if (error) {
      // Suele fallar si el producto ya tiene una receta o movimientos asociados
      setError(
        'No se pudo eliminar. Es posible que este producto ya tenga una receta o movimientos asociados. ' +
          error.message
      )
      return
    }
    cargarProductos()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <Link to="/catalogos" className="text-sm text-mama-terracotta hover:underline">
            ← Catálogos
          </Link>
          <h1 className="font-display text-2xl text-mama-charcoal mt-1">Productos</h1>
        </div>
        <button
          onClick={abrirNuevo}
          className="bg-mama-terracotta hover:bg-mama-terracotta-dark transition-colors text-white font-medium px-4 py-2 rounded-lg"
        >
          + Nuevo producto
        </button>
      </div>
      <p className="text-mama-gray mb-6">
        El stock se actualiza automáticamente con cada producción y cada venta.
      </p>

      {error && (
        <div className="bg-mama-maroon-50 border border-mama-maroon-200 text-mama-maroon-700 text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      {mostrarForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-mama-gray/10 p-5 mb-6 space-y-4"
        >
          <h2 className="font-medium text-mama-charcoal">
            {form.id ? 'Editar producto' : 'Nuevo producto'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-mama-charcoal mb-1">Nombre</label>
              <input
                required
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej. Deditos de queso"
                className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
              />
            </div>

            <div>
              <label className="block text-sm text-mama-charcoal mb-1">
                Unidad de venta
              </label>
              <input
                required
                value={form.unidad_venta}
                onChange={(e) => setForm({ ...form, unidad_venta: e.target.value })}
                placeholder='Ej. "bandeja x10" o "unidad"'
                className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
              />
            </div>

            <div>
              <label className="block text-sm text-mama-charcoal mb-1">
                Precio de venta actual (COP)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={form.precio_venta_actual}
                onChange={(e) => setForm({ ...form, precio_venta_actual: e.target.value })}
                className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
              />
            </div>

            <div>
              <label className="block text-sm text-mama-charcoal mb-1">
                Stock actual (bandejas/unidades)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={form.stock_actual}
                onChange={(e) => setForm({ ...form, stock_actual: e.target.value })}
                className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
              />
            </div>

            <div>
              <label className="block text-sm text-mama-charcoal mb-1">
                Stock mínimo (para alertas)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={form.stock_minimo}
                onChange={(e) => setForm({ ...form, stock_minimo: e.target.value })}
                className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
              />
            </div>

            <div className="flex items-center gap-2 mt-1 sm:mt-6">
              <input
                type="checkbox"
                id="activo"
                checked={form.activo}
                onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                className="rounded border-mama-gray/30 text-mama-terracotta focus:ring-mama-terracotta"
              />
              <label htmlFor="activo" className="text-sm text-mama-charcoal">
                Producto activo (visible para ventas/producción)
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={guardando}
              className="bg-mama-terracotta hover:bg-mama-terracotta-dark transition-colors text-white font-medium px-4 py-2 rounded-lg disabled:opacity-60"
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMostrarForm(false)
                setForm(FORM_VACIO)
              }}
              className="px-4 py-2 rounded-lg text-mama-charcoal hover:bg-mama-cream transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-mama-gray/10 overflow-hidden">
        {cargando ? (
          <p className="p-5 text-mama-gray">Cargando productos...</p>
        ) : productos.length === 0 ? (
          <p className="p-5 text-mama-gray">
            Aún no hay productos registrados. Crea el primero con el botón de arriba.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-mama-gray border-b border-mama-gray/10">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Unidad de venta</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Stock actual</th>
                <th className="px-4 py-3 font-medium">Stock mínimo</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {productos.map((producto) => {
                const stockBajo = producto.stock_actual <= producto.stock_minimo
                return (
                  <tr key={producto.id} className="border-b border-mama-gray/5 last:border-0">
                    <td className="px-4 py-3 text-mama-charcoal font-medium">
                      {producto.nombre}
                    </td>
                    <td className="px-4 py-3 text-mama-gray">{producto.unidad_venta}</td>
                    <td className="px-4 py-3 text-mama-gray">
                      ${Number(producto.precio_venta_actual).toLocaleString('es-CO')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={stockBajo ? 'text-mama-maroon-600 font-medium' : 'text-mama-charcoal'}>
                        {producto.stock_actual}
                      </span>
                      {stockBajo && (
                        <span className="ml-2 inline-block bg-mama-maroon-50 text-mama-maroon-600 text-xs px-2.5 py-1 rounded-full font-medium">
                          Stock bajo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-mama-gray">{producto.stock_minimo}</td>
                    <td className="px-4 py-3">
                      {producto.activo ? (
                        <span className="text-mama-green text-xs bg-mama-green/10 px-2.5 py-1 rounded-full font-medium">
                          Activo
                        </span>
                      ) : (
                        <span className="text-mama-gray text-xs bg-mama-gray/10 px-2.5 py-1 rounded-full font-medium">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                      <button
                        onClick={() => abrirEditar(producto)}
                        className="text-mama-terracotta hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(producto)}
                        className="text-mama-maroon-500 hover:underline"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
