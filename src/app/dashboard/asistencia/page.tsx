'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'

export default function RegistroAsistencia() {
  const [estudiantes, setEstudiantes] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState('')
  
  // Contexto
  const [seccionId, setSeccionId] = useState<string | null>(null)
  const [infoSeccion, setInfoSeccion] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const hoy = new Date().toISOString().split('T')[0]
  const [fecha, setFecha] = useState(hoy)
  const [registro, setRegistro] = useState<Record<string, string>>({})

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const secId = params.get('seccion_id')
    
    if (secId) {
      setSeccionId(secId)
      inicializarAsistencia(secId)
    } else {
      setCargando(false)
    }
  }, [fecha]) // Si cambia la fecha, refrescamos la lista

  const inicializarAsistencia = async (secId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setUserId(session.user.id)

      // 1. Cargar info de la sección (Grado/Sección)
      const { data: secData } = await supabase
        .from('secciones')
        .select('grado, identificador')
        .eq('id', secId)
        .single()
      if (secData) setInfoSeccion(secData)

      // 2. Cargar estudiantes de ESTA sección y maestro
      const { data: listaEstudiantes } = await supabase
        .from('estudiantes')
        .select('*')
        .eq('seccion_id', secId)
        .eq('user_id', session.user.id)
        .order('numero_orden', { ascending: true })

      if (listaEstudiantes) setEstudiantes(listaEstudiantes)

      // 3. Buscar si ya hay asistencia guardada para esta fecha y sección
      const { data: asistenciasHoy } = await supabase
        .from('asistencias')
        .select('*')
        .eq('fecha', fecha)
        .eq('seccion_id', secId)

      const mapaAsistencia: Record<string, string> = {}
      listaEstudiantes?.forEach(est => {
        const guardada = asistenciasHoy?.find(a => a.estudiante_id === est.id)
        mapaAsistencia[est.id] = guardada ? guardada.estado : 'Presente'
      })
      setRegistro(mapaAsistencia)

    } catch (error) {
      console.error(error)
    } finally {
      setCargando(false)
    }
  }

  const marcar = (id: string, estado: string) => {
    setRegistro(prev => ({ ...prev, [id]: estado }))
  }

  const guardarLista = async () => {
    if (!seccionId || !userId) return
    setMensaje('Guardando en la nube...')
    
    try {
      // Borramos lo anterior de este día/sección para evitar duplicados
      await supabase.from('asistencias')
        .delete()
        .eq('fecha', fecha)
        .eq('seccion_id', seccionId)

      const datos = estudiantes.map(est => ({
        estudiante_id: est.id,
        seccion_id: seccionId,
        user_id: userId,
        fecha: fecha,
        estado: registro[est.id]
      }))

      const { error } = await supabase.from('asistencias').insert(datos)
      if (error) throw error

      setMensaje('✅ ¡Asistencia guardada correctamente!')
      setTimeout(() => setMensaje(''), 3000)
    } catch (error) {
      setMensaje('❌ Error al guardar.')
    }
  }

  if (cargando) return <div className="p-10 text-center">Cargando lista... ⏳</div>

  if (!seccionId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold mb-4">⚠️ No has seleccionado una sección</h2>
        <Link href="/dashboard" className="bg-blue-600 text-white px-6 py-2 rounded-lg">Volver al Panel</Link>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/dashboard" className="text-blue-600 hover:underline text-sm font-medium mb-4 inline-block">
        ← Volver al Dashboard
      </Link>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pase de Lista</h1>
          <p className="text-gray-500 font-medium">
            {infoSeccion?.grado} "{infoSeccion?.identificador}" - Nivel Primario
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <input 
            type="date" 
            value={fecha} 
            onChange={(e) => setFecha(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={guardarLista} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-md">
            Guardar Todo
          </button>
        </div>
      </div>

      {mensaje && (
        <div className={`mb-6 p-3 rounded-lg text-center font-bold animate-pulse ${mensaje.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {mensaje}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="p-4 text-center w-16">No.</th>
              <th className="p-4">Estudiante</th>
              <th className="p-4 text-center">Estado (MINERD)</th>
            </tr>
          </thead>
          <tbody>
            {estudiantes.map((est) => (
              <tr key={est.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="p-4 text-center font-bold text-gray-400">{est.numero_orden}</td>
                <td className="p-4 font-semibold text-gray-700">{est.nombre_completo}</td>
                <td className="p-4">
                  <div className="flex justify-center gap-2">
                    {[
                      { l: 'P', n: 'Presente', c: 'bg-green-100 text-green-700 border-green-400' },
                      { l: 'A', n: 'Ausente', c: 'bg-red-100 text-red-700 border-red-400' },
                      { l: 'T', n: 'Tardanza', c: 'bg-orange-100 text-orange-700 border-orange-400' },
                      { l: 'E', n: 'Excusa', c: 'bg-blue-100 text-blue-700 border-blue-400' }
                    ].map((btn) => (
                      <button
                        key={btn.l}
                        onClick={() => marcar(est.id, btn.n)}
                        className={`w-10 h-10 rounded-full font-bold border-2 transition-all ${registro[est.id] === btn.n ? btn.c : 'bg-white text-gray-300 border-gray-100 hover:border-gray-300'}`}
                        title={btn.n}
                      >
                        {btn.l}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}