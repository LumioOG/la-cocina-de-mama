import { Link, Routes, Route, useLocation } from 'react-router-dom'
import Insumos from './Insumos'
import Productos from './Productos'

const secciones = [
  { nombre: 'Insumos', to: '/catalogos/insumos', listo: true },
  { nombre: 'Productos', to: '/catalogos/productos', listo: true },
  { nombre: 'Recetas', to: '/catalogos/recetas', listo: false },
]

export default function Catalogos() {
  const location = useLocation()
  const enSubruta = location.pathname !== '/catalogos'

  return (
    <div className="p-6">
      {!enSubruta && (
        <>
          <h1 className="font-display text-2xl text-mama-charcoal mb-1">Catálogos</h1>
          <p className="text-mama-gray mb-6">
            Gestiona los insumos, productos y recetas del negocio.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {secciones.map((s) => (
              <Link
                key={s.nombre}
                to={s.listo ? s.to : '#'}
                className={`block bg-white rounded-xl shadow-sm border border-mama-gray/10 p-5 transition-all ${
                  s.listo
                    ? 'hover:shadow-md hover:border-mama-terracotta/40'
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <span className="font-medium text-mama-charcoal">{s.nombre}</span>
                {!s.listo && (
                  <span className="block text-xs text-mama-gray mt-1">Próximamente</span>
                )}
              </Link>
            ))}
          </div>
        </>
      )}

      <Routes>
        <Route path="insumos" element={<Insumos />} />
        <Route path="productos" element={<Productos />} />
      </Routes>
    </div>
  )
}
