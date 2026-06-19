'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabase'

type VistaResumen = 'asistencia' | 'sabana'
type EstadoAsistencia = 'P' | 'A' | 'E' | 'T'
type Periodo = 'P1' | 'P2' | 'P3' | 'P4'
type Competencia = 'C1' | 'C2' | 'C3'

type Estudiante = {
  id: string
  colegio_id?: string | null
  numero_orden?: number | null
  nombre_completo?: string | null
  nombres?: string | null
  apellidos?: string | null
  sexo?: string | null
  estado?: string | null
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

type Perfil = {
  id: string
  colegio_id?: string | null
  nombre_completo?: string | null
  full_name?: string | null
}

type Colegio = {
  id: string
  nombre?: string | null
  distrito_educativo?: string | null
  regional_educacion?: string | null
}

type Asignatura = {
  id: string
  nombre: string
}

type RegistroAsistencia = {
  estudiante_id: string
  fecha: string
  estado: EstadoAsistencia | string
}

type Calificacion = {
  estudiante_id: string
  asignatura_id: string
  periodo: Periodo | string
  competencia: Competencia | `${Competencia}_RP` | string
  nota: number | string | null
}

type ConsultaPaginada<T> = {
  range: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>
}

type ConteoAsistencia = {
  asistencia: number
  tardanza: number
  ausencia: number
  excusa: number
  diasTrabajados: number
}

type ResumenEstudiante = {
  estudiante: Estudiante
  porMes: Map<string, ConteoAsistencia>
  anual: ConteoAsistencia
  porcentajeAsistencia: number
  porcentajeAusencia: number
  porcentajeExcusa: number
}

type AreaSabana = {
  key: string
  nombre: string
  aliases: string[]
  tokens?: string[]
}

type ResultadoArea = {
  area: AreaSabana
  finalArea: number | null
  recuperacionFinal: number | null
  recuperacionEspecial: number | null
}

const meses = [
  { clave: '08', nombre: 'Agosto' },
  { clave: '09', nombre: 'Septiembre' },
  { clave: '10', nombre: 'Octubre' },
  { clave: '11', nombre: 'Noviembre' },
  { clave: '12', nombre: 'Diciembre' },
  { clave: '01', nombre: 'Enero' },
  { clave: '02', nombre: 'Febrero' },
  { clave: '03', nombre: 'Marzo' },
  { clave: '04', nombre: 'Abril' },
  { clave: '05', nombre: 'Mayo' },
  { clave: '06', nombre: 'Junio' },
]

const periodos: Periodo[] = ['P1', 'P2', 'P3', 'P4']
const competencias: Competencia[] = ['C1', 'C2', 'C3']

const areasBase: AreaSabana[] = [
  { key: 'lengua', nombre: 'Lengua Espanola', aliases: ['Lengua Espanola', 'Lengua Española'] },
  { key: 'matematica', nombre: 'Matematica', aliases: ['Matematica', 'Matemática'] },
  { key: 'sociales', nombre: 'Ciencias Sociales', aliases: ['Ciencias Sociales'] },
  { key: 'naturaleza', nombre: 'Ciencias de la Naturaleza', aliases: ['Ciencias de la Naturaleza', 'Ciencias Naturales'] },
  { key: 'fisica', nombre: 'Educacion Fisica', aliases: ['Educacion Fisica', 'Educación Física'] },
  { key: 'formacion', nombre: 'Formacion Integral Humana y Religiosa', aliases: ['Formacion Integral Humana y Religiosa', 'Formación Integral Humana y Religiosa', 'Formacion Integral, Humana y Religiosa', 'Formación Integral, Humana y Religiosa'] },
  { key: 'artistica', nombre: 'Educacion Artistica', aliases: ['Educacion Artistica', 'Educación Artística'] },
]

const areaIngles: AreaSabana = {
  key: 'ingles',
  nombre: 'Lenguas Extranjeras (ingles)',
  aliases: ['Lenguas Extranjeras', 'Lenguas Extranjeras (ingles)', 'Lenguas Extranjeras (inglés)', 'Ingles', 'Inglés'],
}

const crearConteo = (): ConteoAsistencia => ({
  asistencia: 0,
  tardanza: 0,
  ausencia: 0,
  excusa: 0,
  diasTrabajados: 0,
})

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
  }
}

const normalizarTexto = (valor?: string | null) =>
  (valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()

const normalizarFechaISO = (fecha?: string | null) => fecha ? fecha.slice(0, 10) : ''

const obtenerNombreEstudiante = (estudiante: Estudiante) =>
  estudiante.nombre_completo || [estudiante.nombres, estudiante.apellidos].filter(Boolean).join(' ') || ''

const esEstudianteRetirado = (estudiante: Estudiante) =>
  normalizarTexto(estudiante.estado) === 'retirado'

const estaActivoEnFecha = (estudiante: Estudiante, fecha: string) => {
  const inscritoAntes = !estudiante.fecha_nuevo_inscrito || normalizarFechaISO(estudiante.fecha_nuevo_inscrito) <= fecha
  const retiradoAntes = estudiante.fecha_retiro ? normalizarFechaISO(estudiante.fecha_retiro) < fecha : false
  return inscritoAntes && !retiradoAntes
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

const normalizarEstadoAsistencia = (estado?: string | null): EstadoAsistencia | null => {
  const valor = (estado || '').trim().toUpperCase()
  if (valor === 'P' || valor === 'A' || valor === 'E' || valor === 'T') return valor
  return null
}

const contarEstado = (conteo: ConteoAsistencia, estado: EstadoAsistencia) => {
  if (estado === 'P') conteo.asistencia += 1
  if (estado === 'T') conteo.tardanza += 1
  if (estado === 'A') conteo.ausencia += 1
  if (estado === 'E') conteo.excusa += 1
}

const obtenerClaveMes = (fecha: string) => fecha.slice(5, 7)

const usaOchoAreas = (grado?: string | null) => ['4to', '5to', '6to'].includes(grado || '')

const usaSabanaConSituacion = (grado?: string | null) => ['3ro', '4to', '5to', '6to'].includes(grado || '')

const obtenerAreasSabana = (grado?: string | null) =>
  usaOchoAreas(grado) ? [...areasBase.slice(0, 4), areaIngles, ...areasBase.slice(4)] : areasBase

const obtenerGrupoSabana = (grado?: string | null) => {
  if (grado === '1ro' || grado === '2do') return '1ro a 2do'
  if (grado === '3ro') return '3ro'
  return '4to a 6to'
}

const celda = (valor: unknown) => {
  if (valor === null || valor === undefined || valor === '') return ''
  return String(valor)
}

const calcularPorcentaje = (valor: number, total: number) =>
  total > 0 ? Math.round((valor / total) * 100) : 0

const cargarTodosLosRegistros = async <T,>(
  crearConsulta: () => ConsultaPaginada<T>,
  tamanoPagina = 1000
) => {
  const registros: T[] = []
  let desde = 0

  while (true) {
    const hasta = desde + tamanoPagina - 1
    const { data, error } = await crearConsulta().range(desde, hasta)
    if (error) throw error

    const pagina = data || []
    registros.push(...pagina)

    if (pagina.length < tamanoPagina) break
    desde += tamanoPagina
  }

  return registros
}

const aliasesExtraPorArea: Record<string, string[]> = {
  lengua: ['Espanol', 'Español', 'Lengua'],
  sociales: ['Cs Sociales', 'C. Sociales', 'Sociales'],
  naturaleza: ['Cs Naturales', 'C. Naturales', 'Naturales', 'Ciencias Naturales'],
  fisica: ['Edu. Fisica', 'Ed. Fisica', 'Fisica', 'Educacion Fisica'],
  formacion: ['Formacion Humana', 'Formacion Integral', 'FIHR', 'F.I.H.R.', 'Humana y Religiosa'],
  artistica: ['Edu. Artistica', 'Ed. Artistica', 'Artistica', 'Educacion Artistica'],
  ingles: ['Ingles', 'Idioma Ingles', 'Lenguas Extranjeras'],
}

const tokensPorArea: Record<string, string[]> = {
  lengua: ['lengua'],
  matematica: ['matematica'],
  sociales: ['ciencias', 'sociales'],
  naturaleza: ['naturaleza'],
  fisica: ['fisica'],
  formacion: ['formacion', 'humana'],
  artistica: ['artistica'],
  ingles: ['ingles'],
}

const normalizarAsignatura = (valor?: string | null) =>
  normalizarTexto(valor)
    .replace(/ã¡/g, 'a')
    .replace(/ã©/g, 'e')
    .replace(/ã­/g, 'i')
    .replace(/ã³/g, 'o')
    .replace(/ãº/g, 'u')
    .replace(/ã±/g, 'n')
    .replace(/\bcs\b/g, 'ciencias')
    .replace(/\bc\b/g, 'ciencias')
    .replace(/\bedu\b/g, 'educacion')
    .replace(/\bed\b/g, 'educacion')
    .replace(/\bfis\b/g, 'fisica')
    .replace(/\bart\b/g, 'artistica')
    .replace(/\bsoc\b/g, 'sociales')
    .replace(/\bnat\b/g, 'naturaleza')
    .replace(/\bfihr\b/g, 'formacion integral humana religiosa')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const coincideAsignatura = (area: AreaSabana, asignatura: Asignatura) => {
  const nombre = normalizarAsignatura(asignatura.nombre)
  const aliases = [area.nombre, ...area.aliases, ...(aliasesExtraPorArea[area.key] || [])].map(normalizarAsignatura)
  const tokens = area.tokens || tokensPorArea[area.key] || []

  if (aliases.includes(nombre)) return true
  if (area.key === 'naturaleza' && nombre.includes('natural')) return true
  if (area.key === 'formacion' && nombre.includes('religiosa')) return true

  return tokens.length > 0 && tokens.every(token => nombre.includes(normalizarAsignatura(token)))
}

const buscarAsignaturasArea = (area: AreaSabana, asignaturas: Asignatura[]) =>
  asignaturas.filter(asignatura => coincideAsignatura(area, asignatura))

const calcularArea = (area: AreaSabana, asignaturas: Asignatura[], calificaciones: Calificacion[], estudianteId: string): ResultadoArea => {
  const asignaturasArea = buscarAsignaturasArea(area, asignaturas)
  if (asignaturasArea.length === 0) return { area, finalArea: null, recuperacionFinal: null, recuperacionEspecial: null }
  const idsAsignaturasArea = new Set(asignaturasArea.map(asignatura => asignatura.id))

  const notasArea = calificaciones.filter(nota =>
    nota.estudiante_id === estudianteId && idsAsignaturasArea.has(nota.asignatura_id)
  )

  const finalesCompetencia = competencias.map(competencia => {
    const valores = periodos
      .map(periodo => {
        const recuperada = notasArea.find(nota => nota.periodo === periodo && nota.competencia === `${competencia}_RP`)?.nota
        const ordinaria = notasArea.find(nota => nota.periodo === periodo && nota.competencia === competencia)?.nota
        const valor = recuperada ?? ordinaria
        return valor === null || valor === undefined || valor === '' ? null : Number(valor)
      })
      .filter((nota): nota is number => typeof nota === 'number' && !Number.isNaN(nota))

    return valores.length > 0 ? Math.round(valores.reduce((total, nota) => total + nota, 0) / valores.length) : null
  })

  const validas = finalesCompetencia.filter((nota): nota is number => typeof nota === 'number' && !Number.isNaN(nota))

  return {
    area,
    finalArea: validas.length > 0 ? Math.round(validas.reduce((total, nota) => total + nota, 0) / validas.length) : null,
    recuperacionFinal: null,
    recuperacionEspecial: null,
  }
}

const obtenerSituacion = (resultados: ResultadoArea[]): string => {
  const finales = resultados
    .map(resultado => resultado.recuperacionEspecial ?? resultado.recuperacionFinal ?? resultado.finalArea)
    .filter((nota): nota is number => typeof nota === 'number' && !Number.isNaN(nota))

  if (finales.length === 0) return ''
  return finales.some(nota => nota < 65) ? 'Aplazado/a' : 'Promovido/a'
}

export default function ResumenAnual() {
  const [vista, setVista] = useState<VistaResumen>('asistencia')
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' })
  const [seccionId, setSeccionId] = useState<string | null>(null)
  const [infoSeccion, setInfoSeccion] = useState<Seccion | null>(null)
  const [infoPerfil, setInfoPerfil] = useState<Perfil | null>(null)
  const [infoColegio, setInfoColegio] = useState<Colegio | null>(null)
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [registrosAsistencia, setRegistrosAsistencia] = useState<RegistroAsistencia[]>([])
  const [diasBloqueados, setDiasBloqueados] = useState<string[]>([])
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([])
  const [calificaciones, setCalificaciones] = useState<Calificacion[]>([])

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

      const { data: seccion, error: seccionError } = await supabase
        .from('secciones')
        .select('*')
        .eq('id', secId)
        .eq('user_id', session.user.id)
        .single()
      if (seccionError) throw seccionError

      const rangoSeccion = obtenerRangoAnoEscolar(seccion?.ano_escolar)
      setInfoSeccion(seccion)

      const [
        { data: perfil },
        { data: listaEstudiantes, error: estudiantesError },
        { data: bloqueados, error: bloqueadosError },
        { data: listaAsignaturas, error: asignaturasError },
      ] = await Promise.all([
        supabase.from('perfiles').select('*').eq('id', session.user.id).maybeSingle(),
        supabase
          .from('estudiantes')
          .select('*')
          .eq('seccion_id', secId)
          .eq('user_id', session.user.id)
          .order('numero_orden', { ascending: true }),
        supabase
          .from('dias_bloqueados')
          .select('fecha')
          .eq('seccion_id', secId)
          .gte('fecha', rangoSeccion.fechaInicio)
          .lte('fecha', rangoSeccion.fechaFin),
        supabase.from('asignaturas').select('*'),
      ])

      if (estudiantesError) throw estudiantesError
      if (bloqueadosError) throw bloqueadosError
      if (asignaturasError) throw asignaturasError

      const [asistencia, notas] = await Promise.all([
        cargarTodosLosRegistros<RegistroAsistencia>(() =>
          supabase
            .from('asistencia')
            .select('estudiante_id, fecha, estado')
            .eq('seccion_id', secId)
            .eq('user_id', session.user.id)
            .gte('fecha', rangoSeccion.fechaInicio)
            .lte('fecha', rangoSeccion.fechaFin)
            .order('fecha', { ascending: true }) as unknown as ConsultaPaginada<RegistroAsistencia>
        ),
        cargarTodosLosRegistros<Calificacion>(() =>
          supabase
            .from('calificaciones')
            .select('estudiante_id, asignatura_id, periodo, competencia, nota')
            .eq('seccion_id', secId)
            .eq('user_id', session.user.id)
            .order('asignatura_id', { ascending: true })
            .order('estudiante_id', { ascending: true }) as unknown as ConsultaPaginada<Calificacion>
        ),
      ])

      setInfoPerfil(perfil || null)
      setEstudiantes((listaEstudiantes || []) as Estudiante[])
      setRegistrosAsistencia(asistencia)
      setDiasBloqueados((bloqueados || []).map((dia: { fecha: string }) => normalizarFechaISO(dia.fecha)))
      setAsignaturas((listaAsignaturas || []) as Asignatura[])
      setCalificaciones(notas)

      const colegioRelacionado = perfil?.colegio_id || (listaEstudiantes || [])[0]?.colegio_id
      if (colegioRelacionado) {
        const { data: colegio } = await supabase.from('colegios').select('*').eq('id', colegioRelacionado).maybeSingle()
        setInfoColegio(colegio || null)
      } else {
        const { data: colegios } = await supabase.from('colegios').select('*').limit(1)
        setInfoColegio(colegios?.[0] || null)
      }
    } catch (error) {
      console.error(error)
      setMensaje({ texto: 'No se pudo cargar el resumen anual.', tipo: 'error' })
    } finally {
      setCargando(false)
    }
  }

  const resumenAsistencia = useMemo(() => {
    const bloqueados = new Set(diasBloqueados)
    const asistenciaPorEstudianteFecha = new Map<string, EstadoAsistencia>()
    const diasTrabajadosPorMes = new Map<string, number>()
    const porEstudiante = new Map<string, ResumenEstudiante>()
    let totalDiasTrabajados = 0

    estudiantes.forEach(estudiante => {
      porEstudiante.set(estudiante.id, {
        estudiante,
        porMes: new Map(meses.map(mes => [mes.clave, crearConteo()])),
        anual: crearConteo(),
        porcentajeAsistencia: 0,
        porcentajeAusencia: 0,
        porcentajeExcusa: 0,
      })
    })

    registrosAsistencia.forEach(registro => {
      const fecha = normalizarFechaISO(registro.fecha)
      const estado = normalizarEstadoAsistencia(registro.estado)
      if (!fecha || !estado || bloqueados.has(fecha) || esFinDeSemana(fecha)) return
      asistenciaPorEstudianteFecha.set(`${registro.estudiante_id}_${fecha}`, estado)
    })

    let cursor = rango.fechaInicio
    while (cursor <= rango.fechaFin) {
      if (!esFinDeSemana(cursor) && !bloqueados.has(cursor)) {
        const claveMes = obtenerClaveMes(cursor)
        totalDiasTrabajados += 1
        diasTrabajadosPorMes.set(claveMes, (diasTrabajadosPorMes.get(claveMes) || 0) + 1)

        estudiantes.forEach(estudiante => {
          if (!estaActivoEnFecha(estudiante, cursor)) return

          const resumen = porEstudiante.get(estudiante.id)
          if (!resumen) return

          const resumenMes = resumen.porMes.get(claveMes)
          if (!resumenMes) return

          resumenMes.diasTrabajados += 1
          resumen.anual.diasTrabajados += 1

          const estado = asistenciaPorEstudianteFecha.get(`${estudiante.id}_${cursor}`)
          if (!estado) return

          contarEstado(resumenMes, estado)
          contarEstado(resumen.anual, estado)
        })
      }
      cursor = sumarDia(cursor)
    }

    const estudiantesResumen = Array.from(porEstudiante.values()).map(resumen => ({
      ...resumen,
      porcentajeAsistencia: calcularPorcentaje(resumen.anual.asistencia, resumen.anual.diasTrabajados),
      porcentajeAusencia: calcularPorcentaje(resumen.anual.ausencia, resumen.anual.diasTrabajados),
      porcentajeExcusa: calcularPorcentaje(resumen.anual.excusa, resumen.anual.diasTrabajados),
    }))

    return { totalDiasTrabajados, diasTrabajadosPorMes, estudiantesResumen }
  }, [diasBloqueados, estudiantes, registrosAsistencia, rango.fechaFin, rango.fechaInicio])

  const areasSabana = useMemo(() => obtenerAreasSabana(infoSeccion?.grado), [infoSeccion?.grado])

  if (cargando) return <div className="p-10 text-center text-slate-500 font-medium w-full">Cargando resumen anual...</div>
  if (!seccionId) return <div className="p-10 text-center text-slate-500 font-bold w-full">Por favor selecciona una seccion en el Panel de Control.</div>

  return (
    <div className="h-full overflow-y-auto bg-slate-100">
      <div className="mx-auto max-w-[1800px] p-4 md:p-8 print:p-0">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end print:hidden">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Modulo oficial</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-800">Resumen anual y Sabana</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {infoSeccion ? `${infoSeccion.grado} "${infoSeccion.identificador}" ${infoSeccion.tanda ? `(${infoSeccion.tanda})` : ''} | ${rango.texto}` : 'Resumen oficial de seccion'}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
              <button onClick={() => setVista('asistencia')} className={`rounded-md px-4 py-2 text-sm font-bold transition ${vista === 'asistencia' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                Asistencia anual
              </button>
              <button onClick={() => setVista('sabana')} className={`rounded-md px-4 py-2 text-sm font-bold transition ${vista === 'sabana' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                Sabana
              </button>
            </div>
            <button onClick={() => window.print()} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700">
              Imprimir
            </button>
          </div>
        </div>

        {mensaje.texto && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 print:hidden">
            {mensaje.texto}
          </div>
        )}

        {vista === 'asistencia' ? (
          <ResumenAsistenciaOficial
            infoSeccion={infoSeccion}
            resumen={resumenAsistencia.estudiantesResumen}
            diasTrabajadosPorMes={resumenAsistencia.diasTrabajadosPorMes}
            totalDiasTrabajados={resumenAsistencia.totalDiasTrabajados}
          />
        ) : (
          <SabanaOficial
            infoSeccion={infoSeccion}
            infoColegio={infoColegio}
            infoPerfil={infoPerfil}
            estudiantesResumen={resumenAsistencia.estudiantesResumen}
            areas={areasSabana}
            asignaturas={asignaturas}
            calificaciones={calificaciones}
            rangoTexto={rango.texto}
          />
        )}
      </div>

      <style jsx global>{`
        .official-sheet,
        .official-sheet * {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }

        .official-table {
          border-collapse: collapse;
          width: 100%;
          table-layout: fixed;
          background: #fff;
          color: #111827;
          font-family: Arial, Helvetica, sans-serif;
        }

        .official-table th,
        .official-table td {
          border: 1px solid #111827;
          padding: 3px 4px;
          vertical-align: middle;
        }

        .official-table th {
          font-size: 10px;
          font-weight: 800;
          text-align: center;
        }

        .official-table td {
          font-size: 11px;
          height: 22px;
        }

        .official-row-even td {
          background: #ffffff;
        }

        .official-row-odd td {
          background: #f1f5f9;
        }

        .official-row-empty td {
          background: #f8fafc;
        }

        .rotate-label {
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          min-height: 68px;
          white-space: nowrap;
        }

        .print-page {
          background: #fff;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
          margin-bottom: 24px;
          padding: 16px;
        }

        @media print {
          @page {
            size: letter landscape;
            margin: 0.25in;
          }

          html,
          body {
            background: #fff !important;
            height: auto !important;
            margin: 0 !important;
            overflow: visible !important;
          }

          body * {
            visibility: hidden !important;
          }

          .official-sheet,
          .official-sheet * {
            visibility: visible !important;
          }

          aside,
          nav,
          button,
          .print\\:hidden {
            display: none !important;
          }

          main,
          .official-sheet {
            display: block !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .print-page {
            width: 100%;
            min-height: 7.85in;
            margin: 0;
            padding: 0;
            box-shadow: none !important;
            break-after: page;
            page-break-after: always;
          }

          .print-page:last-child {
            break-after: auto;
            page-break-after: auto;
          }

          .official-table th {
            font-size: 7px;
            padding: 2px;
          }

          .official-table td {
            font-size: 8px;
            height: 18px;
            padding: 2px;
          }

          .rotate-label {
            min-height: 54px;
          }
        }
      `}</style>
    </div>
  )
}

function ResumenAsistenciaOficial({
  infoSeccion,
  resumen,
  diasTrabajadosPorMes,
  totalDiasTrabajados,
}: {
  infoSeccion: Seccion | null
  resumen: ResumenEstudiante[]
  diasTrabajadosPorMes: Map<string, number>
  totalDiasTrabajados: number
}) {
  return (
    <section className="official-sheet">
      <div className="print-page overflow-x-auto">
        <div className="mb-3 grid grid-cols-2 gap-6 text-sm font-bold text-slate-800">
          <div>
            <h2 className="text-center text-lg font-black uppercase">Resumen anual de asistencia</h2>
            <p className="mt-2">Dias trabajados: {totalDiasTrabajados || '_____________________________________'}</p>
          </div>
          <div className="text-right text-xs font-semibold">
            <p>Grado: {infoSeccion?.grado || '____'} &nbsp; Seccion: {infoSeccion?.identificador || '____'}</p>
            <p>Ano escolar: {infoSeccion?.ano_escolar || '____'}</p>
          </div>
        </div>

        <table className="official-table min-w-[1500px]">
          <thead>
            <tr>
              <th rowSpan={3} className="w-10">No.</th>
              <th rowSpan={3} className="w-56">Nombre(s) y apellido(s)</th>
              {meses.map(mes => <th key={mes.clave} colSpan={4}>{mes.nombre}</th>)}
              <th colSpan={4}>Resumen Anual</th>
              <th colSpan={2}>Porcentaje Anual</th>
            </tr>
            <tr>
              {meses.map(mes => (
                <th key={mes.clave} colSpan={4} className="text-[9px]">
                  Dias: {diasTrabajadosPorMes.get(mes.clave) || ''}
                </th>
              ))}
              <th colSpan={4}>Totales</th>
              <th colSpan={2}>%</th>
            </tr>
            <tr>
              {[...meses, { clave: 'anual', nombre: 'Anual' }].flatMap(mes => [
                <th key={`${mes.clave}-p`}><span className="rotate-label">Asistencia</span></th>,
                <th key={`${mes.clave}-t`}><span className="rotate-label">Tardanza</span></th>,
                <th key={`${mes.clave}-a`}><span className="rotate-label">Ausencia</span></th>,
                <th key={`${mes.clave}-e`}><span className="rotate-label">Excusa</span></th>,
              ])}
              <th><span className="rotate-label">Asistencia</span></th>
              <th><span className="rotate-label">Ausencia</span></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: Math.max(45, resumen.length) }).map((_, index) => {
              const item = resumen[index]
              return (
                <tr key={item?.estudiante.id || index} className={item ? (index % 2 === 0 ? 'official-row-even' : 'official-row-odd') : 'official-row-empty'}>
                  <td className="text-center font-bold">{item?.estudiante.numero_orden || index + 1}</td>
                  <td className="font-semibold">{item ? obtenerNombreEstudiante(item.estudiante) : ''}</td>
                  {meses.map(mes => {
                    const conteo = item?.porMes.get(mes.clave) || crearConteo()
                    return (
                      <AsistenciaCeldas
                        key={mes.clave}
                        asistencia={conteo.asistencia}
                        tardanza={conteo.tardanza}
                        ausencia={conteo.ausencia}
                        excusa={conteo.excusa}
                      />
                    )
                  })}
                  <AsistenciaCeldas
                    asistencia={item?.anual.asistencia || ''}
                    tardanza={item?.anual.tardanza || ''}
                    ausencia={item?.anual.ausencia || ''}
                    excusa={item?.anual.excusa || ''}
                  />
                  <td className="text-center font-bold">{item ? `${item.porcentajeAsistencia}%` : ''}</td>
                  <td className="text-center font-bold">{item ? `${item.porcentajeAusencia}%` : ''}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function AsistenciaCeldas({
  asistencia,
  tardanza,
  ausencia,
  excusa,
}: {
  asistencia: number | string
  tardanza: number | string
  ausencia: number | string
  excusa: number | string
}) {
  return (
    <>
      <td className="text-center">{celda(asistencia)}</td>
      <td className="text-center">{celda(tardanza)}</td>
      <td className="text-center">{celda(ausencia)}</td>
      <td className="text-center">{celda(excusa)}</td>
    </>
  )
}

function SabanaOficial({
  infoSeccion,
  infoColegio,
  infoPerfil,
  estudiantesResumen,
  areas,
  asignaturas,
  calificaciones,
  rangoTexto,
}: {
  infoSeccion: Seccion | null
  infoColegio: Colegio | null
  infoPerfil: Perfil | null
  estudiantesResumen: ResumenEstudiante[]
  areas: AreaSabana[]
  asignaturas: Asignatura[]
  calificaciones: Calificacion[]
  rangoTexto: string
}) {
  const incluyeSituacion = usaSabanaConSituacion(infoSeccion?.grado)
  const grupo = obtenerGrupoSabana(infoSeccion?.grado)

  return (
    <section className="official-sheet">
      <div className="print-page overflow-x-auto">
        <div className="mb-2 text-center font-bold text-slate-900">
          <h2 className="text-base font-black uppercase">Acta de rendimiento del/de la estudiante de fin del ano escolar</h2>
          <div className="mt-2 grid grid-cols-12 gap-2 text-left text-[11px]">
            <p className="col-span-5">Centro educativo: <span className="font-semibold">{infoColegio?.nombre || '______________________________'}</span></p>
            <p className="col-span-2">Regional: <span className="font-semibold">{infoColegio?.regional_educacion || '_____'}</span></p>
            <p className="col-span-2">Distrito Educativo: <span className="font-semibold">{infoColegio?.distrito_educativo || '_____'}</span></p>
            <p className="col-span-1">Grado: <span className="font-semibold">{infoSeccion?.grado || '____'}</span></p>
            <p className="col-span-1">Seccion: <span className="font-semibold">{infoSeccion?.identificador || '____'}</span></p>
            <p className="col-span-1">Ano: <span className="font-semibold">{rangoTexto}</span></p>
          </div>
        </div>

        <p className="mb-2 text-right text-xs font-bold text-slate-500 print:hidden">Modelo: {grupo}</p>

        <table className="official-table min-w-[1450px]">
          <thead>
            <tr>
              <th rowSpan={3} className="w-10">No.</th>
              <th rowSpan={3} className="w-64">Nombre(s) y apellido(s)</th>
              {areas.map(area => (
                <th key={area.key} colSpan={incluyeSituacion ? 3 : 2}>{area.nombre}</th>
              ))}
              <th colSpan={3}>Presencia y Ausencia</th>
              {incluyeSituacion && <th colSpan={3}>Situacion del/de la estudiante</th>}
              <th rowSpan={3} className="w-28">Observaciones</th>
            </tr>
            <tr>
              {areas.map(area => (
                <th key={area.key} colSpan={incluyeSituacion ? 3 : 2}>Resultados finales</th>
              ))}
              <th rowSpan={2}><span className="rotate-label">% de Asistencia</span></th>
              <th rowSpan={2}><span className="rotate-label">% de Ausencia</span></th>
              <th rowSpan={2}><span className="rotate-label">% de Excusa</span></th>
              {incluyeSituacion && (
                <>
                  <th rowSpan={2}><span className="rotate-label">Aplazado/a</span></th>
                  <th rowSpan={2}><span className="rotate-label">Promovido/a</span></th>
                  <th rowSpan={2}><span className="rotate-label">Reprobado/a</span></th>
                </>
              )}
            </tr>
            <tr>
              {areas.flatMap(area => [
                <th key={`${area.key}-final`}><span className="rotate-label">Final del area</span></th>,
                <th key={`${area.key}-rec`}><span className="rotate-label">Recuperacion final</span></th>,
                incluyeSituacion ? <th key={`${area.key}-esp`}><span className="rotate-label">Recuperacion especial</span></th> : null,
              ])}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: Math.max(45, estudiantesResumen.length) }).map((_, index) => {
              const item = estudiantesResumen[index]
              const resultados = item
                ? areas.map(area => calcularArea(area, asignaturas, calificaciones, item.estudiante.id))
                : []
              const situacion = item && !esEstudianteRetirado(item.estudiante) ? obtenerSituacion(resultados) : ''

              return (
                <tr key={item?.estudiante.id || index} className={item ? (index % 2 === 0 ? 'official-row-even' : 'official-row-odd') : 'official-row-empty'}>
                  <td className="text-center font-bold">{item?.estudiante.numero_orden || index + 1}</td>
                  <td className="font-semibold">{item ? obtenerNombreEstudiante(item.estudiante) : ''}</td>
                  {areas.map((area, areaIndex) => {
                    const resultado = resultados[areaIndex]
                    return (
                      <SabanaAreaCeldas
                        key={area.key}
                        finalArea={resultado?.finalArea ?? ''}
                        recuperacionFinal={resultado?.recuperacionFinal ?? ''}
                        recuperacionEspecial={resultado?.recuperacionEspecial ?? ''}
                        incluyeRecuperacionEspecial={incluyeSituacion}
                      />
                    )
                  })}
                  <td className="text-center font-bold">{item ? `${item.porcentajeAsistencia}%` : ''}</td>
                  <td className="text-center font-bold">{item ? `${item.porcentajeAusencia}%` : ''}</td>
                  <td className="text-center font-bold">{item ? `${item.porcentajeExcusa}%` : ''}</td>
                  {incluyeSituacion && (
                    <>
                      <td className="text-center font-bold">{situacion === 'Aplazado/a' ? 'X' : ''}</td>
                      <td className="text-center font-bold">{situacion === 'Promovido/a' ? 'X' : ''}</td>
                      <td className="text-center font-bold">{situacion === 'Reprobado/a' ? 'X' : ''}</td>
                    </>
                  )}
                  <td>{item && esEstudianteRetirado(item.estudiante) ? 'Retirado/a' : ''}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="mt-4 grid grid-cols-2 gap-8 text-xs font-semibold text-slate-800">
          <p>Dado en: _______________________________, a los _____ dias del mes de _______________ del ano ________</p>
          <p>Director o Directora del centro educativo: ______________________________________________</p>
          <p>Docente: {infoPerfil?.nombre_completo || infoPerfil?.full_name || '______________________________________________'}</p>
          <p>Firma y sello: ______________________________________________</p>
        </div>
      </div>
    </section>
  )
}

function SabanaAreaCeldas({
  finalArea,
  recuperacionFinal,
  recuperacionEspecial,
  incluyeRecuperacionEspecial,
}: {
  finalArea: number | string
  recuperacionFinal: number | string
  recuperacionEspecial: number | string
  incluyeRecuperacionEspecial: boolean
}) {
  return (
    <>
      <td className="text-center font-bold">{celda(finalArea)}</td>
      <td className="text-center">{celda(recuperacionFinal)}</td>
      {incluyeRecuperacionEspecial && <td className="text-center">{celda(recuperacionEspecial)}</td>}
    </>
  )
}
