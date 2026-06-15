'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../../../lib/supabase'

type Periodo = 'P1' | 'P2' | 'P3' | 'P4'
type Competencia = 'C1' | 'C2' | 'C3'
type GradoBoletin = '1ro' | '2do' | '3ro' | '4to' | '5to' | '6to'

type Estudiante = {
  id: string
  colegio_id?: string | null
  numero_orden?: number | null
  nombre_completo?: string | null
  nombres?: string | null
  apellidos?: string | null
  sigerd_id?: string | null
  seccion_id?: string | null
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
  codigo_centro?: string | null
  telefono_centro?: string | null
  distrito_educativo?: string | null
  regional_educacion?: string | null
  provincia?: string | null
  municipio?: string | null
  tanda?: string | null
}

type Seccion = {
  id: string
  grado?: string | null
  identificador?: string | null
  ano_escolar?: string | null
  tanda?: string | null
}

type Asignatura = {
  id: string
  nombre: string
}

type Calificacion = {
  asignatura_id: string
  periodo: Periodo | string
  competencia: Competencia | `${Competencia}_RP` | string
  nota: number | string | null
}

type RegistroAsistencia = {
  fecha: string
  estado: string
}

type FilaBoletin = {
  id: string
  nombre: string
  notas: Record<Competencia, Record<Periodo, number | null>>
  recuperaciones: Record<Competencia, Record<Periodo, number | null>>
  finales: Record<Competencia, number | null>
  finalArea: number | null
}

type ResumenAsistencia = Record<Periodo, { asistencia: number; ausencia: number }>

type BoletinGenerado = {
  estudiante: Estudiante
  filasBoletin: FilaBoletin[]
  asistenciaResumen: ResumenAsistencia
  totalDiasTrabajados: number
  infoSeccion: Seccion | null
  infoColegio: Colegio | null
  infoPerfil: Perfil | null
}

type ContextoBoletin = {
  perfil: Perfil | null
  seccion: Seccion | null
  colegio: Colegio | null
  asignaturas: Asignatura[]
}

const periodos: Periodo[] = ['P1', 'P2', 'P3', 'P4']
const competencias: Competencia[] = ['C1', 'C2', 'C3']

const asignaturasPrimerGrado = [
  {
    key: 'lengua-espanola',
    nombre: 'Lengua Espanola',
    aliases: ['Lengua Espanola', 'Lengua Española'],
  },
  {
    key: 'matematica',
    nombre: 'Matematica',
    aliases: ['Matematica', 'Matemática'],
  },
  {
    key: 'ciencias-sociales',
    nombre: 'Ciencias Sociales',
    aliases: ['Ciencias Sociales'],
  },
  {
    key: 'ciencias-naturaleza',
    nombre: 'Ciencias de la Naturaleza',
    aliases: ['Ciencias de la Naturaleza', 'Ciencias Naturales'],
  },
  {
    key: 'educacion-fisica',
    nombre: 'Educacion Fisica',
    aliases: ['Educacion Fisica', 'Educación Física'],
  },
  {
    key: 'formacion-integral',
    nombre: 'Formacion Integral, Humana y Religiosa',
    aliases: [
      'Formacion Integral Humana y Religiosa',
      'Formación Integral Humana y Religiosa',
      'Formacion Integral, Humana y Religiosa',
      'Formación Integral, Humana y Religiosa',
    ],
  },
  {
    key: 'educacion-artistica',
    nombre: 'Educacion Artistica',
    aliases: ['Educacion Artistica', 'Educación Artística'],
  },
]

const mesesPorPeriodo: Record<Periodo, number[]> = {
  P1: [8, 9, 10],
  P2: [11, 12, 1],
  P3: [2, 3],
  P4: [4, 5, 6],
}

const obtenerPeriodoAsistencia = (fechaISO: string): Periodo | null => {
  const fecha = new Date(`${fechaISO}T00:00:00`)
  const mes = fecha.getMonth() + 1
  return periodos.find(periodo => mesesPorPeriodo[periodo].includes(mes)) || null
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

const contarDiasTrabajados = (inicio: string, fin: string, bloqueados: Set<string>) => {
  let total = 0
  let cursor = inicio

  while (cursor <= fin) {
    if (!esFinDeSemana(cursor) && !bloqueados.has(cursor)) total++
    cursor = sumarDia(cursor)
  }

  return total
}

const normalizarFechaISO = (fecha?: string | null) => fecha ? fecha.slice(0, 10) : ''

const normalizarEstadoAsistencia = (estado?: string | null): 'P' | 'A' | null => {
  const valor = (estado || '').trim().toUpperCase()
  if (valor === 'P' || valor === 'A') return valor
  return null
}

const contarEstadoAsistencia = (
  estado: string,
  resumenPeriodo: { asistencia: number; ausencia: number }
) => {
  const estadoNormalizado = normalizarEstadoAsistencia(estado)
  if (estadoNormalizado === 'P') resumenPeriodo.asistencia += 1
  if (estadoNormalizado === 'A') resumenPeriodo.ausencia += 1
}

const etiquetaGrado: Record<string, string> = {
  '1ro': 'PRIMER GRADO',
  '2do': 'SEGUNDO GRADO',
  '3ro': 'TERCER GRADO',
  '4to': 'CUARTO GRADO',
  '5to': 'QUINTO GRADO',
  '6to': 'SEXTO GRADO',
}

const gradosConBoletin: GradoBoletin[] = ['1ro', '2do', '3ro', '4to', '5to', '6to']

const obtenerGradoBoletin = (grado?: string | null): GradoBoletin => {
  return gradosConBoletin.includes(grado as GradoBoletin) ? grado as GradoBoletin : '1ro'
}

const usaColumnasRecuperacionPedagogica = (grado: GradoBoletin) =>
  ['3ro', '4to', '5to', '6to'].includes(grado)

const usaOchoAreasCurriculares = (grado: GradoBoletin) =>
  ['4to', '5to', '6to'].includes(grado)

const obtenerAsignaturasBoletin = (grado: GradoBoletin) =>
  usaOchoAreasCurriculares(grado) ? asignaturasSegundoCiclo : asignaturasPrimerGrado

const obtenerImagenBoletin = (grado: GradoBoletin, pagina: 1 | 2) =>
  `/boletines/informe-${grado}-pagina-${pagina}.jpg`

const normalizar = (valor = '') =>
  valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

const celda = (valor: unknown) => {
  if (valor === null || valor === undefined || valor === '') return ''
  return String(valor)
}

const ultimosDosDigitos = (valor: number | string) => String(valor).slice(-2)

const rangoAnoEscolar = (anoEscolar?: string | null) => {
  const match = (anoEscolar || '').match(/(\d{4})\D+(\d{4})/)
  if (!match) {
    const actual = new Date().getFullYear()
    return { inicio: actual, fin: actual + 1, texto: anoEscolar || `${actual}-${actual + 1}` }
  }
  return { inicio: Number(match[1]), fin: Number(match[2]), texto: `${match[1]}-${match[2]}` }
}

const crearResumenAsistenciaVacio = (): ResumenAsistencia =>
  periodos.reduce((acc, periodo) => {
    acc[periodo] = { asistencia: 0, ausencia: 0 }
    return acc
  }, {} as ResumenAsistencia)

const calcularTotalesAsistencia = (asistenciaResumen: ResumenAsistencia, totalDiasTrabajados: number) => {
  const asistencia = periodos.reduce((total, periodo) => total + asistenciaResumen[periodo].asistencia, 0)
  const ausencia = periodos.reduce((total, periodo) => total + asistenciaResumen[periodo].ausencia, 0)

  return {
    asistencia,
    ausencia,
    porcentajeAsistencia: totalDiasTrabajados > 0 ? Math.round((asistencia / totalDiasTrabajados) * 100) : 0,
    porcentajeAusencia: totalDiasTrabajados > 0 ? Math.round((ausencia / totalDiasTrabajados) * 100) : 0,
  }
}

export default function GeneradorBoletines() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState('')
  const [filasBoletin, setFilasBoletin] = useState<FilaBoletin[]>([])
  const [asistenciaResumen, setAsistenciaResumen] = useState<ResumenAsistencia>(crearResumenAsistenciaVacio())
  const [totalDiasTrabajadosBoletin, setTotalDiasTrabajadosBoletin] = useState(0)
  const [boletinesSeccion, setBoletinesSeccion] = useState<BoletinGenerado[]>([])
  const [modoSeccionCompleta, setModoSeccionCompleta] = useState(false)
  const [progresoSeccion, setProgresoSeccion] = useState('')
  const [infoSeccion, setInfoSeccion] = useState<Seccion | null>(null)
  const [infoColegio, setInfoColegio] = useState<Colegio | null>(null)
  const [infoPerfil, setInfoPerfil] = useState<Perfil | null>(null)
  const [cargando, setCargando] = useState(true)
  const [cargandoBoletin, setCargandoBoletin] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const cargarEstudiantes = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        setUserId(session.user.id)

        const params = new URLSearchParams(window.location.search)
        const seccionId = params.get('seccion_id') || localStorage.getItem('ultimaSeccionActiva')

        let consulta = supabase
          .from('estudiantes')
          .select('*')
          .eq('user_id', session.user.id)
          .order('numero_orden', { ascending: true })

        if (seccionId) consulta = consulta.eq('seccion_id', seccionId)

        const { data, error } = await consulta
        if (error) throw error
        setEstudiantes(data || [])
      } catch (error) {
        console.error(error)
      } finally {
        setCargando(false)
      }
    }
    cargarEstudiantes()
  }, [])

  useEffect(() => {
    if (!estudianteSeleccionado) {
      setFilasBoletin([])
      setInfoSeccion(null)
      setInfoColegio(null)
      setInfoPerfil(null)
      return
    }
    generarBoletin(estudianteSeleccionado)
  }, [estudianteSeleccionado, userId])

  const datosEstudiante = estudiantes.find(e => e.id === estudianteSeleccionado)

  const construirBoletin = async (idEstudiante: string, contexto?: ContextoBoletin): Promise<BoletinGenerado | null> => {
    if (!userId) return null
      const estudiante = estudiantes.find(e => e.id === idEstudiante)
      if (!estudiante) return null
      let perfil = contexto?.perfil
      if (!contexto) {
        const { data } = await supabase.from('perfiles').select('*').eq('id', userId).maybeSingle()
        perfil = data || null
      }

      let seccion: Seccion | null = contexto?.seccion || null
      if (!contexto && estudiante?.seccion_id) {
        const { data } = await supabase
          .from('secciones')
          .select('*')
          .eq('id', estudiante.seccion_id)
          .eq('user_id', userId)
          .maybeSingle()
        seccion = data
      }

      let colegio: Colegio | null = contexto?.colegio || null
      if (!contexto) {
        const colegioRelacionado = perfil?.colegio_id || estudiante?.colegio_id
        if (colegioRelacionado) {
          const { data } = await supabase.from('colegios').select('*').eq('id', colegioRelacionado).maybeSingle()
          colegio = data
        } else {
          const { data } = await supabase.from('colegios').select('*').limit(1)
          colegio = data?.[0] || null
        }
      }

      let materias = contexto?.asignaturas || []
      if (!contexto) {
        const { data: asignaturas, error: errAsig } = await supabase.from('asignaturas').select('*')
        if (errAsig) throw errAsig
        materias = (asignaturas || []) as Asignatura[]
      }

      const { data: notas, error: errNotas } = await supabase
        .from('calificaciones')
        .select('*')
        .eq('estudiante_id', idEstudiante)
        .eq('user_id', userId)
      if (errNotas) throw errNotas

      const gradoBoletin = obtenerGradoBoletin(seccion?.grado)
      const asignaturasOficiales = obtenerAsignaturasBoletin(gradoBoletin)

      const filas = asignaturasOficiales.map(asignaturaOficial => {
        const materia = materias.find(item =>
          asignaturaOficial.aliases.some(alias => normalizar(alias) === normalizar(item.nombre))
        )
        const porCompetencia: Record<Competencia, Record<Periodo, number | null>> = {
          C1: { P1: null, P2: null, P3: null, P4: null },
          C2: { P1: null, P2: null, P3: null, P4: null },
          C3: { P1: null, P2: null, P3: null, P4: null },
        }
        const recuperaciones: Record<Competencia, Record<Periodo, number | null>> = {
          C1: { P1: null, P2: null, P3: null, P4: null },
          C2: { P1: null, P2: null, P3: null, P4: null },
          C3: { P1: null, P2: null, P3: null, P4: null },
        }

        competencias.forEach(competencia => {
          periodos.forEach(periodo => {
            const nota = (notas as Calificacion[] | null)?.find(n =>
              materia &&
              n.asignatura_id === materia.id &&
              n.periodo === periodo &&
              n.competencia === competencia
            )?.nota
            porCompetencia[competencia][periodo] = nota === undefined || nota === null ? null : Number(nota)

            const notaRP = (notas as Calificacion[] | null)?.find(n =>
              materia &&
              n.asignatura_id === materia.id &&
              n.periodo === periodo &&
              n.competencia === `${competencia}_RP`
            )?.nota
            recuperaciones[competencia][periodo] = notaRP === undefined || notaRP === null ? null : Number(notaRP)
          })
        })

        const finales = competencias.reduce((acc, competencia) => {
          const valores = periodos
            .map(periodo => recuperaciones[competencia][periodo] ?? porCompetencia[competencia][periodo])
            .filter((nota): nota is number => typeof nota === 'number' && !Number.isNaN(nota))

          acc[competencia] = valores.length > 0
            ? Math.round(valores.reduce((total, nota) => total + nota, 0) / valores.length)
            : null

          return acc
        }, {} as Record<Competencia, number | null>)

        const valoresFinales = competencias
          .map(competencia => finales[competencia])
          .filter((nota): nota is number => typeof nota === 'number' && !Number.isNaN(nota))

        return {
          id: materia?.id || asignaturaOficial.key,
          nombre: asignaturaOficial.nombre,
          notas: porCompetencia,
          recuperaciones,
          finales,
          finalArea: valoresFinales.length > 0
            ? Math.round(valoresFinales.reduce((total, nota) => total + nota, 0) / valoresFinales.length)
            : null,
        }
      })

      const seccionParaAsistencia = seccion || infoSeccion
      const { inicio, fin } = rangoAnoEscolar(seccionParaAsistencia?.ano_escolar)
      const fechaInicioAsistencia = `${inicio}-08-01`
      const fechaFinAsistencia = `${fin}-06-30`
      const { data: asistencia } = await supabase
        .from('asistencia')
        .select('fecha, estado')
        .eq('estudiante_id', idEstudiante)
        .eq('user_id', userId)
        .gte('fecha', fechaInicioAsistencia)
        .lte('fecha', fechaFinAsistencia)

      const { data: diasNoLaborables } = await supabase
        .from('dias_bloqueados')
        .select('fecha')
        .eq('seccion_id', seccionParaAsistencia?.id || estudiante.seccion_id)
        .gte('fecha', fechaInicioAsistencia)
        .lte('fecha', fechaFinAsistencia)

      const resumen = crearResumenAsistenciaVacio()
      const diasBloqueados = new Set((diasNoLaborables || []).map((dia: { fecha: string }) => normalizarFechaISO(dia.fecha)))
      const totalDiasTrabajados = contarDiasTrabajados(fechaInicioAsistencia, fechaFinAsistencia, diasBloqueados)

      ;(asistencia as RegistroAsistencia[] | null)?.forEach(registro => {
        const fecha = normalizarFechaISO(registro.fecha)
        if (!fecha || diasBloqueados.has(fecha) || esFinDeSemana(fecha)) return
        const periodo = obtenerPeriodoAsistencia(fecha)
        if (!periodo) return
        contarEstadoAsistencia(registro.estado, resumen[periodo])
      })

      return {
        estudiante,
        filasBoletin: filas,
        asistenciaResumen: resumen,
        totalDiasTrabajados,
        infoSeccion: seccion || null,
        infoColegio: colegio || null,
        infoPerfil: perfil || null,
      }
  }

  const generarBoletin = async (idEstudiante: string) => {
    if (!userId) return
    setCargandoBoletin(true)
    setModoSeccionCompleta(false)
    setBoletinesSeccion([])
    setProgresoSeccion('')
    try {
      const boletin = await construirBoletin(idEstudiante)
      if (!boletin) return
      setInfoPerfil(boletin.infoPerfil)
      setInfoSeccion(boletin.infoSeccion)
      setInfoColegio(boletin.infoColegio)
      setFilasBoletin(boletin.filasBoletin)
      setAsistenciaResumen(boletin.asistenciaResumen)
      setTotalDiasTrabajadosBoletin(boletin.totalDiasTrabajados)
    } catch (error) {
      console.error(error)
    } finally {
      setCargandoBoletin(false)
    }
  }

  const imprimirBoletin = () => window.print()

  const prepararSeccionCompleta = async () => {
    if (!userId || estudiantes.length === 0) return
    setCargandoBoletin(true)
    setModoSeccionCompleta(true)
    setEstudianteSeleccionado('')
    setFilasBoletin([])
    setInfoSeccion(null)
    setInfoColegio(null)
    setInfoPerfil(null)
    setBoletinesSeccion([])
    try {
      const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', userId).maybeSingle()
      let seccion: Seccion | null = null
      const seccionId = estudiantes[0]?.seccion_id
      if (seccionId) {
        const { data } = await supabase
          .from('secciones')
          .select('*')
          .eq('id', seccionId)
          .eq('user_id', userId)
          .maybeSingle()
        seccion = data || null
      }

      let colegio: Colegio | null = null
      const colegioRelacionado = perfil?.colegio_id || estudiantes[0]?.colegio_id
      if (colegioRelacionado) {
        const { data } = await supabase.from('colegios').select('*').eq('id', colegioRelacionado).maybeSingle()
        colegio = data || null
      } else {
        const { data } = await supabase.from('colegios').select('*').limit(1)
        colegio = data?.[0] || null
      }

      const { data: asignaturas, error: errAsig } = await supabase.from('asignaturas').select('*')
      if (errAsig) throw errAsig
      const contexto: ContextoBoletin = {
        perfil: perfil || null,
        seccion,
        colegio,
        asignaturas: (asignaturas || []) as Asignatura[],
      }

      const generados: BoletinGenerado[] = []
      for (const [index, estudiante] of estudiantes.entries()) {
        setProgresoSeccion(`Preparando ${index + 1}/${estudiantes.length}: ${estudiante.nombre_completo || estudiante.nombres || 'Estudiante'}`)
        const boletin = await construirBoletin(estudiante.id, contexto)
        if (boletin) {
          generados.push(boletin)
          setBoletinesSeccion([...generados])
        }
      }
      setProgresoSeccion(`Listos ${generados.length} boletines de ${estudiantes.length}`)
    } catch (error) {
      console.error(error)
      setProgresoSeccion('No se pudo preparar la seccion completa.')
    } finally {
      setCargandoBoletin(false)
    }
  }

  if (cargando) return <div className="p-10 text-center text-slate-500 font-medium">Cargando base de datos...</div>

  const gradoActual = obtenerGradoBoletin(infoSeccion?.grado)
  const gradoTitulo = etiquetaGrado[gradoActual]

  return (
    <div className="min-h-full bg-slate-100 p-6 text-slate-900 print:bg-white print:p-0">
      <div className="mx-auto mb-6 max-w-5xl print:hidden">
        <h1 className="text-2xl font-black text-slate-800">Boletines oficiales</h1>
        <p className="mt-1 text-sm text-slate-500">
          Formato oficial para {gradoTitulo.toLowerCase()} del Nivel Primario. Los campos vacios se imprimen como lineas para completar.
        </p>

        <div className="mt-5 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
          <label className="text-sm font-bold text-slate-700">Seleccionar estudiante</label>
          <select
            className="min-h-11 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={estudianteSeleccionado}
            onChange={(e) => setEstudianteSeleccionado(e.target.value)}
          >
            <option value="">Elige un estudiante de la seccion activa</option>
            {estudiantes.map(est => (
              <option key={est.id} value={est.id}>{est.numero_orden}. {est.nombre_completo}</option>
            ))}
          </select>

          {estudianteSeleccionado && (
            <button
              onClick={imprimirBoletin}
              className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-700"
            >
              Imprimir
            </button>
          )}
          {estudiantes.length > 0 && (
            <button
              onClick={prepararSeccionCompleta}
              disabled={cargandoBoletin}
              className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              Preparar seccion completa
            </button>
          )}
          {modoSeccionCompleta && boletinesSeccion.length > 0 && (
            <button
              onClick={imprimirBoletin}
              className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-700"
            >
              Imprimir seccion
            </button>
          )}
        </div>
        {progresoSeccion && (
          <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm font-semibold text-blue-800">
            {progresoSeccion}
          </div>
        )}

        {estudianteSeleccionado && infoSeccion?.grado && !gradosConBoletin.includes(infoSeccion.grado as GradoBoletin) && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
            No hay una plantilla especifica para {infoSeccion.grado}; se usara el formato de 1er grado como vista preliminar.
          </div>
        )}
      </div>

      {cargandoBoletin && boletinesSeccion.length === 0 ? (
        <div className="py-12 text-center text-slate-500">Generando informe...</div>
      ) : modoSeccionCompleta && boletinesSeccion.length > 0 ? (
        <div className="boletin-print-root mx-auto max-w-[1500px] space-y-6 print:max-w-none print:space-y-0">
          {boletinesSeccion.map((boletin) => (
            <BoletinDocumento key={boletin.estudiante.id} boletin={boletin} />
          ))}
        </div>
      ) : estudianteSeleccionado && datosEstudiante ? (
        <div className="boletin-print-root mx-auto max-w-[1500px] space-y-6 print:max-w-none print:space-y-0">
          <BoletinDocumento
            boletin={{
              estudiante: datosEstudiante,
              filasBoletin,
              asistenciaResumen,
              totalDiasTrabajados: totalDiasTrabajadosBoletin,
              infoSeccion,
              infoColegio,
              infoPerfil,
            }}
          />
        </div>
      ) : null}

      <style jsx global>{`
        .boletin-page,
        .boletin-page * {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }

        .official-template-page {
          position: relative;
          aspect-ratio: 2048 / 1581;
          width: 100%;
          overflow: hidden;
          background: #fff;
        }

        .template-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          display: block;
          width: 100%;
          height: 100%;
          object-fit: fill;
          image-rendering: auto;
          user-select: none;
        }

        .template-text,
        .template-grade {
          position: absolute;
          z-index: 1;
          color: #111827;
          font-family: Arial, Helvetica, sans-serif;
          line-height: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .template-text {
          font-size: clamp(7px, 1.8vw, 28px);
          font-weight: 600;
          transform: translateY(-72%);
        }

        .template-grade {
          min-width: 2.8%;
          text-align: center;
          font-size: clamp(7px, 1.5vw, 50px);
          font-weight: 700;
          transform: translate(-50%, -50%);
        }

        @media print {
          @page {
            size: letter landscape;
            margin: 0;
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

          .boletin-print-root,
          .boletin-print-root * {
            visibility: visible !important;
          }

          .h-screen {
            height: auto !important;
          }

          .overflow-hidden,
          .overflow-x-hidden,
          .overflow-y-auto {
            overflow: visible !important;
          }

          aside,
          nav,
          button,
          .fixed,
          .print\\:hidden {
            display: none !important;
          }

          main,
          .boletin-print-root {
            display: block !important;
            width: 11in !important;
            max-width: none !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .boletin-page {
            width: 11in;
            height: 8.5in;
            min-height: 8.5in;
            margin: 0;
            overflow: hidden !important;
            break-after: page;
            page-break-after: always;
            box-shadow: none !important;
          }

          .official-template-page {
            aspect-ratio: auto;
          }

          .boletin-page:last-child {
            page-break-after: auto;
          }
        }
      `}</style>
    </div>
  )
}

function BoletinDocumento({ boletin }: { boletin: BoletinGenerado }) {
  const gradoActual = obtenerGradoBoletin(boletin.infoSeccion?.grado)
  const anoEscolar = rangoAnoEscolar(boletin.infoSeccion?.ano_escolar)
  const layoutCalificaciones = obtenerLayoutCalificaciones(gradoActual)
  const layoutAsistencia = obtenerLayoutAsistencia(gradoActual)
  const layoutPortada = obtenerLayoutPortada(gradoActual)
  const totalesAsistencia = calcularTotalesAsistencia(boletin.asistenciaResumen, boletin.totalDiasTrabajados)

  return (
    <>
      <section className="boletin-page official-template-page official-cover-page bg-white shadow-sm print:shadow-none">
        <TemplateImage src={obtenerImagenBoletin(gradoActual, 1)} alt={`Formato oficial boletin ${gradoActual} pagina 1`} />
        <TemplateText {...layoutPortada.anoInicio}>{ultimosDosDigitos(anoEscolar.inicio)}</TemplateText>
        <TemplateText {...layoutPortada.anoFin}>{ultimosDosDigitos(anoEscolar.fin)}</TemplateText>
        <TemplateText {...layoutPortada.seccion}>{boletin.infoSeccion?.identificador}</TemplateText>
        <TemplateText {...layoutPortada.numeroOrden}>{boletin.estudiante.numero_orden}</TemplateText>
        <TemplateText {...layoutPortada.nombres}>{boletin.estudiante.nombres}</TemplateText>
        <TemplateText {...layoutPortada.apellidos}>{boletin.estudiante.apellidos}</TemplateText>
        <TemplateText {...layoutPortada.sigerd}>{boletin.estudiante.sigerd_id}</TemplateText>
        <TemplateText {...layoutPortada.docente}>{boletin.infoPerfil?.nombre_completo || boletin.infoPerfil?.full_name}</TemplateText>
        <TemplateText {...layoutPortada.centro}>{boletin.infoColegio?.nombre}</TemplateText>
        <TemplateText {...layoutPortada.codigoCentro}>{boletin.infoColegio?.codigo_centro}</TemplateText>
        <TemplateText {...layoutPortada.tanda}>{boletin.infoSeccion?.tanda || boletin.infoColegio?.tanda}</TemplateText>
        <TemplateText {...layoutPortada.telefono}>{boletin.infoColegio?.telefono_centro}</TemplateText>
        <TemplateText {...layoutPortada.distrito}>{boletin.infoColegio?.distrito_educativo}</TemplateText>
        <TemplateText {...layoutPortada.regional}>{boletin.infoColegio?.regional_educacion}</TemplateText>
        <TemplateText {...layoutPortada.provincia}>{boletin.infoColegio?.provincia}</TemplateText>
        <TemplateText {...layoutPortada.municipio}>{boletin.infoColegio?.municipio}</TemplateText>
      </section>

      <section className="boletin-page official-template-page official-grades-page bg-white shadow-sm print:shadow-none">
        <TemplateImage src={obtenerImagenBoletin(gradoActual, 2)} alt={`Formato oficial boletin ${gradoActual} pagina 2`} />
        {boletin.filasBoletin.map((fila, rowIndex) => (
          <TemplateGradeRow key={fila.id} fila={fila} rowIndex={rowIndex} layout={layoutCalificaciones} />
        ))}
        {periodos.map((periodo, index) => (
          <div key={periodo}>
            <TemplateGrade left={layoutAsistencia.columnLefts.asistencia} top={layoutAsistencia.rowTops[index]}>{boletin.asistenciaResumen[periodo].asistencia || ''}</TemplateGrade>
            <TemplateGrade left={layoutAsistencia.columnLefts.ausencia} top={layoutAsistencia.rowTops[index]}>{boletin.asistenciaResumen[periodo].ausencia || ''}</TemplateGrade>
          </div>
        ))}
        <TemplateGrade left={layoutAsistencia.columnLefts.porcentajeAsistencia} top={layoutAsistencia.totalTop}>{boletin.totalDiasTrabajados ? `${totalesAsistencia.porcentajeAsistencia}%` : ''}</TemplateGrade>
        <TemplateGrade left={layoutAsistencia.columnLefts.porcentajeAusencia} top={layoutAsistencia.totalTop}>{boletin.totalDiasTrabajados ? `${totalesAsistencia.porcentajeAusencia}%` : ''}</TemplateGrade>
      </section>
    </>
  )
}

type GradeLayout = {
  rowTops: number[]
  columnLefts: number[]
  incluyeRecuperacionPedagogica: boolean
}

type AttendanceLayout = {
  rowTops: number[]
  totalTop: number
  columnLefts: {
    asistencia: number
    ausencia: number
    porcentajeAsistencia: number
    porcentajeAusencia: number
  }
}

type TemplatePosition = {
  left: number
  top: number
  width: number
}

type CoverLayout = {
  anoInicio: TemplatePosition
  anoFin: TemplatePosition
  seccion: TemplatePosition
  numeroOrden: TemplatePosition
  nombres: TemplatePosition
  apellidos: TemplatePosition
  sigerd: TemplatePosition
  docente: TemplatePosition
  centro: TemplatePosition
  codigoCentro: TemplatePosition
  tanda: TemplatePosition
  telefono: TemplatePosition
  distrito: TemplatePosition
  regional: TemplatePosition
  provincia: TemplatePosition
  municipio: TemplatePosition
}

const coverLayoutBasico: CoverLayout = {
  anoInicio: { left: 72.2, top: 50.25, width: 12 },
  anoFin: { left: 81.4, top: 50.25, width: 12 },
  seccion: { left: 59.8, top: 54.65, width: 17 },
  numeroOrden: { left: 84.5, top: 54.65, width: 14 },
  nombres: { left: 61.6, top: 57.6, width: 35 },
  apellidos: { left: 61.6, top: 61.3, width: 35 },
  sigerd: { left: 78.6, top: 64.95, width: 18 },
  docente: { left: 59.5, top: 68.05, width: 37 },
  centro: { left: 65.2, top: 71.8, width: 31 },
  codigoCentro: { left: 65.2, top: 75.15, width: 31 },
  tanda: { left: 58.4, top: 78.45, width: 38 },
  telefono: { left: 66.8, top: 82, width: 29 },
  distrito: { left: 67.1, top: 85.4, width: 29 },
  regional: { left: 69.4, top: 89.15, width: 27 },
  provincia: { left: 61, top: 92.35, width: 34 },
  municipio: { left: 61.5, top: 95.76, width: 35 },
}

const coverLayoutSegundo: CoverLayout = {
  anoInicio: { left: 73.00, top: 51.50, width: 6.4 },
  anoFin: { left: 82.0, top: 51.50, width: 6.4 },
  seccion: { left: 60.70, top: 55.50, width: 12.5 },
  numeroOrden: { left: 85.2, top: 55.50, width: 12.5 },
  nombres: { left: 62.5, top: 58.80, width: 35.2 },
  apellidos: { left: 62.6, top: 62.00, width: 35.2 },
  sigerd: { left: 79.9, top: 65.42, width: 18 },
  docente: { left: 60.8, top: 68.56, width: 37 },
  centro: { left: 66.3, top: 71.80, width: 31.5 },
  codigoCentro: { left: 67, top: 75.10, width: 30.8 },
  tanda: { left: 59.35, top: 78.38, width: 38.5 },
  telefono: { left: 67.8, top: 81.68, width: 30 },
  distrito: { left: 67, top: 85.00, width: 30.8 },
  regional: { left: 70.1, top: 88.21, width: 27.7 },
  provincia: { left: 61.6, top: 91.44, width: 36.2 },
  municipio: { left: 61.7, top: 94.64, width: 36.1 },
}

const coverLayoutTercero: CoverLayout = {
  anoInicio: { left: 72.95, top: 50.00, width: 6.4 },
  anoFin: { left: 81.85, top: 50.00, width: 6.4 },
  seccion: { left: 59.7, top: 54.29, width: 12.5 },
  numeroOrden: { left: 85.1, top: 54.29, width: 12.5 },
  nombres: { left: 62.4, top: 57.57, width: 35.2 },
  apellidos: { left: 62.55, top: 60.70, width: 35.2 },
  sigerd: { left: 79.8, top: 64.00, width: 18 },
  docente: { left: 60.7, top: 67.20, width: 37 },
  centro: { left: 66.2, top: 70.48, width: 31.5 },
  codigoCentro: { left: 66.9, top: 73.77, width: 30.8 },
  tanda: { left: 59.2, top: 77.00, width: 38.5 },
  telefono: { left: 67.7, top: 80.27, width: 30 },
  distrito: { left: 66.9, top: 83.5, width: 30.8 },
  regional: { left: 70, top: 86.78, width: 27.7 },
  provincia: { left: 61.5, top: 90.06, width: 36.2 },
  municipio: { left: 61.6, top: 93.29, width: 36.1 },
}

const coverLayoutCuarto: CoverLayout = {
  anoInicio: { left: 72.95, top: 50.20, width: 6.4 },
  anoFin: { left: 81.85, top: 50.20, width: 6.4 },
  seccion: { left: 59.7, top: 54.53, width: 12.5 },
  numeroOrden: { left: 85.1, top: 54.53, width: 12.5 },
  nombres: { left: 62.4, top: 57.56, width: 35.2 },
  apellidos: { left: 62.55, top: 60.86, width: 35.2 },
  sigerd: { left: 79.8, top: 64.10, width: 18 },
  docente: { left: 60.7, top: 67.39, width: 37 },
  centro: { left: 66.2, top: 70.63, width: 31.5 },
  codigoCentro: { left: 66.9, top: 73.93, width: 30.8 },
  tanda: { left: 59.2, top: 77.22, width: 38.5 },
  telefono: { left: 67.7, top: 80.46, width: 30 },
  distrito: { left: 66.9, top: 83.76, width: 30.8 },
  regional: { left: 70, top: 86.90, width: 27.7 },
  provincia: { left: 61.5, top: 90.29, width: 36.2 },
  municipio: { left: 61.6, top: 93.68, width: 36.1 },
}

const coverLayoutQuinto: CoverLayout = {
  anoInicio: { left: 72.95, top: 50.09, width: 6.4 },
  anoFin: { left: 81.85, top: 50.09, width: 6.4 },
  seccion: { left: 59.7, top: 54.33, width: 12.5 },
  numeroOrden: { left: 85.1, top: 54.33, width: 12.5 },
  nombres: { left: 62.4, top: 57.62, width: 35.2 },
  apellidos: { left: 62.55, top: 60.92, width: 35.2 },
  sigerd: { left: 79.8, top: 64.16, width: 18 },
  docente: { left: 60.7, top: 67.45, width: 37 },
  centro: { left: 66.2, top: 70.69, width: 31.5 },
  codigoCentro: { left: 66.9, top: 73.98, width: 30.8 },
  tanda: { left: 59.2, top: 77.42, width: 38.5 },
  telefono: { left: 67.7, top: 80.52, width: 30 },
  distrito: { left: 66.9, top: 83.81, width: 30.8 },
  regional: { left: 70, top: 87.05, width: 27.7 },
  provincia: { left: 61.5, top: 90.35, width: 36.2 },
  municipio: { left: 61.6, top: 93.58, width: 36.1 },
}

const coverLayoutSexto: CoverLayout = {
  anoInicio: { left: 72.95, top: 50.24, width: 6.4 },
  anoFin: { left: 81.85, top: 50.24, width: 6.4 },
  seccion: { left: 59.7, top: 54.48, width: 12.5 },
  numeroOrden: { left: 85.1, top: 54.48, width: 12.5 },
  nombres: { left: 62.4, top: 57.77, width: 35.2 },
  apellidos: { left: 62.55, top: 61.01, width: 35.2 },
  sigerd: { left: 79.8, top: 64.31, width: 18 },
  docente: { left: 60.7, top: 67.61, width: 37 },
  centro: { left: 66.2, top: 70.85, width: 31.5 },
  codigoCentro: { left: 66.9, top: 74.15, width: 30.8 },
  tanda: { left: 59.2, top: 77.39, width: 38.5 },
  telefono: { left: 67.7, top: 80.68, width: 30 },
  distrito: { left: 66.9, top: 83.92, width: 30.8 },
  regional: { left: 70, top: 87.22, width: 27.7 },
  provincia: { left: 61.5, top: 90.52, width: 36.2 },
  municipio: { left: 61.6, top: 93.76, width: 36.1 },
}

const obtenerLayoutPortada = (grado: GradoBoletin) =>
  grado === '2do'
    ? coverLayoutSegundo
    : grado === '3ro'
      ? coverLayoutTercero
      : grado === '4to'
        ? coverLayoutCuarto
        : grado === '5to'
          ? coverLayoutQuinto
          : grado === '6to'
            ? coverLayoutSexto
            : coverLayoutBasico

const gradeRowTopsBasico = [18.37, 22.93, 27.62, 32.37, 36.97, 41.62, 46.32]
const gradeColumnLeftsBasico = [
  23.54, 28.35, 33.16, 37.97,
  42.78, 47.6, 52.4, 57.22,
  62.03, 66.84, 71.65, 76.46,
  80.85, 84.81, 88.76, 92.71,
]

const asignaturasSegundoCiclo = [
  ...asignaturasPrimerGrado.slice(0, 4),
  {
    key: 'lenguas-extranjeras',
    nombre: 'Lenguas Extranjeras (ingles)',
    aliases: [
      'Lenguas Extranjeras',
      'Lenguas Extranjeras (ingles)',
      'Lenguas Extranjeras (inglés)',
      'Ingles',
      'Inglés',
      'Idioma Ingles',
      'Idioma Inglés',
    ],
  },
  ...asignaturasPrimerGrado.slice(4),
]
const gradeRowTopsConRecuperacion = [18.88, 23.27, 27.67, 32.07, 36.46, 40.86, 45.25]
const gradeColumnLeftsConRecuperacion = [
  21.07, 23.58, 26.09, 28.61, 31.13, 33.66, 36.16, 38.67,
  41.2, 43.71, 46.23, 48.75, 51.26, 53.78, 56.29, 58.8,
  61.33, 63.84, 66.35, 68.88, 71.39, 73.91, 76.42, 78.94,
  81.67, 84.6, 87.55, 90.5,
]
const gradeLayoutBasico: GradeLayout = {
  rowTops: gradeRowTopsBasico,
  columnLefts: gradeColumnLeftsBasico,
  incluyeRecuperacionPedagogica: false,
}
const gradeLayoutSegundo: GradeLayout = {
  rowTops: [18.83, 23.24, 27.65, 32.06, 36.47, 40.89, 45.3],
  columnLefts: [
    25.67, 30.09, 34.52, 38.94,
    43.34, 47.75, 52.17, 56.59,
    61, 65.42, 69.84, 74.24,
    78.57, 82.84, 87.11, 91.36,
  ],
  incluyeRecuperacionPedagogica: false,
}
const gradeLayoutConRecuperacion: GradeLayout = {
  rowTops: gradeRowTopsConRecuperacion,
  columnLefts: gradeColumnLeftsConRecuperacion,
  incluyeRecuperacionPedagogica: true,
}
const gradeLayoutSegundoCiclo: GradeLayout = {
  rowTops: [18.8, 23.22, 27.63, 32.05, 36.47, 40.89, 45.32, 49.7],
  columnLefts: gradeColumnLeftsConRecuperacion,
  incluyeRecuperacionPedagogica: true,
}
const obtenerLayoutCalificaciones = (grado: GradoBoletin) => {
  if (grado === '2do') return gradeLayoutSegundo
  if (usaOchoAreasCurriculares(grado)) return gradeLayoutSegundoCiclo
  if (usaColumnasRecuperacionPedagogica(grado)) return gradeLayoutConRecuperacion
  return gradeLayoutBasico
}
const attendanceLayoutBasico: AttendanceLayout = {
  rowTops: [82.27, 86.1, 90, 93.97],
  totalTop: 88.17,
  columnLefts: {
    asistencia: 10.77,
    ausencia: 17.16,
    porcentajeAsistencia: 23.62,
    porcentajeAusencia: 30.08,
  },
}
const attendanceLayoutSegundo: AttendanceLayout = {
  rowTops: [85.77, 88.93, 92.09, 95.27],
  totalTop: 90.52,
  columnLefts: {
    asistencia: 11.75,
    ausencia: 18.02,
    porcentajeAsistencia: 24.29,
    porcentajeAusencia: 30.56,
  },
}
const attendanceLayoutTercero: AttendanceLayout = {
  rowTops: [85.61, 88.78, 91.93, 95.08],
  totalTop: 90.36,
  columnLefts: {
    asistencia: 11.78,
    ausencia: 18.04,
    porcentajeAsistencia: 24.3,
    porcentajeAusencia: 30.56,
  },
}
const attendanceLayoutCuarto: AttendanceLayout = {
  rowTops: [85.78, 88.96, 92.13, 95.28],
  totalTop: 90.55,
  columnLefts: {
    asistencia: 11.78,
    ausencia: 18.04,
    porcentajeAsistencia: 24.3,
    porcentajeAusencia: 30.56,
  },
}
const attendanceLayoutQuinto: AttendanceLayout = {
  rowTops: [85.84, 89.01, 92.17, 95.34],
  totalTop: 90.58,
  columnLefts: {
    asistencia: 11.76,
    ausencia: 18.01,
    porcentajeAsistencia: 24.28,
    porcentajeAusencia: 30.54,
  },
}
const attendanceLayoutSexto: AttendanceLayout = {
  rowTops: [85.95, 89.13, 92.31, 95.49],
  totalTop: 90.72,
  columnLefts: {
    asistencia: 11.78,
    ausencia: 18.03,
    porcentajeAsistencia: 24.28,
    porcentajeAusencia: 30.54,
  },
}
const obtenerLayoutAsistencia = (grado: GradoBoletin) =>
  grado === '2do'
    ? attendanceLayoutSegundo
    : grado === '3ro'
      ? attendanceLayoutTercero
      : grado === '4to'
        ? attendanceLayoutCuarto
        : grado === '5to'
          ? attendanceLayoutQuinto
          : grado === '6to'
            ? attendanceLayoutSexto
            : attendanceLayoutBasico

function TemplateImage({ src, alt }: { src: string; alt: string }) {
  return <img className="template-bg" src={src} alt={alt} draggable={false} />
}

function TemplateText({
  children,
  left,
  top,
  width,
}: {
  children: ReactNode
  left: number
  top: number
  width: number
}) {
  return (
    <span className="template-text" style={{ left: `${left}%`, top: `${top}%`, width: `${width}%` }}>
      {celda(children)}
    </span>
  )
}

function TemplateGrade({
  children,
  left,
  top,
}: {
  children: ReactNode
  left: number
  top: number
}) {
  return (
    <span className="template-grade" style={{ left: `${left}%`, top: `${top}%` }}>
      {celda(children)}
    </span>
  )
}

function TemplateGradeRow({
  fila,
  rowIndex,
  layout,
}: {
  fila: FilaBoletin
  rowIndex: number
  layout: GradeLayout
}) {
  const valoresPeriodo = layout.incluyeRecuperacionPedagogica
    ? competencias.flatMap(competencia =>
        periodos.flatMap(periodo => [
          fila.notas[competencia][periodo],
          fila.recuperaciones[competencia][periodo],
        ])
      )
    : competencias.flatMap(competencia => periodos.map(periodo => fila.notas[competencia][periodo]))

  const valores = [
    ...valoresPeriodo,
    ...competencias.map(competencia => fila.finales[competencia]),
    fila.finalArea,
  ]

  return (
    <>
      {valores.map((valor, columnIndex) => (
        <TemplateGrade
          key={`${fila.id}-${columnIndex}`}
          left={layout.columnLefts[columnIndex]}
          top={layout.rowTops[rowIndex]}
        >
          {valor}
        </TemplateGrade>
      ))}
    </>
  )
}
