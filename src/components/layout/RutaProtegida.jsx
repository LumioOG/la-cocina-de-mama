import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/**
 * Protege rutas según sesión y, opcionalmente, rol requerido.
 * Uso: <RutaProtegida soloAdmin>...</RutaProtegida>
 */
export default function RutaProtegida({ children, soloAdmin = false }) {
  const { session, esAdmin, cargando } = useAuth()

  if (cargando) return <div className="p-6 text-mama-charcoal">Cargando...</div>
  if (!session) return <Navigate to="/login" replace />
  if (soloAdmin && !esAdmin) return <Navigate to="/" replace />

  return children
}
