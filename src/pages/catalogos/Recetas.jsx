import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

const FILA_INSUMO_VACIA = () => ({
  key: crypto.randomUUID(),
  insumo_id: '',
  cantidad_requerida: '',
  unidad_medida: '',
})

const FORM_VACIO = {
  id: null,
  producto_id: '',
  nombre: '',
  rinde_bandejas: '',
  rinde_unidades_por_bandeja: '',
  activa: true,
}

export default function Recetas() {
  const [recetas, setRecetas] = useState([])
  const [productos, setProductos] = useState([])
  const [insumos, setInsumos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState(FORM_VACIO)
  const [filasInsumos, setFilasInsumos] = useState([FILA_INSUMO_VACIA()])
  const [guardando, setGuardando] = useState(false)

  async function cargarTodo() {
    setCargando(true)
    setError('')

    const [recetasRes, productosRes, insumosRes] = await Promise.all([
      supabase
        .from('recetas')
        .select('*, productos(nombre), receta_insumos(*, insumos(nombre, unidad_medida))')
        .order('nombre', { ascending: true }),
      supabase.from('productos').select('id, nombre').order('nombre', { ascending: true }),
      supabase.from('insumos').select('id, nombre, unidad_medida').order('nombre', { ascending: true }),
    ])

    if (recetasRes.error) {
      setError('No se pudieron cargar las recetas: ' + recetasRes.error.message)
    } else {
      setRecetas(recetasRes.data)
    }
    if (productosRes.data) setProductos(productosRes.data)
    if (insumosRes.data) setInsumos(insumosRes.data)

    setCargando(false)
  }

  useEffect(() => {
    cargarTodo()
  }, [])

  function abrirNueva() {
    setForm(FORM_VACIO)
    setFilasInsumos([FILA_INSUMO_VACIA()])
    setMostrarForm(true)
  }

  function abrirEditar(receta) {
    setForm({
      id: receta.id,
      producto_id: receta.producto_id,
      nombre: receta.nombre,
      rinde_bandejas: receta.rinde_bandejas,
      rinde_unidades_por_bandeja: receta.rinde_unidades_por_bandeja,
      activa: receta.activa,
    })
    setFilasInsumos(
      receta.receta_insumos.length > 0
        ? receta.receta_insumos.map((ri) => ({
            key: ri.id,
            insumo_id: ri.insumo_id,
            cantidad_requerida: ri.cantidad_requerida,
            unidad_medida: ri.unidad_medida,
          }))
        : [FILA_INSUMO_VACIA()]
    )
    setMostrarForm(true)
  }

  function actualizarFila(key, cambios) {
    setFilasInsumos((filas) =>
      filas.map((f) => {
        if (f.key !== key) return f
        const filaActualizada = { ...f, ...cambios }
        // Si cambia el insumo, autocompleta la unidad de medida sugerida
        if (cambios.insumo_id) {
          const insumo = insumos.find((i) => i.id === cambios.insumo_id)
          if (insumo) filaActualizada.unidad_medida = insumo.unidad_medida
        }
        return filaActualizada
      })
    )
  }

  function agregarFila() {
    setFilasInsumos((filas) => [...filas, FILA_INSUMO_VACIA()])
  }

  function eliminarFila(key) {
    setFilasInsumos((filas) => (filas.length > 1 ? filas.filter((f) => f.key !== key) : filas))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    setError('')

    const filasValidas = filasInsumos.filter((f) => f.insumo_id && f.cantidad_requerida)
    if (filasValidas.length === 0) {
      setError('Agrega al menos un insumo con su cantidad.')
      setGuardando(false)
      return
    }

    const payloadReceta = {
      producto_id: form.producto_id,
      nombre: form.nombre.trim(),
      rinde_bandejas: Number(form.rinde_bandejas) || 0,
      rinde_unidades_por_bandeja: Number(form.rinde_unidades_por_bandeja) || 0,
      activa: form.activa,
    }

    let recetaId = form.id

    if (form.id) {
      const { error } = await supabase.from('recetas').update(payloadReceta).eq('id', form.id)
      if (error) {
        setError('No se pudo guardar la receta: ' + error.message)
        setGuardando(false)
        return
      }
      // Reemplaza los insumos: borra los anteriores y crea los nuevos
      const { error: errorBorrar } = await supabase
        .from('receta_insumos')
        .delete()
        .eq('receta_id', form.id)
      if (errorBorrar) {
        setError('No se pudieron actualizar los insumos: ' + errorBorrar.message)
        setGuardando(false)
        return
      }
    } else {
      const { data, error } = await supabase
        .from('recetas')
        .insert(payloadReceta)
        .select()
        .single()
      if (error) {
        setError('No se pudo crear la receta: ' + error.message)
        setGuardando(false)
        return
      }
      recetaId = data.id
    }

    const filasParaInsertar = filasValidas.map((f) => ({
      receta_id: recetaId,
      insumo_id: f.insumo_id,
      cantidad_requerida: Number(f.cantidad_requerida),
      unidad_medida: f.unidad_medida,
    }))

    const { error: errorInsumos } = await supabase.from('receta_insumos').insert(filasParaInsertar)
    if (errorInsumos) {
      setError('La receta se guardó, pero hubo un error con los insumos: ' + errorInsumos.message)
      setGuardando(false)
      return
    }

    setGuardando(false)
    setMostrarForm(false)
    setForm(FORM_VACIO)
    setFilasInsumos([FILA_INSUMO_VACIA()])
    cargarTodo()
  }

  async function handleEliminar(receta) {
    const confirmar = window.confirm(
      `¿Eliminar la receta "${receta.nombre}"? Esta acción no se puede deshacer.`
    )
    if (!confirmar) return

    const { error } = await supabase.from('recetas').delete().eq('id', receta.id)
    if (error) {
      setError(
        'No se pudo eliminar. Es posible que ya existan producciones registradas con esta receta. ' +
          error.message
      )
      return
    }
    cargarTodo()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <Link to="/catalogos" className="text-sm text-mama-terracotta hover:underline">
            ← Catálogos
          </Link>
          <h1 className="font-display text-2xl text-mama-charcoal mt-1">Recetas</h1>
        </div>
        <button
          onClick={abrirNueva}
          disabled={productos.length === 0 || insumos.length === 0}
          className="bg-mama-terracotta hover:bg-mama-terracotta-dark transition-colors text-white font-medium px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Nueva receta
        </button>
      </div>
      <p className="text-mama-gray mb-6">
        Cada receta define cuánto de cada insumo se necesita para producir un lote. Con esto,
        el sistema calcula automáticamente el costo de cada producción.
      </p>

      {(productos.length === 0 || insumos.length === 0) && !cargando && (
        <div className="bg-mama-gold/10 border border-mama-gold/30 text-mama-charcoal text-sm rounded-lg p-3 mb-4">
          Antes de crear una receta necesitas al menos un producto y un insumo registrados en
          Catálogos.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      {mostrarForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-mama-gray/10 p-5 mb-6 space-y-5"
        >
          <h2 className="font-medium text-mama-charcoal">
            {form.id ? 'Editar receta' : 'Nueva receta'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-mama-charcoal mb-1">Producto</label>
              <select
                required
                value={form.producto_id}
                onChange={(e) => setForm({ ...form, producto_id: e.target.value })}
                className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
              >
                <option value="">Selecciona un producto</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-mama-charcoal mb-1">Nombre de la receta</label>
              <input
                required
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej. Receta estándar deditos de queso"
                className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
              />
            </div>

            <div>
              <label className="block text-sm text-mama-charcoal mb-1">
                Bandejas que rinde 1 lote
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={form.rinde_bandejas}
                onChange={(e) => setForm({ ...form, rinde_bandejas: e.target.value })}
                className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
              />
            </div>

            <div>
              <label className="block text-sm text-mama-charcoal mb-1">
                Unidades por bandeja
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={form.rinde_unidades_por_bandeja}
                onChange={(e) =>
                  setForm({ ...form, rinde_unidades_por_bandeja: e.target.value })
                }
                className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm text-mama-charcoal">
                Insumos que requiere 1 lote
              </label>
              <button
                type="button"
                onClick={agregarFila}
                className="text-sm text-mama-terracotta hover:underline"
              >
                + Agregar insumo
              </button>
            </div>

            <div className="space-y-2">
              {filasInsumos.map((fila) => (
                <div key={fila.key} className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
                  <select
                    value={fila.insumo_id}
                    onChange={(e) => actualizarFila(fila.key, { insumo_id: e.target.value })}
                    className="flex-1 min-w-[160px] rounded-lg border border-mama-gray/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
                  >
                    <option value="">Selecciona un insumo</option>
                    {insumos.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.nombre}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    placeholder="Cantidad"
                    value={fila.cantidad_requerida}
                    onChange={(e) =>
                      actualizarFila(fila.key, { cantidad_requerida: e.target.value })
                    }
                    className="w-28 rounded-lg border border-mama-gray/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
                  />

                  <span className="text-sm text-mama-gray w-16">
                    {fila.unidad_medida || '—'}
                  </span>

                  <button
                    type="button"
                    onClick={() => eliminarFila(fila.key)}
                    className="text-red-500 text-sm hover:underline shrink-0"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="receta-activa"
              checked={form.activa}
              onChange={(e) => setForm({ ...form, activa: e.target.checked })}
              className="rounded border-mama-gray/30 text-mama-terracotta focus:ring-mama-terracotta"
            />
            <label htmlFor="receta-activa" className="text-sm text-mama-charcoal">
              Receta activa
            </label>
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
                setFilasInsumos([FILA_INSUMO_VACIA()])
              }}
              className="px-4 py-2 rounded-lg text-mama-charcoal hover:bg-mama-cream transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {cargando ? (
          <p className="text-mama-gray">Cargando recetas...</p>
        ) : recetas.length === 0 ? (
          <p className="text-mama-gray bg-white rounded-xl border border-mama-gray/10 p-5">
            Aún no hay recetas registradas.
          </p>
        ) : (
          recetas.map((receta) => (
            <div
              key={receta.id}
              className="bg-white rounded-xl shadow-sm border border-mama-gray/10 p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-mama-charcoal">{receta.nombre}</p>
                  <p className="text-sm text-mama-gray">
                    Producto: {receta.productos?.nombre || '—'} · Rinde{' '}
                    {receta.rinde_bandejas} bandejas ({receta.rinde_unidades_por_bandeja} c/u)
                    {!receta.activa && (
                      <span className="ml-2 text-mama-gray bg-mama-gray/10 text-xs px-2 py-0.5 rounded-full">
                        Inactiva
                      </span>
                    )}
                  </p>
                </div>
                <div className="space-x-3 whitespace-nowrap">
                  <button
                    onClick={() => abrirEditar(receta)}
                    className="text-mama-terracotta hover:underline text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(receta)}
                    className="text-red-500 hover:underline text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              <ul className="mt-3 text-sm text-mama-gray space-y-1">
                {receta.receta_insumos.map((ri) => (
                  <li key={ri.id}>
                    · {ri.cantidad_requerida} {ri.unidad_medida} de {ri.insumos?.nombre}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
