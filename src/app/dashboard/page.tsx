'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import {
  asignaturasPrimaria,
  asignaturasSecundaria,
  esSeccionPrimaria,
  esSeccionSecundaria,
  etiquetaSeccion,
} from '../../lib/registroEscolar'

const accesosPrimaria = [
  { titulo: 'Estudiantes', descripcion: 'Ficha y datos academicos de la seccion primaria activa.', ruta: '/dashboard/estudiantes', iniciales: 'ES' },
  { titulo: 'Asistencia', descripcion: 'Registro mensual de presencia, ausencia, excusa y tardanza.', ruta: '/dashboard/asistencia', iniciales: 'AS' },
  { titulo: 'Notas', descripcion: 'Carga masiva y matriz de calificaciones de Primaria.', ruta: '/dashboard/calificaciones-masivas', iniciales: 'NO' },
  { titulo: 'Reporte', descripcion: 'Resumen de asistencia anual y sabana de calificaciones.', ruta: '/dashboard/resumen', iniciales: 'RE' },
  { titulo: 'Boletines', descripcion: 'Generar boletines finales por estudiantes o secciones.', ruta: '/dashboard/boletines', iniciales: 'BO' },
]

const accesosSecundaria = [
  { titulo: 'Estudiantes', descripcion: 'Listado y ficha de estudiantes de la seccion secundaria activa.', ruta: '/dashboard/secundaria/estudiantes', iniciales: 'ES' },
  { titulo: 'Asistencia', descripcion: 'Resumen y control de asistencia para alimentar el boletin.', ruta: '/dashboard/secundaria/asistencia', iniciales: 'AS' },
  { titulo: 'Notas', descripcion: 'Entrada P1-P4 para el boletin de calificaciones.', ruta: '/dashboard/secundaria/calificaciones-masivas', iniciales: 'NO' },
  { titulo: 'Reporte', descripcion: 'Resumen academico y asistencia anual de Secundaria.', ruta: '/dashboard/secundaria/resumen', iniciales: 'RE' },
  { titulo: 'Boletines', descripcion: 'Boletin de calificaciones imprimible de Secundaria.', ruta: '/dashboard/secundaria/boletines', iniciales: 'BO' },
]

export default function Dashboard() {
  const router = useRouter()
  const [secciones, setSecciones] = useState<any[]>([])
  const [estudiantes, setEstudiantes] = useState<any[]>([])
  const [seccionPrimariaActiva, setSeccionPrimariaActiva] = useState('')
  const [seccionSecundariaActiva, setSeccionSecundariaActiva] = useState('')
  const [cargando, setCargando] = useState(true)

  const seccionesPrimaria = useMemo(() => secciones.filter(esSeccionPrimaria), [secciones])
  const seccionesSecundaria = useMemo(() => secciones.filter(esSeccionSecundaria), [secciones])
  const seccionPrimariaSeleccionada = seccionesPrimaria.find(sec => sec.id === seccionPrimariaActiva)
  const seccionSecundariaSeleccionada = seccionesSecundaria.find(sec => sec.id === seccionSecundariaActiva)

  const estudiantesPrimaria = estudiantes.filter(est =>
    seccionesPrimaria.some(sec => sec.id === est.seccion_id)
  )
  const estudiantesSecundaria = estudiantes.filter(est =>
    seccionesSecundaria.some(sec => sec.id === est.seccion_id)
  )

  useEffect(() => {
    cargarDashboard()
  }, [])

  const cargarDashboard = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const [{ data: seccionesData, error: seccionesError }, { data: estudiantesData, error: estudiantesError }] = await Promise.all([
        supabase
          .from('secciones')
          .select('*')
          .eq('user_id', session.user.id)
          .order('nivel', { ascending: true })
          .order('grado', { ascending: true })
          .order('identificador', { ascending: true }),
        supabase
          .from('estudiantes')
          .select('id,seccion_id,resultado_final,estado')
          .eq('user_id', session.user.id),
      ])

      if (seccionesError) throw seccionesError
      if (estudiantesError) throw estudiantesError

      const listaSecciones = seccionesData || []
      setSecciones(listaSecciones)
      setEstudiantes(estudiantesData || [])

      const primarias = listaSecciones.filter(esSeccionPrimaria)
      const secundarias = listaSecciones.filter(esSeccionSecundaria)
      if (primarias.length > 0) {
        const ultimaPrimaria = localStorage.getItem('ultimaSeccionPrimaria') || localStorage.getItem('ultimaSeccionActiva')
        const existe = primarias.find(sec => sec.id === ultimaPrimaria)
        const inicial = existe ? existe.id : primarias[0].id
        setSeccionPrimariaActiva(inicial)
        localStorage.setItem('ultimaSeccionPrimaria', inicial)
        localStorage.setItem('ultimaSeccionActiva', inicial)
      }
      if (secundarias.length > 0) {
        const ultimaSecundaria = localStorage.getItem('ultimaSeccionSecundaria')
        const existe = secundarias.find(sec => sec.id === ultimaSecundaria)
        const inicial = existe ? existe.id : secundarias[0].id
        setSeccionSecundariaActiva(inicial)
        localStorage.setItem('ultimaSeccionSecundaria', inicial)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setCargando(false)
    }
  }

  const manejarCambioPrimaria = (nuevoId: string) => {
    setSeccionPrimariaActiva(nuevoId)
    localStorage.setItem('ultimaSeccionPrimaria', nuevoId)
    localStorage.setItem('ultimaSeccionActiva', nuevoId)
    router.replace(`/dashboard?seccion_id=${nuevoId}&nivel=Primaria`)
  }

  const manejarCambioSecundaria = (nuevoId: string) => {
    setSeccionSecundariaActiva(nuevoId)
    localStorage.setItem('ultimaSeccionSecundaria', nuevoId)
    router.replace(`/dashboard?seccion_id=${nuevoId}&nivel=Secundario`)
  }

  const navegarPrimaria = (rutaBase: string, extraParams = '') => {
    if (!seccionPrimariaActiva) {
      alert('Primero selecciona o crea una seccion de Primaria.')
      return
    }
    router.push(`${rutaBase}?seccion_id=${seccionPrimariaActiva}&nivel=Primaria${extraParams}`)
  }

  const navegarSecundaria = (rutaBase = '/dashboard/secundaria/estudiantes', materia = '') => {
    if (!seccionSecundariaActiva) {
      alert('Primero selecciona o crea una seccion de Secundaria.')
      return
    }
    const materiaParam = materia ? `&materia=${encodeURIComponent(materia)}` : ''
    router.push(`${rutaBase}?seccion_id=${seccionSecundariaActiva}&nivel=Secundario${materiaParam}`)
  }

  const tarjetaResumen = [
    ['Estudiantes Primaria', estudiantesPrimaria.length],
    ['Secciones Primaria', seccionesPrimaria.length],
    ['Estudiantes Secundaria', estudiantesSecundaria.length],
    ['Secciones Secundaria', seccionesSecundaria.length],
  ] as const

  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dashboard general</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Registro Escolar</h1>
            <p className="mt-1 text-sm text-slate-500">Primaria y Secundaria se gestionan como contextos separados.</p>
          </div>

          {cargando ? (
            <div className="h-10 w-72 animate-pulse rounded-md bg-slate-100" />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {seccionesPrimaria.length > 0 && (
                <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:min-w-80">
                  Seccion activa para Primaria
                  <select
                    value={seccionPrimariaActiva}
                    onChange={(e) => manejarCambioPrimaria(e.target.value)}
                    className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold normal-case text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {seccionesPrimaria.map(sec => (
                      <option key={sec.id} value={sec.id}>{etiquetaSeccion(sec)}</option>
                    ))}
                  </select>
                </label>
              )}
              {seccionesSecundaria.length > 0 && (
                <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:min-w-80">
                  Seccion activa para Secundaria
                  <select
                    value={seccionSecundariaActiva}
                    onChange={(e) => manejarCambioSecundaria(e.target.value)}
                    className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold normal-case text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    {seccionesSecundaria.map(sec => (
                      <option key={sec.id} value={sec.id}>{etiquetaSeccion(sec)}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {tarjetaResumen.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
            </div>
          ))}
        </section>

        <section className="mb-8 grid gap-5 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-blue-700">Modulo Nivel Primario</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">Modulo Nivel Primario</h2>
                <p className="mt-1 text-sm text-slate-500">{seccionPrimariaSeleccionada ? etiquetaSeccion(seccionPrimariaSeleccionada) : 'No hay seccion primaria activa.'}</p>
              </div>
              <button onClick={() => router.push('/dashboard/secciones?nivel=Primaria')} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                Secciones
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {accesosPrimaria.map(acceso => (
                <button
                  key={acceso.ruta}
                  type="button"
                  onClick={() => navegarPrimaria(acceso.ruta)}
                  disabled={!seccionPrimariaActiva}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-200 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-700 font-mono text-xs font-semibold text-white">{acceso.iniciales}</span>
                  <span className="mt-3 block text-sm font-semibold text-slate-950">{acceso.titulo}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">{acceso.descripcion}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Modulo Nivel Secundario</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">Modulo Nivel Secundario</h2>
                <p className="mt-1 text-sm text-slate-500">{seccionSecundariaSeleccionada ? etiquetaSeccion(seccionSecundariaSeleccionada) : 'No hay seccion secundaria activa.'}</p>
              </div>
              <button onClick={() => router.push('/dashboard/secciones?nivel=Secundario')} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                Secciones
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {accesosSecundaria.map(acceso => (
                <button
                  key={acceso.titulo}
                  type="button"
                  onClick={() => navegarSecundaria(acceso.ruta)}
                  disabled={!seccionSecundariaActiva}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-emerald-200 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-700 font-mono text-xs font-semibold text-white">{acceso.iniciales}</span>
                  <span className="mt-3 block text-sm font-semibold text-slate-950">{acceso.titulo}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">{acceso.descripcion}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Materias de Primaria</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">Entrada directa a calificaciones primarias</h2>
            <p className="mt-1 text-sm text-slate-500">Estas materias solo usan la seccion primaria activa. Las materias de Secundaria se abren desde el modulo secundario.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {asignaturasPrimaria.map((materia) => (
              <button
                key={materia.id}
                type="button"
                onClick={() => navegarPrimaria('/dashboard/calificaciones', `&materia=${materia.dbNombre}&titulo=${materia.nombre}`)}
                disabled={!seccionPrimariaActiva}
                className="group flex min-h-24 items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border text-xs font-bold ${materia.tono}`}>{materia.abrevia}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-900 group-hover:text-blue-700">{materia.nombre}</span>
                  <span className="mt-1 block text-xs font-medium text-slate-500">Nivel Primario</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Materias de Secundaria</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">Entrada directa a calificaciones secundarias</h2>
              <p className="mt-1 text-sm text-slate-500">Usa la seccion secundaria activa y abre el formato del boletin oficial con P1, P2, P3 y P4.</p>
            </div>
            <button onClick={() => navegarSecundaria('/dashboard/secundaria/calificaciones-masivas')} disabled={!seccionSecundariaActiva} className="h-10 rounded-md bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">
              Abrir notas
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {asignaturasSecundaria.map((materia, index) => (
              <button
                key={materia}
                type="button"
                onClick={() => navegarSecundaria('/dashboard/secundaria/calificaciones-masivas', materia)}
                disabled={!seccionSecundariaActiva}
                className="group flex min-h-20 items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 font-mono text-xs font-bold text-emerald-700">{String(index + 1).padStart(2, '0')}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-900 group-hover:text-emerald-700">{materia}</span>
                  <span className="mt-1 block text-xs font-medium text-slate-500">Nivel Secundario</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
