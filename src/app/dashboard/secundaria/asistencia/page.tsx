'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../../../lib/supabase'
import { getCsvValue, readCsvFile } from '../../../../lib/csv'
import { esSeccionSecundaria, etiquetaSeccion } from '../../../../lib/registroEscolar'

type Mensaje = { texto: string; tipo: 'info' | 'exito' | 'error' | '' }

const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const inicialesDias = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
const estadosValidos = ['P', 'A', 'E', 'T']

export default function AsistenciaSecundaria() {
  const [estudiantes, setEstudiantes] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState<Mensaje>({ texto: '', tipo: '' })
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
    } else {
      setCargando(false)
      setMensaje({ texto: 'Selecciona una seccion de Secundaria desde el Dashboard.', tipo: 'error' })
    }
  }, [mesActual, anioActual])

  const obtenerFechaISO = (dia: number, mes: number, anio: number) =>
    `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`

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

      const { data: secData } = await supabase
        .from('secciones')
        .select('*')
        .eq('id', secId)
        .eq('user_id', session.user.id)
        .single()

      if (!secData) {
        setMensaje({ texto: 'No tienes permisos para acceder a esta seccion.', tipo: 'error' })
        return
      }

      if (!esSeccionSecundaria(secData)) {
        setMensaje({ texto: 'Esta pantalla es solo para asistencia de Secundaria. Usa Asistencia Primaria para esa seccion.', tipo: 'error' })
        return
      }

      setInfoSeccion(secData)
      const { data: listaEst } = await supabase
        .from('estudiantes')
        .select('*')
        .eq('seccion_id', secId)
        .eq('user_id', session.user.id)
        .order('numero_orden', { ascending: true })
      setEstudiantes(listaEst || [])

      const fechaInicio = `${anioActual}-${String(mesActual + 1).padStart(2, '0')}-01`
      const ultimoDia = new Date(anioActual, mesActual + 1, 0).getDate()
      const fechaFin = `${anioActual}-${String(mesActual + 1).padStart(2, '0')}-${ultimoDia}`

      const { data: asistBD } = await supabase
        .from('asistencia')
        .select('*')
        .eq('seccion_id', secId)
        .eq('user_id', session.user.id)
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin)

      const mapaAsistencia: Record<string, string> = {}
      asistBD?.forEach(reg => { mapaAsistencia[`${reg.estudiante_id}_${reg.fecha}`] = reg.estado })
      setAsistencia(mapaAsistencia)

      const { data: diasBD } = await supabase
        .from('dias_bloqueados')
        .select('fecha')
        .eq('seccion_id', secId)
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin)

      const finesDeSemana: string[] = []
      for (let d = 1; d <= ultimoDia; d++) {
        const fechaD = new Date(anioActual, mesActual, d)
        if (fechaD.getDay() === 0 || fechaD.getDay() === 6) {
          finesDeSemana.push(obtenerFechaISO(d, mesActual, anioActual))
        }
      }

      setDiasBloqueados(Array.from(new Set([...(diasBD?.map(d => d.fecha) || []), ...finesDeSemana])))
    } catch (error) {
      console.error(error)
      setMensaje({ texto: 'No se pudo cargar la asistencia de Secundaria.', tipo: 'error' })
    } finally {
      setCargando(false)
    }
  }

  const diasDelMes = new Date(anioActual, mesActual + 1, 0).getDate()
  const arrayDias = Array.from({ length: diasDelMes }, (_, i) => i + 1)
  const anosDisponibles = Array.from({ length: 7 }, (_, i) => fechaActual.getFullYear() - 3 + i)
  const totalDiasLaborables = arrayDias.length - diasBloqueados.length

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

  const irAlMesActual = () => cambiarPeriodo(fechaActual.getMonth(), fechaActual.getFullYear())

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
    setMensaje({ texto: 'Guardando asistencia de Secundaria...', tipo: 'info' })
    try {
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

      for (const registro of nuevosRegistros) {
        const { data: existentes } = await supabase
          .from('asistencia')
          .select('estudiante_id')
          .eq('estudiante_id', registro.estudiante_id)
          .eq('seccion_id', registro.seccion_id)
          .eq('fecha', registro.fecha)
          .eq('user_id', registro.user_id)
          .limit(1)

        const resultado = existentes?.[0]?.estudiante_id
          ? await supabase
              .from('asistencia')
              .update({ estado: registro.estado })
              .eq('estudiante_id', registro.estudiante_id)
              .eq('seccion_id', registro.seccion_id)
              .eq('fecha', registro.fecha)
              .eq('user_id', registro.user_id)
          : await supabase.from('asistencia').insert(registro)

        if (resultado.error) throw resultado.error
      }

      for (const fecha of diasBloqueados) {
        const { data: existentes } = await supabase
          .from('dias_bloqueados')
          .select('fecha')
          .eq('seccion_id', seccionId)
          .eq('fecha', fecha)
          .limit(1)

        if (!existentes?.[0]?.fecha) {
          const { error } = await supabase.from('dias_bloqueados').insert({ seccion_id: seccionId, fecha })
          if (error) throw error
        }
      }

      setMensaje({ texto: 'Asistencia de Secundaria guardada correctamente.', tipo: 'exito' })
      setHayCambiosPendientes(false)
      setUltimoGuardado(new Date().toLocaleString('es-DO', { dateStyle: 'medium', timeStyle: 'short' }))
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000)
    } catch (error: any) {
      setMensaje({ texto: `Error al guardar asistencia: ${error?.message || 'revisa la conexion.'}`, tipo: 'error' })
    }
  }

  const obtenerColorCelda = (estado: string) => {
    if (estado === 'P') return 'bg-teal-100 text-teal-800 border-teal-300'
    if (estado === 'A') return 'bg-rose-100 text-rose-700 border-rose-300'
    if (estado === 'E') return 'bg-cyan-100 text-cyan-800 border-cyan-300'
    if (estado === 'T') return 'bg-violet-100 text-violet-700 border-violet-300'
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

          const estudiante = estudiantesPorNumero.get(Number(columna))
          if (!estudiante) {
            sinEstudiante++
            return
          }

          if (!estadosValidos.includes(estado)) {
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
        texto: `CSV cargado: ${aplicadas} registros aplicados. Vacias: ${celdasVacias}. Sin estudiante: ${sinEstudiante}. Fecha invalida: ${fechaInvalida}. Otro mes: ${otroMes}. Estado invalido: ${estadoInvalido}. Dia bloqueado: ${diaBloqueado}. Revisa y presiona Guardar Mes.`,
        tipo: aplicadas > 0 ? 'exito' : 'error',
      })
      if (archivoCsvRef.current) archivoCsvRef.current.value = ''
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 5000)
    } catch {
      setMensaje({ texto: 'Error al importar asistencia. Revisa la plantilla CSV.', tipo: 'error' })
    }
  }

  if (cargando) return <div className="p-10 text-center text-slate-500 font-medium w-full">Cargando asistencia de Secundaria...</div>

  return (
    <div ref={contenedorPrincipalRef} className="h-full w-full overflow-y-auto bg-slate-50 pb-20">
      <div className="mx-auto max-w-[1750px] p-4 md:p-8">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-teal-700">Registro Escolar - Nivel Secundario</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Control de Asistencia</h1>
              <p className="mt-1 text-sm font-medium text-slate-500">Seccion Secundaria: {etiquetaSeccion(infoSeccion)}</p>
            </div>
            <div className="flex min-w-[112px] flex-col items-center rounded-2xl border-2 border-teal-700 bg-white p-3 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-tight text-teal-700">Dias laborables</span>
              <span className="text-2xl font-black text-slate-900">{totalDiasLaborables}</span>
            </div>
          </div>

          <div className="flex w-full flex-col items-stretch gap-3 md:w-auto lg:flex-row lg:items-center">
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
              <button onClick={() => cambiarMes(-1)} className="h-10 w-10 rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-teal-700">‹</button>
              <select value={mesActual} onChange={(e) => cambiarPeriodo(Number(e.target.value), anioActual)} className="h-10 min-w-36 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
                {nombresMeses.map((mes, index) => <option key={mes} value={index}>{mes}</option>)}
              </select>
              <select value={anioActual} onChange={(e) => cambiarPeriodo(mesActual, Number(e.target.value))} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
                {anosDisponibles.map(anio => <option key={anio} value={anio}>{anio}</option>)}
              </select>
              <button onClick={() => cambiarMes(1)} className="h-10 w-10 rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-teal-700">›</button>
              <button onClick={irAlMesActual} className="h-10 rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wide text-slate-500 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700">Hoy</button>
            </div>
            <input type="file" accept=".csv" ref={archivoCsvRef} onChange={importarAsistenciaCSV} className="hidden" />
            <button onClick={() => archivoCsvRef.current?.click()} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 font-bold text-slate-700 shadow-sm transition-all hover:border-teal-300 hover:text-teal-700">Importar matriz CSV</button>
            <button onClick={guardarRegistro} className="rounded-xl bg-teal-700 px-8 py-2.5 font-bold text-white shadow-md transition-all hover:bg-teal-800">Guardar Mes</button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold uppercase tracking-widest text-slate-500 shadow-sm">
          <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded border border-teal-300 bg-teal-100" /> P = Presente</span>
          <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded border border-rose-300 bg-rose-100" /> A = Ausente</span>
          <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded border border-cyan-300 bg-cyan-100" /> E = Excusa</span>
          <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded border border-violet-300 bg-violet-100" /> T = Tardanza</span>
          <span className="flex items-center gap-1.5 text-slate-400"><span className="h-4 w-4 rounded bg-slate-200" /> Bloqueado / fines de semana</span>
          <span className={`ml-auto ${hayCambiosPendientes ? 'text-amber-600' : 'text-teal-700'}`}>{hayCambiosPendientes ? 'Cambios pendientes' : 'Sin cambios pendientes'}</span>
          {ultimoGuardado && <span className="text-slate-500">Ultimo guardado: {ultimoGuardado}</span>}
        </div>

        {mensaje.texto && (
          <div className={`mb-6 rounded-xl border p-4 text-sm font-semibold shadow-sm ${mensaje.tipo === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : mensaje.tipo === 'info' ? 'border-cyan-200 bg-cyan-50 text-cyan-800' : 'border-teal-200 bg-teal-50 text-teal-800'}`}>
            {mensaje.texto}
          </div>
        )}

        <div className="relative w-full min-w-0 rounded-2xl border border-slate-300 bg-white shadow-md">
          <div className="custom-scrollbar w-full overflow-x-auto">
            <table className="w-full min-w-[1400px] table-fixed border-collapse text-left text-sm">
              <thead className="select-none border-b border-slate-800 bg-slate-800 text-white">
                <tr className="uppercase tracking-wider">
                  <th className="sticky left-0 z-30 w-12 border-r border-slate-600 bg-slate-900 p-3 text-center font-bold">No.</th>
                  <th className="sticky left-12 z-30 w-56 border-r border-slate-600 bg-slate-900 p-3 font-bold">Estudiante</th>
                  {arrayDias.map(dia => {
                    const fechaISO = obtenerFechaISO(dia, mesActual, anioActual)
                    const esBloqueado = diasBloqueados.includes(fechaISO)
                    const esFinSemana = [0, 6].includes(new Date(anioActual, mesActual, dia).getDay())
                    return (
                      <th key={dia} className={`w-10 border-r border-slate-600 p-1 text-center ${esBloqueado ? 'bg-slate-950 text-slate-500' : esFinSemana ? 'bg-slate-700 text-slate-300' : 'bg-slate-800 text-white'}`}>
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] font-bold opacity-80">{inicialesDias[new Date(anioActual, mesActual, dia).getDay()]}</span>
                          <span className="text-sm font-black">{dia}</span>
                          <button onClick={() => alternarDiaBloqueado(dia)} className={`mt-1 text-[10px] transition-colors ${esBloqueado ? 'text-rose-400 hover:text-rose-300' : 'text-slate-400 hover:text-white'}`}>
                            {esBloqueado ? 'X' : 'Abrir'}
                          </button>
                        </div>
                      </th>
                    )
                  })}
                  <th className="w-12 border-l border-slate-600 bg-teal-700 p-2 text-center font-black text-white">P</th>
                  <th className="w-12 border-l border-slate-600 bg-rose-600 p-2 text-center font-black text-white">A</th>
                  <th className="w-12 border-l border-slate-600 bg-cyan-700 p-2 text-center font-black text-white">E</th>
                  <th className="w-12 border-l border-slate-600 bg-violet-700 p-2 text-center font-black text-white">T</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {estudiantes.map((est, index) => {
                  const res = calcularResumenEstudiante(est.id)
                  const esRetirado = est.estado === 'Retirado'
                  const fondoSticky = index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                  return (
                    <tr key={est.id} className={fondoSticky}>
                      <td className={`sticky left-0 z-10 border-r border-slate-200 p-2 text-center font-bold text-slate-500 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${fondoSticky}`}>{est.numero_orden}</td>
                      <td className={`sticky left-12 z-10 truncate border-r border-slate-200 p-2 font-semibold text-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${fondoSticky}`}>
                        {est.nombre_completo} {esRetirado && <span className="ml-2 rounded bg-rose-100 px-1 text-[8px] font-bold text-rose-600">Retirado</span>}
                      </td>
                      {arrayDias.map(dia => {
                        const fechaISO = obtenerFechaISO(dia, mesActual, anioActual)
                        const estaBloqueado = diasBloqueados.includes(fechaISO)
                        const estado = asistencia[`${est.id}_${fechaISO}`] || ''
                        return (
                          <td key={dia} onClick={() => !estaBloqueado && !esRetirado && alternarAsistencia(est.id, dia)} className={`cursor-pointer border-r border-slate-100 p-0 text-center ${estaBloqueado || esRetirado ? 'pointer-events-none bg-slate-200/50' : ''}`}>
                            <div className={`flex h-8 w-full items-center justify-center border text-xs font-bold ${obtenerColorCelda(estado)}`}>{estaBloqueado ? '-' : estado}</div>
                          </td>
                        )
                      })}
                      <td className="border-l border-slate-200 bg-teal-50/70 p-1 text-center font-black text-teal-800">{res.p}</td>
                      <td className="border-l border-slate-200 bg-rose-50/70 p-1 text-center font-black text-rose-700">{res.a}</td>
                      <td className="border-l border-slate-200 bg-cyan-50/70 p-1 text-center font-black text-cyan-800">{res.e}</td>
                      <td className="border-l border-slate-200 bg-violet-50/70 p-1 text-center font-black text-violet-700">{res.t}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="border-t-2 border-slate-300 bg-slate-100 font-bold">
                <tr>
                  <td colSpan={2} className="sticky left-0 z-10 bg-slate-100 p-3 text-right text-[10px] uppercase tracking-tight text-slate-500">Presentes:</td>
                  {arrayDias.map(dia => {
                    const estaBloqueado = diasBloqueados.includes(obtenerFechaISO(dia, mesActual, anioActual))
                    return <td key={dia} className={`border-r border-slate-200 p-2 text-center ${estaBloqueado ? 'text-slate-400' : 'text-teal-700'}`}>{estaBloqueado ? '-' : contarPresentesDia(dia)}</td>
                  })}
                  <td colSpan={4} className="bg-slate-100" />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="mt-6 flex items-start gap-4 rounded-2xl border border-teal-100 bg-teal-50 p-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-teal-700">PA</span>
          <p className="text-sm font-medium text-teal-900">
            Haz clic repetidas veces en una casilla para rotar entre P, A, E y T. La importacion CSV usa una fila por fecha y columnas por numero de orden del estudiante.
          </p>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { height: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 5px; }
      ` }} />
    </div>
  )
}
