'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '../../../lib/supabase'

type Periodo = 'P1' | 'P2' | 'P3' | 'P4'
type Competencia = 'C1' | 'C2' | 'C3'

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
  competencia: Competencia | string
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
  finales: Record<Competencia, number | null>
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

const etiquetaGrado: Record<string, string> = {
  '1ro': 'PRIMER GRADO',
  '2do': 'SEGUNDO GRADO',
  '3ro': 'TERCER GRADO',
  '4to': 'CUARTO GRADO',
  '5to': 'QUINTO GRADO',
  '6to': 'SEXTO GRADO',
}

const normalizar = (valor = '') =>
  valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

const celda = (valor: unknown) => {
  if (valor === null || valor === undefined || valor === '') return ''
  return String(valor)
}

const rangoAnoEscolar = (anoEscolar?: string | null) => {
  const match = (anoEscolar || '').match(/(\d{4})\D+(\d{4})/)
  if (!match) {
    const actual = new Date().getFullYear()
    return { inicio: actual, fin: actual + 1, texto: anoEscolar || `${actual}-${actual + 1}` }
  }
  return { inicio: Number(match[1]), fin: Number(match[2]), texto: `${match[1]}-${match[2]}` }
}

export default function GeneradorBoletines() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState('')
  const [filasBoletin, setFilasBoletin] = useState<FilaBoletin[]>([])
  const [asistenciaResumen, setAsistenciaResumen] = useState<Record<Periodo, { asistencia: number; ausencia: number }>>({
    P1: { asistencia: 0, ausencia: 0 },
    P2: { asistencia: 0, ausencia: 0 },
    P3: { asistencia: 0, ausencia: 0 },
    P4: { asistencia: 0, ausencia: 0 },
  })
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

  const anoEscolar = useMemo(() => rangoAnoEscolar(infoSeccion?.ano_escolar), [infoSeccion?.ano_escolar])
  const totalesAsistencia = useMemo(() => {
    const asistencia = periodos.reduce((total, periodo) => total + asistenciaResumen[periodo].asistencia, 0)
    const ausencia = periodos.reduce((total, periodo) => total + asistenciaResumen[periodo].ausencia, 0)
    const total = asistencia + ausencia

    return {
      asistencia,
      ausencia,
      porcentajeAsistencia: total > 0 ? Math.round((asistencia / total) * 100) : 0,
      porcentajeAusencia: total > 0 ? Math.round((ausencia / total) * 100) : 0,
    }
  }, [asistenciaResumen])

  const generarBoletin = async (idEstudiante: string) => {
    if (!userId) return
    setCargandoBoletin(true)
    try {
      const estudiante = estudiantes.find(e => e.id === idEstudiante)
      const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', userId).maybeSingle()

      let seccion: Seccion | null = null
      if (estudiante?.seccion_id) {
        const { data } = await supabase
          .from('secciones')
          .select('*')
          .eq('id', estudiante.seccion_id)
          .eq('user_id', userId)
          .maybeSingle()
        seccion = data
      }

      let colegio: Colegio | null = null
      const colegioRelacionado = perfil?.colegio_id || estudiante?.colegio_id
      if (colegioRelacionado) {
        const { data } = await supabase.from('colegios').select('*').eq('id', colegioRelacionado).maybeSingle()
        colegio = data
      } else {
        const { data } = await supabase.from('colegios').select('*').limit(1)
        colegio = data?.[0] || null
      }

      const { data: asignaturas, error: errAsig } = await supabase.from('asignaturas').select('*')
      if (errAsig) throw errAsig

      const { data: notas, error: errNotas } = await supabase
        .from('calificaciones')
        .select('*')
        .eq('estudiante_id', idEstudiante)
        .eq('user_id', userId)
      if (errNotas) throw errNotas

      const materias = (asignaturas || []) as Asignatura[]

      const filas = asignaturasPrimerGrado.map(asignaturaOficial => {
        const materia = materias.find(item =>
          asignaturaOficial.aliases.some(alias => normalizar(alias) === normalizar(item.nombre))
        )
        const porCompetencia: Record<Competencia, Record<Periodo, number | null>> = {
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
          })
        })

        const finales = competencias.reduce((acc, competencia) => {
          const valores = periodos
            .map(periodo => porCompetencia[competencia][periodo])
            .filter((nota): nota is number => typeof nota === 'number' && !Number.isNaN(nota))

          acc[competencia] = valores.length > 0
            ? Math.round(valores.reduce((total, nota) => total + nota, 0) / valores.length)
            : null

          return acc
        }, {} as Record<Competencia, number | null>)

        return {
          id: materia?.id || asignaturaOficial.key,
          nombre: asignaturaOficial.nombre,
          notas: porCompetencia,
          finales,
        }
      })

      const seccionParaAsistencia = seccion || infoSeccion
      const { inicio, fin } = rangoAnoEscolar(seccionParaAsistencia?.ano_escolar)
      const { data: asistencia } = await supabase
        .from('asistencia')
        .select('fecha, estado')
        .eq('estudiante_id', idEstudiante)
        .eq('user_id', userId)
        .gte('fecha', `${inicio}-08-01`)
        .lte('fecha', `${fin}-06-30`)

      const resumen = periodos.reduce((acc, periodo) => {
        acc[periodo] = { asistencia: 0, ausencia: 0 }
        return acc
      }, {} as Record<Periodo, { asistencia: number; ausencia: number }>)

      ;(asistencia as RegistroAsistencia[] | null)?.forEach(registro => {
        const fecha = new Date(`${registro.fecha}T00:00:00`)
        const mes = fecha.getMonth() + 1
        const periodo = periodos.find(p => mesesPorPeriodo[p].includes(mes))
        if (!periodo) return
        if (registro.estado === 'P') resumen[periodo].asistencia += 1
        else resumen[periodo].ausencia += 1
      })

      setInfoPerfil(perfil || null)
      setInfoSeccion(seccion || null)
      setInfoColegio(colegio || null)
      setFilasBoletin(filas)
      setAsistenciaResumen(resumen)
    } catch (error) {
      console.error(error)
    } finally {
      setCargandoBoletin(false)
    }
  }

  const imprimirBoletin = () => window.print()

  if (cargando) return <div className="p-10 text-center text-slate-500 font-medium">Cargando base de datos...</div>

  const gradoTitulo = etiquetaGrado[infoSeccion?.grado || ''] || 'PRIMER GRADO'

  return (
    <div className="min-h-full bg-slate-100 p-6 text-slate-900 print:bg-white print:p-0">
      <div className="mx-auto mb-6 max-w-5xl print:hidden">
        <h1 className="text-2xl font-black text-slate-800">Boletines oficiales</h1>
        <p className="mt-1 text-sm text-slate-500">
          Formato piloto para 1er grado del Nivel Primario. Los campos vacios se imprimen como lineas para completar.
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
        </div>

        {estudianteSeleccionado && infoSeccion?.grado && infoSeccion.grado !== '1ro' && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
            Este formato esta optimizado para 1er grado. Para {infoSeccion.grado} lo usaremos solo como vista preliminar.
          </div>
        )}
      </div>

      {cargandoBoletin ? (
        <div className="py-12 text-center text-slate-500">Generando informe...</div>
      ) : estudianteSeleccionado && datosEstudiante ? (
        <div className="mx-auto max-w-[1500px] space-y-6 print:max-w-none print:space-y-0">
          <section className="boletin-page official-template-page official-cover-page bg-white shadow-sm print:shadow-none">
            <TemplateImage src="/boletines/informe-1ro-pagina-1.jpg" alt="Formato oficial boletin 1er grado pagina 1" />
            <span className="sigerd-helper">(Numero de identificacion SIGERD)</span>
            <TemplateText left={71.2} top={49.35} width={8}>{anoEscolar.inicio}</TemplateText>
            <TemplateText left={81.6} top={49.35} width={8}>{anoEscolar.fin}</TemplateText>
            <TemplateText left={59.8} top={53.35} width={17}>{infoSeccion?.identificador}</TemplateText>
            <TemplateText left={83.5} top={53.35} width={14}>{datosEstudiante.numero_orden}</TemplateText>
            <TemplateText left={61.6} top={56.65} width={35}>{datosEstudiante.nombres}</TemplateText>
            <TemplateText left={61.6} top={59.75} width={35}>{datosEstudiante.apellidos}</TemplateText>
            <TemplateText left={78.6} top={62.95} width={18}>{datosEstudiante.sigerd_id}</TemplateText>
            <TemplateText left={59.5} top={66.05} width={37}>{infoPerfil?.nombre_completo || infoPerfil?.full_name}</TemplateText>
            <TemplateText left={65.2} top={69.15} width={31}>{infoColegio?.nombre}</TemplateText>
            <TemplateText left={65.2} top={72.35} width={31}>{infoColegio?.codigo_centro}</TemplateText>
            <TemplateText left={58.4} top={75.45} width={38}>{infoSeccion?.tanda || infoColegio?.tanda}</TemplateText>
            <TemplateText left={66.8} top={78.7} width={29}>{infoColegio?.telefono_centro}</TemplateText>
            <TemplateText left={67.1} top={81.9} width={29}>{infoColegio?.distrito_educativo}</TemplateText>
            <TemplateText left={69.4} top={85.15} width={27}>{infoColegio?.regional_educacion}</TemplateText>
            <TemplateText left={62.2} top={88.35} width={34}>{infoColegio?.provincia}</TemplateText>
            <TemplateText left={61.5} top={91.6} width={35}>{infoColegio?.municipio}</TemplateText>
          </section>

          <section className="boletin-page official-template-page official-grades-page bg-white shadow-sm print:shadow-none">
            <TemplateImage src="/boletines/informe-1ro-pagina-2.jpg" alt="Formato oficial boletin 1er grado pagina 2" />
            {filasBoletin.map((fila, rowIndex) => (
              <TemplateGradeRow key={fila.id} fila={fila} rowIndex={rowIndex} />
            ))}
            {periodos.map((periodo, index) => (
              <div key={periodo}>
                <TemplateGrade left={12.5} top={87.9 + index * 3.15}>{asistenciaResumen[periodo].asistencia || ''}</TemplateGrade>
                <TemplateGrade left={18.9} top={87.9 + index * 3.15}>{asistenciaResumen[periodo].ausencia || ''}</TemplateGrade>
              </div>
            ))}
            <TemplateGrade left={25.2} top={87.9}>{totalesAsistencia.asistencia ? `${totalesAsistencia.porcentajeAsistencia}%` : ''}</TemplateGrade>
            <TemplateGrade left={31.4} top={87.9}>{totalesAsistencia.ausencia ? `${totalesAsistencia.porcentajeAusencia}%` : ''}</TemplateGrade>
          </section>
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
          font-size: clamp(7px, 1.18vw, 17px);
          font-weight: 600;
          transform: translateY(-72%);
        }

        .template-grade {
          min-width: 2.8%;
          text-align: center;
          font-size: clamp(7px, 1vw, 15px);
          font-weight: 700;
          transform: translate(-50%, -50%);
        }

        .sigerd-helper {
          position: absolute;
          left: 65.3%;
          top: 62.66%;
          z-index: 2;
          color: #111827;
          font-family: Arial, Helvetica, sans-serif;
          font-size: clamp(5.5px, 0.78vw, 11.5px);
          font-weight: 700;
          line-height: 1;
          white-space: nowrap;
          transform: translateY(-72%);
        }

        @media print {
          @page {
            size: letter landscape;
            margin: 0;
          }

          body {
            background: #fff !important;
          }

          .boletin-page {
            width: 11in;
            height: 8.5in;
            min-height: 8.5in;
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

const gradeRowTops = [19.35, 23.8, 28.25, 32.7, 37.2, 41.65, 46.1]
const gradeColumnLefts = [26.9, 31.7, 36.5, 41.3, 46.1, 50.9, 55.6, 60.4, 65.2, 70, 74.8, 79.5, 83.6, 87.5, 91.6]

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

function TemplateGradeRow({ fila, rowIndex }: { fila: FilaBoletin; rowIndex: number }) {
  const valores = [
    ...competencias.flatMap(competencia => periodos.map(periodo => fila.notas[competencia][periodo])),
    ...competencias.map(competencia => fila.finales[competencia]),
  ]

  return (
    <>
      {valores.map((valor, columnIndex) => (
        <TemplateGrade
          key={`${fila.id}-${columnIndex}`}
          left={gradeColumnLefts[columnIndex]}
          top={gradeRowTops[rowIndex]}
        >
          {valor}
        </TemplateGrade>
      ))}
    </>
  )
}
