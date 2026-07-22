import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'

const FORM_VACIO = {
  nombre: '',
  email: '',
  password: '',
  rol: 'empleado',
}

export default function Usuarios() {
  const { session } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)

  async function cargarUsuarios() {
    setCargando(true)
    setError('')
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('creado_en', { ascending: true })

    if (error) {
      setError('No se pudieron cargar los usuarios: ' + error.message)
    } else {
      setUsuarios(data)
    }
    setCargando(false)
  }

  useEffect(() => {
    cargarUsuarios()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    setError('')
    setExito('')

    const { data, error } = await supabase.functions.invoke('crear-usuario', {
      body: form,
    })

    setGuardando(false)

    // supabase-js pone el error de la función aquí, o dentro de `data.error`
    const mensajeError = error?.message || data?.error
    if (mensajeError) {
      setError('No se pudo crear el usuario: ' + mensajeError)
      return
    }

    setExito(`Cuenta creada para ${form.nombre}. Ya puede iniciar sesión con ese correo y contraseña.`)
    setForm(FORM_VACIO)
    setMostrarForm(false)
    cargarUsuarios()
  }

  async function cambiarRol(usuario, nuevoRol) {
    if (usuario.id === session.user.id) {
      setError('No puedes cambiar tu propio rol desde aquí.')
      return
    }
    const { error } = await supabase
      .from('usuarios')
      .update({ rol: nuevoRol })
      .eq('id', usuario.id)
    if (error) {
      setError('No se pudo actualizar el rol: ' + error.message)
      return
    }
    cargarUsuarios()
  }

  async function toggleActivo(usuario) {
    if (usuario.id === session.user.id) {
      setError('No puedes desactivar tu propia cuenta.')
      return
    }
    const { error } = await supabase
      .from('usuarios')
      .update({ activo: !usuario.activo })
      .eq('id', usuario.id)
    if (error) {
      setError('No se pudo actualizar: ' + error.message)
      return
    }
    cargarUsuarios()
  }

  async function eliminarUsuario(usuario) {
    if (usuario.id === session.user.id) {
      setError('No puedes eliminar tu propia cuenta.')
      return
    }

    const confirmar = window.confirm(
      `¿Eliminar por completo la cuenta de "${usuario.nombre}"? Esto no se puede deshacer. Si ya tiene movimientos registrados, el sistema lo va a bloquear automáticamente.`
    )
    if (!confirmar) return

    setError('')
    setExito('')

    const { data, error } = await supabase.functions.invoke('eliminar-usuario', {
      body: { id_usuario: usuario.id },
    })

    const mensajeError = error?.message || data?.error
    if (mensajeError) {
      setError(mensajeError)
      return
    }

    setExito(`Cuenta de ${usuario.nombre} eliminada.`)
    cargarUsuarios()
  }

  return (
    <div className="p-6">
      <Link to="/" className="text-sm text-mama-terracotta hover:underline">
        ← Dashboard
      </Link>
      <div className="flex items-center justify-between mt-1 mb-1">
        <h1 className="font-display text-2xl text-mama-charcoal">Usuarios</h1>
        <button
          onClick={() => setMostrarForm(true)}
          className="bg-mama-terracotta hover:bg-mama-terracotta-dark transition-colors text-white font-medium px-4 py-2 rounded-lg"
        >
          + Nuevo usuario
        </button>
      </div>
      <p className="text-mama-gray mb-6">
        Solo el administrador puede crear cuentas y asignar contraseñas al equipo.
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

      {mostrarForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-mama-gray/10 p-5 mb-6 space-y-4"
        >
          <h2 className="font-medium text-mama-charcoal">Nuevo usuario</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-mama-charcoal mb-1">Nombre</label>
              <input
                required
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
              />
            </div>
            <div>
              <label className="block text-sm text-mama-charcoal mb-1">Correo</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
              />
            </div>
            <div>
              <label className="block text-sm text-mama-charcoal mb-1">
                Contraseña temporal
              </label>
              <input
                type="text"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
              />
              <p className="text-xs text-mama-gray mt-1">
                Compártela con la persona por un medio seguro (no queda guardada en ningún
                lado después de esto).
              </p>
            </div>
            <div>
              <label className="block text-sm text-mama-charcoal mb-1">Rol</label>
              <select
                value={form.rol}
                onChange={(e) => setForm({ ...form, rol: e.target.value })}
                className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
              >
                <option value="empleado">Empleado</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={guardando}
              className="bg-mama-terracotta hover:bg-mama-terracotta-dark transition-colors text-white font-medium px-4 py-2 rounded-lg disabled:opacity-60"
            >
              {guardando ? 'Creando...' : 'Crear cuenta'}
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
          <p className="p-5 text-mama-gray">Cargando usuarios...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-mama-gray border-b border-mama-gray/10">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Correo</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-mama-gray/5 last:border-0">
                  <td className="px-4 py-3 text-mama-charcoal font-medium">
                    {u.nombre} {u.id === session.user.id && '(tú)'}
                  </td>
                  <td className="px-4 py-3 text-mama-gray">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.rol}
                      onChange={(e) => cambiarRol(u, e.target.value)}
                      disabled={u.id === session.user.id}
                      className="rounded-lg border border-mama-gray/30 px-2 py-1 text-sm disabled:opacity-50"
                    >
                      <option value="empleado">Empleado</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActivo(u)}
                      disabled={u.id === session.user.id}
                      className={`text-xs px-2 py-1 rounded-full disabled:opacity-50 disabled:cursor-not-allowed ${
                        u.activo
                          ? 'bg-mama-green/10 text-mama-green hover:bg-mama-green/20'
                          : 'bg-mama-gray/10 text-mama-gray hover:bg-mama-gray/20'
                      }`}
                    >
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.id !== session.user.id && (
                      <button
                        onClick={() => eliminarUsuario(u)}
                        className="text-mama-maroon-500 hover:underline text-xs"
                      >
                        Eliminar
                      </button>
                    )}
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
