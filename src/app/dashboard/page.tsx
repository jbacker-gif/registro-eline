'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function Dashboard() {
  const router = useRouter()
  
  const [secciones, setSecciones] = useState<any[]>([])
  const [seccionActiva, setSeccionActiva] = useState('')
  const [cargando, setCargando] = useState(true)

  const asignaturas = [
    { id: 1, nombre: 'Lengua Española', dbNombre: 'Lengua Española', color: 'bg-blue-100 text-blue-800 border-blue-200', icono: '📚' },
    { id: 2, nombre: 'Matemática', dbNombre: 'Matemática', color: 'bg-red-100 text-red-800 border-red-200', icono: '➕' },
    { id: 3, nombre: 'Ciencias Sociales', dbNombre: 'Ciencias Sociales', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icono: '🌍' },
    { id: 4, nombre: 'Ciencias de la Naturaleza', dbNombre: 'Ciencias de la Naturaleza', color: 'bg-green-100 text-green-800 border-green-200', icono: '🔬' },
    { id: 5, nombre: 'Inglés', dbNombre: 'Lenguas Extranjeras (inglés)', color: 'bg-purple-100 text-purple-800 border-purple-200', icono: '🔠' },
    { id: 6, nombre: 'Educación Física', dbNombre: 'Educación Física', color: 'bg-orange-100 text-orange-800 border-orange-200', icono: '🏃' },
    { id: 7, nombre: 'Formación Humana', dbNombre: 'Formación Integral Humana y Religiosa', color: 'bg-teal-100 text-teal-800 border-teal-200', icono: '🤝' },
    { id: 8, nombre: 'Educación Artística', dbNombre: 'Educación Artística', color: 'bg-pink-100 text-pink-800 border-pink-200', icono: '🎨' },
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

      if (error) throw error
      
      setSecciones(data || [])
      
      if (data && data.length > 0) {
        // LA MAGIA DE LA MEMORIA: Buscamos si había una sección guardada
        const ultimaSeccion = localStorage.getItem('ultimaSeccionActiva')
        
        // Verificamos que la sección guardada aún exista en la lista del maestro
        const seccionExiste = data.find(s => s.id === ultimaSeccion)

        if (seccionExiste) {
          setSeccionActiva(ultimaSeccion!) // Restauramos la memoria
        } else {
          setSeccionActiva(data[0].id) // Si no hay memoria, elegimos la primera
          localStorage.setItem('ultimaSeccionActiva', data[0].id)
        }
      }
    } catch (error) {
      console.error(error)
    } finally {
      setCargando(false)
    }
  }

  // Nueva función para guardar la selección en la memoria del navegador
  const manejarCambioSeccion = (nuevoId: string) => {
    setSeccionActiva(nuevoId)
    localStorage.setItem('ultimaSeccionActiva', nuevoId)
  }

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('ultimaSeccionActiva') // Limpiamos la memoria al salir
    router.push('/')
  }

  const navegarConContexto = (rutaBase: string, extraParams: string = '') => {
    if (!seccionActiva) {
      alert('Por favor, selecciona o crea una sección primero.')
      return
    }
    router.push(`${rutaBase}?seccion_id=${seccionActiva}${extraParams}`)
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      <aside className="w-64 bg-gray-900 text-white flex flex-col shadow-xl hidden md:flex">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white tracking-tight">Registro<span className="text-blue-500">App</span></h2>
          <p className="text-xs text-gray-400 mt-1">Gestión Escolar Inteligente</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <p className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Principal</p>
          <button className="w-full flex items-center gap-3 px-3 py-2 bg-blue-600 text-white rounded-lg transition-colors">
            🏠 <span>Inicio (Materias)</span>
          </button>
          <button onClick={() => navegarConContexto('/dashboard/asistencia')} className="w-full flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors">
            📅 <span>Pasar Asistencia</span>
          </button>
          <button onClick={() => navegarConContexto('/dashboard/boletines')} className="w-full flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors">
            📊 <span>Boletines Finales</span>
          </button>

          <p className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-2">Administración</p>
          <button onClick={() => navegarConContexto('/dashboard/estudiantes')} className="w-full flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors">
            👥 <span>Mis Estudiantes</span>
          </button>
          <button onClick={() => router.push('/dashboard/secciones')} className="w-full flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors">
            📚 <span>Secciones / Grados</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button onClick={cerrarSesion} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium">
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4 flex justify-between items-center z-10">
          <div>
            <h1 className="text-xl font-bold text-gray-800 mb-1">Panel de Control</h1>
            {cargando ? (
              <p className="text-sm text-gray-500">Cargando contexto...</p>
            ) : secciones.length === 0 ? (
              <p className="text-sm text-red-500 font-medium">No tienes secciones registradas.</p>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Trabajando con:</span>
                <select 
                  value={seccionActiva} 
                  onChange={(e) => manejarCambioSeccion(e.target.value)}
                  className="bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-1.5 font-bold outline-none cursor-pointer"
                >
                  {secciones.map(sec => (
                    <option key={sec.id} value={sec.id}>
                      {sec.grado} "{sec.identificador}"
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm font-semibold border border-gray-200 hidden sm:block">
            Nivel Primario | 2025-2026
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {secciones.length === 0 && !cargando && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-xl mb-8 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">¡Bienvenido a RegistroApp!</h3>
                <p>Para empezar a trabajar, primero necesitas crear tu grado y sección (Ej. 1ro A).</p>
              </div>
              <button onClick={() => router.push('/dashboard/secciones')} className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Crear mi primera Sección
              </button>
            </div>
          )}

          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Calificaciones por Asignatura</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {asignaturas.map((materia) => (
              <div 
                key={materia.id} 
                className={`border rounded-xl p-6 transition-all hover:shadow-lg hover:-translate-y-1 flex flex-col items-center justify-center text-center h-40 ${secciones.length === 0 ? 'opacity-50 cursor-not-allowed bg-gray-100' : `${materia.color} cursor-pointer`}`}
                onClick={() => secciones.length > 0 && navegarConContexto('/dashboard/calificaciones', `&materia=${materia.dbNombre}&titulo=${materia.nombre}`)}
              >
                <div className="bg-white/40 p-3 rounded-full mb-3 shadow-sm text-3xl">
                  {materia.icono}
                </div>
                <h3 className="font-bold text-lg leading-tight">{materia.nombre}</h3>
              </div>
            ))}
          </div>

          <h2 className="text-xl font-semibold text-gray-800 mt-12 mb-4">Accesos Rápidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div onClick={() => navegarConContexto('/dashboard/asistencia')} className={`bg-white border border-gray-200 rounded-xl p-6 transition-all flex items-center space-x-4 ${secciones.length === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}`}>
                  <div className="bg-indigo-100 p-4 rounded-full text-xl">📅</div>
                  <div>
                      <h3 className="font-bold text-gray-800">Pasar Asistencia</h3>
                      <p className="text-sm text-gray-500">Ir directo a la lista de estudiantes</p>
                  </div>
              </div>
              <div onClick={() => navegarConContexto('/dashboard/estudiantes')} className={`bg-white border border-gray-200 rounded-xl p-6 transition-all flex items-center space-x-4 ${secciones.length === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}`}>
                  <div className="bg-emerald-100 p-4 rounded-full text-xl">👥</div>
                  <div>
                      <h3 className="font-bold text-gray-800">Mis Estudiantes</h3>
                      <p className="text-sm text-gray-500">Gestionar la lista de alumnos</p>
                  </div>
              </div>
          </div>
        </div>
      </main>
    </div>
  )
}