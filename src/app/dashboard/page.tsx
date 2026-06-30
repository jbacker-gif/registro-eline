'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function Dashboard() {
  const router = useRouter()

  const [secciones, setSecciones] = useState<any[]>([])
  const [seccionActiva, setSeccionActiva] = useState('')
  const [cargando, setCargando] = useState(true)
  const seccionSeleccionada = secciones.find(sec => sec.id === seccionActiva)

  // 1. NUEVA PALETA MINIMALISTA: Solo color en los íconos, tarjetas blancas limpias.
  const asignaturas = [
    { id: 1, nombre: 'Lengua Española', dbNombre: 'Lengua Española', iconBg: 'bg-blue-50', iconColor: 'text-blue-600', icono: '📚' },
    { id: 2, nombre: 'Matemática', dbNombre: 'Matemática', iconBg: 'bg-red-50', iconColor: 'text-red-600', icono: '📐' },
    { id: 3, nombre: 'Ciencias Sociales', dbNombre: 'Ciencias Sociales', iconBg: 'bg-amber-50', iconColor: 'text-amber-600', icono: '🌍' },
    { id: 4, nombre: 'Ciencias de la Naturaleza', dbNombre: 'Ciencias de la Naturaleza', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', icono: '🔬' },
    { id: 5, nombre: 'Inglés', dbNombre: 'Lenguas Extranjeras (inglés)', iconBg: 'bg-violet-50', iconColor: 'text-violet-600', icono: '💬' },
    { id: 6, nombre: 'Educación Física', dbNombre: 'Educación Física', iconBg: 'bg-orange-50', iconColor: 'text-orange-600', icono: '⚽' },
    { id: 7, nombre: 'Formación Humana', dbNombre: 'Formación Integral Humana y Religiosa', iconBg: 'bg-teal-50', iconColor: 'text-teal-600', icono: '🤝' },
    { id: 8, nombre: 'Educación Artística', dbNombre: 'Educación Artística', iconBg: 'bg-pink-50', iconColor: 'text-pink-600', icono: '🎨' },
  ]

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
        const seccionExiste = data.find(s => s.id === ultimaSeccion)

        if (seccionExiste) {
          setSeccionActiva(ultimaSeccion!)
        } else {
          setSeccionActiva(data[0].id)
          localStorage.setItem('ultimaSeccionActiva', data[0].id)
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

  const navegarConContexto = (rutaBase: string, extraParams: string = '') => {
    if (!seccionActiva) {
      alert('Por favor, selecciona o crea una sección primero.')
      return
    }
    router.push(`${rutaBase}?seccion_id=${seccionActiva}${extraParams}`)
  }

  return (
    <>
      {/* ========================================================
          ENCABEZADO INTACTO (Sin cambios según tu solicitud)
          ======================================================== */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center z-10 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Panel de Control</h1>
          <p className="text-sm text-slate-500 font-medium">Ciclo Escolar {seccionSeleccionada?.ano_escolar || 'sin definir'}</p>
        </div>

        {cargando ? (
          <p className="text-sm text-slate-500">Cargando...</p>
        ) : secciones.length > 0 && (
          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <span className="text-sm text-slate-600 font-bold hidden md:block pl-2">Sección Activa:</span>
            <select
              value={seccionActiva}
              onChange={(e) => manejarCambioSeccion(e.target.value)}
              className="bg-white border border-slate-300 text-blue-700 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 block p-2 font-bold outline-none cursor-pointer w-full sm:w-auto shadow-sm"
            >
              {secciones.map(sec => (
                <option key={sec.id} value={sec.id}>
                  {sec.grado} "{sec.identificador}" {sec.tanda ? `(${sec.tanda})` : ''} {sec.ano_escolar ? `- ${sec.ano_escolar}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      {/* ========================================================
          CONTENIDO CENTRAL: DISEÑO MINIMALISTA Y MODERNO
          ======================================================== */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-50/50">

        {secciones.length === 0 && !cargando && (
          <div className="bg-white border border-blue-100 p-8 rounded-3xl mb-10 flex flex-col md:flex-row items-center justify-between shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
            <div className="mb-4 md:mb-0 text-center md:text-left pl-4">
              <h3 className="font-bold text-2xl text-slate-800 mb-1">¡Bienvenido a ELINE!</h3>
              <p className="text-slate-500">Para empezar, configura tu primera sección escolar.</p>
            </div>
            <button onClick={() => router.push('/dashboard/secciones')} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-blue-700 hover:-translate-y-0.5 transition-all">
              Configurar Sección
            </button>
          </div>
        )}

        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Asignaturas Oficiales</h2>
            <p className="text-sm text-slate-500 mt-1">Selecciona una materia para gestionar calificaciones.</p>
          </div>
        </div>

        {/* NUEVA CUADRÍCULA DE ASIGNATURAS (Estilo Tarjetas SaaS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {asignaturas.map((materia) => (
            <div
              key={materia.id}
              onClick={() => secciones.length > 0 && navegarConContexto('/dashboard/calificaciones', `&materia=${materia.dbNombre}&titulo=${materia.nombre}`)}
              className={`group flex items-center p-5 bg-white border border-slate-200 rounded-2xl transition-all duration-300 ${secciones.length === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-slate-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1'}`}
            >
              {/* Ícono de la materia */}
              <div className={`w-14 h-14 flex items-center justify-center rounded-2xl text-2xl ${materia.iconBg} ${materia.iconColor} transition-transform duration-300 group-hover:scale-110 mr-5`}>
                {materia.icono}
              </div>

              {/* Textos */}
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-sm md:text-base leading-snug group-hover:text-blue-600 transition-colors">
                  {materia.nombre}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 font-semibold uppercase tracking-wider">
                  Matriz de Notas
                </p>
              </div>

              {/* Flecha sutil a la derecha */}
              <div className="text-slate-300 group-hover:text-blue-500 transition-colors transform group-hover:translate-x-1 duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </div>
            </div>
          ))}
        </div>

        {/* SECCIÓN DE ACCESOS RÁPIDOS REDISEÑADA */}
        <h2 className="text-lg font-bold text-slate-800 mt-14 mb-6 tracking-tight">Accesos Rápidos</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Tarjeta Carga Masiva */}
            <button
              type="button"
              onClick={() => navegarConContexto('/dashboard/calificaciones-masivas')}
              className={`group relative overflow-hidden bg-white border border-slate-200 rounded-3xl p-8 text-left transition-all duration-300 ${secciones.length === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5'}`}
            >
                <div className="flex items-center gap-6 relative z-10">
                    <div className="bg-blue-50 text-blue-600 w-16 h-16 flex items-center justify-center rounded-2xl text-3xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                      CSV
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-xl group-hover:text-blue-600 transition-colors">Carga Masiva de Notas</h3>
                        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">Importa una matriz completa por periodo para todas las asignaturas.</p>
                    </div>
                </div>
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-blue-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>
            </button>
            {/* Tarjeta Asistencia */}
            <div
              onClick={() => navegarConContexto('/dashboard/asistencia')}
              className={`group relative overflow-hidden bg-white border border-slate-200 rounded-3xl p-8 transition-all duration-300 ${secciones.length === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-900/5'}`}
            >
                <div className="flex items-center gap-6 relative z-10">
                    <div className="bg-indigo-50 text-indigo-600 w-16 h-16 flex items-center justify-center rounded-2xl text-3xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                      📅
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-xl group-hover:text-indigo-600 transition-colors">Pasar Asistencia</h3>
                        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">Registro diario oficial y control de ausencias de tu sección.</p>
                    </div>
                </div>
                {/* Decoración minimalista de fondo */}
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-indigo-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>
            </div>

            {/* Tarjeta Estudiantes */}
            <div
              onClick={() => navegarConContexto('/dashboard/estudiantes')}
              className={`group relative overflow-hidden bg-white border border-slate-200 rounded-3xl p-8 text-left transition-all duration-300 ${secciones.length === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/5'}`}
            >
                <div className="flex items-center gap-6 relative z-10">
                    <div className="bg-emerald-50 text-emerald-600 w-16 h-16 flex items-center justify-center rounded-2xl text-3xl group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                      👥
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-xl group-hover:text-emerald-600 transition-colors">Mis Estudiantes</h3>
                        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">Fichas técnicas e importación masiva desde Excel/CSV.</p>
                    </div>
                </div>
                {/* Decoración minimalista de fondo */}
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>
            </div>

        </div>
      </div>
    </>
  )
}
