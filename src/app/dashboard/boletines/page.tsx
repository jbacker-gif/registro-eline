'use client'

import { useEffect, useMemo, useState } from 'react'
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
        <div className="mx-auto max-w-[1100px] space-y-6 print:max-w-none print:space-y-0">
          <section className="boletin-page bg-white p-8 shadow-sm print:shadow-none">
            <div className="grid grid-cols-[1fr_1.05fr] gap-8">
              <div>
                <h2 className="text-center text-sm font-bold uppercase">Firma del padre, madre o tutor</h2>
                <div className="mt-5 space-y-5 text-xs">
                  {[
                    'Ago-Sept-Oct',
                    'Nov-Dic-Ene',
                    'Feb-Mar',
                    'Abr-May-Jun',
                  ].map(periodo => (
                    <div key={periodo} className="grid grid-cols-[120px_1fr] items-end gap-3">
                      <span>{periodo}</span>
                      <span className="border-b border-slate-700">&nbsp;</span>
                    </div>
                  ))}
                </div>

                <div className="mt-10">
                  <p className="text-xs leading-relaxed">
                    Informacion sobre el nivel de avance de los aprendizajes y los apoyos que necesita para la mejora de sus aprendizajes.
                  </p>
                  <div className="mt-3 space-y-4">
                    {Array.from({ length: 12 }).map((_, index) => (
                      <div key={index} className="border-b border-slate-500">&nbsp;</div>
                    ))}
                  </div>
                </div>

                <div className="mt-16 grid grid-cols-2 gap-10 text-center text-xs font-semibold">
                  <div>
                    <div className="border-b border-slate-800">&nbsp;</div>
                    <p className="mt-2">Maestro(a) Encargado(a) del grado</p>
                  </div>
                  <div>
                    <div className="border-b border-slate-800">&nbsp;</div>
                    <p className="mt-2">Director(a) del Centro Educativo</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-8 text-center">
                  <p className="text-xs font-semibold">Viceministerio de Servicios Tecnicos y Pedagogicos</p>
                  <p className="text-xs font-semibold">Direccion General de Educacion Primaria</p>
                  <h2 className="mt-8 text-xl font-black uppercase tracking-wide">Informe de aprendizaje</h2>
                  <h3 className="mt-10 text-lg font-black uppercase">{gradoTitulo}</h3>
                  <p className="text-sm font-bold uppercase">Nivel Primario</p>
                </div>

                <div className="space-y-3 text-xs">
                  <Field label="Ano escolar" value={anoEscolar.texto} />
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Seccion" value={infoSeccion?.identificador} />
                    <Field label="Numero de orden" value={datosEstudiante.numero_orden} />
                  </div>
                  <Field label="Nombre(s)" value={datosEstudiante.nombres} />
                  <Field label="Apellido(s)" value={datosEstudiante.apellidos} />
                  <Field label="ID estudiante (SIGERD)" value={datosEstudiante.sigerd_id} />
                  <Field label="Docente" value={infoPerfil?.nombre_completo || infoPerfil?.full_name} />
                  <Field label="Centro educativo" value={infoColegio?.nombre} />
                  <Field label="Codigo del centro" value={infoColegio?.codigo_centro} />
                  <Field label="Tanda" value={infoSeccion?.tanda || infoColegio?.tanda} />
                  <Field label="Telefono del centro" value={infoColegio?.telefono_centro} />
                  <Field label="Distrito educativo" value={infoColegio?.distrito_educativo} />
                  <Field label="Regional de educacion" value={infoColegio?.regional_educacion} />
                  <Field label="Provincia" value={infoColegio?.provincia} />
                  <Field label="Municipio" value={infoColegio?.municipio} />
                </div>
              </div>
            </div>
          </section>

          <section className="boletin-page bg-white p-6 shadow-sm print:shadow-none">
            <h2 className="mb-4 text-center text-base font-black uppercase">Desempeno individual del/la estudiante</h2>

            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr>
                  <th rowSpan={2} className="w-[22%] border border-slate-700 p-1 text-left align-bottom uppercase">Competencias fundamentales</th>
                  <th colSpan={4} className="border border-slate-700 p-1">Comunicativa</th>
                  <th colSpan={4} className="border border-slate-700 p-1">Pensamiento Logico, Creativo y Critico; Resolucion de Problemas; Cientifica y Tecnologica</th>
                  <th colSpan={4} className="border border-slate-700 p-1">Etica y Ciudadana; Desarrollo Personal y Espiritual; Ambiental y de la Salud</th>
                  <th colSpan={3} className="border border-slate-700 p-1">Calificacion final por competencia</th>
                </tr>
                <tr>
                  {[...periodos, ...periodos, ...periodos, ...competencias].map((item, index) => (
                    <th key={`${item}-${index}`} className="border border-slate-700 p-1 text-center">{item}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filasBoletin.map(fila => (
                  <tr key={fila.id}>
                    <td className="border border-slate-700 p-1.5 font-semibold">{fila.nombre}</td>
                    {competencias.map(competencia =>
                      periodos.map(periodo => (
                        <td key={`${fila.id}-${competencia}-${periodo}`} className="border border-slate-700 p-1 text-center">
                          {celda(fila.notas[competencia][periodo])}
                        </td>
                      ))
                    )}
                    {competencias.map(competencia => (
                      <td key={`${fila.id}-${competencia}-final`} className="border border-slate-700 p-1 text-center font-bold">
                        {celda(fila.finales[competencia])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-6 grid grid-cols-[1.1fr_1.5fr] gap-6">
              <div>
                <h3 className="mb-2 text-center text-xs font-bold">Resumen de asistencia del/la estudiante</h3>
                <table className="w-full border-collapse text-[10px]">
                  <thead>
                    <tr>
                      <th className="border border-slate-700 p-1">Periodos</th>
                      <th className="border border-slate-700 p-1">Asistencia</th>
                      <th className="border border-slate-700 p-1">Ausencia</th>
                      <th className="border border-slate-700 p-1">% Anual Asistencia</th>
                      <th className="border border-slate-700 p-1">% Anual Ausencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {periodos.map((periodo, index) => (
                      <tr key={periodo}>
                        <td className="border border-slate-700 p-1 text-center">{periodo}</td>
                        <td className="border border-slate-700 p-1 text-center">{asistenciaResumen[periodo].asistencia || ''}</td>
                        <td className="border border-slate-700 p-1 text-center">{asistenciaResumen[periodo].ausencia || ''}</td>
                        <td className="border border-slate-700 p-1 text-center">{index === 0 && totalesAsistencia.asistencia ? `${totalesAsistencia.porcentajeAsistencia}%` : ''}</td>
                        <td className="border border-slate-700 p-1 text-center">{index === 0 && totalesAsistencia.ausencia ? `${totalesAsistencia.porcentajeAusencia}%` : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-[0.8fr_1.2fr_2fr] gap-3 text-[10px]">
                <div>
                  <h3 className="font-bold">Leyenda</h3>
                  <p>(P1) Periodo 1</p>
                  <p>(P2) Periodo 2</p>
                  <p>(P3) Periodo 3</p>
                  <p>(P4) Periodo 4</p>
                  <p className="mt-2">(C1) Competencia 1</p>
                  <p>(C2) Competencia 2</p>
                  <p>(C3) Competencia 3</p>
                </div>
                <div>
                  <h3 className="font-bold">Escala numerica</h3>
                  <p>89-100</p>
                  <p className="mt-4">77-88</p>
                  <p className="mt-4">65-76</p>
                  <p className="mt-4">Menos de 65</p>
                </div>
                <div>
                  <h3 className="font-bold">Descripcion</h3>
                  <p>Evidencia que el estudiante ha alcanzado un desempeno destacado con relacion a los aspectos evaluados.</p>
                  <p className="mt-2">Evidencia que el estudiante ha logrado, en general, los aprendizajes esperados.</p>
                  <p className="mt-2">Evidencia que el estudiante aun se encuentra en proceso, mostrando un logro muy basico.</p>
                  <p className="mt-2">Evidencia que el estudiante ha alcanzado un desempeno insuficiente.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      <style jsx global>{`
        @media print {
          @page {
            size: letter landscape;
            margin: 0.35in;
          }

          body {
            background: #fff !important;
          }

          .boletin-page {
            min-height: calc(8.5in - 0.7in);
            page-break-after: always;
            box-shadow: none !important;
          }

          .boletin-page:last-child {
            page-break-after: auto;
          }
        }
      `}</style>
    </div>
  )
}

function Field({ label, value }: { label: string; value?: unknown }) {
  return (
    <div className="grid grid-cols-[150px_1fr] items-end gap-2">
      <span className="font-semibold">{label}:</span>
      <span className="min-h-5 border-b border-slate-700 px-1">{celda(value)}</span>
    </div>
  )
}
