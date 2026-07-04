'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import {
  asignaturasSecundaria,
  calcularEdad,
  cicloSecundaria,
  esSegundoCicloSecundaria,
  estadoEstudiante,
  etiquetaSeccion,
  inicialesEstudiante,
  matriculaEstudiante,
  modalidadDeSeccion,
  promedioMostrable,
  telefonoTutor,
  tutorPrincipal,
} from '../../../lib/registroEscolar'

type Pestana = 'listado' | 'formulario' | 'calificaciones' | 'boletin'
type Periodo = 'P1' | 'P2' | 'P3' | 'P4'
type FilaBoletinSecundaria = {
  asignatura: string
  P1: string
  P2: string
  P3: string
  P4: string
  promedioCompetencias: string
  finalArea: string
  completiva: string
  extraordinaria: string
  especial: string
  situacion: string
}

const periodos: Periodo[] = ['P1', 'P2', 'P3', 'P4']
const condiciones = ['Promovido', 'Repitente', 'Reingreso', 'Aplazado']
const resultados = ['Promovido', 'Reprobado', 'Pendiente', 'Retirado', 'Transferido']
const situacionesAsignatura = ['Aprobado', 'Reprobado', 'Pendiente']
const situacionEstudianteOpciones = ['Promovido/a', 'Repitente', 'Pendiente']
const demo = [
  ['Ana Maria', 'Duarte Perez', 'F', '1ro', 'RNE-2026-001', 'Promovido'],
  ['Luis Rafael', 'Matos Rojas', 'M', '3ro', 'RNE-2026-003', 'Pendiente'],
  ['Camila', 'Santos Nunez', 'F', '6to', 'RNE-2026-006', 'Promovido'],
]

const normalizar = (valor = '') =>
  valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

const promedio = (valores: string[]) => {
  const numeros = valores.map(Number).filter(valor => Number.isFinite(valor) && valor > 0)
  return numeros.length ? Math.round(numeros.reduce((total, valor) => total + valor, 0) / numeros.length) : null
}

const crearFilaBoletin = (asignatura: string): FilaBoletinSecundaria => ({
  asignatura,
  P1: '',
  P2: '',
  P3: '',
  P4: '',
  promedioCompetencias: '',
  finalArea: '',
  completiva: '',
  extraordinaria: '',
  especial: '',
  situacion: 'Pendiente',
})

const crearFilasBoletin = (grado = '1ro', salidaOptativa = '') => {
  const filas = asignaturasSecundaria.map(crearFilaBoletin)
  return esSegundoCicloSecundaria(grado)
    ? [...filas, crearFilaBoletin(salidaOptativa || 'Salida Optativa')]
    : filas
}

const promedioPeriodosFila = (fila: FilaBoletinSecundaria) =>
  promedio(periodos.map(periodo => fila[periodo]))

const mesesPorPeriodo: Record<Periodo, number[]> = {
  P1: [8, 9, 10],
  P2: [11, 12, 1],
  P3: [2, 3],
  P4: [4, 5, 6],
}

const periodoPorFecha = (fechaISO: string): Periodo | null => {
  const fecha = new Date(`${fechaISO}T00:00:00`)
  const mes = fecha.getMonth() + 1
  return periodos.find(periodo => mesesPorPeriodo[periodo].includes(mes)) || null
}

const asistenciaVacia = () =>
  periodos.reduce((acc, periodo) => {
    acc[periodo] = { asistencia: 0, ausencia: 0 }
    return acc
  }, {} as Record<Periodo, { asistencia: number; ausencia: number }>)

export default function RegistroSecundaria() {
  const [pestana, setPestana] = useState<Pestana>('listado')
  const [userId, setUserId] = useState('')
  const [secciones, setSecciones] = useState<any[]>([])
  const [seccionId, setSeccionId] = useState('')
  const [estudiantes, setEstudiantes] = useState<any[]>([])
  const [estudianteActivo, setEstudianteActivo] = useState<any | null>(null)
  const [asignaturas, setAsignaturas] = useState<any[]>([])
  const [filasBoletin, setFilasBoletin] = useState<FilaBoletinSecundaria[]>(crearFilasBoletin())
  const [asistenciaBoletin, setAsistenciaBoletin] = useState(asistenciaVacia())
  const [observacionesBoletin, setObservacionesBoletin] = useState('')
  const [situacionEstudiante, setSituacionEstudiante] = useState('Pendiente')
  const [condicionFinal, setCondicionFinal] = useState('Pendiente')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(true)
  const [form, setForm] = useState<any>(crearFormulario())
  const [busqueda, setBusqueda] = useState('')
  const [docenteTitular, setDocenteTitular] = useState('Docente titular')
  const [centroEducativo, setCentroEducativo] = useState('Centro educativo')

  const seccionActiva = secciones.find(item => item.id === seccionId)
  const grado = seccionActiva?.grado || estudianteActivo?.grado || '1ro'
  const esSegundoCiclo = esSegundoCicloSecundaria(grado)
  const promedioFinal = useMemo(() => {
    const valores = filasBoletin.map(fila => fila.finalArea || String(promedioPeriodosFila(fila) || '')).filter(Boolean)
    return promedio(valores)
  }, [filasBoletin])
  const totalesAsistencia = useMemo(() => {
    const asistencia = periodos.reduce((total, periodo) => total + asistenciaBoletin[periodo].asistencia, 0)
    const ausencia = periodos.reduce((total, periodo) => total + asistenciaBoletin[periodo].ausencia, 0)
    const total = asistencia + ausencia
    return {
      asistencia,
      ausencia,
      porcentajeAsistencia: total ? Math.round((asistencia / total) * 100) : 0,
      porcentajeAusencia: total ? Math.round((ausencia / total) * 100) : 0,
    }
  }, [asistenciaBoletin])
  const estudiantesFiltrados = estudiantes.filter(estudiante => {
    const texto = `${estudiante.nombre_completo || ''} ${estudiante.rne || ''} ${estudiante.sigerd_id || ''} ${estudiante.cedula_pasaporte || ''} ${tutorPrincipal(estudiante)}`
    const coincideBusqueda = normalizar(texto).includes(normalizar(busqueda))
    return coincideBusqueda
  })
  const etiquetaEstado = (estudiante: any) => {
    const estado = estadoEstudiante(estudiante)
    const normalizado = estado.toLowerCase()
    if (normalizado.includes('retir') || normalizado.includes('reprob')) return 'bg-red-50 text-red-700 border-red-100'
    if (normalizado.includes('pend') || normalizado.includes('aplaz')) return 'bg-amber-50 text-amber-700 border-amber-100'
    if (normalizado.includes('transfer') || normalizado.includes('traslad')) return 'bg-blue-50 text-blue-700 border-blue-100'
    return 'bg-emerald-50 text-emerald-700 border-emerald-100'
  }

  useEffect(() => {
    inicializar()
  }, [])

  useEffect(() => {
    if (seccionId && userId) cargarEstudiantes(seccionId, userId)
  }, [seccionId, userId])

  useEffect(() => {
    setFilasBoletin(crearFilasBoletin(grado, seccionActiva?.salida_optativa))
  }, [grado, seccionActiva?.salida_optativa])

  useEffect(() => {
    if (estudianteActivo?.id && userId && !String(estudianteActivo.id).startsWith('demo-')) cargarNotas(estudianteActivo.id)
  }, [estudianteActivo?.id, userId])

  const inicializar = async () => {
    try {
      const params = new URLSearchParams(window.location.search)
      const seccionParam = params.get('seccion_id') || ''
      const vistaSolicitada = params.get('vista')
      const vistaParam = vistaSolicitada === 'evaluacion'
        ? 'calificaciones'
        : vistaSolicitada === 'informe'
          ? 'boletin'
          : vistaSolicitada as Pestana | null
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setUserId(session.user.id)
      const [{ data: seccionesData }, { data: asignaturasData }] = await Promise.all([
        supabase.from('secciones').select('*').eq('user_id', session.user.id).order('ano_escolar', { ascending: false }),
        supabase.from('asignaturas').select('*').order('nombre', { ascending: true }),
      ])
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('nombre_completo, colegio_id')
        .eq('id', session.user.id)
        .maybeSingle()
      if (perfil?.nombre_completo) setDocenteTitular(perfil.nombre_completo)
      if (perfil?.colegio_id) {
        const { data: colegio } = await supabase
          .from('colegios')
          .select('nombre, codigo_centro')
          .eq('id', perfil.colegio_id)
          .maybeSingle()
        if (colegio?.nombre) setCentroEducativo(colegio.codigo_centro ? `${colegio.nombre} - ${colegio.codigo_centro}` : colegio.nombre)
      }
      const secundarias = (seccionesData || []).filter(seccion =>
        seccion.nivel === 'Secundario' || (seccion.modalidad || seccion.salida_optativa)
      )
      setSecciones(secundarias)
      setAsignaturas(asignaturasData || [])
      const seccionInicial = secundarias.find(seccion => seccion.id === seccionParam) || secundarias[0]
      if (seccionInicial) setSeccionId(seccionInicial.id)
      if (vistaParam && ['listado', 'formulario', 'calificaciones', 'boletin'].includes(vistaParam)) setPestana(vistaParam)
    } finally {
      setCargando(false)
    }
  }

  const cargarEstudiantes = async (idSeccion: string, idUsuario: string) => {
    const { data, error } = await supabase
      .from('estudiantes')
      .select('*')
      .eq('seccion_id', idSeccion)
      .eq('user_id', idUsuario)
      .order('numero_orden', { ascending: true })
    if (error) {
      setMensaje('No se pudo cargar el listado.')
      return
    }
    const idsEstudiantes = (data || []).map(estudiante => estudiante.id)
    let responsablesPorEstudiante = new Map<string, any>()
    let promediosPorEstudiante = new Map<string, number>()

    if (idsEstudiantes.length > 0) {
      const [{ data: responsables, error: responsablesError }, { data: calificaciones, error: calificacionesError }] = await Promise.all([
        supabase
          .from('responsables_estudiante')
          .select('*')
          .in('estudiante_id', idsEstudiantes)
          .eq('user_id', idUsuario)
          .eq('es_principal', true),
        supabase
          .from('calificaciones')
          .select('estudiante_id, nota')
          .in('estudiante_id', idsEstudiantes)
          .eq('seccion_id', idSeccion)
          .eq('user_id', idUsuario),
      ])

      if (!responsablesError) {
        responsablesPorEstudiante = new Map((responsables || []).map(resp => [resp.estudiante_id, resp]))
      }
      if (!calificacionesError) {
        const acumulado = new Map<string, { total: number; cantidad: number }>()
        ;(calificaciones || []).forEach((calificacion: any) => {
          const nota = Number(calificacion.nota)
          if (!Number.isFinite(nota)) return
          const actual = acumulado.get(calificacion.estudiante_id) || { total: 0, cantidad: 0 }
          acumulado.set(calificacion.estudiante_id, { total: actual.total + nota, cantidad: actual.cantidad + 1 })
        })
        promediosPorEstudiante = new Map(Array.from(acumulado.entries()).map(([id, valor]) => [id, Math.round(valor.total / valor.cantidad)]))
      }
    }

    const enriquecidos = (data || []).map(estudiante => ({
      ...estudiante,
      responsable_principal: responsablesPorEstudiante.get(estudiante.id) || null,
      promedio_estudiante: promediosPorEstudiante.get(estudiante.id) ?? null,
    }))
    setEstudiantes(enriquecidos)
    setEstudianteActivo(enriquecidos?.[0] || null)
  }

  const cargarNotas = async (estudianteId: string) => {
    const { data } = await supabase
      .from('calificaciones')
      .select('*')
      .eq('estudiante_id', estudianteId)
      .eq('user_id', userId)
      .eq('nivel', 'Secundario')
      .eq('tipo_registro', 'secundaria_boletin_calificaciones')

    const filas = crearFilasBoletin(grado, seccionActiva?.salida_optativa)
    ;(data || []).forEach((nota: any) => {
      const asignaturaNombre = nota.metadata?.asignatura || ''
      const fila = filas.find(item => normalizar(item.asignatura) === normalizar(asignaturaNombre))
      if (!fila) return
      if (periodos.includes(nota.periodo as Periodo)) {
        fila[nota.periodo as Periodo] = nota.nota === null || nota.nota === undefined ? '' : String(nota.nota)
      }
      fila.promedioCompetencias = nota.metadata?.promedio_competencias ? String(nota.metadata.promedio_competencias) : fila.promedioCompetencias
      fila.finalArea = nota.metadata?.final_area ? String(nota.metadata.final_area) : fila.finalArea
      fila.completiva = nota.metadata?.calificacion_completiva ? String(nota.metadata.calificacion_completiva) : fila.completiva
      fila.extraordinaria = nota.metadata?.calificacion_extraordinaria ? String(nota.metadata.calificacion_extraordinaria) : fila.extraordinaria
      fila.especial = nota.metadata?.evaluacion_especial ? String(nota.metadata.evaluacion_especial) : fila.especial
      fila.situacion = nota.metadata?.situacion_final_asignatura || fila.situacion
    })
    setFilasBoletin(filas)
    await cargarAsistenciaBoletin(estudianteId)
  }

  const cargarAsistenciaBoletin = async (estudianteId: string) => {
    const resumen = asistenciaVacia()
    if (!userId) return setAsistenciaBoletin(resumen)
    const { data } = await supabase
      .from('asistencia')
      .select('fecha, estado')
      .eq('estudiante_id', estudianteId)
      .eq('user_id', userId)
    ;(data || []).forEach((registro: any) => {
      const periodo = periodoPorFecha(String(registro.fecha || '').slice(0, 10))
      if (!periodo) return
      const estado = String(registro.estado || '').toUpperCase()
      if (estado === 'P') resumen[periodo].asistencia += 1
      if (estado === 'A') resumen[periodo].ausencia += 1
    })
    setAsistenciaBoletin(resumen)
  }

  const nuevoRegistro = () => {
    setForm(crearFormulario(String((estudiantes.at(-1)?.numero_orden || 0) + 1)))
    setPestana('formulario')
  }

  const editar = (estudiante: any) => {
    setEstudianteActivo(estudiante)
    setForm({ ...crearFormulario(), ...estudiante, numero_orden: String(estudiante.numero_orden || '') })
    setPestana('formulario')
  }

  const guardarEstudiante = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!userId || !seccionId) return setMensaje('Selecciona una seccion secundaria antes de guardar.')
    if (!form.numero_orden || !form.nombres.trim() || !form.apellidos.trim() || !form.sexo) {
      return setMensaje('Completa numero, nombres, apellidos y sexo.')
    }
    const payload = {
      ...form,
      numero_orden: Number(form.numero_orden),
      nombre_completo: `${form.apellidos.trim()}, ${form.nombres.trim()}`,
      seccion_id: seccionId,
      user_id: userId,
    }
    const { error } = form.id
      ? await supabase.from('estudiantes').update(payload).eq('id', form.id).eq('user_id', userId)
      : await supabase.from('estudiantes').insert([payload])
    if (error) return setMensaje(`No se pudo guardar: ${error.message}`)
    setMensaje('Registro guardado.')
    setPestana('listado')
    await cargarEstudiantes(seccionId, userId)
  }

  const guardarNotas = async () => {
    if (!estudianteActivo || !seccionId || !userId) return
    const filas = filasBoletin.flatMap(fila => {
      const asignatura = asignaturas.find(item => normalizar(item.nombre) === normalizar(fila.asignatura))
      if (!asignatura) return []
      const finalCalculado = fila.finalArea || String(promedioPeriodosFila(fila) || '')
      return periodos.filter(periodo => fila[periodo] !== '').map(periodo => ({
        estudiante_id: estudianteActivo.id,
        seccion_id: seccionId,
        user_id: userId,
        asignatura_id: asignatura.id,
        periodo,
        competencia: 'BOLETIN',
        nota: Number(fila[periodo]),
        nivel: 'Secundario',
        ano_escolar: seccionActiva?.ano_escolar || null,
        tipo_registro: 'secundaria_boletin_calificaciones',
        es_recuperacion_pedagogica: false,
        grupo_recuperacion: null,
        metadata: {
          grado,
          ciclo: cicloSecundaria(grado),
          asignatura: fila.asignatura,
          formato: 'boletin_secundaria',
          promedio_competencias: fila.promedioCompetencias || String(promedioPeriodosFila(fila) || ''),
          final_area: finalCalculado,
          calificacion_completiva: fila.completiva,
          calificacion_extraordinaria: fila.extraordinaria,
          evaluacion_especial: fila.especial,
          situacion_final_asignatura: fila.situacion,
          situacion_estudiante: situacionEstudiante,
          condicion_final: condicionFinal,
          observaciones: observacionesBoletin,
        },
      }))
    })
    if (filas.length) {
      const { error } = await supabase
        .from('calificaciones')
        .upsert(filas, { onConflict: 'estudiante_id,seccion_id,asignatura_id,periodo,competencia' })
      if (error) return setMensaje(`No se pudieron guardar las calificaciones del boletin: ${error.message}`)
    }
    setMensaje('Calificaciones del boletin guardadas.')
  }

  const cargarDemo = () => {
    const registros = demo.map(([nombres, apellidos, sexo, gradoDemo, rne, resultado], index) => ({
      id: `demo-${index}`,
      numero_orden: index + 1,
      nombres,
      apellidos,
      nombre_completo: `${apellidos}, ${nombres}`,
      sexo,
      grado: gradoDemo,
      rne,
      condicion_inicial: index === 1 ? 'Reingreso' : 'Promovido',
      resultado_final: resultado,
    }))
    setEstudiantes(registros)
    setEstudianteActivo(registros[0])
    setFilasBoletin(crearFilasBoletin(grado, seccionActiva?.salida_optativa))
    setMensaje('Datos demo cargados en pantalla. Para persistir, crea una seccion secundaria y guarda las fichas.')
  }

  if (cargando) return <div className="p-10 text-center text-sm font-semibold text-slate-500">Cargando secundaria...</div>

  return (
    <div className="min-h-full bg-slate-50">
      <main className="mx-auto max-w-7xl px-4 py-4 md:px-8 md:py-6">
        {mensaje && pestana !== 'listado' && <div className="mb-5 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">{mensaje}</div>}

        {pestana === 'listado' && (
          <section className="overflow-hidden rounded-2xl border border-teal-100 bg-white p-5 shadow-sm md:p-7">
            <div className="flex flex-col gap-5 border-b-2 border-teal-800 pb-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">
                  {centroEducativo} - Ciclo {seccionActiva?.ano_escolar || 'vigente'}
                </p>
                <h2 className="mt-2 font-serif text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                  {seccionActiva ? `${seccionActiva.grado} de Secundaria - Seccion ${seccionActiva.identificador} - Listado de Estudiantes` : 'Listado de Estudiantes de Secundaria'}
                </h2>
              </div>
              <div className="text-left text-sm font-semibold leading-6 text-slate-600 lg:text-right">
                Profesor(a) titular: <span className="font-black text-slate-950">{docenteTitular}</span><br />
                {estudiantes.length} alumnos matriculados
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, matricula, RNE o tutor..."
                className="min-h-11 flex-1 rounded-lg border border-teal-200 bg-teal-50/40 px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              />
              <div className="flex flex-wrap items-center gap-2">
                <p className="mr-2 text-sm font-bold text-slate-600"><span className="text-teal-700">{estudiantesFiltrados.length}</span> de {estudiantes.length} estudiantes</p>
                <button onClick={nuevoRegistro} className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-teal-800">Crear registro</button>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1040px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-teal-50 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                      <th className="p-4 font-black">Estudiante</th>
                      <th className="p-4 font-black">Matricula</th>
                      <th className="p-4 font-black">Estado</th>
                      <th className="p-4 font-black">Promedio</th>
                      <th className="p-4 font-black">Tutor / Contacto</th>
                      <th className="p-4 font-black">Condicion</th>
                      <th className="p-4 text-right font-black">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {estudiantesFiltrados.length === 0 ? (
                      <tr><td colSpan={7} className="p-10 text-center font-semibold text-slate-400">No hay estudiantes secundarios en esta seccion.</td></tr>
                    ) : estudiantesFiltrados.map(estudiante => (
                      <tr key={estudiante.id} className="text-sm transition-colors hover:bg-teal-50/45">
                        <td className="p-4">
                          <button onClick={() => setEstudianteActivo(estudiante)} className="flex items-center gap-3 text-left">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-800 text-xs font-black text-white">{inicialesEstudiante(estudiante.nombre_completo)}</span>
                            <span>
                              <span className="block font-serif text-lg font-black leading-tight text-slate-950">{estudiante.nombre_completo}</span>
                              <span className="block text-xs font-semibold text-slate-500">
                                {calcularEdad(estudiante.fecha_nacimiento) !== null ? `${calcularEdad(estudiante.fecha_nacimiento)} anos` : 'Edad pendiente'} - No. {estudiante.numero_orden || '-'} - {estudiante.sexo === 'F' ? 'Femenino' : estudiante.sexo === 'M' ? 'Masculino' : 'Sexo pendiente'}
                              </span>
                            </span>
                          </button>
                        </td>
                        <td className="p-4 font-mono text-sm font-semibold text-slate-700">{matriculaEstudiante(estudiante)}</td>
                        <td className="p-4"><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${etiquetaEstado(estudiante)}`}>{estadoEstudiante(estudiante)}</span></td>
                        <td className="p-4 text-lg font-black text-slate-950">{promedioMostrable(estudiante) ?? '-'}</td>
                        <td className="p-4 font-semibold text-slate-700">
                          {tutorPrincipal(estudiante)}
                          {telefonoTutor(estudiante) ? <span className="block text-xs text-slate-500">{telefonoTutor(estudiante)}</span> : null}
                        </td>
                        <td className="p-4 text-sm font-semibold text-slate-600">{estudiante.condicion_inicial || '-'}</td>
                        <td className="p-4 text-right">
                          <button onClick={() => { setEstudianteActivo(estudiante); setPestana('listado') }} className="mr-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-200">Ver</button>
                          <button onClick={() => editar(estudiante)} className="mr-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 hover:bg-blue-100">Editar</button>
                          <button onClick={() => { setEstudianteActivo(estudiante); setPestana('calificaciones') }} className="mr-2 rounded-lg bg-teal-50 px-3 py-2 text-xs font-black text-teal-700 hover:bg-teal-100">Calificaciones</button>
                          <button onClick={() => { setEstudianteActivo(estudiante); setPestana('boletin') }} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-black text-white hover:bg-slate-700">Boletin</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {pestana === 'formulario' && (
          <form onSubmit={guardarEstudiante} className="grid gap-6 lg:grid-cols-3">
            <Bloque titulo="Datos del estudiante">
              <Campo label="No. orden"><input value={form.numero_orden} onChange={e => setForm({ ...form, numero_orden: e.target.value })} type="number" required className="input-secundaria" /></Campo>
              <Campo label="Nombres"><input value={form.nombres} onChange={e => setForm({ ...form, nombres: e.target.value })} required className="input-secundaria" /></Campo>
              <Campo label="Apellidos"><input value={form.apellidos} onChange={e => setForm({ ...form, apellidos: e.target.value })} required className="input-secundaria" /></Campo>
              <Campo label="Sexo"><select value={form.sexo} onChange={e => setForm({ ...form, sexo: e.target.value })} required className="input-secundaria"><option value="">Seleccione</option><option value="F">Femenino</option><option value="M">Masculino</option></select></Campo>
              <Campo label="Fecha nacimiento"><input type="date" value={form.fecha_nacimiento || ''} onChange={e => setForm({ ...form, fecha_nacimiento: e.target.value })} className="input-secundaria" /></Campo>
              <Campo label="Nacionalidad"><input value={form.nacionalidad || ''} onChange={e => setForm({ ...form, nacionalidad: e.target.value })} className="input-secundaria" /></Campo>
            </Bloque>
            <Bloque titulo="Datos academicos">
              <Campo label="RNE"><input value={form.rne || ''} onChange={e => setForm({ ...form, rne: e.target.value })} className="input-secundaria" /></Campo>
              <Campo label="Cedula o pasaporte"><input value={form.cedula_pasaporte || ''} onChange={e => setForm({ ...form, cedula_pasaporte: e.target.value })} className="input-secundaria" /></Campo>
              <Campo label="ID SIGERD"><input value={form.sigerd_id || ''} onChange={e => setForm({ ...form, sigerd_id: e.target.value })} className="input-secundaria" /></Campo>
              <Campo label="Correo electronico"><input type="email" value={form.correo_electronico || ''} onChange={e => setForm({ ...form, correo_electronico: e.target.value })} className="input-secundaria" /></Campo>
              <Campo label="Condicion inicial"><select value={form.condicion_inicial || ''} onChange={e => setForm({ ...form, condicion_inicial: e.target.value })} className="input-secundaria">{condiciones.map(item => <option key={item}>{item}</option>)}</select></Campo>
              <Campo label="Resultado final"><select value={form.resultado_final || ''} onChange={e => setForm({ ...form, resultado_final: e.target.value })} className="input-secundaria">{resultados.map(item => <option key={item}>{item}</option>)}</select></Campo>
            </Bloque>
            <Bloque titulo="Familia, salud y observaciones">
              <Campo label="Direccion"><textarea value={form.direccion_residencia || ''} onChange={e => setForm({ ...form, direccion_residencia: e.target.value })} className="input-secundaria min-h-20" /></Campo>
              <Campo label="Tutor o responsable"><input value={form.nombre_tutor || ''} onChange={e => setForm({ ...form, nombre_tutor: e.target.value })} className="input-secundaria" /></Campo>
              <Campo label="Telefono"><input value={form.telefono_contacto || ''} onChange={e => setForm({ ...form, telefono_contacto: e.target.value })} className="input-secundaria" /></Campo>
              <Campo label="Emergencia"><input value={form.emergencia_nombre || ''} onChange={e => setForm({ ...form, emergencia_nombre: e.target.value })} className="input-secundaria" /></Campo>
              <Campo label="Salud / alergias"><input value={form.enfermedades_alergias || ''} onChange={e => setForm({ ...form, enfermedades_alergias: e.target.value })} className="input-secundaria" /></Campo>
              <Campo label="Observaciones"><textarea value={form.observaciones_academicas || ''} onChange={e => setForm({ ...form, observaciones_academicas: e.target.value })} className="input-secundaria min-h-20" /></Campo>
            </Bloque>
            <div className="lg:col-span-3 flex justify-end gap-3">
              <button type="button" onClick={() => setPestana('listado')} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700">Volver</button>
              <button type="submit" className="rounded-md bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700">Guardar cambios</button>
            </div>
          </form>
        )}

        {pestana === 'calificaciones' && (
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div><h2 className="text-base font-black text-slate-900">Entrada de calificaciones del boletin</h2><p className="text-sm text-slate-500">{estudianteActivo?.nombre_completo || 'Selecciona un estudiante'} - Periodos P1, P2, P3 y P4 con minimo aprobatorio 70 puntos.</p></div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select value={estudianteActivo?.id || ''} onChange={e => setEstudianteActivo(estudiantes.find(item => item.id === e.target.value) || null)} className="input-secundaria">{estudiantes.map(estudiante => <option key={estudiante.id} value={estudiante.id}>{estudiante.nombre_completo}</option>)}</select>
                <button type="button" onClick={() => setPestana('listado')} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700">Volver</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] border-collapse text-sm">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="border border-slate-700 p-3 text-left">Area curricular / asignatura</th>
                    {periodos.map(periodo => <th key={periodo} className="border border-slate-700 p-3">{periodo}</th>)}
                    <th className="border border-slate-700 p-3">PC</th>
                    <th className="border border-slate-700 p-3">C.F.</th>
                    <th className="border border-slate-700 p-3">C.E.C.</th>
                    <th className="border border-slate-700 p-3">C.E. EX</th>
                    <th className="border border-slate-700 p-3">C.E.</th>
                    <th className="border border-slate-700 p-3">Situacion</th>
                  </tr>
                </thead>
                <tbody>
                  {filasBoletin.map((fila, index) => (
                    <tr key={fila.asignatura} className="odd:bg-white even:bg-slate-50">
                      <td className="border border-slate-200 p-3 font-semibold text-slate-800">{fila.asignatura}</td>
                      {periodos.map(periodo => (
                        <td key={periodo} className="border border-slate-200 p-2">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={fila[periodo]}
                            onChange={e => setFilasBoletin(actual => actual.map((item, itemIndex) => itemIndex === index ? { ...item, [periodo]: e.target.value } : item))}
                            className="h-10 w-full rounded-md border border-slate-200 text-center font-bold outline-none focus:ring-2 focus:ring-teal-100"
                          />
                        </td>
                      ))}
                      <td className="border border-slate-200 p-2"><input value={fila.promedioCompetencias || promedioPeriodosFila(fila) || ''} onChange={e => setFilasBoletin(actual => actual.map((item, itemIndex) => itemIndex === index ? { ...item, promedioCompetencias: e.target.value } : item))} className="h-10 w-full rounded-md border border-slate-200 text-center font-bold outline-none focus:ring-2 focus:ring-teal-100" /></td>
                      <td className="border border-slate-200 p-2"><input value={fila.finalArea || promedioPeriodosFila(fila) || ''} onChange={e => setFilasBoletin(actual => actual.map((item, itemIndex) => itemIndex === index ? { ...item, finalArea: e.target.value } : item))} className="h-10 w-full rounded-md border border-slate-200 text-center font-bold outline-none focus:ring-2 focus:ring-teal-100" /></td>
                      <td className="border border-slate-200 p-2"><input value={fila.completiva} onChange={e => setFilasBoletin(actual => actual.map((item, itemIndex) => itemIndex === index ? { ...item, completiva: e.target.value } : item))} className="h-10 w-full rounded-md border border-slate-200 text-center font-bold outline-none focus:ring-2 focus:ring-teal-100" /></td>
                      <td className="border border-slate-200 p-2"><input value={fila.extraordinaria} onChange={e => setFilasBoletin(actual => actual.map((item, itemIndex) => itemIndex === index ? { ...item, extraordinaria: e.target.value } : item))} className="h-10 w-full rounded-md border border-slate-200 text-center font-bold outline-none focus:ring-2 focus:ring-teal-100" /></td>
                      <td className="border border-slate-200 p-2"><input value={fila.especial} onChange={e => setFilasBoletin(actual => actual.map((item, itemIndex) => itemIndex === index ? { ...item, especial: e.target.value } : item))} className="h-10 w-full rounded-md border border-slate-200 text-center font-bold outline-none focus:ring-2 focus:ring-teal-100" /></td>
                      <td className="border border-slate-200 p-2"><select value={fila.situacion} onChange={e => setFilasBoletin(actual => actual.map((item, itemIndex) => itemIndex === index ? { ...item, situacion: e.target.value } : item))} className="input-secundaria">{situacionesAsignatura.map(item => <option key={item}>{item}</option>)}</select></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <Campo label="Situacion del/de la estudiante"><select value={situacionEstudiante} onChange={e => setSituacionEstudiante(e.target.value)} className="input-secundaria">{situacionEstudianteOpciones.map(item => <option key={item}>{item}</option>)}</select></Campo>
              <Campo label="Condicion final"><input value={condicionFinal} onChange={e => setCondicionFinal(e.target.value)} className="input-secundaria" /></Campo>
              <Campo label="Observaciones"><input value={observacionesBoletin} onChange={e => setObservacionesBoletin(e.target.value)} className="input-secundaria" /></Campo>
            </div>
            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm font-bold text-slate-700">Calificacion final estimada: {promedioFinal ?? '-'} - {promedioFinal === null ? 'Pendiente' : promedioFinal >= 70 ? 'Promovido/a' : 'Repitente'}</p>
              <button onClick={guardarNotas} className="rounded-md bg-teal-700 px-5 py-2 text-sm font-bold text-white hover:bg-teal-800">Guardar calificaciones</button>
            </div>
          </section>
        )}

        {pestana === 'boletin' && (
          <section className="space-y-4">
            <div className="flex justify-end gap-2 print:hidden">
              <button onClick={() => setPestana('listado')} className="rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-bold text-slate-700">Volver</button>
              <button onClick={() => window.print()} className="rounded-md bg-slate-900 px-5 py-2 text-sm font-bold text-white">Imprimir boletin</button>
            </div>
            <div className="mx-auto max-w-5xl rounded-lg border border-slate-300 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
              <div className="border-b-2 border-slate-900 pb-5 text-center">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Viceministerio de Servicios Tecnicos y Pedagogicos - Direccion General de Educacion Secundaria</p>
                <h2 className="mt-2 text-2xl font-black uppercase text-slate-950">Boletin de Calificaciones</h2>
                <p className="mt-1 text-sm font-semibold text-slate-600">{cicloSecundaria(grado)} - {grado} de Secundaria</p>
              </div>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <Dato label="Ano escolar" value={seccionActiva?.ano_escolar} />
                <Dato label="Seccion" value={seccionActiva?.identificador} />
                <Dato label="No. orden" value={estudianteActivo?.numero_orden} />
                <Dato label="Nombre(s)" value={estudianteActivo?.nombres || estudianteActivo?.nombre_completo} />
                <Dato label="Apellido(s)" value={estudianteActivo?.apellidos} />
                <Dato label="ID SIGERD" value={estudianteActivo?.rne || estudianteActivo?.sigerd_id || estudianteActivo?.cedula_pasaporte} />
                <Dato label="Docente" value={docenteTitular} />
                <Dato label="Centro educativo" value={centroEducativo} />
                <Dato label="Tanda" value={seccionActiva?.tanda} />
                {esSegundoCiclo && <Dato label="Salida optativa" value={seccionActiva?.salida_optativa || 'Pendiente'} />}
              </div>
              <div className="mt-6 rounded-md border border-slate-200 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Observaciones</p>
                <p className="mt-2 min-h-16 text-sm font-semibold text-slate-700">{observacionesBoletin || ' '}</p>
              </div>
              <div className="mt-8 overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse text-xs">
                  <thead className="bg-slate-900 text-white">
                    <tr>
                      <th className="border border-slate-700 p-2 text-left">Areas curriculares</th>
                      {periodos.map(periodo => <th key={periodo} className="border border-slate-700 p-2">{periodo}</th>)}
                      <th className="border border-slate-700 p-2">PC</th>
                      <th className="border border-slate-700 p-2">C.F.</th>
                      <th className="border border-slate-700 p-2">C.E.C.</th>
                      <th className="border border-slate-700 p-2">C.E. EX</th>
                      <th className="border border-slate-700 p-2">C.E.</th>
                      <th className="border border-slate-700 p-2">Situacion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filasBoletin.map(fila => (
                      <tr key={fila.asignatura}>
                        <td className="border border-slate-300 p-2 font-semibold">{fila.asignatura}</td>
                        {periodos.map(periodo => <td key={periodo} className="border border-slate-300 p-2 text-center">{fila[periodo]}</td>)}
                        <td className="border border-slate-300 p-2 text-center">{fila.promedioCompetencias || promedioPeriodosFila(fila) || ''}</td>
                        <td className="border border-slate-300 p-2 text-center font-black">{fila.finalArea || promedioPeriodosFila(fila) || ''}</td>
                        <td className="border border-slate-300 p-2 text-center">{fila.completiva}</td>
                        <td className="border border-slate-300 p-2 text-center">{fila.extraordinaria}</td>
                        <td className="border border-slate-300 p-2 text-center">{fila.especial}</td>
                        <td className="border border-slate-300 p-2 text-center">{fila.situacion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-sm font-black uppercase text-slate-800">Resumen de asistencia</h3>
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-slate-100"><tr><th className="border border-slate-300 p-2">Periodo</th><th className="border border-slate-300 p-2">Asistencia</th><th className="border border-slate-300 p-2">Ausencia</th></tr></thead>
                    <tbody>
                      {periodos.map(periodo => <tr key={periodo}><td className="border border-slate-300 p-2 font-bold">{periodo}</td><td className="border border-slate-300 p-2 text-center">{asistenciaBoletin[periodo].asistencia}</td><td className="border border-slate-300 p-2 text-center">{asistenciaBoletin[periodo].ausencia}</td></tr>)}
                      <tr className="bg-slate-50"><td className="border border-slate-300 p-2 font-black">Anual</td><td className="border border-slate-300 p-2 text-center font-bold">{totalesAsistencia.porcentajeAsistencia}%</td><td className="border border-slate-300 p-2 text-center font-bold">{totalesAsistencia.porcentajeAusencia}%</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="grid gap-3">
                  <Dato label="Situacion del/de la estudiante" value={situacionEstudiante} />
                  <Dato label="Condicion final del/de la estudiante" value={condicionFinal} />
                  <p className="text-xs font-semibold leading-5 text-slate-500">Leyenda: P1-P4 periodos. PC promedio de competencias especificas. C.F. calificacion final. C.E.C. completiva. C.E. EX extraordinaria. C.E. evaluacion especial. A aprobado. R reprobado.</p>
                </div>
              </div>
              <div className="mt-8 grid gap-6 md:grid-cols-3"><Firma label="Padre, madre o tutor" /><Firma label="Maestro(a) encargado(a)" /><Firma label="Director(a) del centro educativo" /></div>
            </div>
          </section>
        )}
      </main>
      <style jsx global>{`
        .input-secundaria { min-height: 2.5rem; width: 100%; border-radius: 0.375rem; border: 1px solid #cbd5e1; background: white; padding: 0.5rem 0.75rem; font-size: 0.875rem; font-weight: 600; color: #334155; outline: none; }
        .input-secundaria:focus { border-color: #2563eb; box-shadow: 0 0 0 3px #dbeafe; }
        @media print { aside, nav, button, header, .print\\:hidden { display: none !important; } main { padding: 0 !important; } }
      `}</style>
    </div>
  )
}

function crearFormulario(numeroOrden = '') {
  return {
    numero_orden: numeroOrden,
    nombres: '',
    apellidos: '',
    sexo: '',
    fecha_nacimiento: '',
    nacionalidad: 'Dominicana',
    cedula_pasaporte: '',
    rne: '',
    sigerd_id: '',
    correo_electronico: '',
    condicion_inicial: 'Promovido',
    direccion_residencia: '',
    nombre_tutor: '',
    telefono_contacto: '',
    parentesco_con_quien_vive: '',
    emergencia_nombre: '',
    emergencia_telefono: '',
    enfermedades_alergias: 'Ninguna',
    medicamentos_usa: '',
    resultado_final: 'Pendiente',
    observaciones_academicas: '',
  }
}

function Resumen({ label, value }: { label: string; value: unknown }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-lg font-black text-slate-950">{String(value || '-')}</p></div>
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 text-base font-black text-slate-900">{titulo}</h2><div className="space-y-4">{children}</div></section>
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>{children}</label>
}

function Dato({ label, value }: { label: string; value: unknown }) {
  return <div className="rounded-md border border-slate-200 p-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 min-h-6 font-bold text-slate-900">{String(value || '-')}</p></div>
}

function Firma({ label }: { label: string }) {
  return <div className="pt-10 text-center"><div className="border-t border-slate-400 pt-2 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div></div>
}
