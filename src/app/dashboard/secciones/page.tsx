'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

export default function MisSecciones() {
  const [secciones, setSecciones] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' })
  
  const [grado, setGrado] = useState('')
  const [identificador, setIdentificador] = useState('')
  const [tanda, setTanda] = useState('Matutina') // NUEVO ESTADO PARA LA TANDA
  
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    obtenerSesion()
  }, [])

  const obtenerSesion = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      setUserId(session.user.id)
      cargarSecciones(session.user.id)
    } else {
      setCargando(false)
    }
  }

  const cargarSecciones = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('secciones')
        .select('*')
        .eq('user_id', id)
        .order('grado', { ascending: true })
        .order('identificador', { ascending: true })
        
      if (error) throw error
      setSecciones(data || [])
    } catch (error) {
      console.error('Error al cargar:', error)
    } finally {
      setCargando(false)
    }
  }

  const agregarSeccion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    
    setMensaje({ texto: 'Guardando...', tipo: 'info' })
    
    try {
      // Verificamos si ya existe una sección exactamente igual (Grado + Letra + Tanda)
      const existe = secciones.find(s => s.grado === grado && s.identificador === identificador && s.tanda === tanda)
      if (existe) {
        setMensaje({ texto: '⚠️ Ya tienes registrada esta sección en esta misma tanda.', tipo: 'error' })
        return
      }

      const { error } = await supabase.from('secciones').insert([
        { grado, identificador, tanda, user_id: userId }
      ])

      if (error) throw error

      setMensaje({ texto: '✅ ¡Sección creada con éxito!', tipo: 'exito' })
      setGrado('')
      setIdentificador('')
      setTanda('Matutina')
      cargarSecciones(userId)
      
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000)
    } catch (error) {
      setMensaje({ texto: '❌ Error al crear la sección.', tipo: 'error' })
    }
  }

  const eliminarSeccion = async (id: string, nombreCompleto: string) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar la sección ${nombreCompleto}? Se borrarán todos sus estudiantes y notas.`)) return
    
    try {
      const { error } = await supabase.from('secciones').delete().eq('id', id)
      if (error) throw error
      
      // Si elimina la sección activa, la quitamos de la memoria
      if (localStorage.getItem('ultimaSeccionActiva') === id) {
        localStorage.removeItem('ultimaSeccionActiva')
      }
      
      if (userId) cargarSecciones(userId)
    } catch (error) {
      alert('Error al eliminar la sección.')
    }
  }

  if (cargando) return <div className="p-10 text-center text-slate-500 font-medium">Cargando tus secciones... ⏳</div>

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto bg-slate-50/50 min-h-full">
      
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Mis Secciones Escolar</h1>
        <p className="text-sm text-slate-500 mt-1">Administra los grados, aulas y tandas donde impartes docencia.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ========================================================
            FORMULARIO MINIMALISTA
            ======================================================== */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 sticky top-6">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="bg-blue-50 text-blue-600 p-2 rounded-lg text-xl leading-none">📚</span>
              Nueva Sección
            </h2>
            
            <form onSubmit={agregarSeccion} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Grado</label>
                <select required value={grado} onChange={(e) => setGrado(e.target.value)} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-slate-700 font-medium">
                  <option value="">Seleccione un grado</option>
                  <option value="1ro">1ro de Primaria</option>
                  <option value="2do">2do de Primaria</option>
                  <option value="3ro">3ro de Primaria</option>
                  <option value="4to">4to de Primaria</option>
                  <option value="5to">5to de Primaria</option>
                  <option value="6to">6to de Primaria</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sección (Letra)</label>
                <input type="text" required maxLength={2} value={identificador} onChange={(e) => setIdentificador(e.target.value.toUpperCase())} placeholder="Ej: A, B, C..." className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-slate-700 font-medium uppercase"/>
              </div>

              {/* EL NUEVO CAMPO DE TANDA */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tanda</label>
                <select required value={tanda} onChange={(e) => setTanda(e.target.value)} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-slate-700 font-medium">
                  <option value="Matutina">Matutina (Mañana)</option>
                  <option value="Vespertina">Vespertina (Tarde)</option>
                  <option value="Jornada Extendida">Jornada Extendida</option>
                  <option value="Nocturna">Nocturna (Noche)</option>
                </select>
              </div>

              {mensaje.texto && (
                <div className={`p-3 rounded-xl text-sm font-semibold border ${mensaje.tipo === 'error' ? 'bg-red-50 text-red-600 border-red-200' : mensaje.tipo === 'exito' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                  {mensaje.texto}
                </div>
              )}

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg mt-2 flex justify-center items-center gap-2">
                + Crear Sección
              </button>
            </form>
          </div>
        </div>

        {/* ========================================================
            TABLA DE SECCIONES (Estilo Clean UI)
            ======================================================== */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="p-5 font-bold">Grado</th>
                    <th className="p-5 font-bold text-center">Sección</th>
                    <th className="p-5 font-bold">Tanda</th>
                    <th className="p-5 font-bold text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {secciones.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-10 text-center text-slate-400 font-medium">
                        No has creado ninguna sección todavía.<br/>
                        <span className="text-sm font-normal">Usa el formulario para empezar.</span>
                      </td>
                    </tr>
                  ) : (
                    secciones.map((sec) => (
                      <tr key={sec.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="p-5 font-bold text-slate-800">{sec.grado}</td>
                        <td className="p-5 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-black text-sm border border-indigo-100">
                            {sec.identificador}
                          </span>
                        </td>
                        <td className="p-5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${
                            sec.tanda === 'Matutina' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            sec.tanda === 'Vespertina' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            sec.tanda === 'Jornada Extendida' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {sec.tanda || 'Matutina'}
                          </span>
                        </td>
                        <td className="p-5 text-center">
                          <button 
                            onClick={() => eliminarSeccion(sec.id, `${sec.grado} ${sec.identificador} (${sec.tanda || 'Matutina'})`)} 
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Eliminar Sección"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-6 bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-4">
            <span className="text-xl">💡</span>
            <p className="text-sm text-blue-800 font-medium">
              <strong className="font-black">Nota para docentes:</strong> Ahora puedes tener múltiples secciones con la misma letra (ej. "5to A") siempre y cuando pertenezcan a tandas diferentes. Al crearla, asegúrate de seleccionarla en el Panel de Control para añadirle estudiantes.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}