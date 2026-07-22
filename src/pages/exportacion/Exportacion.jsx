import { useState } from 'react'
import { Link } from 'react-router-dom'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { supabase } from '../../lib/supabaseClient'

const TIPOS = [
  { id: 'compras', nombre: 'Compras' },
  { id: 'producciones', nombre: 'Producción' },
  { id: 'ventas', nombre: 'Ventas' },
  { id: 'gastos_operativos', nombre: 'Gastos operativos' },
]

function hoyISO() {
  return new Date().toISOString().slice(0, 10)
}
function haceDias(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}
function formatoCOP(v) {
  return '$' + Number(v || 0).toLocaleString('es-CO')
}

// Define cómo se consulta y cómo se ve cada tipo de movimiento en la exportación
const CONFIG_TIPOS = {
  compras: {
    consulta: (desde, hasta) =>
      supabase
        .from('compras')
        .select('fecha, cantidad, costo_unitario, costo_total, proveedor, insumos(nombre, unidad_compra)')
        .gte('fecha', desde)
        .lte('fecha', hasta)
        .order('fecha'),
    columnas: ['Fecha', 'Insumo', 'Cantidad', 'Costo unitario', 'Costo total', 'Proveedor'],
    fila: (r) => [
      r.fecha,
      r.insumos?.nombre || '',
      `${r.cantidad} ${r.insumos?.unidad_compra || ''}`,
      formatoCOP(r.costo_unitario),
      formatoCOP(r.costo_total),
      r.proveedor || '',
    ],
  },
  producciones: {
    consulta: (desde, hasta) =>
      supabase
        .from('producciones')
        .select('fecha, num_lotes, bandejas_producidas, costo_total_calculado, costo_por_bandeja, productos(nombre), recetas(nombre)')
        .gte('fecha', desde)
        .lte('fecha', hasta)
        .order('fecha'),
    columnas: ['Fecha', 'Producto', 'Receta', 'Lotes', 'Bandejas', 'Costo total', 'Costo/bandeja'],
    fila: (r) => [
      r.fecha,
      r.productos?.nombre || '',
      r.recetas?.nombre || '',
      r.num_lotes,
      r.bandejas_producidas,
      formatoCOP(r.costo_total_calculado),
      formatoCOP(r.costo_por_bandeja),
    ],
  },
  ventas: {
    consulta: (desde, hasta) =>
      supabase
        .from('ventas')
        .select('fecha, cantidad, precio_unitario, total, metodo_pago, productos(nombre)')
        .gte('fecha', desde)
        .lte('fecha', hasta)
        .order('fecha'),
    columnas: ['Fecha', 'Producto', 'Cantidad', 'Precio unitario', 'Total', 'Método de pago'],
    fila: (r) => [
      r.fecha,
      r.productos?.nombre || '',
      r.cantidad,
      formatoCOP(r.precio_unitario),
      formatoCOP(r.total),
      r.metodo_pago,
    ],
  },
  gastos_operativos: {
    consulta: (desde, hasta) =>
      supabase
        .from('gastos_operativos')
        .select('fecha, concepto, valor, descripcion')
        .gte('fecha', desde)
        .lte('fecha', hasta)
        .order('fecha'),
    columnas: ['Fecha', 'Concepto', 'Valor', 'Descripción'],
    fila: (r) => [r.fecha, r.concepto, formatoCOP(r.valor), r.descripcion || ''],
  },
}

export default function Exportacion() {
  const [desde, setDesde] = useState(haceDias(30))
  const [hasta, setHasta] = useState(hoyISO())
  const [tiposSeleccionados, setTiposSeleccionados] = useState(TIPOS.map((t) => t.id))
  const [exportando, setExportando] = useState(false)
  const [error, setError] = useState('')

  function toggleTipo(id) {
    setTiposSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  async function obtenerDatos() {
    const resultado = {}
    for (const tipoId of tiposSeleccionados) {
      const config = CONFIG_TIPOS[tipoId]
      const { data, error } = await config.consulta(desde, hasta)
      if (error) throw new Error(`Error cargando ${tipoId}: ${error.message}`)
      resultado[tipoId] = data || []
    }
    return resultado
  }

  async function exportarExcel() {
    setError('')
    if (tiposSeleccionados.length === 0) {
      setError('Selecciona al menos un tipo de movimiento.')
      return
    }
    setExportando(true)
    try {
      const datos = await obtenerDatos()
      const libro = XLSX.utils.book_new()

      tiposSeleccionados.forEach((tipoId) => {
        const config = CONFIG_TIPOS[tipoId]
        const nombreHoja = TIPOS.find((t) => t.id === tipoId).nombre
        const filas = datos[tipoId].map(config.fila)
        const hoja = XLSX.utils.aoa_to_sheet([config.columnas, ...filas])
        XLSX.utils.book_append_sheet(libro, hoja, nombreHoja.slice(0, 31))
      })

      XLSX.writeFile(libro, `la-cocina-de-mama_${desde}_a_${hasta}.xlsx`)
    } catch (e) {
      setError(e.message)
    } finally {
      setExportando(false)
    }
  }

  async function exportarPDF() {
    setError('')
    if (tiposSeleccionados.length === 0) {
      setError('Selecciona al menos un tipo de movimiento.')
      return
    }
    setExportando(true)
    try {
      const datos = await obtenerDatos()
      const doc = new jsPDF()

      doc.setFontSize(14)
      doc.text('La Cocina de Mamá — Reporte de movimientos', 14, 15)
      doc.setFontSize(10)
      doc.text(`Del ${desde} al ${hasta}`, 14, 21)

      let cursorY = 28

      tiposSeleccionados.forEach((tipoId) => {
        const config = CONFIG_TIPOS[tipoId]
        const nombreSeccion = TIPOS.find((t) => t.id === tipoId).nombre
        const filas = datos[tipoId].map(config.fila)

        if (cursorY > 260) {
          doc.addPage()
          cursorY = 15
        }

        doc.setFontSize(12)
        doc.text(nombreSeccion, 14, cursorY)

        autoTable(doc, {
          startY: cursorY + 3,
          head: [config.columnas],
          body: filas.length > 0 ? filas : [['Sin movimientos en este período', '', '', '', '', '']],
          styles: { fontSize: 8 },
          headStyles: { fillColor: [192, 85, 59] }, // terracota
          margin: { left: 14, right: 14 },
        })

        cursorY = doc.lastAutoTable.finalY + 12
      })

      doc.save(`la-cocina-de-mama_${desde}_a_${hasta}.pdf`)
    } catch (e) {
      setError(e.message)
    } finally {
      setExportando(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <Link to="/" className="text-sm text-mama-terracotta hover:underline">
        ← Dashboard
      </Link>
      <h1 className="font-display text-2xl text-mama-charcoal mt-1 mb-1">Exportar datos</h1>
      <p className="text-mama-gray mb-6">
        Descarga los movimientos del negocio para análisis contable.
      </p>

      {error && (
        <div className="bg-mama-maroon-50 border border-mama-maroon-200 text-mama-maroon-700 text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-mama-gray/10 p-5 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-mama-charcoal mb-1">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
            />
          </div>
          <div>
            <label className="block text-sm text-mama-charcoal mb-1">Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="w-full rounded-lg border border-mama-gray/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mama-terracotta"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-mama-charcoal mb-2">Tipos de movimiento</label>
          <div className="flex flex-wrap gap-2">
            {TIPOS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTipo(t.id)}
                className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                  tiposSeleccionados.includes(t.id)
                    ? 'bg-mama-terracotta text-white border-mama-terracotta'
                    : 'bg-white text-mama-charcoal border-mama-gray/20 hover:border-mama-terracotta/40'
                }`}
              >
                {t.nombre}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={exportarExcel}
            disabled={exportando}
            className="flex-1 bg-mama-green hover:opacity-90 transition-opacity text-white font-medium px-4 py-2 rounded-lg disabled:opacity-60"
          >
            {exportando ? 'Generando...' : 'Descargar Excel'}
          </button>
          <button
            onClick={exportarPDF}
            disabled={exportando}
            className="flex-1 bg-mama-terracotta hover:bg-mama-terracotta-dark transition-colors text-white font-medium px-4 py-2 rounded-lg disabled:opacity-60"
          >
            {exportando ? 'Generando...' : 'Descargar PDF'}
          </button>
        </div>
      </div>
    </div>
  )
}
