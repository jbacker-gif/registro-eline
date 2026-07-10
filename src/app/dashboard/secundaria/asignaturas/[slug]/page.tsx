'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../../../lib/supabase'
import {
  asignaturaSecundariaDesdeSlug,
  asignaturaSecundariaDesdeSlugConSeccion,
  asignaturasSecundariaDeSeccion,
  esSegundoCicloSecundaria,
  esSeccionSecundaria,
  etiquetaSeccion,
  normalizarTexto,
  slugAsignatura,
} from '../../../../../lib/registroEscolar'
import {
  CompetenciaSecundaria,
  MatrizSecundaria,
  PeriodoSecundaria,
  calcularResultadoSecundaria,
  competenciasSecundaria,
  competenciasSecundaria30,
  competenciasSecundaria70,
  crearMatrizSecundariaVacia,
  normalizarPeriodoSecundaria,
  periodosSecundaria,
} from '../../../../../lib/secundariaCalificaciones'

type FilaEstudiante = {
  id: string
  numero: number
  sigerd_id?: string | null
  nombre: string
  estado: string
  matriz: MatrizSecundaria
  completiva: string
  extraordinaria: string
  especial: string
  situacion: string
}

const situaciones = ['Aprobado', 'Reprobado', 'Pendiente', 'Completiva']
const bloquesPeriodos = [
  {
    titulo: 'Periodos 1 y 2',
    descripcion: 'Captura P1, P2 y la recuperacion pedagogica correspondiente.',
    periodos: ['P1', 'P2', 'RP1'] as PeriodoSecundaria[],
    tono: 'teal',
  },
  {
    titulo: 'Periodos 3 y 4',
    descripcion: 'Captura P3, P4 y la recuperacion pedagogica correspondiente.',
    periodos: ['P3', 'P4', 'RP2'] as PeriodoSecundaria[],
    tono: 'cyan',
  },
]

const normalizarCatalogo = (valor = '') =>
  valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

const validarCalificacion = (valor: string) => {
  if (valor === '') return true
  const numero = Number(valor)
  return Number.isFinite(numero) && numero >= 0 && numero <= 100
}

export default function AsignaturaSecundariaPage() {
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const contenedorRef = useRef<HTMLDivElement>(null)
  const slug = params?.slug || ''

  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' })
  const [seccionId, setSeccionId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [infoSeccion, setInfoSeccion] = useState<any>(null)
  const [materiaNombre, setMateriaNombre] = useState(asignaturaSecundariaDesdeSlug(slug))
  const [asignaturaId, setAsignaturaId] = useState('')
  const [filas, setFilas] = useState<FilaEstudiante[]>([])
  const [bloquePeriodoActivoIndex, setBloquePeriodoActivoIndex] = useState(0)

  const asignaturasVisibles = useMemo(() => {
    return asignaturasSecundariaDeSeccion(infoSeccion)
  }, [infoSeccion])
  const bloquePeriodoActivo = bloquesPeriodos[bloquePeriodoActivoIndex] || bloquesPeriodos[0]

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const secId = searchParams.get('seccion_id')
    if (!secId) {
      setMensaje({ texto: 'Selecciona una seccion secundaria desde el Dashboard.', tipo: 'error' })
      setCargando(false)
      return
    }
    setSeccionId(secId)
    inicializar(secId)
  }, [slug])

  const inicializar = async (secId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setUserId(session.user.id)

      const [{ data: secData }, { data: asignaturasData }, { data: estudiantesData }] = await Promise.all([
        supabase.from('secciones').select('*').eq('id', secId).eq('user_id', session.user.id).single(),
        supabase.from('asignaturas').select('id,nombre').order('nombre', { ascending: true }),
        supabase.from('estudiantes').select('id, numero_orden, sigerd_id, nombre_completo, estado').eq('seccion_id', secId).eq('user_id', session.user.id).order('numero_orden', { ascending: true }),
      ])

      if (!secData || !esSeccionSecundaria(secData)) {
        setMensaje({ texto: 'Esta pagina es solo para asignaturas de Secundaria.', tipo: 'error' })
        return
      }

      const materiaResuelta = asignaturaSecundariaDesdeSlugConSeccion(slug, secData)
      if (!materiaResuelta) {
        setMensaje({ texto: 'Asignatura secundaria no reconocida.', tipo: 'error' })
        return
      }
      setMateriaNombre(materiaResuelta)

      const esOptativa = esSegundoCicloSecundaria(secData.grado) && [
        normalizarCatalogo(secData.salida_optativa || ''),
        normalizarCatalogo('Salida Optativa'),
      ].includes(normalizarCatalogo(materiaResuelta))
      const asignatura = (asignaturasData || []).find(item => normalizarCatalogo(item.nombre) === normalizarCatalogo(materiaResuelta))
        || (esOptativa
          ? (asignaturasData || []).find(item => normalizarCatalogo(item.nombre) === normalizarCatalogo('Salida Optativa'))
          : null)
      if (!asignatura?.id) {
        setMensaje({ texto: `La asignatura ${materiaResuelta} no existe en el catalogo. Revisar Configuracion Academica.`, tipo: 'error' })
        setInfoSeccion(secData)
        return
      }

      const { data: calificaciones } = await supabase
        .from('calificaciones')
        .select('*')
        .eq('seccion_id', secId)
        .eq('asignatura_id', asignatura.id)
        .eq('user_id', session.user.id)
        .eq('nivel', 'Secundario')
        .eq('tipo_registro', 'secundaria_boletin_calificaciones')

      const filasIniciales = (estudiantesData || []).map((estudiante: any) => {
        const notas = (calificaciones || []).filter((nota: any) => nota.estudiante_id === estudiante.id)
        const matriz = crearMatrizSecundariaVacia()
        notas.forEach((nota: any) => {
          const competencia = String(nota.competencia || '').toUpperCase() as CompetenciaSecundaria
          if (!competenciasSecundaria.includes(competencia)) return
          const periodo = normalizarPeriodoSecundaria(nota.periodo)
          matriz[competencia][periodo] = nota.nota?.toString() || ''
        })
        const primera = notas[0]
        const metadata = primera?.metadata || {}
        const resultado = calcularResultadoSecundaria(matriz)

        return {
          id: estudiante.id,
          numero: estudiante.numero_orden,
          sigerd_id: estudiante.sigerd_id,
          nombre: estudiante.nombre_completo,
          estado: estudiante.estado || 'Activo',
          matriz,
          completiva: String(metadata.calificacion_completiva || ''),
          extraordinaria: String(metadata.calificacion_extraordinaria || ''),
          especial: String(metadata.evaluacion_especial || ''),
          situacion: String(metadata.situacion_asignatura || resultado.situacion),
        }
      })

      setInfoSeccion(secData)
      setAsignaturaId(asignatura.id)
      setFilas(filasIniciales)
    } catch (error) {
      setMensaje({ texto: 'No se pudo cargar la asignatura secundaria.', tipo: 'error' })
    } finally {
      setCargando(false)
    }
  }

  const actualizarFila = (id: string, campo: string, valor: string) => {
    const [competencia, periodo] = campo.split('.') as [CompetenciaSecundaria, PeriodoSecundaria]
    if (competencia && periodo && competenciasSecundaria.includes(competencia) && periodosSecundaria.includes(periodo) && !validarCalificacion(valor)) return
    if (['completiva', 'extraordinaria', 'especial'].includes(campo) && !validarCalificacion(valor)) return

    setFilas(actuales => actuales.map(fila => {
      if (fila.id !== id) return fila
      if (competencia && periodo && competenciasSecundaria.includes(competencia) && periodosSecundaria.includes(periodo)) {
        const matriz = {
          ...fila.matriz,
          [competencia]: {
            ...fila.matriz[competencia],
            [periodo]: valor,
          },
        }
        const resultado = calcularResultadoSecundaria(matriz)
        return {
          ...fila,
          matriz,
          situacion: fila.situacion === 'Completiva' ? fila.situacion : resultado.situacion,
        }
      }
      return { ...fila, [campo]: valor }
    }))
  }

  const manejarEnter = (event: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    const inputs = Array.from(document.querySelectorAll('[data-secundaria-cell="true"]')) as HTMLElement[]
    const index = inputs.indexOf(event.currentTarget as HTMLElement)
    const siguiente = inputs[index + 1]
    if (siguiente) siguiente.focus()
  }

  const guardarCalificaciones = async () => {
    if (!seccionId || !userId || !asignaturaId) return
    setGuardando(true)
    setMensaje({ texto: 'Guardando calificaciones de Secundaria...', tipo: 'info' })
    try {
      const registros = filas.flatMap(fila => {
        if (fila.estado === 'Retirado') return []
        const resultado = calcularResultadoSecundaria(fila.matriz)
        return competenciasSecundaria.flatMap(competencia =>
          periodosSecundaria.flatMap(periodo => {
            const valor = fila.matriz[competencia][periodo]
            if (valor === '') return []
            return {
              estudiante_id: fila.id,
              seccion_id: seccionId,
              user_id: userId,
              asignatura_id: asignaturaId,
              periodo,
              competencia,
              nota: Number(valor),
              nivel: 'Secundario',
              ano_escolar: infoSeccion?.ano_escolar || null,
              tipo_registro: 'secundaria_boletin_calificaciones',
              es_recuperacion_pedagogica: periodo.startsWith('RP'),
              grupo_recuperacion: periodo.startsWith('RP') ? periodo : null,
              metadata: {
                formato: 'registro_secundaria_7_competencias',
                asignatura: materiaNombre,
                grado: infoSeccion?.grado,
                ciclo: ['4to', '5to', '6to'].includes(infoSeccion?.grado) ? 'Segundo ciclo' : 'Primer ciclo general',
                modalidad: infoSeccion?.modalidad || null,
                salida_optativa: infoSeccion?.salida_optativa || null,
                resultado_70: resultado.resultado70,
                resultado_30: resultado.resultado30,
                final_area: resultado.final,
                suma_70: resultado.suma70,
                suma_30: resultado.suma30,
                calificacion_completiva: fila.completiva,
                calificacion_extraordinaria: fila.extraordinaria,
                evaluacion_especial: fila.especial,
                situacion_asignatura: fila.situacion === 'Pendiente' ? resultado.situacion : fila.situacion,
              },
            }
          })
        )
      })

      if (registros.length > 0) {
        const { error } = await supabase
          .from('calificaciones')
          .upsert(registros, { onConflict: 'estudiante_id,seccion_id,asignatura_id,periodo,competencia' })
        if (error) throw error
      }

      setMensaje({ texto: `Calificaciones guardadas para ${materiaNombre}.`, tipo: 'exito' })
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000)
    } catch (error: any) {
      setMensaje({ texto: `Error al guardar: ${error?.message || 'revisa la conexion.'}`, tipo: 'error' })
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return <div className="p-10 text-center text-sm font-medium text-slate-500">Cargando asignatura secundaria...</div>

  return (
    <div ref={contenedorRef} className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <header className="mb-6 rounded-lg border border-teal-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-teal-700">Registro Escolar - Nivel Secundario</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{materiaNombre || 'Asignatura secundaria'}</h1>
              <p className="mt-2 text-sm font-medium text-slate-500">{etiquetaSeccion(infoSeccion)}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-teal-700">7 competencias especificas: C1-C4 = 70%, C5-C7 = 30%</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => router.push(`/dashboard/secundaria/calificaciones-masivas?seccion_id=${seccionId}&nivel=Secundario&materia=${encodeURIComponent(materiaNombre)}`)}
                className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-teal-300 hover:text-teal-700"
              >
                Carga masiva
              </button>
              <button
                onClick={guardarCalificaciones}
                disabled={guardando || !asignaturaId}
                className="h-10 rounded-md bg-teal-700 px-5 text-sm font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Guardar calificaciones'}
              </button>
            </div>
          </div>
        </header>

        <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {asignaturasVisibles.map((asignatura, index) => (
            <button
              key={asignatura}
              type="button"
              onClick={() => router.push(`/dashboard/secundaria/asignaturas/${slugAsignatura(asignatura)}?seccion_id=${seccionId}&nivel=Secundario`)}
              className={`rounded-lg border p-4 text-left shadow-sm transition ${
                normalizarTexto(asignatura) === normalizarTexto(materiaNombre)
                  ? 'border-teal-300 bg-teal-50'
                  : 'border-slate-200 bg-white hover:border-teal-200 hover:bg-slate-50'
              }`}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 font-mono text-xs font-bold text-white">{String(index + 1).padStart(2, '0')}</span>
              <span className="mt-3 block text-sm font-bold text-slate-950">{asignatura}</span>
              <span className="mt-1 block text-xs font-semibold text-teal-700">Calificaciones</span>
            </button>
          ))}
        </section>

        {mensaje.texto && (
          <div className={`mb-5 rounded-md border p-4 text-sm font-semibold ${mensaje.tipo === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : mensaje.tipo === 'exito' ? 'border-teal-200 bg-teal-50 text-teal-800' : 'border-cyan-200 bg-cyan-50 text-cyan-800'}`}>
            {mensaje.texto}
          </div>
        )}

        <section className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              {bloquesPeriodos.map((bloque, index) => {
                const activo = bloquePeriodoActivoIndex === index
                return (
                  <button
                    key={bloque.titulo}
                    type="button"
                    onClick={() => setBloquePeriodoActivoIndex(index)}
                    className={`rounded-md border px-4 py-3 text-left transition ${
                      activo
                        ? bloque.tono === 'teal'
                          ? 'border-teal-300 bg-teal-50 text-teal-900'
                          : 'border-cyan-300 bg-cyan-50 text-cyan-900'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <span className="block text-sm font-black uppercase tracking-wide">{bloque.titulo}</span>
                    <span className="mt-1 block text-xs font-semibold">{bloque.descripcion}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              {(() => {
                const bloque = bloquePeriodoActivo
                return (
            <div>
              <div className={`border-b px-4 py-3 ${bloque.tono === 'teal' ? 'border-teal-100 bg-teal-50' : 'border-cyan-100 bg-cyan-50'}`}>
                <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">{bloque.titulo}</h2>
                <p className="mt-1 text-xs font-semibold text-slate-600">{bloque.descripcion}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1160px] border-collapse text-left text-sm">
                  <thead className="bg-slate-900 text-white">
                    <tr className="uppercase tracking-wider">
                      <th rowSpan={2} className="w-16 border border-slate-700 p-3 text-center font-bold">No.</th>
                      <th rowSpan={2} className="w-64 border border-slate-700 p-3 font-bold">Estudiante</th>
                      {competenciasSecundaria.map(competencia => (
                        <th key={competencia} colSpan={bloque.periodos.length} className={`border border-slate-700 p-3 text-center font-bold ${competenciasSecundaria70.includes(competencia) ? 'bg-teal-800' : 'bg-cyan-800'}`}>
                          {competencia} {competenciasSecundaria70.includes(competencia) ? '70%' : '30%'}
                        </th>
                      ))}
                    </tr>
                    <tr className="bg-slate-800 uppercase tracking-wider">
                      {competenciasSecundaria.flatMap(competencia =>
                        bloque.periodos.map(periodo => (
                          <th key={`${bloque.titulo}-${competencia}-${periodo}`} className={`w-20 border border-slate-700 p-2 text-center text-xs font-bold ${periodo.startsWith('RP') ? 'bg-amber-700 text-white' : ''}`}>
                            {periodo.startsWith('RP') ? 'RP' : periodo}
                          </th>
                        ))
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map((fila, index) => {
                      const retirado = fila.estado === 'Retirado'
                      const fondo = retirado ? 'bg-slate-200 opacity-60' : index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                      return (
                        <tr key={`${bloque.titulo}-${fila.id}`} className={fondo}>
                          <td className="border border-slate-200 p-2 text-center font-bold text-slate-500">{fila.numero}</td>
                          <td className="border border-slate-200 p-2 font-semibold text-slate-900">
                            {fila.nombre}
                            {retirado && <span className="ml-2 rounded bg-slate-300 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">Retirado</span>}
                          </td>
                          {competenciasSecundaria.flatMap(competencia =>
                            bloque.periodos.map(periodo => (
                              <td key={`${bloque.titulo}-${competencia}-${periodo}`} className={`border border-slate-200 p-1 ${competenciasSecundaria30.includes(competencia) ? 'bg-cyan-50/40' : 'bg-teal-50/20'} ${periodo.startsWith('RP') ? 'bg-amber-50' : ''}`}>
                                <input
                                  data-secundaria-cell="true"
                                  type="number"
                                  value={fila.matriz[competencia][periodo]}
                                  disabled={retirado}
                                  onChange={(event) => actualizarFila(fila.id, `${competencia}.${periodo}`, event.target.value)}
                                  onKeyDown={manejarEnter}
                                  className={`h-10 w-full rounded-md border text-center font-bold text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100 ${periodo.startsWith('RP') ? 'border-amber-300 bg-amber-50 ring-1 ring-amber-100' : 'border-slate-200 bg-white'}`}
                                  placeholder="-"
                                />
                              </td>
                            ))
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
                )
              })()}
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Resultados y procesos finales</h2>
              <p className="mt-1 text-xs font-semibold text-slate-600">Resumen calculado con todos los periodos y campos finales de la asignatura.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                <thead className="bg-slate-900 text-white">
                  <tr className="uppercase tracking-wider">
                    <th className="w-16 border border-slate-700 p-3 text-center font-bold">No.</th>
                    <th className="w-64 border border-slate-700 p-3 font-bold">Estudiante</th>
                    <th className="w-24 border border-slate-700 bg-teal-800 p-3 text-center font-bold">70%</th>
                    <th className="w-24 border border-slate-700 bg-cyan-800 p-3 text-center font-bold">30%</th>
                    <th className="w-28 border border-slate-700 bg-slate-700 p-3 text-center font-bold">Final</th>
                    <th className="w-28 border border-slate-700 p-3 text-center font-bold">Completiva</th>
                    <th className="w-28 border border-slate-700 p-3 text-center font-bold">Extraord.</th>
                    <th className="w-28 border border-slate-700 p-3 text-center font-bold">Especial</th>
                    <th className="w-36 border border-slate-700 p-3 text-center font-bold">Situacion</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((fila, index) => {
                    const retirado = fila.estado === 'Retirado'
                    const fondo = retirado ? 'bg-slate-200 opacity-60' : index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    const resultado = calcularResultadoSecundaria(fila.matriz)
                    return (
                      <tr key={`resultados-${fila.id}`} className={fondo}>
                        <td className="border border-slate-200 p-2 text-center font-bold text-slate-500">{fila.numero}</td>
                        <td className="border border-slate-200 p-2 font-semibold text-slate-900">{fila.nombre}</td>
                        <td className="border border-slate-200 bg-teal-50 p-2 text-center text-lg font-black text-teal-800">{resultado.resultado70 || '-'}</td>
                        <td className="border border-slate-200 bg-cyan-50 p-2 text-center text-lg font-black text-cyan-800">{resultado.resultado30 || '-'}</td>
                        <td className="border border-slate-200 bg-slate-100 p-2 text-center text-lg font-black text-slate-950">{resultado.final || '-'}</td>
                        <td className="border border-slate-200 p-1">
                          <input data-secundaria-cell="true" type="number" value={fila.completiva} disabled={retirado} onChange={(event) => actualizarFila(fila.id, 'completiva', event.target.value)} onKeyDown={manejarEnter} className="h-10 w-full rounded-md border border-slate-200 text-center font-bold outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100" />
                        </td>
                        <td className="border border-slate-200 p-1">
                          <input data-secundaria-cell="true" type="number" value={fila.extraordinaria} disabled={retirado} onChange={(event) => actualizarFila(fila.id, 'extraordinaria', event.target.value)} onKeyDown={manejarEnter} className="h-10 w-full rounded-md border border-slate-200 text-center font-bold outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100" />
                        </td>
                        <td className="border border-slate-200 p-1">
                          <input data-secundaria-cell="true" type="number" value={fila.especial} disabled={retirado} onChange={(event) => actualizarFila(fila.id, 'especial', event.target.value)} onKeyDown={manejarEnter} className="h-10 w-full rounded-md border border-slate-200 text-center font-bold outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100" />
                        </td>
                        <td className="border border-slate-200 p-1">
                          <select data-secundaria-cell="true" value={fila.situacion} disabled={retirado} onChange={(event) => actualizarFila(fila.id, 'situacion', event.target.value)} onKeyDown={manejarEnter} className="h-10 w-full rounded-md border border-slate-200 bg-white px-2 text-xs font-bold text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100">
                            {situaciones.map(situacion => <option key={situacion}>{situacion}</option>)}
                          </select>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <div className="mt-5 rounded-lg border border-teal-100 bg-teal-50 p-4 text-sm font-medium text-teal-900">
          Esta pantalla guarda la asignatura como boletin de Secundaria con 7 competencias especificas, periodos P1, P2, RP, P3, P4 y RP. El sistema calcula C1-C4 al 70%, C5-C7 al 30% y determina la situacion de la asignatura con minimo aprobatorio de 70 puntos.
        </div>
      </div>
    </div>
  )
}
