'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'

export default function MisEstudiantes() {
  const [estudiantes, setEstudiantes] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState('')

  // Contexto de seguridad y navegación
  const [seccionId, setSeccionId] = useState<string | null>(null)
  const [infoSeccion, setInfoSeccion] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Formulario
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoNumero, setNuevoNumero] = useState('')

  useEffect(() => {
    // 1. Leer la URL para saber en qué sección entramos
    const params = new URLSearchParams(window.location.search)
    const secId = params.get('seccion_id')
    
    if (secId) {
      setSeccionId(secId)
      inicializarDatos(secId)
    } else {
      setCargando(false)
    }
  }, [])

  const inicializarDatos = async (secId: string) => {
    try {
      // 2. Verificar identidad del maestro
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setUserId(session.user.id)

      // 3. Buscar el nombre de la sección para mostrarlo en pantalla
      const { data: secData } = await supabase
        .from('secciones')
        .select('grado, identificador')
        .eq('id', secId)
        .eq('user_id', session.user.id)
        .single()
      
      if (secData) setInfoSeccion(secData)

      // 4. Cargar solo los estudiantes de este maestro Y esta sección
      cargarEstudiantes(secId, session.user.id)
    } catch (error) {
      console.error('Error inicializando:', error)
      setCargando(false)
    }
  }

  const cargarEstudiantes = async (secId: string, maestroId: string) => {
    try {
      const { data, error } = await supabase
        .from('estudiantes')
        .select('*')
        .eq('seccion_id', secId)
        .eq('user_id', maestroId) // Doble seguridad
        .order('numero_orden', { ascending: true })

      if (error) throw error
      setEstudiantes(data || [])
      
      // Sugerir el siguiente número de lista para ESTA sección en específico
      if (data && data.length > 0) {
        const ultimoNumero = Math.max(...data.map(e => e.numero_orden))
        setNuevoNumero((ultimoNumero + 1).toString())
      } else {
        setNuevoNumero('1')
      }
    } catch (error) {
      console.error(error)
      setMensaje('❌ Error al cargar la lista.')
    } finally {
      setCargando(false)
    }
  }

  const agregarEstudiante = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!seccionId || !userId) return
    
    setMensaje('Guardando...')
    
    try {
      const { error } = await supabase
        .from('estudiantes')
        .insert([{ 
          nombre_completo: nuevoNombre, 
          numero_orden: Number(nuevoNumero),
          seccion_id: seccionId,
          user_id: userId // El maestro es el dueño absoluto
        }])

      if (error) throw error

      setMensaje('✅ ¡Estudiante agregado con éxito!')
      setNuevoNombre('')
      cargarEstudiantes(seccionId, userId)
      setTimeout(() => setMensaje(''), 3000)
    } catch (error) {
      console.error(error)
      setMensaje('❌ Error al guardar.')
    }
  }

  const eliminarEstudiante = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar a ${nombre}?`)) return

    try {
      const { error } = await supabase.from('estudiantes').delete().eq('id', id)
      if (error) throw error
      if (seccionId && userId) cargarEstudiantes(seccionId, userId)
    } catch (error) {
      console.error(error)
      alert('Error al eliminar.')
    }
  }

  if (cargando) return <div className="p-10 text-center">Cargando base de datos... ⏳</div>

  // Si alguien entra directamente a /estudiantes sin elegir sección en el Dashboard
  if (!seccionId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md text-center border border-red-200">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Falta Contexto</h2>
          <p className="text-gray-600 mb-6">Por favor, selecciona una sección en el Panel Principal antes de gestionar a tus estudiantes.</p>
          <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            Ir al Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Link href="/dashboard" className="text-blue-600 hover:underline text-sm font-medium mb-4 inline-block">
        ← Volver al Dashboard
      </Link>
      <div className="mb-8 flex justify-between items-end border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mis Estudiantes</h1>
          <p className="text-gray-600">Gestiona la lista de alumnos para este registro.</p>
        </div>
        {infoSeccion && (
          <div className="bg-blue-50 text-blue-800 border border-blue-200 px-4 py-2 rounded-lg text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">Sección Activa</p>
            <p className="text-xl font-bold">{infoSeccion.grado} "{infoSeccion.identificador}"</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Formulario */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Agregar Nuevo Alumno</h2>
            <form onSubmit={agregarEstudiante} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Lista</label>
                <input type="number" required value={nuevoNumero} onChange={(e) => setNuevoNumero(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input type="text" required placeholder="Ej: Pérez, Juan" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors">+ Guardar en {infoSeccion?.grado}</button>
              {mensaje && <p className={`text-sm text-center font-medium p-2 rounded ${mensaje.includes('Error') ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>{mensaje}</p>}
            </form>
          </div>
        </div>

        {/* Tabla */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-700 uppercase tracking-wider">
                  <th className="p-4 font-semibold text-center w-20">No.</th>
                  <th className="p-4 font-semibold">Nombre del Alumno</th>
                  <th className="p-4 font-semibold text-center w-24">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {estudiantes.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-500 italic">No hay estudiantes en esta sección.</td>
                  </tr>
                ) : (
                  estudiantes.map((est) => (
                    <tr key={est.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-center text-gray-600 font-medium">{est.numero_orden}</td>
                      <td className="p-4 text-gray-800">{est.nombre_completo}</td>
                      <td className="p-4 text-center">
                        <button onClick={() => eliminarEstudiante(est.id, est.nombre_completo)} className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors" title="Eliminar estudiante">🗑️</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}