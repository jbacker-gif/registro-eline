'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { getCsvValue, readCsvFile } from '../../../lib/csv'
import { esSeccionPrimaria, etiquetaSeccion } from '../../../lib/registroEscolar'

export default function Asistencia() {
  const [estudiantes, setEstudiantes] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' })
  const [seccionId, setSeccionId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [infoSeccion, setInfoSeccion] = useState<any>(null)

  const fechaActual = new Date()
  const [mesActual, setMesActual] = useState(fechaActual.getMonth())
  const [anioActual, setAnioActual] = useState(fechaActual.getFullYear())
  const [asistencia, setAsistencia] = useState<Record<string, string>>({})
  const [diasBloqueados, setDiasBloqueados] = useState<string[]>([])
  const [hayCambiosPendientes, setHayCambiosPendientes] = useState(false)
  const [ultimoGuardado, setUltimoGuardado] = useState<string | null>(null)

  const contenedorPrincipalRef = useRef<HTMLDivElement>(null)
  const archivoCsvRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const secId = params.get('seccion_id')
    if (secId) {
      setSeccionId(secId)
      inicializarDatos(secId)
    } else { setCargando(false) }
  }, [mesActual, anioActual])

  const obtenerFechaISO = (dia: number, mes: number, anio: number) => {
    return `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
  }

  const normalizarFechaCSV = (valor: string) => {
    const fecha = valor.trim()
    const iso = fecha.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
    if (iso) {
      const [, anio, mes, dia] = iso
      return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
    }

    const fechaLocal = fecha.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/)
    if (fechaLocal) {
      const [, dia, mes, anio] = fechaLocal
      return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
    }

    return ''
  }

  const inicializarDatos = async (secId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setUserId(session.user.id)
      const { data: secData } = await supabase.from('secciones').select('*').eq('id', secId).eq('user_id', session.user.id).single()
      if (!secData) {
        setMensaje({ texto: 'No tienes permisos para acceder a esta sección.', tipo: 'error' })
        return
      }
      if (!esSeccionPrimaria(secData)) {
        setMensaje({ texto: 'Esta pantalla es solo para asistencia de Primaria. Usa el modulo de Secundaria para esa seccion.', tipo: 'error' })
        return
      }
      setInfoSeccion(secData)

      const { data: listaEst } = await supabase.from('estudiantes').select('*').eq('seccion_id', secId).eq('user_id', session.user.id).order('numero_orden', { ascending: true })
      setEstudiantes(listaEst || [])

      const fechaInicio = `${anioActual}-${String(mesActual + 1).padStart(2, '0')}-01`
      const ultimoDia = new Date(anioActual, mesActual + 1, 0).getDate()
      const fechaFin = `${anioActual}-${String(mesActual + 1).padStart(2, '0')}-${ultimoDia}`

      // 1. Cargar Asistencias
      const { data: asistBD } = await supabase.from('asistencia').select('*').eq('seccion_id', secId).eq('user_id', session.user.id).gte('fecha', fechaInicio).lte('fecha', fechaFin)
      const mapaAsistencia: Record<string, string> = {}
      asistBD?.forEach(reg => { mapaAsistencia[`${reg.estudiante_id}_${reg.fecha}`] = reg.estado })
      setAsistencia(mapaAsistencia)

      // 2. Cargar Días Bloqueados de la BD
      const { data: diasBD } = await supabase.from('dias_bloqueados').select('fecha').eq('seccion_id', secId).gte('fecha', fechaInicio).lte('fecha', fechaFin)
      const bloqueadosBD = diasBD?.map(d => d.fecha) || []

      // 3. MAGIA: Identificar fines de semana del mes actual
      const finesDeSemana: string[] = []
      for (let d = 1; d <= ultimoDia; d++) {
        const fechaD = new Date(anioActual, mesActual, d)
        if (fechaD.getDay() === 0 || fechaD.getDay() === 6) { // 0 = Domingo, 6 = Sábado
          finesDeSemana.push(obtenerFechaISO(d, mesActual, anioActual))
        }
      }

      // Combinamos ambos (BD + Fines de semana) sin duplicar
      const todosBloqueados = Array.from(new Set([...bloqueadosBD, ...finesDeSemana]))
      setDiasBloqueados(todosBloqueados)

    } catch (error) { console.error(error) } finally { setCargando(false) }
  }

  const diasDelMes = new Date(anioActual, mesActual + 1, 0).getDate()
  const arrayDias = Array.from({ length: diasDelMes }, (_, i) => i + 1)
  const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const inicialesDias = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
  const anosDisponibles = Array.from({ length: 7 }, (_, i) => fechaActual.getFullYear() - 3 + i)

  const cambiarMes = (direccion: number) => {
    let nuevoMes = mesActual + direccion
    let nuevoAnio = anioActual
    if (nuevoMes > 11) { nuevoMes = 0; nuevoAnio++ }
    if (nuevoMes < 0) { nuevoMes = 11; nuevoAnio-- }
    setMesActual(nuevoMes)
    setAnioActual(nuevoAnio)
    setCargando(true)
  }

  const cambiarPeriodo = (nuevoMes: number, nuevoAnio: number) => {
    setMesActual(nuevoMes)
    setAnioActual(nuevoAnio)
    setCargando(true)
  }

  const irAlMesActual = () => {
    cambiarPeriodo(fechaActual.getMonth(), fechaActual.getFullYear())
  }

  const alternarAsistencia = (estudianteId: string, dia: number) => {
    const fecha = obtenerFechaISO(dia, mesActual, anioActual)
    if (diasBloqueados.includes(fecha)) return
    const clave = `${estudianteId}_${fecha}`
    const estadoActual = asistencia[clave]
    let nuevoEstado = ''
    if (!estadoActual) nuevoEstado = 'P'
    else if (estadoActual === 'P') nuevoEstado = 'A'
    else if (estadoActual === 'A') nuevoEstado = 'E'
    else if (estadoActual === 'E') nuevoEstado = 'T'
    else if (estadoActual === 'T') nuevoEstado = ''

    setAsistencia(prev => {
      const copia = { ...prev }
      if (nuevoEstado === '') delete copia[clave]
      else copia[clave] = nuevoEstado
      return copia
    })
    setHayCambiosPendientes(true)
  }

  const alternarDiaBloqueado = (dia: number) => {
    const fecha = obtenerFechaISO(dia, mesActual, anioActual)
    setDiasBloqueados(prev => prev.includes(fecha) ? prev.filter(d => d !== fecha) : [...prev, fecha])
    setHayCambiosPendientes(true)
  }

  const totalDiasLaborables = arrayDias.length - diasBloqueados.length

  const calcularResumenEstudiante = (id: string) => {
    let p = 0, a = 0, e = 0, t = 0
    arrayDias.forEach(dia => {
      const estado = asistencia[`${id}_${obtenerFechaISO(dia, mesActual, anioActual)}`]
      if (estado === 'P') p++
      else if (estado === 'A') a++
      else if (estado === 'E') e++
      else if (estado === 'T') t++
    })
    return { p, a, e, t }
  }

  const contarPresentesDia = (dia: number) => {
    const fecha = obtenerFechaISO(dia, mesActual, anioActual)
    return estudiantes.filter(est => est.estado !== 'Retirado' && asistencia[`${est.id}_${fecha}`] === 'P').length
  }

  const guardarRegistro = async () => {
    if (!seccionId || !userId) return
    if (!window.confirm(`¿Confirmas guardar la asistencia de ${nombresMeses[mesActual]} ${anioActual}?`)) {
      return
    }
    setMensaje({ texto: 'Guardando registro...', tipo: 'info' })
    try {
      const fechaInicio = `${anioActual}-${String(mesActual + 1).padStart(2, '0')}-01`
      const fechaFin = `${anioActual}-${String(mesActual + 1).padStart(2, '0')}-${diasDelMes}`

      await supabase.from('asistencia').delete().eq('seccion_id', seccionId).eq('user_id', userId).gte('fecha', fechaInicio).lte('fecha', fechaFin)
      await supabase.from('dias_bloqueados').delete().eq('seccion_id', seccionId).gte('fecha', fechaInicio).lte('fecha', fechaFin)

      const nuevosRegistros: any[] = []
      estudiantes.forEach(est => {
        if (est.estado === 'Retirado') return
        arrayDias.forEach(dia => {
          const fecha = obtenerFechaISO(dia, mesActual, anioActual)
          const estado = asistencia[`${est.id}_${fecha}`]
          if (estado && !diasBloqueados.includes(fecha)) {
            nuevosRegistros.push({ estudiante_id: est.id, seccion_id: seccionId, user_id: userId, fecha, estado })
          }
        })
      })

      const registrosBloqueados = diasBloqueados.map(fecha => ({ seccion_id: seccionId, fecha }))
      if (nuevosRegistros.length > 0) await supabase.from('asistencia').insert(nuevosRegistros)
      if (registrosBloqueados.length > 0) await supabase.from('dias_bloqueados').insert(registrosBloqueados)

      setMensaje({ texto: '✅ Asistencia guardada correctamente.', tipo: 'exito' })
      setHayCambiosPendientes(false)
      setUltimoGuardado(new Date().toLocaleString('es-DO', { dateStyle: 'medium', timeStyle: 'short' }))
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000)
    } catch (error) { setMensaje({ texto: 'Error al guardar.', tipo: 'error' }) }
  }

  const obtenerColorCelda = (estado: string) => {
    if (estado === 'P') return 'bg-emerald-100 text-emerald-700 border-emerald-300'
    if (estado === 'A') return 'bg-red-100 text-red-700 border-red-300'
    if (estado === 'E') return 'bg-amber-100 text-amber-700 border-amber-300'
    if (estado === 'T') return 'bg-orange-100 text-orange-700 border-orange-300'
    return 'bg-white text-transparent border-slate-100'
  }

  const importarAsistenciaCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const filas = await readCsvFile(file)
      const estudiantesPorNumero = new Map(estudiantes.map(est => [Number(est.numero_orden), est]))
      const nuevosRegistros: Record<string, string> = {}
      let aplicadas = 0
      let sinEstudiante = 0
      let fechaInvalida = 0
      let otroMes = 0
      let estadoInvalido = 0
      let diaBloqueado = 0
      let celdasVacias = 0

      filas.forEach(row => {
        const fecha = normalizarFechaCSV(getCsvValue(row, ['fecha', 'dia']))
        const fechaDato = new Date(`${fecha}T00:00:00`)

        if (Number.isNaN(fechaDato.getTime())) {
          fechaInvalida++
          return
        }

        if (fechaDato.getMonth() !== mesActual || fechaDato.getFullYear() !== anioActual) {
          otroMes++
          return
        }

        if (diasBloqueados.includes(fecha)) {
          diaBloqueado++
          return
        }

        Object.entries(row).forEach(([columna, valor]) => {
          if (columna === 'fecha' || columna === 'dia') return

          const estado = valor.trim().toUpperCase()
          if (!estado) {
            celdasVacias++
            return
          }

          const numeroOrden = Number(columna)
          const estudiante = estudiantesPorNumero.get(numeroOrden)

          if (!estudiante) {
            sinEstudiante++
            return
          }

          if (!['P', 'A', 'E', 'T'].includes(estado)) {
            estadoInvalido++
            return
          }

          nuevosRegistros[`${estudiante.id}_${fecha}`] = estado
          aplicadas++
        })
      })

      if (aplicadas > 0) {
        setAsistencia(prev => ({ ...prev, ...nuevosRegistros }))
        setHayCambiosPendientes(true)
      }

      setMensaje({
        texto: `CSV matricial cargado: ${aplicadas} registros aplicados. Celdas vacías ignoradas: ${celdasVacias}. Sin estudiante: ${sinEstudiante}. Fecha inválida: ${fechaInvalida}. Otro mes: ${otroMes}. Estado inválido: ${estadoInvalido}. Día bloqueado/no laborable: ${diaBloqueado}. Revisa y presiona Guardar Mes.`,
        tipo: aplicadas > 0 ? 'exito' : 'error',
      })
      if (archivoCsvRef.current) archivoCsvRef.current.value = ''
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 5000)
    } catch (error) {
      setMensaje({ texto: 'Error al importar asistencia. Revisa la plantilla CSV.', tipo: 'error' })
    }
  }
  if (cargando) return <div className="p-10 text-center text-slate-500 font-medium w-full">Cargando registro de asistencia... </div>

  return (
    <div ref={contenedorPrincipalRef} className="h-full w-full overflow-y-auto bg-slate-50/50 pb-20">
      <div className="p-4 md:p-8 max-w-[1750px] mx-auto">
        
        {/* ENCABEZADO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Control de Asistencia</h1>
              <p className="text-sm text-slate-500 font-medium mt-1">Seccion Primaria: {etiquetaSeccion(infoSeccion)}</p>
            </div>
            <div className="bg-white border-2 border-blue-600 rounded-2xl p-3 shadow-sm flex flex-col items-center min-w-[100px]">
               <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">Días Laborables</span>
               <span className="text-2xl font-black text-slate-800">{totalDiasLaborables}</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 rounded-xl shadow-sm p-2">
              <button onClick={() => cambiarMes(-1)} className="h-10 w-10 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors">◀</button>
              <select
                value={mesActual}
                onChange={(e) => cambiarPeriodo(Number(e.target.value), anioActual)}
                className="h-10 min-w-36 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {nombresMeses.map((mes, index) => (
                  <option key={mes} value={index}>{mes}</option>
                ))}
              </select>
              <select
                value={anioActual}
                onChange={(e) => cambiarPeriodo(mesActual, Number(e.target.value))}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {anosDisponibles.map((anio) => (
                  <option key={anio} value={anio}>{anio}</option>
                ))}
              </select>
              <button onClick={() => cambiarMes(1)} className="h-10 w-10 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors">▶</button>
              <button onClick={irAlMesActual} className="h-10 rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wide text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                Hoy
              </button>
            </div>
            <input type="file" accept=".csv" ref={archivoCsvRef} onChange={importarAsistenciaCSV} className="hidden" />
            <button onClick={() => archivoCsvRef.current?.click()} className="bg-white border border-slate-200 text-slate-700 hover:text-blue-700 hover:border-blue-300 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm">
              Importar matriz CSV
            </button>
            <button onClick={guardarRegistro} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-md transition-all">💾 Guardar Mes</button>
          </div>
        </div>

        {/* LEYENDA Y ESTADO */}
        <div className="flex flex-wrap items-center gap-4 mb-6 bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-xs font-bold text-slate-500 uppercase tracking-widest">
          <span className="flex items-center gap-1.5"><div className="w-4 h-4 bg-emerald-100 border border-emerald-300 rounded"></div> P = Presente</span>
          <span className="flex items-center gap-1.5"><div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div> A = Ausente</span>
          <span className="flex items-center gap-1.5"><div className="w-4 h-4 bg-amber-100 border border-amber-300 rounded"></div> E = Excusa</span>
          <span className="flex items-center gap-1.5"><div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div> T = Tardanza</span>
          <span className="flex items-center gap-1.5 text-slate-400"><div className="w-4 h-4 bg-slate-200 rounded"></div> Bloqueado / Fines de Semana</span>
          <span className={`ml-auto ${hayCambiosPendientes ? 'text-amber-600' : 'text-emerald-600'}`}>
            {hayCambiosPendientes ? 'Cambios pendientes' : 'Sin cambios pendientes'}
          </span>
          {ultimoGuardado && <span className="text-slate-500">Último guardado: {ultimoGuardado}</span>}
        </div>

        {mensaje.texto && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-semibold border shadow-sm ${mensaje.tipo === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
            {mensaje.texto}
          </div>
        )}

        <div className="bg-white shadow-md border border-slate-300 rounded-2xl w-full min-w-0 relative">
          <div className="overflow-x-auto w-full custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1400px] text-sm table-fixed">
              
              <thead className="bg-slate-700 text-white select-none border-b border-slate-800">
                <tr className="uppercase tracking-wider">
                  <th className="p-3 text-center w-12 font-bold border-r border-slate-600 sticky left-0 z-30 bg-slate-800">No.</th>
                  <th className="p-3 font-bold border-r border-slate-600 sticky left-12 z-30 bg-slate-800 w-56">Estudiante</th>
                  
                  {arrayDias.map(dia => {
                    const fechaISO = obtenerFechaISO(dia, mesActual, anioActual)
                    const esBloqueado = diasBloqueados.includes(fechaISO)
                    const esFinSemana = [0, 6].includes(new Date(anioActual, mesActual, dia).getDay())
                    
                    return (
                      <th key={dia} className={`p-1 w-10 border-r border-slate-600 text-center ${esBloqueado ? 'bg-slate-900 text-slate-500' : esFinSemana ? 'bg-slate-600 text-slate-300' : 'bg-slate-700 text-white'}`}>
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] font-bold opacity-80">{inicialesDias[new Date(anioActual, mesActual, dia).getDay()]}</span>
                          <span className="font-black text-sm">{dia}</span>
                          <button onClick={() => alternarDiaBloqueado(dia)} className={`mt-1 text-[10px] transition-colors ${esBloqueado ? 'text-red-500 hover:text-red-400' : 'text-slate-400 hover:text-white'}`}>
                            {esBloqueado ? 'X' : 'Abrir'}
                          </button>
                        </div>
                      </th>
                    )
                  })}

                  <th className="p-2 w-12 bg-emerald-600 text-white font-black text-center border-l border-slate-600">P</th>
                  <th className="p-2 w-12 bg-red-600 text-white font-black text-center border-l border-slate-600">A</th>
                  <th className="p-2 w-12 bg-amber-500 text-white font-black text-center border-l border-slate-600">E</th>
                  <th className="p-2 w-12 bg-orange-500 text-white font-black text-center border-l border-slate-600">T</th>
                </tr>
              </thead>

              <tbody className="bg-white">
                {estudiantes.map((est, index) => {
                  const res = calcularResumenEstudiante(est.id)
                  const esRetirado = est.estado === 'Retirado'
                  return (
                    <tr key={est.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className={`p-2 text-center text-slate-500 font-bold sticky left-0 z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>{est.numero_orden}</td>
                      <td className={`p-2 font-semibold text-slate-800 sticky left-12 z-10 border-r border-slate-200 truncate shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                        {est.nombre_completo} {esRetirado && <span className="text-[8px] bg-red-100 text-red-600 px-1 rounded ml-2 font-bold">Retirado</span>}
                      </td>
                      {arrayDias.map(dia => {
                        const fechaISO = obtenerFechaISO(dia, mesActual, anioActual)
                        const estaBloqueado = diasBloqueados.includes(fechaISO)
                        const estado = asistencia[`${est.id}_${fechaISO}`] || ''
                        return (
                          <td key={dia} onClick={() => !estaBloqueado && !esRetirado && alternarAsistencia(est.id, dia)} className={`p-0 border-r border-slate-100 text-center cursor-pointer ${estaBloqueado || esRetirado ? 'bg-slate-200/50 pointer-events-none' : ''}`}>
                            <div className={`w-full h-8 flex items-center justify-center font-bold text-xs border ${obtenerColorCelda(estado)}`}>
                              {estaBloqueado ? '-' : estado}
                            </div>
                          </td>
                        )
                      })}
                      <td className="p-1 text-center font-black bg-emerald-50/50 text-emerald-700 border-l border-slate-200">{res.p}</td>
                      <td className="p-1 text-center font-black bg-red-50/50 text-red-700 border-l border-slate-200">{res.a}</td>
                      <td className="p-1 text-center font-black bg-amber-50/50 text-amber-700 border-l border-slate-200">{res.e}</td>
                      <td className="p-1 text-center font-black bg-orange-50/50 text-orange-700 border-l border-slate-200">{res.t}</td>
                    </tr>
                  )
                })}
              </tbody>

              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                <tr>
                  <td colSpan={2} className="p-3 text-right text-[10px] uppercase tracking-tighter text-slate-500 sticky left-0 bg-slate-100 z-10">Presentes:</td>
                  {arrayDias.map(dia => {
                    const cant = contarPresentesDia(dia)
                    const estaBloqueado = diasBloqueados.includes(obtenerFechaISO(dia, mesActual, anioActual))
                    return (
                      <td key={dia} className={`p-2 text-center border-r border-slate-200 ${estaBloqueado ? 'text-slate-400' : 'text-blue-600'}`}>
                        {estaBloqueado ? '-' : cant}
                      </td>
                    )
                  })}
                  <td colSpan={4} className="bg-slate-100"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* TRUCO DE VELOCIDAD */}
        <div className="mt-6 bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-4">
          <span className="text-xl">💡</span>
          <p className="text-sm text-blue-800 font-medium">
            <strong className="font-black">Truco de velocidad:</strong> Haz clic repetidas veces en una casilla blanca para rotar entre (P), (A), (E) y (T). Los fines de semana se bloquean automáticamente, pero puedes usar el ícono 🔓 para habilitarlos si hubo clases un sábado.
          </p>
        </div>

      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { height: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 5px; }
      `}} />
    </div>
  )
}
