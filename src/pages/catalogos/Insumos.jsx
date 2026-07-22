import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

const UNIDADES = ['kg', 'g', 'litro', 'ml', 'unidad', 'paquete']

const FORM_VACIO = {
  id: null,
  nombre: '',
  unidad_medida: 'kg',
  unidad_compra: 'unidad',
  contenido_por_unidad_compra: '1',
  costo_unitario_actual: '',
  stock_actual: '',
  stock_minimo: '',
}

export default function Insumos() {
  const [insumos, setInsumos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)

  async function cargarInsumos() {
    setCargando(true)
    setError('')
    const { data, error } = await supabase
      .from('insumos')
      .select('*')
      .order('nombre', { ascending: true })

    if (error) {
      setError('No se pudieron cargar los insumos: ' + error.message)
    } else {
      setInsumos(data)
    }
    setCargando(false)
  }

  useEffect(() => {
    cargarInsumos()
  }, [])

  function abrirNuevo() {
    setForm(FORM_VACIO)
    setMostrarForm(true)
  }

  function abrirEditar(insumo) {
    setForm({
      id: insumo.id,
      nombre: insumo.nombre,
      unidad_medida: insumo.unidad_medida,
      unidad_compra: insumo.unidad_compra || 'unidad',
      contenido_por_unidad_compra: insumo.contenido_por_unidad_compra || '1',
      costo_unitario_actual: insumo.costo_unitario_actual,
      stock_actual: insumo.stock_actual,
      stock_minimo: insumo.stock_minimo,
    })
    setMostrarForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    setError('')

    const payload = {
      nombre: form.nombre.trim(),
      unidad_medida: form.unidad_medida,
      unidad_compra: form.unidad_compra.trim(),
      contenido_por_unidad_compra: Number(form.contenido_por_unidad_compra) || 1,
      costo_unitario_actual: Number(form.costo_unitario_actual) || 0,
      stock_actual: Number(form.stock_actual) || 0,
      stock_minimo: Number(form.stock_minimo) || 0,
    }

    let resultado
    if (form.id) {
      resultado = await supabase.from('insumos').update(payload).eq('id', form.id)
    } else {
      resultado = await supabase.from('insumos').insert(payload)
    }

    setGuardando(false)

    if (resultado.error) {
      setError('No se pudo guardar: ' + resultado.error.message)
      return
    }

    setMostrarForm(false)
    setForm(FORM_VACIO)
    cargarInsumos()
  }

  async function handleEliminar(insumo) {
    const confirmar = window.confirm(
      `¿Eliminar el insumo "${insumo.nombre}"? Esta acción no se puede deshacer.`
    )
    if (!confirmar) return

    const { error } = await supabase.from('insumos').delete().eq('id', insumo.id)
    if (error) {
      // Suele fallar si el insumo ya está usado en una receta (protección de la base de datos)
      setError(
        'No se pudo eliminar. Es posible que este insumo ya esté usado en una receta. ' +
          error.message
      )
      return
    }
    cargarInsumos()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <Link to="/catalogos" className="text-sm text-mama-terracotta hover:underline">
            ← Catálogos
          </Link>
          <h1 className="font-display text-2xl text-mama-charcoal mt-1">Insumos</h1>
        </div>
        <button
          onClick={abrirNuevo}
          className="bg-mama-terracotta hover:bg-mama-terracotta-dark transition-colors text-white font-medium px-4 py-2 rounded-lg"
        >
          + Nuevo insumo
        </button>
      </div>
      <p className="text-mama-gray mb-6">
        El costo unitario se actualiza automáticamente cuando registras una compra.
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
            {form.id ? 'Editar insumo' : 'Nuevo insumo'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-mama-charcoal mb-1">Nombre</label>
              <input
                required
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej. Harina de trigo"
                className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
              />
            </div>

            <div>
              <label className="block text-sm text-mama-charcoal mb-1">
                Unidad de consumo (la que usas en recetas)
              </label>
              <select
                value={form.unidad_medida}
                onChange={(e) => setForm({ ...form, unidad_medida: e.target.value })}
                className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
              >
                {UNIDADES.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-mama-cream rounded-lg p-4 space-y-3">
            <p className="text-sm text-mama-charcoal font-medium">
              ¿Cómo compras este insumo?
            </p>
            <p className="text-xs text-mama-gray -mt-2">
              Ej: harina se compra por <strong>saco</strong>, y cada saco trae 20 kg. El sistema
              calcula solo el costo por kg.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-mama-charcoal mb-1">
                  Unidad de compra
                </label>
                <input
                  required
                  value={form.unidad_compra}
                  onChange={(e) => setForm({ ...form, unidad_compra: e.target.value })}
                  placeholder="Ej. saco, botella, caja"
                  className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
                />
              </div>

              <div>
                <label className="block text-sm text-mama-charcoal mb-1">
                  Contenido por {form.unidad_compra || 'unidad de compra'} (en{' '}
                  {form.unidad_medida})
                </label>
                <input
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  required
                  value={form.contenido_por_unidad_compra}
                  onChange={(e) =>
                    setForm({ ...form, contenido_por_unidad_compra: e.target.value })
                  }
                  placeholder="Ej. 20"
                  className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-mama-charcoal mb-1">
                Costo actual por {form.unidad_medida || 'unidad de consumo'} (COP)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={form.costo_unitario_actual}
                onChange={(e) => setForm({ ...form, costo_unitario_actual: e.target.value })}
                className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
              />
              <p className="text-xs text-mama-gray mt-1">
                Solo para el registro inicial — desde la primera compra, esto se recalcula
                automáticamente.
              </p>
            </div>

            <div>
              <label className="block text-sm text-mama-charcoal mb-1">Stock actual</label>
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
          <p className="p-5 text-mama-gray">Cargando insumos...</p>
        ) : insumos.length === 0 ? (
          <p className="p-5 text-mama-gray">
            Aún no hay insumos registrados. Crea el primero con el botón de arriba.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-mama-gray border-b border-mama-gray/10">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Se compra por</th>
                <th className="px-4 py-3 font-medium">Costo / unidad</th>
                <th className="px-4 py-3 font-medium">Stock actual</th>
                <th className="px-4 py-3 font-medium">Stock mínimo</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {insumos.map((insumo) => {
                const stockBajo = insumo.stock_actual <= insumo.stock_minimo
                return (
                  <tr key={insumo.id} className="border-b border-mama-gray/5 last:border-0">
                    <td className="px-4 py-3 text-mama-charcoal font-medium">
                      {insumo.nombre}
                    </td>
                    <td className="px-4 py-3 text-mama-gray">
                      {insumo.unidad_compra}
                      {insumo.contenido_por_unidad_compra != 1 && (
                        <span className="text-xs text-mama-gray/70">
                          {' '}
                          ({insumo.contenido_por_unidad_compra} {insumo.unidad_medida})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-mama-gray">
                      ${Number(insumo.costo_unitario_actual).toLocaleString('es-CO')} / {insumo.unidad_medida}
                    </td>
                    <td className="px-4 py-3">
                      <span className={stockBajo ? 'text-mama-maroon-600 font-medium' : 'text-mama-charcoal'}>
                        {insumo.stock_actual}
                      </span>
                      {stockBajo && (
                        <span className="ml-2 inline-block bg-mama-maroon-50 text-mama-maroon-600 text-xs px-2.5 py-1 rounded-full font-medium">
                          Stock bajo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-mama-gray">{insumo.stock_minimo}</td>
                    <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                      <button
                        onClick={() => abrirEditar(insumo)}
                        className="text-mama-terracotta hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(insumo)}
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
