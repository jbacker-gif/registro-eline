'use client'

import { useState } from 'react'
import catalogo from '../data/catalogo-servicios.json'

const categorias = [...new Set(catalogo.map(({ categoria }) => categoria))]
const moneda = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', currencyDisplay: 'narrowSymbol' })
const normalizar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

export default function CatalogoServicios() {
  const [categoria, setCategoria] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean)
  const resultados = catalogo.filter((item) => {
    const texto = normalizar([item.categoria, item.servicio, item.formato, item.variante, item.codigo].join(' '))
    return (!categoria || item.categoria === categoria) && palabras.every((palabra) => texto.includes(palabra))
  })

  return (
    <section id="catalogo" className="border-t border-slate-200 bg-[#f2f5f8] px-5 py-16 sm:px-6 md:py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-serif text-4xl tracking-tight text-[#142037] md:text-5xl">Catálogo y precios</h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
          Encuentra formatos de impresión y acabados. Los precios están en pesos dominicanos (RD$).
        </p>
        <div className="mt-7 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1.5fr_1fr] sm:p-5">
          <label className="grid gap-1.5 text-sm font-semibold text-slate-800">
            Buscar en el catálogo
            <input type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Ej. papel bond, color o empastado" className="min-w-0 rounded-lg border border-slate-300 px-3 py-3 font-normal placeholder:text-slate-500" />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-slate-800">
            Categoría
            <select value={categoria} onChange={(event) => setCategoria(event.target.value)} className="min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-3 font-normal">
              <option value="">Todas las categorías</option>
              {categorias.map((opcion) => <option key={opcion} value={opcion}>{opcion}</option>)}
            </select>
          </label>
        </div>
        <p aria-live="polite" className="my-4 text-sm font-medium text-slate-600">{resultados.length} {resultados.length === 1 ? 'variante' : 'variantes'}</p>
        {resultados.length === 0 && <p className="rounded-xl border border-slate-200 bg-white p-5 text-slate-700">Prueba otro término o selecciona todas las categorías.</p>}
        <div className="space-y-7">
          {categorias.map((grupo) => {
            const variantes = resultados.filter((item) => item.categoria === grupo)
            if (!variantes.length) return null
            return (
              <div key={grupo} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <h3 className="border-b border-slate-200 bg-slate-100 px-4 py-3.5 text-lg font-bold text-[#142037] sm:px-6">{grupo}</h3>
                <ul className="divide-y divide-slate-200">
                  {variantes.map((item) => {
                    const especificacion = [item.formato, item.variante].filter(Boolean).join(' · ')
                    const detalle = [item.servicio, especificacion].filter(Boolean).join(' · ')
                    const mensaje = `Hola ADSP, deseo cotizar ${detalle} (${item.codigo}). Cantidad: . Fecha de entrega deseada: .`
                    return (
                      <li key={item.codigo} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_8rem_10rem] sm:items-center sm:gap-5 sm:px-6">
                        <div>
                          <h4 className="font-semibold text-[#142037]">{item.servicio}</h4>
                          {especificacion && <p className="mt-1 text-sm text-slate-600">{especificacion}</p>}
                          {item.nota && <p className="mt-1 text-sm text-slate-600">{item.nota}</p>}
                        </div>
                        <div className="text-right sm:text-left">
                          <p className="whitespace-nowrap font-bold tabular-nums text-[#142037]">{item.precio === null ? 'A cotizar' : moneda.format(item.precio).replace(/^\$/, 'RD$')}</p>
                          <p className="text-xs text-slate-600">Por {item.unidad.toLowerCase()}</p>
                        </div>
                        <a href={`https://wa.me/18496297248?text=${encodeURIComponent(mensaje)}`} target="_blank" rel="noopener noreferrer" aria-label={`Cotizar ${detalle} por WhatsApp`} className="col-span-2 inline-flex min-h-11 w-fit items-center rounded-lg border border-emerald-300 bg-emerald-50 px-3 text-sm font-semibold text-emerald-900 hover:bg-emerald-100 sm:col-span-1">
                          Cotizar por WhatsApp
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
