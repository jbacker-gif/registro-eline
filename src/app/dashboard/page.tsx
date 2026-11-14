'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { anoEscolarCerrado } from '../../lib/ano-escolar'
import { supabase } from '../../lib/supabase'

const asignaturas = [
  { id: 1, nombre: 'Lengua Española', dbNombre: 'Lengua Española', abrevia: 'LE', tono: 'border-blue-200 bg-blue-50 text-blue-700' },
  { id: 2, nombre: 'Matemática', dbNombre: 'Matemática', abrevia: 'MA', tono: 'border-red-200 bg-red-50 text-red-700' },
  { id: 3, nombre: 'Ciencias Sociales', dbNombre: 'Ciencias Sociales', abrevia: 'CS', tono: 'border-amber-200 bg-amber-50 text-amber-700' },
  { id: 4, nombre: 'Ciencias de la Naturaleza', dbNombre: 'Ciencias de la Naturaleza', abrevia: 'CN', tono: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  { id: 5, nombre: 'Inglés', dbNombre: 'Lenguas Extranjeras (inglés)', abrevia: 'IN', tono: 'border-violet-200 bg-violet-50 text-violet-700' },
  { id: 6, nombre: 'Educación Física', dbNombre: 'Educación Física', abrevia: 'EF', tono: 'border-orange-200 bg-orange-50 text-orange-700' },
  { id: 7, nombre: 'Formación Humana', dbNombre: 'Formación Integral Humana y Religiosa', abrevia: 'FH', tono: 'border-teal-200 bg-teal-50 text-teal-700' },
  { id: 8, nombre: 'Educación Artística', dbNombre: 'Educación Artística', abrevia: 'EA', tono: 'border-pink-200 bg-pink-50 text-pink-700' },
]

const accesos = [
  { titulo: 'Carga masiva de notas', descripcion: 'Importación por periodo para todas las asignaturas.', ruta: '/dashboard/calificaciones-masivas', iniciales: 'CSV' },
  { titulo: 'Asistencia', descripcion: 'Registro mensual de presencia, ausencia, excusa y tardanza.', ruta: '/dashboard/asistencia', iniciales: 'AS' },
  { titulo: 'Estudiantes', descripcion: 'Ficha, estado y datos académicos de la sección.', ruta: '/dashboard/estudiantes', iniciales: 'ES' },
  { titulo: 'Resumen', descripcion: 'Vista consolidada para revisión y cierre.', ruta: '/dashboard/resumen', iniciales: 'RE' },
]

type Seccion = {
  id: string
  grado: string
  identificador: string
  tanda: string | null
  ano_escolar: string | null
}

const normalizarBusqueda = (texto: string) =>
  texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

export default function Dashboard() {
  const router = useRouter()
  const [secciones, setSecciones] = useState<Seccion[]>([])
  const [seccionActiva, setSeccionActiva] = useState('')
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const terminos = normalizarBusqueda(busqueda).trim().split(/\s+/).filter(Boolean)
  const coincidencias = secciones.filter(sec => {
    const texto = normalizarBusqueda([sec.grado, sec.identificador, sec.tanda, sec.ano_escolar].join(' '))
    return terminos.every(termino => texto.includes(termino))
  })
  const vigentes = coincidencias.filter(sec => !anoEscolarCerrado(sec.ano_escolar))
  const historicas = coincidencias.filter(sec => anoEscolarCerrado(sec.ano_escolar))

  const botonesSecciones = (lista: Seccion[]) => (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {lista.map(sec => (
        <button
          key={sec.id}
          type="button"
          aria-pressed={sec.id === seccionActiva}
          onClick={() => manejarCambioSeccion(sec.id)}
          className="min-w-0 rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-slate-900 hover:border-blue-400 focus-visible:outline-2 focus-visible:outline-blue-600 aria-pressed:border-blue-700 aria-pressed:bg-blue-50"
        >
          <span className="block text-sm font-semibold">{sec.grado} {sec.identificador}</span>
          <span className="mt-1 block text-xs text-slate-600">
            {[sec.tanda, sec.ano_escolar].filter(Boolean).join(' · ')}
          </span>
          {sec.id === seccionActiva && <span className="mt-1 block text-xs font-semibold text-blue-800">Seleccionada</span>}
        </button>
      ))}
    </div>
  )

  useEffect(() => {
    cargarSeccionesDelMaestro()
  }, [])

  const cargarSeccionesDelMaestro = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from('secciones')
        .select('*')
        .eq('user_id', session.user.id)
        .order('grado', { ascending: true })
        .order('identificador', { ascending: true })
        .order('ano_escolar', { ascending: false })
      if (error) throw error

      setSecciones(data || [])

      if (data && data.length > 0) {
        const ultimaSeccion = localStorage.getItem('ultimaSeccionActiva')
        const parametros = new URLSearchParams(window.location.search)
        const solicitada = parametros.get('seccion_id')
        const recordada = data.find(sec => sec.id === ultimaSeccion)
        const vigente = data.find(sec => !anoEscolarCerrado(sec.ano_escolar))
        const inicial = data.find(sec => sec.id === solicitada)
          ?? (recordada && !anoEscolarCerrado(recordada.ano_escolar) ? recordada : vigente ?? recordada)
          ?? data[0]
        setSeccionActiva(inicial.id)
        localStorage.setItem('ultimaSeccionActiva', inicial.id)
        if (solicitada && solicitada !== inicial.id) {
          parametros.set('seccion_id', inicial.id)
          router.replace(`/dashboard?${parametros}`, { scroll: false })
        }
      }
    } catch (error) {
      console.error(error)
    } finally {
      setCargando(false)
    }
  }

  const manejarCambioSeccion = (nuevoId: string) => {
    setSeccionActiva(nuevoId)
    localStorage.setItem('ultimaSeccionActiva', nuevoId)
    router.replace(`/dashboard?seccion_id=${encodeURIComponent(nuevoId)}`, { scroll: false })
  }

  const navegarConContexto = (rutaBase: string, extraParams = '') => {
    if (!seccionActiva) {
      alert('Por favor, selecciona o crea una sección primero.')
      return
    }
    router.push(`${rutaBase}?seccion_id=${seccionActiva}${extraParams}`)
  }

  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Panel docente</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Registro escolar</h1>
          </div>


        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
        {secciones.length === 0 && !cargando && (
          <section className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-950">Configura tu primera sección</h2>
                <p className="mt-1 text-sm text-slate-600">La sección activa conecta asistencia, estudiantes, calificaciones y reportes.</p>
              </div>
              <button onClick={() => router.push('/dashboard/secciones')} className="h-10 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700">
                Configurar sección
              </button>
            </div>
          </section>
        )}

        {cargando && <div aria-label="Cargando secciones" className="mb-8 h-24 animate-pulse rounded-lg bg-slate-200" />}
        {secciones.length > 0 && (
          <section className="mb-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="selector-seccion">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 id="selector-seccion" className="text-lg font-semibold text-slate-950">Sección activa</h2>
              {secciones.length > 3 && (
                <input
                  type="search"
                  aria-label="Buscar sección"
                  placeholder="Buscar grado, tanda o año"
                  value={busqueda}
                  onChange={event => setBusqueda(event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-blue-600 sm:w-64"
                />
              )}
            </div>
            {botonesSecciones(vigentes)}
            {historicas.length > 0 && (
              <details key={terminos.length > 0 ? 'busqueda' : 'lista'} open={terminos.length > 0 || historicas.some(sec => sec.id === seccionActiva)}>
                <summary className="mt-3 cursor-pointer rounded px-1 py-2 text-sm font-semibold text-slate-700 focus-visible:outline-2 focus-visible:outline-blue-600">
                  Años anteriores · Solo lectura
                </summary>
                {botonesSecciones(historicas)}
              </details>
            )}
            {coincidencias.length === 0 && <p role="status" className="text-sm text-slate-600">No hay secciones que coincidan con la búsqueda.</p>}
          </section>
        )}

        <section className="mb-10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Asignaturas</h2>
              <p className="mt-1 text-sm text-slate-500">Entrada directa a la matriz individual por asignatura.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {asignaturas.map((materia) => (
              <button
                key={materia.id}
                type="button"
                onClick={() => navegarConContexto('/dashboard/calificaciones', `&materia=${materia.dbNombre}&titulo=${materia.nombre}`)}
                disabled={secciones.length === 0}
                className="group flex min-h-24 items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border text-xs font-bold ${materia.tono}`}>{materia.abrevia}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-900 group-hover:text-blue-700">{materia.nombre}</span>
                  <span className="mt-1 block text-xs font-medium text-slate-500">Calificaciones</span>
                </span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-blue-600">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 5 7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-950">Accesos rápidos</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {accesos.map((acceso) => (
              <button
                key={acceso.ruta}
                type="button"
                onClick={() => navegarConContexto(acceso.ruta)}
                disabled={secciones.length === 0}
                className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 font-mono text-xs font-semibold text-white">{acceso.iniciales}</span>
                <span className="mt-4 block text-base font-semibold text-slate-950">{acceso.titulo}</span>
                <span className="mt-2 block text-sm leading-5 text-slate-500">{acceso.descripcion}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}