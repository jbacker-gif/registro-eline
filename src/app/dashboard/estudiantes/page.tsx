'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'

export default function MisEstudiantes() {
  const [estudiantes, setEstudiantes] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState('')

  const [seccionId, setSeccionId] = useState<string | null>(null)
  const [infoSeccion, setInfoSeccion] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Nuevos estados del formulario completo
  const [nuevoNumero, setNuevoNumero] = useState('')
  const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [sexo, setSexo] = useState('')
  const [nacionalidad, setNacionalidad] = useState('Dominicana')
  const [tutor, setTutor] = useState('')
  const [telefono, setTelefono] = useState('')

  useEffect(() => {
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
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setUserId(session.user.id)

      const { data: secData } = await supabase.from('secciones').select('grado, identificador').eq('id', secId).eq('user_id', session.user.id).single()
      if (secData) setInfoSeccion(secData)

      cargarEstudiantes(secId, session.user.id)
    } catch (error) {
      console.error('Error inicializando:', error)
      setCargando(false)
    }
  }

  const cargarEstudiantes = async (secId: string, maestroId: string) => {
    try {
      const { data, error } = await supabase.from('estudiantes').select('*').eq('seccion_id', secId).eq('user_id', maestroId).order('numero_orden', { ascending: true })
      if (error) throw error
      setEstudiantes(data || [])
      
      if (data && data.length > 0) {
        const ultimoNumero = Math.max(...data.map(e => e.numero_orden))
        setNuevoNumero((ultimoNumero + 1).toString())
      } else {
        setNuevoNumero('1')
      }
    } catch (error) {
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
      // Unimos nombres y apellidos para no romper los módulos de Asistencia y Notas
      const nombreCompletoGenerado = `${apellidos}, ${nombres}`

      const { error } = await supabase.from('estudiantes').insert([{ 
        numero_orden: Number(nuevoNumero),
        nombre_completo: nombreCompletoGenerado,
        nombres: nombres,
        apellidos: apellidos,
        sexo: sexo,
        nacionalidad: nacionalidad,
        nombre_tutor: tutor,
        telefono_contacto: telefono,
        seccion_id: seccionId,
        user_id: userId 
      }])

      if (error) throw error

      setMensaje('✅ ¡Estudiante registrado con éxito!')
      // Limpiar formulario
      setNombres(''); setApellidos(''); setSexo(''); setNacionalidad('Dominicana'); setTutor(''); setTelefono('');
      
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
      alert('Error al eliminar.')
    }
  }

  if (cargando) return <div className="p-10 text-center">Cargando base de datos... ⏳</div>

  if (!seccionId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md text-center border border-red-200">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Falta Contexto</h2>
          <p className="text-gray-600 mb-6">Por favor, selecciona una sección en el Panel Principal.</p>
          <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">Ir al Dashboard</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Link href="/dashboard" className="text-blue-600 hover:underline text-sm font-medium mb-4 inline-block">← Volver al Dashboard</Link>
      
      <div className="mb-8 flex justify-between items-end border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Registro de Estudiantes</h1>
          <p className="text-gray-600">Completa la ficha técnica oficial de cada alumno.</p>
        </div>
        {infoSeccion && (
          <div className="bg-blue-50 text-blue-800 border border-blue-200 px-4 py-2 rounded-lg text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">Sección Activa</p>
            <p className="text-xl font-bold">{infoSeccion.grado} "{infoSeccion.identificador}"</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Formulario Completo */}
        <div className="xl:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Ficha del Alumno</h2>
            
            <form onSubmit={agregarEstudiante} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">No. Lista</label>
                  <input type="number" required value={nuevoNumero} onChange={(e) => setNuevoNumero(e.target.value)} className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 font-bold text-center"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Sexo</label>
                  <select required value={sexo} onChange={(e) => setSexo(e.target.value)} className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">Seleccione</option>
                    <option value="M">Masculino (M)</option>
                    <option value="F">Femenino (F)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Nombres</label>
                <input type="text" required value={nombres} onChange={(e) => setNombres(e.target.value)} className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Apellidos</label>
                <input type="text" required value={apellidos} onChange={(e) => setApellidos(e.target.value)} className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Nacionalidad</label>
                <input type="text" required value={nacionalidad} onChange={(e) => setNacionalidad(e.target.value)} className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mt-4">
                <p className="text-xs font-bold text-gray-500 uppercase mb-3">Datos de Contacto</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Nombre del Padre, Madre o Tutor</label>
                    <input type="text" required value={tutor} onChange={(e) => setTutor(e.target.value)} className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm"/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Teléfono</label>
                    <input type="tel" required value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej: 809-555-5555" className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm"/>
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors mt-2 shadow-sm">
                + Guardar Ficha
              </button>
              
              {mensaje && <p className={`text-sm text-center font-bold p-2 rounded ${mensaje.includes('Error') ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>{mensaje}</p>}
            </form>
          </div>
        </div>

        {/* Tabla Extendida */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-800 text-white text-xs uppercase tracking-wider">
                  <th className="p-3 text-center w-12">No.</th>
                  <th className="p-3 w-48">Apellidos, Nombres</th>
                  <th className="p-3 text-center w-16">Sexo</th>
                  <th className="p-3 w-24">Nacionalidad</th>
                  <th className="p-3">Tutor Principal</th>
                  <th className="p-3 w-32">Teléfono</th>
                  <th className="p-3 text-center w-16">Acción</th>
                </tr>
              </thead>
              <tbody>
                {estudiantes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500 italic">No hay estudiantes en esta sección.</td>
                  </tr>
                ) : (
                  estudiantes.map((est) => (
                    <tr key={est.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors text-sm">
                      <td className="p-3 text-center text-gray-500 font-bold">{est.numero_orden}</td>
                      <td className="p-3 font-bold text-gray-800">{est.nombre_completo}</td>
                      <td className="p-3 text-center font-medium">{est.sexo || '-'}</td>
                      <td className="p-3 text-gray-600 truncate">{est.nacionalidad || '-'}</td>
                      <td className="p-3 text-gray-600 truncate">{est.nombre_tutor || '-'}</td>
                      <td className="p-3 font-medium text-gray-700">{est.telefono_contacto || '-'}</td>
                      <td className="p-3 text-center">
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