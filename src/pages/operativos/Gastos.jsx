import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'

const CONCEPTOS_SUGERIDOS = [
  'Servicios públicos (luz)',
  'Servicios públicos (agua)',
  'Servicios públicos (gas)',
  'Arriendo',
  'Nómina / pagos personal',
  'Domicilios',
  'Impuestos',
  'Mantenimiento',
  'Empaques / desechables',
  'Otro',
]

const FORM_VACIO = {
  fecha: new Date().toISOString().slice(0, 10),
  concepto: '',
  valor: '',
  descripcion: '',
}

export default function Gastos() {
  const { esAdmin } = useAuth()
  const [gastos, setGastos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [form, setForm] = useState(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)

  async function cargarGastos() {
    setCargando(true)
    setError('')
    const { data, error } = await supabase
      .from('gastos_operativos')
      .select('*')
      .order('fecha', { ascending: false })
      .order('creado_en', { ascending: false })
      .limit(50)

    if (error) {
      setError('No se pudo cargar el historial: ' + error.message)
    } else {
      setGastos(data)
    }
    setCargando(false)
  }

  useEffect(() => {
    cargarGastos()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    setError('')
    setExito('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase.from('gastos_operativos').insert({
      fecha: form.fecha,
      concepto: form.concepto,
      valor: Number(form.valor),
      descripcion: form.descripcion.trim() || null,
      registrado_por: user?.id,
    })

    setGuardando(false)

    if (error) {
      setError('No se pudo registrar el gasto: ' + error.message)
      return
    }

    setExito('Gasto registrado correctamente.')
    setForm({ ...FORM_VACIO, fecha: form.fecha })
    cargarGastos()
  }

  async function handleEliminar(gasto) {
    const confirmar = window.confirm(`¿Eliminar el gasto "${gasto.concepto}"?`)
    if (!confirmar) return

    const { error } = await supabase.from('gastos_operativos').delete().eq('id', gasto.id)
    if (error) {
      setError('No se pudo eliminar: ' + error.message)
      return
    }
    cargarGastos()
  }

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl text-mama-charcoal mb-1">Gastos operativos</h1>
      <p className="text-mama-gray mb-6">
        Registra otros gastos del negocio: servicios, nómina, domicilios, impuestos, etc.
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
            <label className="block text-sm text-mama-charcoal mb-1">Concepto</label>
            <input
              required
              list="conceptos-sugeridos"
              value={form.concepto}
              onChange={(e) => setForm({ ...form, concepto: e.target.value })}
              placeholder="Ej. Servicios públicos (luz)"
              className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
            />
            <datalist id="conceptos-sugeridos">
              {CONCEPTOS_SUGERIDOS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-sm text-mama-charcoal mb-1">Valor (COP)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
              className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
            />
          </div>

          <div>
            <label className="block text-sm text-mama-charcoal mb-1">
              Descripción (opcional)
            </label>
            <input
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Detalles adicionales"
              className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={guardando}
          className="bg-mama-terracotta hover:bg-mama-terracotta-dark transition-colors text-white font-medium px-5 py-2 rounded-lg disabled:opacity-60"
        >
          {guardando ? 'Registrando...' : 'Registrar gasto'}
        </button>
      </form>

      <h2 className="font-medium text-mama-charcoal mb-3">Historial reciente</h2>
      <div className="bg-white rounded-xl shadow-sm border border-mama-gray/10 overflow-hidden">
        {cargando ? (
          <p className="p-5 text-mama-gray">Cargando gastos...</p>
        ) : gastos.length === 0 ? (
          <p className="p-5 text-mama-gray">Aún no hay gastos registrados.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-mama-gray border-b border-mama-gray/10">
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Concepto</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Descripción</th>
                {esAdmin && <th className="px-4 py-3 font-medium"></th>}
              </tr>
            </thead>
            <tbody>
              {gastos.map((g) => (
                <tr key={g.id} className="border-b border-mama-gray/5 last:border-0">
                  <td className="px-4 py-3 text-mama-gray">
                    {new Date(g.fecha + 'T00:00:00').toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-4 py-3 text-mama-charcoal font-medium">{g.concepto}</td>
                  <td className="px-4 py-3 text-mama-charcoal font-medium">
                    ${Number(g.valor).toLocaleString('es-CO')}
                  </td>
                  <td className="px-4 py-3 text-mama-gray">{g.descripcion || '—'}</td>
                  {esAdmin && (
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleEliminar(g)}
                        className="text-red-500 hover:underline"
                      >
                        Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
