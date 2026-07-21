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
    <div className="min-h-screen flex items-center justify-center bg-mama-cream px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        <h1 className="font-display text-2xl text-mama-terracotta-dark text-center mb-1">
          La Cocina de Mamá
        </h1>
        <p className="text-center text-mama-gray text-sm mb-6">Panel interno de gestión</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-mama-charcoal mb-1">Correo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
            />
          </div>
          <div>
            <label className="block text-sm text-mama-charcoal mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-mama-terracotta hover:bg-mama-terracotta-dark transition-colors text-white font-medium py-2 rounded-lg disabled:opacity-60"
          >
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
