import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import RutaProtegida from './components/layout/RutaProtegida'
import AppLayout from './components/layout/AppLayout'

import Login from './pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard'
import Compras from './pages/operativos/Compras'
import Produccion from './pages/operativos/Produccion'
import Ventas from './pages/operativos/Ventas'
import Gastos from './pages/operativos/Gastos'
import Catalogos from './pages/catalogos/Catalogos'
import Finanzas from './pages/finanzas/Finanzas'
import Recomendaciones from './pages/finanzas/Recomendaciones'
import Exportacion from './pages/exportacion/Exportacion'
import Usuarios from './pages/usuarios/Usuarios'

export default function App() {
  return (
    <BrowserRouter basename="/la-cocina-de-mama">
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <RutaProtegida>
                <AppLayout />
              </RutaProtegida>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/compras" element={<Compras />} />
            <Route path="/produccion" element={<Produccion />} />
            <Route path="/ventas" element={<Ventas />} />
            <Route path="/gastos" element={<Gastos />} />

            <Route
              path="/catalogos/*"
              element={
                <RutaProtegida soloAdmin>
                  <Catalogos />
                </RutaProtegida>
              }
            />
            <Route
              path="/finanzas"
              element={
                <RutaProtegida soloAdmin>
                  <Finanzas />
                </RutaProtegida>
              }
            />
            <Route
              path="/finanzas/recomendaciones"
              element={
                <RutaProtegida soloAdmin>
                  <Recomendaciones />
                </RutaProtegida>
              }
            />
            <Route
              path="/exportacion"
              element={
                <RutaProtegida soloAdmin>
                  <Exportacion />
                </RutaProtegida>
              }
            />
            <Route
              path="/usuarios"
              element={
                <RutaProtegida soloAdmin>
                  <Usuarios />
                </RutaProtegida>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
