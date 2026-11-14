'use client'

import { useState, useEffect } from 'react'
import { anoEscolarCerrado } from '../../../lib/ano-escolar'
import { supabase } from '../../../lib/supabase'

export default function MisSecciones() {
  const [secciones, setSecciones] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' })
  
  const [grado, setGrado] = useState('')
  const [identificador, setIdentificador] = useState('')
  const [tanda, setTanda] = useState('Matutina') // NUEVO ESTADO PARA LA TANDA
  const [anoEscolar, setAnoEscolar] = useState('')
  const [seccionEditando, setSeccionEditando] = useState<any | null>(null)
  
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
        .order('ano_escolar', { ascending: false })
        
      if (error) throw error
      setSecciones(data || [])
    } catch (error) {
      console.error('Error al cargar:', error)
    } finally {
      setCargando(false)
    }
  }

  const limpiarFormulario = () => {
    setGrado('')
    setIdentificador('')
    setTanda('Matutina')
    setAnoEscolar('')
    setSeccionEditando(null)
  }

  const editarSeccion = (seccion: any) => {
    setSeccionEditando(seccion)
    setGrado(seccion.grado || '')
    setIdentificador(seccion.identificador || '')
    setTanda(seccion.tanda || 'Matutina')
    setAnoEscolar(seccion.ano_escolar || '')
    setMensaje({ texto: '', tipo: '' })
  }

  const normalizarAnoEscolar = (valor: string) => {
    const limpio = valor.trim().replace(/\s+/g, '').replace(/[\/_.]/g, '-')
    if (!limpio) return { valor: '', error: 'El año escolar es obligatorio.' }

    const completoConGuion = limpio.match(/^(20\d{2})-(20\d{2})$/)
    if (completoConGuion) {
      const inicio = Number(completoConGuion[1])
      const fin = Number(completoConGuion[2])
      if (fin !== inicio + 1) return { valor: '', error: 'El año escolar debe ser consecutivo. Ej: 2025-2026.' }
      return { valor: `${inicio}-${fin}`, error: '' }
    }

    const completoSinGuion = limpio.match(/^(20\d{2})(20\d{2})$/)
    if (completoSinGuion) {
      const inicio = Number(completoSinGuion[1])
      const fin = Number(completoSinGuion[2])
      if (fin !== inicio + 1) return { valor: '', error: 'El año escolar debe ser consecutivo. Ej: 2025-2026.' }
      return { valor: `${inicio}-${fin}`, error: '' }
    }

    const cortoConGuion = limpio.match(/^(\d{2})-(\d{2})$/)
    if (cortoConGuion) {
      const inicio = 2000 + Number(cortoConGuion[1])
      const fin = 2000 + Number(cortoConGuion[2])
      if (fin !== inicio + 1) return { valor: '', error: 'El año escolar debe ser consecutivo. Ej: 2025-2026.' }
      return { valor: `${inicio}-${fin}`, error: '' }
    }

    const cortoSinGuion = limpio.match(/^(\d{2})(\d{2})$/)
    if (cortoSinGuion) {
      const inicio = 2000 + Number(cortoSinGuion[1])
      const fin = 2000 + Number(cortoSinGuion[2])
      if (fin !== inicio + 1) return { valor: '', error: 'El año escolar debe ser consecutivo. Ej: 2025-2026.' }
      return { valor: `${inicio}-${fin}`, error: '' }
    }

    return { valor: '', error: 'Usa el formato 20xx-20xx. Ej: 2025-2026.' }
  }

  const normalizarAnoEnFormulario = () => {
    const resultado = normalizarAnoEscolar(anoEscolar)
    if (resultado.valor) setAnoEscolar(resultado.valor)
  }

  const agregarSeccion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    setMensaje({ texto: 'Guardando...', tipo: 'info' })

    try {
      const anoNormalizado = normalizarAnoEscolar(anoEscolar)
      if (anoNormalizado.error) {
        setMensaje({ texto: anoNormalizado.error, tipo: 'error' })
        return
      }

      const gradoNormalizado = grado.trim()
      const identificadorNormalizado = identificador.trim().toUpperCase()
      const tandaNormalizada = tanda || 'Matutina'

      const existe = secciones.find(s =>
        s.id !== seccionEditando?.id &&
        s.grado === gradoNormalizado &&
        String(s.identificador || '').trim().toUpperCase() === identificadorNormalizado &&
        (s.tanda || 'Matutina') === tandaNormalizada &&
        (s.ano_escolar || '') === anoNormalizado.valor
      )
      if (existe) {
        setMensaje({ texto: 'Ya tienes registrada esta misma sección, tanda y año escolar.', tipo: 'error' })
        return
      }

      const payload = {
        grado: gradoNormalizado,
        identificador: identificadorNormalizado,
        tanda: tandaNormalizada,
        ano_escolar: anoNormalizado.valor,
      }
      const { error } = seccionEditando
        ? await supabase.from('secciones').update(payload).eq('id', seccionEditando.id).eq('user_id', userId)
        : await supabase.from('secciones').insert([{ ...payload, user_id: userId }])

      if (error) throw error

      setMensaje({ texto: seccionEditando ? 'Seccion actualizada con exito.' : 'Seccion creada con exito.', tipo: 'exito' })
      limpiarFormulario()
      cargarSecciones(userId)

      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000)
    } catch (error) {
      setMensaje({ texto: 'Error al guardar la seccion.', tipo: 'error' })
    }
  }
  const eliminarSeccion = async (id: string, nombreCompleto: string) => {
    if (!userId) return
    if (!window.confirm(`¿Estás seguro de que quieres eliminar la sección ${nombreCompleto}? Se borrarán todos sus estudiantes y notas.`)) return
    
    try {
      const { error } = await supabase.from('secciones').delete().eq('id', id).eq('user_id', userId)
      if (error) throw error
      
      // Si elimina la sección activa, la quitamos de la memoria
      if (localStorage.getItem('ultimaSeccionActiva') === id) {
        localStorage.removeItem('ultimaSeccionActiva')
      }
      
      cargarSecciones(userId)
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
              {seccionEditando ? 'Editar Seccion' : 'Nueva Seccion'}
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

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Año escolar</label>
                <input type="text" required value={anoEscolar} onChange={(e) => setAnoEscolar(e.target.value)} onBlur={normalizarAnoEnFormulario} placeholder="Ej: 2025-2026" className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-slate-700 font-medium"/>
                <p className="mt-2 text-xs font-medium text-slate-400">Acepta 20252026, 25-26 o 2526 y lo ajusta a 2025-2026.</p>
              </div>

              {mensaje.texto && (
                <div className={`p-3 rounded-xl text-sm font-semibold border ${mensaje.tipo === 'error' ? 'bg-red-50 text-red-600 border-red-200' : mensaje.tipo === 'exito' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                  {mensaje.texto}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg mt-2 flex justify-center items-center gap-2">
                  {seccionEditando ? 'Guardar Cambios' : '+ Crear Seccion'}
                </button>
                {seccionEditando && (
                  <button type="button" onClick={limpiarFormulario} className="w-full border border-slate-200 text-slate-600 font-bold py-3 rounded-xl transition-all hover:bg-slate-50">
                    Cancelar edicion
                  </button>
                )}
              </div>
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
                    <th className="p-5 font-bold">Año escolar</th>
                    <th className="p-5 font-bold text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {secciones.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-slate-400 font-medium">
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
                        <td className="p-5 text-sm font-semibold text-slate-600">{sec.ano_escolar || 'Sin definir'}{anoEscolarCerrado(sec.ano_escolar) && <span className="ml-2 text-amber-800">Inactivo</span>}</td>
                        <td className="p-5 text-center">
                          <button
                            disabled={anoEscolarCerrado(sec.ano_escolar)} onClick={() => editarSeccion(sec)}
                            className="mr-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition-all hover:bg-blue-100"
                            title="Editar seccion"
                          >
                            Editar
                          </button>
                          <button 
                            disabled={anoEscolarCerrado(sec.ano_escolar)} onClick={() => eliminarSeccion(sec.id, `${sec.grado} ${sec.identificador} (${sec.tanda || 'Matutina'})`)} 
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
              <strong className="font-black">Nota para docentes:</strong> Puedes repetir grado, sección y tanda cuando correspondan a años escolares diferentes. El año escolar se guardará siempre con formato 20xx-20xx.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
