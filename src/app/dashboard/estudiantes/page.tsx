'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'

export default function MisEstudiantes() {
  const [estudiantes, setEstudiantes] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' })

  const [seccionId, setSeccionId] = useState<string | null>(null)
  const [infoSeccion, setInfoSeccion] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const archivoInputRef = useRef<HTMLInputElement>(null)
  // Referencia para controlar el scroll interno de esta página
  const contenedorPrincipalRef = useRef<HTMLDivElement>(null)

  // ==========================================
  // ESTADOS DEL FORMULARIO
  // ==========================================
  const [idEditando, setIdEditando] = useState<string | null>(null)
  const [nuevoNumero, setNuevoNumero] = useState('')
  const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [sexo, setSexo] = useState('')
  const [nacionalidad, setNacionalidad] = useState('Dominicana')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
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

      const { data: secData } = await supabase.from('secciones').select('*').eq('id', secId).eq('user_id', session.user.id).single()
      if (secData) setInfoSeccion(secData)

      cargarEstudiantes(secId, session.user.id)
    } catch (error) {
      setCargando(false)
    }
  }

  const cargarEstudiantes = async (secId: string, maestroId: string) => {
    try {
      const { data, error } = await supabase.from('estudiantes').select('*').eq('seccion_id', secId).eq('user_id', maestroId).order('numero_orden', { ascending: true })
      if (error) throw error
      setEstudiantes(data || [])
      
      if (!idEditando) {
        if (data && data.length > 0) {
          const ultimoNumero = Math.max(...data.map(e => e.numero_orden))
          setNuevoNumero((ultimoNumero + 1).toString())
        } else {
          setNuevoNumero('1')
        }
      }
    } catch (error) {
      setMensaje({ texto: 'Error al cargar la lista.', tipo: 'error' })
    } finally {
      setCargando(false)
    }
  }

  // ==========================================
  // LÓGICA DE GUARDAR / ACTUALIZAR
  // ==========================================
  const guardarEstudiante = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!seccionId || !userId) return
    setMensaje({ texto: 'Guardando...', tipo: 'info' })
    
    try {
      const nombreCompletoGenerado = `${apellidos}, ${nombres}`

      const datosEstudiante = {
        numero_orden: Number(nuevoNumero),
        nombre_completo: nombreCompletoGenerado,
        nombres: nombres,
        apellidos: apellidos,
        sexo: sexo,
        nacionalidad: nacionalidad,
        fecha_nacimiento: fechaNacimiento || null,
        nombre_tutor: tutor,
        telefono_contacto: telefono,
        seccion_id: seccionId,
        user_id: userId 
      }

      if (idEditando) {
        const { error } = await supabase.from('estudiantes').update(datosEstudiante).eq('id', idEditando)
        if (error) throw error
        setMensaje({ texto: '✅ ¡Estudiante actualizado!', tipo: 'exito' })
      } else {
        const { error } = await supabase.from('estudiantes').insert([datosEstudiante])
        if (error) throw error
        setMensaje({ texto: '✅ ¡Estudiante registrado!', tipo: 'exito' })
      }

      limpiarFormulario()
      cargarEstudiantes(seccionId, userId)
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000)
    } catch (error) {
      setMensaje({ texto: '❌ Error al guardar datos.', tipo: 'error' })
    }
  }

  // ==========================================
  // PREPARAR PARA EDITAR
  // ==========================================
  const cargarParaEditar = (est: any) => {
    setIdEditando(est.id)
    setNuevoNumero(est.numero_orden.toString())
    setNombres(est.nombres || '')
    setApellidos(est.apellidos || '')
    setSexo(est.sexo || '')
    setNacionalidad(est.nacionalidad || 'Dominicana')
    setFechaNacimiento(est.fecha_nacimiento || '')
    setTutor(est.nombre_tutor || '')
    setTelefono(est.telefono_contacto || '')
    
    // Hacemos scroll suave hacia arriba en el contenedor interno
    if (contenedorPrincipalRef.current) {
      contenedorPrincipalRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const limpiarFormulario = () => {
    setIdEditando(null)
    setNombres(''); setApellidos(''); setSexo(''); setNacionalidad('Dominicana'); setFechaNacimiento(''); setTutor(''); setTelefono('');
  }

  // ==========================================
  // LECTOR DE CSV (Fechas incluidas)
  // ==========================================
  const manejarImportacionCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !seccionId || !userId) return

    setMensaje({ texto: 'Procesando archivo CSV...', tipo: 'info' })
    const reader = new FileReader()

    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string
        const lineas = text.split('\n').map(line => line.replace('\r', '').trim()).filter(line => line !== '')

        const datosAInsertar = lineas.slice(1).map(linea => {
          const valores = linea.split(/,|;/)
          
          const numero = Number(valores[0]) || 0
          const nom = valores[1]?.trim() || ''
          const ape = valores[2]?.trim() || ''
          const sex = valores[3]?.trim()?.toUpperCase() || ''
          const nac = valores[4]?.trim() || 'Dominicana'
          
          const dia = valores[5]?.trim().padStart(2, '0')
          const mes = valores[6]?.trim().padStart(2, '0')
          const ano = valores[7]?.trim()
          
          let fechaSQL = null
          if (dia && mes && ano) {
            fechaSQL = `${ano}-${mes}-${dia}`
          }

          return {
            numero_orden: numero,
            nombres: nom,
            apellidos: ape,
            nombre_completo: `${ape}, ${nom}`,
            sexo: sex,
            nacionalidad: nac,
            fecha_nacimiento: fechaSQL,
            seccion_id: seccionId,
            user_id: userId,
            estado: 'Activo' // Por defecto activos al importar
          }
        }).filter(est => est.nombres !== '') 

        if (datosAInsertar.length === 0) {
          setMensaje({ texto: '⚠️ El archivo está vacío o tiene un formato incorrecto.', tipo: 'error' })
          return
        }

        const { error } = await supabase.from('estudiantes').insert(datosAInsertar)
        if (error) throw error

        setMensaje({ texto: `✅ ¡${datosAInsertar.length} estudiantes importados!`, tipo: 'exito' })
        cargarEstudiantes(seccionId, userId)
        if (archivoInputRef.current) archivoInputRef.current.value = ''
        setTimeout(() => setMensaje({ texto: '', tipo: '' }), 4000)

      } catch (error) {
        setMensaje({ texto: '❌ Error al leer el CSV. Revisa el orden de las columnas.', tipo: 'error' })
      }
    }
    reader.readAsText(file, 'UTF-8')
  }

  // ==========================================
  // ACCIONES: RETIRAR Y ELIMINAR
  // ==========================================
  const cambiarEstadoEstudiante = async (id: string, nombre: string, estadoActual: string) => {
    const nuevoEstado = estadoActual === 'Activo' ? 'Retirado' : 'Activo'
    if (!window.confirm(`¿Seguro que quieres marcar a ${nombre} como ${nuevoEstado}?`)) return
    
    setMensaje({ texto: 'Actualizando estado...', tipo: 'info' })
    try {
      const { error } = await supabase.from('estudiantes').update({ estado: nuevoEstado }).eq('id', id)
      if (error) throw error
      
      setMensaje({ texto: `✅ Estudiante marcado como ${nuevoEstado}`, tipo: 'exito' })
      if (seccionId && userId) cargarEstudiantes(seccionId, userId)
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000)
    } catch (error) {
      setMensaje({ texto: '❌ Error al cambiar el estado.', tipo: 'error' })
    }
  }

  const eliminarEstudiante = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Seguro que quieres eliminar definitivamente a ${nombre}?`)) return
    try {
      const { error } = await supabase.from('estudiantes').delete().eq('id', id)
      if (error) throw error
      if (seccionId && userId) cargarEstudiantes(seccionId, userId)
      if (idEditando === id) limpiarFormulario()
    } catch (error) {
      alert('Error al eliminar.')
    }
  }

  if (cargando) return <div className="p-10 text-center text-slate-500 font-medium w-full">Cargando base de datos... ⏳</div>
  if (!seccionId) return <div className="p-10 text-center text-slate-500 font-bold w-full">Por favor selecciona una sección en el Panel de Control.</div>

  return (
    <div ref={contenedorPrincipalRef} className="h-full w-full overflow-y-auto bg-slate-50/50">
      <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
        
        {/* ENCABEZADO Y BOTÓN IMPORTAR */}
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Registro de Estudiantes</h1>
            <p className="text-sm text-slate-500 mt-1">
              {infoSeccion ? `Sección Activa: ${infoSeccion.grado} "${infoSeccion.identificador}" ${infoSeccion.tanda ? `(${infoSeccion.tanda})` : ''}` : 'Ficha oficial del alumno.'}
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input type="file" accept=".csv" ref={archivoInputRef} onChange={manejarImportacionCSV} className="hidden" />
            <button 
              onClick={() => archivoInputRef.current?.click()} 
              className="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 hover:text-emerald-600 hover:border-emerald-300 px-5 py-2.5 rounded-xl font-bold transition-all flex justify-center items-center gap-2 shadow-sm text-sm"
            >
              <span className="text-emerald-500 text-lg">📄</span> Importar CSV
            </button>
          </div>
        </div>

        {mensaje.texto && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-semibold border shadow-sm ${mensaje.tipo === 'error' ? 'bg-red-50 text-red-700 border-red-200' : mensaje.tipo === 'exito' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
            {mensaje.texto}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
          
          {/* ========================================================
              FORMULARIO (min-w-0 evita que empuje la cuadrícula)
              ======================================================== */}
          <div className="xl:col-span-4 min-w-0">
            <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-slate-200 xl:sticky xl:top-6">
              
              <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  {idEditando ? <><span className="text-amber-500">✏️</span> Editando Alumno</> : <><span className="text-blue-500">👤</span> Nuevo Alumno</>}
                </h2>
                {idEditando && (
                  <button onClick={limpiarFormulario} className="text-xs font-bold text-slate-400 hover:text-slate-700 px-2 py-1 bg-slate-50 rounded-lg transition-colors">
                    Cancelar
                  </button>
                )}
              </div>
              
              <form onSubmit={guardarEstudiante} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">No. Lista</label>
                    <input type="number" required value={nuevoNumero} onChange={(e) => setNuevoNumero(e.target.value)} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-center font-black text-slate-700"/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sexo</label>
                    <select required value={sexo} onChange={(e) => setSexo(e.target.value)} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-medium text-slate-700">
                      <option value="">Seleccione</option>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombres</label>
                  <input type="text" required value={nombres} onChange={(e) => setNombres(e.target.value)} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-medium text-slate-700"/>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Apellidos</label>
                  <input type="text" required value={apellidos} onChange={(e) => setApellidos(e.target.value)} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-medium text-slate-700"/>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-truncate">F. Nacimiento</label>
                    <input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm font-medium text-slate-700"/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-truncate">Nacionalidad</label>
                    <input type="text" required value={nacionalidad} onChange={(e) => setNacionalidad(e.target.value)} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm font-medium text-slate-700"/>
                  </div>
                </div>

                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 mt-6">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Tutor y Contacto</p>
                  <div className="space-y-3">
                    <input type="text" value={tutor} onChange={(e) => setTutor(e.target.value)} placeholder="Nombre del Padre/Tutor" className="w-full border border-slate-200 bg-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors text-slate-700"/>
                    <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Teléfono (Ej: 809-555-0000)" className="w-full border border-slate-200 bg-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors text-slate-700"/>
                  </div>
                </div>

                <button type="submit" className={`w-full text-white font-bold py-4 rounded-xl transition-all shadow-md mt-4 flex justify-center items-center gap-2 ${idEditando ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                  {idEditando ? '💾 Actualizar Alumno' : '+ Guardar Alumno'}
                </button>
              </form>
            </div>
          </div>

          {/* ========================================================
              TABLA (min-w-0 permite overflow-x-auto)
              ======================================================== */}
          <div className="xl:col-span-8 min-w-0">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden w-full">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-400 text-[11px] uppercase tracking-widest">
                      <th className="p-4 font-bold text-center w-12">No.</th>
                      <th className="p-4 font-bold">Apellidos, Nombres</th>
                      <th className="p-4 font-bold text-center">Sexo</th>
                      <th className="p-4 font-bold">Nacimiento</th>
                      <th className="p-4 font-bold text-center">Estado</th>
                      <th className="p-4 font-bold text-center w-[120px]">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {estudiantes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-slate-400 font-medium">
                          No hay estudiantes registrados.<br/>
                          <span className="text-sm font-normal">Agrega uno o importa tu archivo CSV.</span>
                        </td>
                      </tr>
                    ) : (
                      estudiantes.map((est) => (
                        <tr key={est.id} className="hover:bg-slate-50/80 transition-colors text-sm group">
                          <td className="p-4 text-center font-bold text-slate-400">{est.numero_orden}</td>
                          <td className="p-4 font-bold text-slate-800 flex flex-col">
                            {est.nombre_completo}
                            <span className="text-[10px] text-slate-400 font-normal uppercase mt-0.5 truncate max-w-[200px]">Tutor: {est.nombre_tutor || 'No registrado'}</span>
                          </td>
                          <td className="p-4 text-center">
                            {est.sexo === 'M' ? (
                              <span className="inline-flex w-7 h-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold border border-blue-100" title="Masculino">M</span>
                            ) : est.sexo === 'F' ? (
                              <span className="inline-flex w-7 h-7 items-center justify-center rounded-lg bg-pink-50 text-pink-600 font-bold border border-pink-100" title="Femenino">F</span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="text-slate-700 font-medium">{est.fecha_nacimiento ? new Date(est.fecha_nacimiento).toLocaleDateString('es-DO', {timeZone: 'UTC'}) : '-'}</span>
                              <span className="text-[10px] text-slate-400 uppercase">{est.nacionalidad}</span>
                            </div>
                          </td>
                          
                          {/* COLUMNA DE ESTADO */}
                          <td className="p-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                              est.estado === 'Retirado' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            }`}>
                              {est.estado || 'Activo'}
                            </span>
                          </td>

                          {/* COLUMNA DE ACCIONES */}
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              
                              {/* EDITAR */}
                              <button onClick={() => cargarParaEditar(est)} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Editar">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                              
                              {/* RETIRAR / REACTIVAR */}
                              <button 
                                onClick={() => cambiarEstadoEstudiante(est.id, est.nombre_completo, est.estado || 'Activo')} 
                                className={`p-2 rounded-lg transition-colors ${est.estado === 'Retirado' ? 'text-emerald-500 hover:bg-emerald-50' : 'text-orange-400 hover:text-orange-600 hover:bg-orange-50'}`} 
                                title={est.estado === 'Retirado' ? 'Reactivar Alumno' : 'Retirar Alumno'}
                              >
                                {est.estado === 'Retirado' ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                )}
                              </button>

                              {/* ELIMINAR */}
                              <button onClick={() => eliminarEstudiante(est.id, est.nombre_completo)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
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
      </div>
    </div>
  )
}