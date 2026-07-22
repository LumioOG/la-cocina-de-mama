import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setCargando(true)
    const { error } = await login(email, password)
    setCargando(false)
    if (error) {
      setError('Correo o contraseña incorrectos.')
      return
    }
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-mama-terracotta px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="inline-flex w-14 h-14 rounded-2xl bg-mama-cream/10 items-center justify-center mb-4">
            <span className="font-display text-2xl text-mama-cream">M</span>
          </span>
          <h1 className="font-display text-2xl text-mama-cream">La Cocina de Mamá</h1>
          <p className="text-mama-cream/60 text-sm mt-1">Panel interno de gestión</p>
        </div>

        <div className="bg-mama-cream rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-mama-charcoal mb-1.5 font-medium">
                Correo
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-mama-gray/20 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-mama-terracotta/40 focus:border-mama-terracotta"
              />
            </div>
            <div>
              <label className="block text-sm text-mama-charcoal mb-1.5 font-medium">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-mama-gray/20 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-mama-terracotta/40 focus:border-mama-terracotta"
              />
            </div>

            {error && <p className="text-sm text-mama-maroon-600">{error}</p>}

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-mama-terracotta hover:bg-mama-terracotta-dark text-white font-medium py-2.5 rounded-xl disabled:opacity-60"
            >
              {cargando ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
