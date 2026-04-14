'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

interface Seccion {
  id: string
  grado: string
  identificador: string
  tanda?: string | null
}

export default function Dashboard() {
  const router = useRouter()
  const [secciones, setSecciones] = useState<Seccion[]>([])
  const [seccionActiva, setSeccionActiva] = useState('')
  const [cargando, setCargando] = useState(true)

  const asignaturas = [
    { id: 1, nombre: 'Lengua Española', dbNombre: 'Lengua Española' },
    { id: 2, nombre: 'Matemática', dbNombre: 'Matemática' },
    { id: 3, nombre: 'Ciencias Sociales', dbNombre: 'Ciencias Sociales' },
    { id: 4, nombre: 'C. de la Naturaleza', dbNombre: 'Ciencias de la Naturaleza' },
    { id: 5, nombre: 'Inglés', dbNombre: 'Lenguas Extranjeras (inglés)' },
    { id: 6, nombre: 'Educación Física', dbNombre: 'Educación Física' },
    { id: 7, nombre: 'Formación Humana', dbNombre: 'Formación Integral Humana y Religiosa' },
    { id: 8, nombre: 'Educación Artística', dbNombre: 'Educación Artística' },
  ]

  useEffect(() => {
    cargarSeccionesDelMaestro()
  }, [])

  const cargarSeccionesDelMaestro = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase.from('secciones').select('*').eq('user_id', session.user.id).order('grado', { ascending: true })
      if (error) throw error

      const seccionesData = (data || []) as Seccion[]
      setSecciones(seccionesData)

      if (seccionesData.length > 0) {
        const ultimaSeccion = localStorage.getItem('ultimaSeccionActiva')
        const seccionExiste = seccionesData.find((s) => s.id === ultimaSeccion)

        if (seccionExiste && ultimaSeccion) {
          setSeccionActiva(ultimaSeccion)
        } else {
          setSeccionActiva(seccionesData[0].id)
          localStorage.setItem('ultimaSeccionActiva', seccionesData[0].id)
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
    router.replace(`/dashboard?seccion_id=${nuevoId}`)
  }

  const navegarConContexto = (rutaBase: string, extraParams = '') => {
    if (!seccionActiva) {
      alert('Por favor, selecciona o crea una sección primero.')
      return
    }
    router.push(`${rutaBase}?seccion_id=${seccionActiva}${extraParams}`)
  }

  return (
    <>
      <header className="z-10 flex flex-col gap-4 border-b border-slate-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Panel de control</h1>
          <p className="text-sm text-slate-500">Ciclo Escolar 2025-2026</p>
        </div>

        {cargando ? (
          <p className="text-sm text-slate-500">Cargando...</p>
        ) : secciones.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
            <select
              value={seccionActiva}
              onChange={(e) => manejarCambioSeccion(e.target.value)}
              className="w-full cursor-pointer rounded-lg border border-slate-300 bg-white p-2 text-sm font-medium text-slate-700 outline-none focus:border-slate-400"
            >
              {secciones.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.grado} &quot;{sec.identificador}&quot; {sec.tanda ? `(${sec.tanda})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto bg-slate-100 p-6 md:p-8">
        {secciones.length === 0 && !cargando && (
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 md:flex md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Bienvenido a ELINE</h3>
              <p className="mt-1 text-sm text-slate-500">Para empezar, configura tu primera sección escolar.</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/secciones')}
              className="mt-4 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 md:mt-0"
            >
              Configurar sección
            </button>
          </div>
        )}

        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Asignaturas oficiales</h2>
          <p className="text-sm text-slate-500">Selecciona una materia para gestionar calificaciones.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {asignaturas.map((materia) => (
            <button
              key={materia.id}
              onClick={() => secciones.length > 0 && navegarConContexto('/dashboard/calificaciones', `&materia=${materia.dbNombre}&titulo=${materia.nombre}`)}
              className={`rounded-2xl border bg-white p-5 text-left transition ${
                secciones.length === 0
                  ? 'cursor-not-allowed border-slate-200 opacity-50'
                  : 'border-slate-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <p className="text-sm font-semibold text-slate-900">{materia.nombre}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.15em] text-slate-400">Matriz de notas</p>
            </button>
          ))}
        </div>

        <h2 className="mb-4 mt-10 text-lg font-semibold text-slate-900">Accesos rápidos</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <button
            onClick={() => navegarConContexto('/dashboard/asistencia')}
            className={`rounded-2xl border bg-white p-6 text-left transition ${
              secciones.length === 0 ? 'cursor-not-allowed border-slate-200 opacity-50' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
            }`}
          >
            <p className="text-base font-semibold text-slate-900">Pasar asistencia</p>
            <p className="mt-1 text-sm text-slate-500">Registro diario oficial y control de ausencias de tu sección.</p>
          </button>

          <button
            onClick={() => navegarConContexto('/dashboard/estudiantes')}
            className={`rounded-2xl border bg-white p-6 text-left transition ${
              secciones.length === 0 ? 'cursor-not-allowed border-slate-200 opacity-50' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
            }`}
          >
            <p className="text-base font-semibold text-slate-900">Mis estudiantes</p>
            <p className="mt-1 text-sm text-slate-500">Fichas técnicas e importación masiva desde Excel/CSV.</p>
          </button>
        </div>
      </div>
    </>
  )
}
