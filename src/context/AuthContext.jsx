import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [perfil, setPerfil] = useState(null) // datos de la tabla `usuarios` (incluye rol)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setCargando(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  // Cuando haya sesión, buscamos el perfil (rol) en la tabla `usuarios`.
  // Esto se conecta cuando montemos la base de datos en el siguiente paso.
  useEffect(() => {
    async function cargarPerfil() {
      if (!session?.user) {
        setPerfil(null)
        return
      }
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) {
        console.error('Error cargando perfil de usuario:', error.message)
        return
      }
      setPerfil(data)
    }
    cargarPerfil()
  }, [session])

  const login = (email, password) =>
    supabase.auth.signInWithPassword({ email, password })

  const logout = () => supabase.auth.signOut()

  const value = {
    session,
    perfil,
    esAdmin: perfil?.rol === 'admin',
    cargando,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
