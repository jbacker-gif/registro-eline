'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabase'

type EstadoAsistencia = 'P' | 'A' | 'E' | 'T'

type Estudiante = {
  id: string
  numero_orden?: number | null
  nombre_completo?: string | null
  nombres?: string | null
  apellidos?: string | null
  sexo?: string | null
  nacionalidad?: string | null
  estado?: string | null
  condicion_inicial?: string | null
  fecha_nuevo_inscrito?: string | null
  fecha_retiro?: string | null
}

type Seccion = {
  id: string
  grado?: string | null
  identificador?: string | null
  ano_escolar?: string | null
  tanda?: string | null
}

type RegistroAsistencia = {
  estudiante_id: string
  fecha: string
  estado: EstadoAsistencia | string
}

type ResumenEstudiante = {
  estudiante: Estudiante
  p: number
  a: number
  e: number
  t: number
  diasTrabajados: number
  total: number
  porcentajePresencia: number
  porcentajeAusencia: number
  porcentajeExcusa: number
  porcentajeTardanza: number
}

const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const obtenerRangoAnoEscolar = (anoEscolar?: string | null) => {
  const match = (anoEscolar || '').match(/(\d{4})\D+(\d{4})/)
  const hoy = new Date()
  const inicio = match ? Number(match[1]) : hoy.getFullYear()
  const fin = match ? Number(match[2]) : inicio + 1

  return {
    inicio,
    fin,
    texto: `${inicio}-${fin}`,
    fechaInicio: `${inicio}-08-01`,
    fechaFin: `${fin}-06-30`,
    corteMatricula: `${inicio}-10-15`,
  }
}

const compararFecha = (fecha?: string | null, referencia?: string | null) => {
  if (!fecha || !referencia) return null
  return fecha <= referencia
}

const estaActivoEnFecha = (estudiante: Estudiante, fecha: string) => {
  const inscritoAntes = !estudiante.fecha_nuevo_inscrito || compararFecha(estudiante.fecha_nuevo_inscrito, fecha)
  const retiradoAntes = estudiante.fecha_retiro ? estudiante.fecha_retiro < fecha : false
  return Boolean(inscritoAntes && !retiradoAntes)
}

const esFinDeSemana = (fechaISO: string) => {
  const fecha = new Date(`${fechaISO}T00:00:00`)
  const dia = fecha.getDay()
  return dia === 0 || dia === 6
}

const sumarDia = (fechaISO: string) => {
  const fecha = new Date(`${fechaISO}T00:00:00`)
  fecha.setDate(fecha.getDate() + 1)
  return fecha.toISOString().slice(0, 10)
}

const obtenerDiasLaborablesPorMes = (inicio: string, fin: string, bloqueados: Set<string>) => {
  const dias: string[] = []
  const porMes = new Map<string, number>()
  let cursor = inicio

  while (cursor <= fin) {
    if (!esFinDeSemana(cursor) && !bloqueados.has(cursor)) {
      dias.push(cursor)
      const claveMes = cursor.slice(0, 7)
      porMes.set(claveMes, (porMes.get(claveMes) || 0) + 1)
    }
    cursor = sumarDia(cursor)
  }

  return { dias, porMes }
}

const normalizarFechaISO = (fecha?: string | null) => {
  if (!fecha) return ''
  return fecha.slice(0, 10)
}

const normalizarEstadoAsistencia = (estado?: string | null): EstadoAsistencia | null => {
  const valor = (estado || '').trim().toUpperCase()
  return ['P', 'A', 'E', 'T'].includes(valor) ? valor as EstadoAsistencia : null
}

const normalizarEtiqueta = (valor?: string | null) => {
  const limpio = (valor || '').trim()
  if (!limpio) return 'No especificada'
  return limpio
    .toLocaleLowerCase('es-DO')
    .replace(/\s+/g, ' ')
    .replace(/(^|\s|-)([a-záéíóúñü])/g, texto => texto.toLocaleUpperCase('es-DO'))
}

export default function ResumenAnual() {
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' })
  const [seccionId, setSeccionId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [infoSeccion, setInfoSeccion] = useState<Seccion | null>(null)
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [registrosAsistencia, setRegistrosAsistencia] = useState<RegistroAsistencia[]>([])
  const [diasBloqueados, setDiasBloqueados] = useState<string[]>([])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const secId = params.get('seccion_id')
    if (!secId) {
      setCargando(false)
      return
    }

    setSeccionId(secId)
    cargarResumen(secId)
  }, [])

  const rango = useMemo(() => obtenerRangoAnoEscolar(infoSeccion?.ano_escolar), [infoSeccion?.ano_escolar])

  const cargarResumen = async (secId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      setUserId(session.user.id)

      const { data: seccion, error: seccionError } = await supabase
        .from('secciones')
        .select('*')
        .eq('id', secId)
        .eq('user_id', session.user.id)
        .single()
      if (seccionError) throw seccionError

      const rangoSeccion = obtenerRangoAnoEscolar(seccion?.ano_escolar)
      setInfoSeccion(seccion)

      const [{ data: listaEstudiantes, error: estudiantesError }, { data: asistencia, error: asistenciaError }, { data: bloqueados, error: bloqueadosError }] = await Promise.all([
        supabase
          .from('estudiantes')
          .select('*')
          .eq('seccion_id', secId)
          .eq('user_id', session.user.id)
          .order('numero_orden', { ascending: true }),
        supabase
          .from('asistencia')
          .select('estudiante_id, fecha, estado')
          .eq('seccion_id', secId)
          .eq('user_id', session.user.id)
          .gte('fecha', rangoSeccion.fechaInicio)
          .lte('fecha', rangoSeccion.fechaFin),
        supabase
          .from('dias_bloqueados')
          .select('fecha')
          .eq('seccion_id', secId)
          .gte('fecha', rangoSeccion.fechaInicio)
          .lte('fecha', rangoSeccion.fechaFin),
      ])

      if (estudiantesError) throw estudiantesError
      if (asistenciaError) throw asistenciaError
      if (bloqueadosError) throw bloqueadosError

      setEstudiantes(listaEstudiantes || [])
      setRegistrosAsistencia((asistencia || []) as RegistroAsistencia[])
      setDiasBloqueados((bloqueados || []).map((dia: { fecha: string }) => dia.fecha))
    } catch (error) {
      console.error(error)
      setMensaje({ texto: 'No se pudo cargar el resumen anual.', tipo: 'error' })
    } finally {
      setCargando(false)
    }
  }

  const estadisticasMatricula = useMemo(() => {
    const activos = estudiantes.filter(est => est.estado !== 'Retirado')
    const retirados = estudiantes.filter(est => est.estado === 'Retirado')
    const nuevos = estudiantes.filter(est => est.fecha_nuevo_inscrito && est.fecha_nuevo_inscrito > rango.corteMatricula)
    const matriculaInicial = estudiantes.filter(est => estaActivoEnFecha(est, rango.corteMatricula))
    const masculino = estudiantes.filter(est => est.sexo === 'M')
    const femenino = estudiantes.filter(est => est.sexo === 'F')
    const nacionalidades = new Map<string, number>()
    const condiciones = new Map<string, number>()

    estudiantes.forEach(est => {
      const nacionalidad = normalizarEtiqueta(est.nacionalidad)
      const condicion = normalizarEtiqueta(est.condicion_inicial)
      nacionalidades.set(nacionalidad, (nacionalidades.get(nacionalidad) || 0) + 1)
      condiciones.set(condicion, (condiciones.get(condicion) || 0) + 1)
    })

    return {
      total: estudiantes.length,
      activos: activos.length,
      retirados: retirados.length,
      nuevos: nuevos.length,
      matriculaInicial: matriculaInicial.length,
      masculino: masculino.length,
      femenino: femenino.length,
      nacionalidades: Array.from(nacionalidades.entries()),
      condiciones: Array.from(condiciones.entries()),
    }
  }, [estudiantes, rango.corteMatricula])

  const resumenAsistencia = useMemo(() => {
    const bloqueados = new Set(diasBloqueados)
    const { dias: diasLaborables, porMes: diasPorMes } = obtenerDiasLaborablesPorMes(rango.fechaInicio, rango.fechaFin, bloqueados)
    const totalDiasTrabajados = diasLaborables.length
    const asistenciaPorEstudianteFecha = new Map<string, EstadoAsistencia>()
    const porEstudiante = new Map<string, ResumenEstudiante>()
    const porMes = new Map<string, { p: number; a: number; e: number; t: number; diasTrabajados: number }>()

    estudiantes.forEach(estudiante => {
      porEstudiante.set(estudiante.id, {
        estudiante,
        p: 0,
        a: 0,
        e: 0,
        t: 0,
        diasTrabajados: 0,
        total: 0,
        porcentajePresencia: 0,
        porcentajeAusencia: 0,
        porcentajeExcusa: 0,
        porcentajeTardanza: 0,
      })
    })

    diasPorMes.forEach((diasTrabajados, claveMes) => {
      porMes.set(claveMes, { p: 0, a: 0, e: 0, t: 0, diasTrabajados })
    })

    registrosAsistencia.forEach(registro => {
      const fecha = normalizarFechaISO(registro.fecha)
      const estado = normalizarEstadoAsistencia(registro.estado)
      if (!fecha || !estado) return
      if (fecha < rango.fechaInicio || fecha > rango.fechaFin) return
      if (bloqueados.has(fecha) || esFinDeSemana(fecha)) return
      asistenciaPorEstudianteFecha.set(`${registro.estudiante_id}_${fecha}`, estado)
    })

    diasLaborables.forEach(fecha => {
      const claveMes = fecha.slice(0, 7)
      const resumenMes = porMes.get(claveMes)
      if (!resumenMes) return

      estudiantes.forEach(estudiante => {
        if (!estaActivoEnFecha(estudiante, fecha)) return

        const resumenEstudiante = porEstudiante.get(estudiante.id)
        if (!resumenEstudiante) return

        const estado = asistenciaPorEstudianteFecha.get(`${estudiante.id}_${fecha}`) || 'A'
        resumenEstudiante[estado.toLowerCase() as 'p' | 'a' | 'e' | 't'] += 1
        resumenEstudiante.diasTrabajados += 1
        resumenEstudiante.total += 1
        resumenMes[estado.toLowerCase() as 'p' | 'a' | 'e' | 't'] += 1
      })
    })

    const estudiantesResumen = Array.from(porEstudiante.values()).map(resumen => ({
      ...resumen,
      porcentajePresencia: resumen.diasTrabajados > 0 ? Math.round((resumen.p / resumen.diasTrabajados) * 100) : 0,
      porcentajeAusencia: resumen.diasTrabajados > 0 ? Math.round((resumen.a / resumen.diasTrabajados) * 100) : 0,
      porcentajeExcusa: resumen.diasTrabajados > 0 ? Math.round((resumen.e / resumen.diasTrabajados) * 100) : 0,
      porcentajeTardanza: resumen.diasTrabajados > 0 ? Math.round((resumen.t / resumen.diasTrabajados) * 100) : 0,
    }))

    const totales = estudiantesResumen.reduce(
      (acc, resumen) => {
        acc.p += resumen.p
        acc.a += resumen.a
        acc.e += resumen.e
        acc.t += resumen.t
        acc.total += resumen.total
        acc.diasTrabajados += resumen.diasTrabajados
        return acc
      },
      { p: 0, a: 0, e: 0, t: 0, total: 0, diasTrabajados: 0 }
    )

    return {
      totalDiasTrabajados,
      estudiantesResumen,
      meses: Array.from(porMes.entries()).sort(([a], [b]) => a.localeCompare(b)),
      totales: {
        ...totales,
        porcentajePresencia: totales.diasTrabajados > 0 ? Math.round((totales.p / totales.diasTrabajados) * 100) : 0,
        porcentajeAusencia: totales.diasTrabajados > 0 ? Math.round((totales.a / totales.diasTrabajados) * 100) : 0,
        porcentajeExcusa: totales.diasTrabajados > 0 ? Math.round((totales.e / totales.diasTrabajados) * 100) : 0,
        porcentajeTardanza: totales.diasTrabajados > 0 ? Math.round((totales.t / totales.diasTrabajados) * 100) : 0,
      },
    }
  }, [diasBloqueados, estudiantes, registrosAsistencia, rango.fechaFin, rango.fechaInicio])

  if (cargando) return <div className="p-10 text-center text-slate-500 font-medium w-full">Cargando resumen anual...</div>
  if (!seccionId) return <div className="p-10 text-center text-slate-500 font-bold w-full">Por favor selecciona una seccion en el Panel de Control.</div>

  return (
    <div className="h-full overflow-y-auto bg-slate-50/50">
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800">Resumen anual</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {infoSeccion ? `${infoSeccion.grado} "${infoSeccion.identificador}" ${infoSeccion.tanda ? `(${infoSeccion.tanda})` : ''} | ${rango.texto}` : 'Resumen oficial de seccion'}
            </p>
          </div>
          <button onClick={() => window.print()} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-700 print:hidden">
            Imprimir resumen
          </button>
        </div>

        {mensaje.texto && (
          <div className={`mb-6 rounded-xl border p-4 text-sm font-semibold ${mensaje.tipo === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
            {mensaje.texto}
          </div>
        )}

        <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            ['Matricula total', estadisticasMatricula.total],
            ['Inicial al 15 oct.', estadisticasMatricula.matriculaInicial],
            ['Activos', estadisticasMatricula.activos],
            ['Retirados', estadisticasMatricula.retirados],
            ['Dias trabajados', resumenAsistencia.totalDiasTrabajados],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</p>
              <p className="mt-2 text-3xl font-black text-slate-800">{value}</p>
            </div>
          ))}
        </section>

        <section className="mb-6 grid gap-6 xl:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Resumen de matricula</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-xs font-bold text-blue-700">Masculino</p>
                <p className="text-2xl font-black text-blue-900">{estadisticasMatricula.masculino}</p>
              </div>
              <div className="rounded-lg bg-rose-50 p-4">
                <p className="text-xs font-bold text-rose-700">Femenino</p>
                <p className="text-2xl font-black text-rose-900">{estadisticasMatricula.femenino}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-4">
                <p className="text-xs font-bold text-emerald-700">Nuevos despues corte</p>
                <p className="text-2xl font-black text-emerald-900">{estadisticasMatricula.nuevos}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <ResumenLista titulo="Nacionalidad" datos={estadisticasMatricula.nacionalidades} />
              <ResumenLista titulo="Condicion inicial" datos={estadisticasMatricula.condiciones} />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Resumen anual de asistencia</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-5">
              {[
                ['P', resumenAsistencia.totales.p, `${resumenAsistencia.totales.porcentajePresencia}%`, 'bg-emerald-50 text-emerald-800'],
                ['A', resumenAsistencia.totales.a, `${resumenAsistencia.totales.porcentajeAusencia}%`, 'bg-red-50 text-red-800'],
                ['E', resumenAsistencia.totales.e, `${resumenAsistencia.totales.porcentajeExcusa}%`, 'bg-amber-50 text-amber-800'],
                ['T', resumenAsistencia.totales.t, `${resumenAsistencia.totales.porcentajeTardanza}%`, 'bg-orange-50 text-orange-800'],
                ['Dias', resumenAsistencia.totalDiasTrabajados, '100%', 'bg-slate-100 text-slate-800'],
              ].map(([label, value, porcentaje, clase]) => (
                <div key={label} className={`rounded-lg p-4 ${clase}`}>
                  <p className="text-xs font-black uppercase">{label}</p>
                  <p className="text-2xl font-black">{value}</p>
                  <p className="mt-1 text-xs font-bold opacity-70">{porcentaje}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] uppercase tracking-widest text-slate-400">
                    <th className="py-2">Mes</th>
                    <th className="py-2 text-center">Dias</th>
                    <th className="py-2 text-center">P</th>
                    <th className="py-2 text-center">A</th>
                    <th className="py-2 text-center">E</th>
                    <th className="py-2 text-center">T</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resumenAsistencia.meses.map(([clave, resumen]) => {
                    const [, mes] = clave.split('-').map(Number)
                    return (
                      <tr key={clave}>
                        <td className="py-2 font-semibold text-slate-700">{nombresMeses[mes - 1]}</td>
                        <td className="py-2 text-center font-bold text-slate-500">{resumen.diasTrabajados}</td>
                        <td className="py-2 text-center">{resumen.p}</td>
                        <td className="py-2 text-center">{resumen.a}</td>
                        <td className="py-2 text-center">{resumen.e}</td>
                        <td className="py-2 text-center">{resumen.t}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Detalle anual por estudiante</h2>
            <p className="mt-1 text-xs font-medium text-slate-400">Los porcentajes se calculan con los dias laborables completos del ano escolar, de agosto a junio, menos dias bloqueados.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] uppercase tracking-widest text-slate-400">
                  <th className="p-3 text-center">No.</th>
                  <th className="p-3">Estudiante</th>
                  <th className="p-3 text-center">Sexo</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-center">P</th>
                  <th className="p-3 text-center">A</th>
                  <th className="p-3 text-center">E</th>
                  <th className="p-3 text-center">T</th>
                  <th className="p-3 text-center">Dias</th>
                  <th className="p-3 text-center">% P</th>
                  <th className="p-3 text-center">% A</th>
                  <th className="p-3 text-center">% E</th>
                  <th className="p-3 text-center">% T</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resumenAsistencia.estudiantesResumen.map(({ estudiante, p, a, e, t, diasTrabajados, porcentajePresencia, porcentajeAusencia, porcentajeExcusa, porcentajeTardanza }) => (
                  <tr key={estudiante.id} className="hover:bg-slate-50">
                    <td className="p-3 text-center font-bold text-slate-400">{estudiante.numero_orden}</td>
                    <td className="p-3 font-bold text-slate-800">{estudiante.nombre_completo || `${estudiante.apellidos || ''}, ${estudiante.nombres || ''}`}</td>
                    <td className="p-3 text-center">{estudiante.sexo || '-'}</td>
                    <td className="p-3 text-center">{estudiante.estado || 'Activo'}</td>
                    <td className="p-3 text-center text-emerald-700">{p}</td>
                    <td className="p-3 text-center text-red-700">{a}</td>
                    <td className="p-3 text-center text-amber-700">{e}</td>
                    <td className="p-3 text-center text-orange-700">{t}</td>
                    <td className="p-3 text-center font-bold text-slate-500">{diasTrabajados}</td>
                    <td className="p-3 text-center font-black text-slate-700">{porcentajePresencia}%</td>
                    <td className="p-3 text-center font-black text-slate-700">{porcentajeAusencia}%</td>
                    <td className="p-3 text-center font-black text-slate-700">{porcentajeExcusa}%</td>
                    <td className="p-3 text-center font-black text-slate-700">{porcentajeTardanza}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

function ResumenLista({ titulo, datos }: { titulo: string; datos: Array<[string, number]> }) {
  return (
    <div>
      <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-400">{titulo}</p>
      <div className="space-y-2">
        {datos.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
            <span className="text-sm font-semibold text-slate-600">{label}</span>
            <span className="text-sm font-black text-slate-800">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
