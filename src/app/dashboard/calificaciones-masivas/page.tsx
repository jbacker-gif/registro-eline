'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { CsvRow, getCsvValue, readCsvFile } from '../../../lib/csv'
import { esSeccionPrimaria, etiquetaSeccion } from '../../../lib/registroEscolar'

type Periodo = 'P1' | 'P2' | 'P3' | 'P4'

type Estudiante = {
  id: string
  numero_orden: number
  sigerd_id?: string | null
  nombre_completo: string
  estado?: string | null
}

type Asignatura = {
  id: string
  nombre: string
}

type NotaPendiente = {
  estudiante_id: string
  seccion_id: string
  user_id: string
  asignatura_id: string
  periodo: Periodo
  competencia: string
  nota: number
  nivel?: string
  ano_escolar?: string | null
  tipo_registro?: string
  es_recuperacion_pedagogica?: boolean
  grupo_recuperacion?: string | null
  metadata?: Record<string, unknown>
}

type VistaPrevia = {
  estudiante: string
  numero: number
  asignatura: string
  competencia: string
  nota: number
}

const periodos: Periodo[] = ['P1', 'P2', 'P3', 'P4']
const competencias = ['C1', 'C1_RP', 'C2', 'C2_RP', 'C3', 'C3_RP']
const columnasIdentidad = [
  'numero_orden',
  'numero_de_orden',
  'no_orden',
  'no_lista',
  'numero_lista',
  'numero',
  'orden',
  'sigerd_id',
  'id_sigerd',
  'sigerd',
  'estudiante',
  'nombre',
  'nombre_completo',
  'nombres',
  'apellidos',
]

const normalizarTexto = (valor = '') =>
  valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

const aliasesBase: Record<string, string[]> = {
  lengua_espanola: ['lengua', 'espanol', 'espanola', 'lengua_espanola'],
  matematica: ['matematica', 'matematicas'],
  ciencias_sociales: ['sociales', 'ciencias_sociales'],
  ciencias_de_la_naturaleza: ['naturales', 'ciencias_naturales', 'ciencias_de_la_naturaleza'],
  lenguas_extranjeras_ingles: ['ingles', 'lenguas_extranjeras_ingles'],
  educacion_fisica: ['educacion_fisica', 'fisica'],
  formacion_integral_humana_y_religiosa: ['formacion_humana', 'formacion_integral', 'religion', 'f_i_h_r'],
  educacion_artistica: ['artistica', 'educacion_artistica'],
}

const crearAliasesAsignatura = (asignatura: Asignatura) => {
  const nombre = normalizarTexto(asignatura.nombre)
  return new Set([nombre, ...(aliasesBase[nombre] || [])])
}

const extraerColumnaNota = (columna: string) => {
  const match = columna.match(/^(.+)_(c[123](?:_rp)?)$/)
  if (!match) return null

  return {
    asignaturaAlias: match[1],
    competencia: match[2].toUpperCase(),
  }
}

const validarNota = (valor: string) => {
  if (!valor.trim()) return null
  const numero = Number(valor.replace(',', '.'))
  if (!Number.isFinite(numero) || numero < 0 || numero > 100) return undefined
  return numero
}

export default function CalificacionesMasivas() {
  const archivoCsvRef = useRef<HTMLInputElement>(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' })
  const [periodo, setPeriodo] = useState<Periodo>('P1')
  const [seccionId, setSeccionId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [infoSeccion, setInfoSeccion] = useState<any>(null)
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([])
  const [notasPendientes, setNotasPendientes] = useState<NotaPendiente[]>([])
  const [vistaPrevia, setVistaPrevia] = useState<VistaPrevia[]>([])
  const [asignaturasIncluidas, setAsignaturasIncluidas] = useState<string[]>([])
  const [resumen, setResumen] = useState({
    aplicadas: 0,
    celdasVacias: 0,
    sinEstudiante: 0,
    columnaInvalida: 0,
    notaInvalida: 0,
    retirados: 0,
  })

  const asignaturasConAliases = useMemo(() => (
    asignaturas.map(asignatura => ({
      asignatura,
      aliases: crearAliasesAsignatura(asignatura),
    }))
  ), [asignaturas])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const secId = params.get('seccion_id')

    if (secId) {
      setSeccionId(secId)
      inicializar(secId)
    } else {
      setCargando(false)
    }
  }, [])

  const inicializar = async (secId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setUserId(session.user.id)

      const [
        { data: secData },
        { data: listaEstudiantes },
        { data: listaAsignaturas },
      ] = await Promise.all([
        supabase.from('secciones').select('*').eq('id', secId).eq('user_id', session.user.id).single(),
        supabase.from('estudiantes').select('id, numero_orden, sigerd_id, nombre_completo, estado').eq('seccion_id', secId).eq('user_id', session.user.id).order('numero_orden', { ascending: true }),
        supabase.from('asignaturas').select('id, nombre').order('nombre', { ascending: true }),
      ])

      if (!secData) {
        setMensaje({ texto: 'No tienes permisos para acceder a esta sección.', tipo: 'error' })
        return
      }

      if (!esSeccionPrimaria(secData)) {
        setMensaje({ texto: 'Esta carga masiva es solo para Primaria. Usa Registro Escolar - Nivel Secundario para esa seccion.', tipo: 'error' })
        return
      }
      setInfoSeccion(secData)
      setEstudiantes((listaEstudiantes || []) as Estudiante[])
      setAsignaturas((listaAsignaturas || []) as Asignatura[])
    } catch (error) {
      setMensaje({ texto: 'Error al cargar la carga masiva de calificaciones.', tipo: 'error' })
    } finally {
      setCargando(false)
    }
  }

  const limpiarImportacion = () => {
    setNotasPendientes([])
    setVistaPrevia([])
    setAsignaturasIncluidas([])
    setResumen({ aplicadas: 0, celdasVacias: 0, sinEstudiante: 0, columnaInvalida: 0, notaInvalida: 0, retirados: 0 })
  }

  const buscarAsignatura = (alias: string) =>
    asignaturasConAliases.find(item => item.aliases.has(alias))?.asignatura || null

  const importarCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !seccionId || !userId) return

    try {
      const filas = await readCsvFile(file)
      const estudiantesPorNumero = new Map(estudiantes.map(est => [Number(est.numero_orden), est]))
      const estudiantesPorSigerd = new Map(
        estudiantes
          .filter(est => est.sigerd_id)
          .map(est => [String(est.sigerd_id).trim(), est])
      )
      const nuevasNotas: NotaPendiente[] = []
      const nuevaVista: VistaPrevia[] = []
      const asignaturasSet = new Set<string>()
      const nuevoResumen = {
        aplicadas: 0,
        celdasVacias: 0,
        sinEstudiante: 0,
        columnaInvalida: 0,
        notaInvalida: 0,
        retirados: 0,
      }

      filas.forEach((row: CsvRow) => {
        const numero = Number(getCsvValue(row, ['numero_orden', 'numero_de_orden', 'no_orden', 'no_lista', 'numero_lista', 'numero', 'orden']))
        const sigerd = getCsvValue(row, ['sigerd_id', 'id_sigerd', 'sigerd']).trim()
        const estudiante = sigerd && estudiantesPorSigerd.has(sigerd)
          ? estudiantesPorSigerd.get(sigerd)
          : estudiantesPorNumero.get(numero)

        if (!estudiante) {
          nuevoResumen.sinEstudiante++
          return
        }

        if (estudiante.estado === 'Retirado') {
          nuevoResumen.retirados++
          return
        }

        Object.entries(row).forEach(([columna, valor]) => {
          if (columnasIdentidad.includes(columna)) return

          const nota = validarNota(valor)
          if (nota === null) {
            nuevoResumen.celdasVacias++
            return
          }

          const datosColumna = extraerColumnaNota(columna)
          const asignatura = datosColumna ? buscarAsignatura(datosColumna.asignaturaAlias) : null

          if (!datosColumna || !asignatura || !competencias.includes(datosColumna.competencia)) {
            nuevoResumen.columnaInvalida++
            return
          }

          if (nota === undefined) {
            nuevoResumen.notaInvalida++
            return
          }

          nuevasNotas.push({
            estudiante_id: estudiante.id,
            seccion_id: seccionId,
            user_id: userId,
            asignatura_id: asignatura.id,
            periodo,
            competencia: datosColumna.competencia,
            nota,
            nivel: 'Primaria',
            ano_escolar: infoSeccion?.ano_escolar || null,
            tipo_registro: 'primaria_carga_masiva',
            es_recuperacion_pedagogica: datosColumna.competencia.includes('_RP'),
            grupo_recuperacion: datosColumna.competencia.includes('_RP') ? periodo : null,
            metadata: { grado: infoSeccion?.grado, asignatura: asignatura.nombre },
          })
          asignaturasSet.add(asignatura.id)
          if (nuevaVista.length < 40) {
            nuevaVista.push({
              estudiante: estudiante.nombre_completo,
              numero: estudiante.numero_orden,
              asignatura: asignatura.nombre,
              competencia: datosColumna.competencia,
              nota,
            })
          }
          nuevoResumen.aplicadas++
        })
      })

      setNotasPendientes(nuevasNotas)
      setVistaPrevia(nuevaVista)
      setAsignaturasIncluidas(Array.from(asignaturasSet))
      setResumen(nuevoResumen)
      setMensaje({
        texto: `Matriz leída: ${nuevoResumen.aplicadas} notas listas para guardar. Columnas inválidas: ${nuevoResumen.columnaInvalida}. Notas inválidas: ${nuevoResumen.notaInvalida}.`,
        tipo: nuevoResumen.aplicadas > 0 ? 'exito' : 'error',
      })
    } catch (error) {
      limpiarImportacion()
      setMensaje({ texto: 'Error al importar la matriz. Revisa el archivo CSV.', tipo: 'error' })
    } finally {
      if (archivoCsvRef.current) archivoCsvRef.current.value = ''
    }
  }

  const guardarNotas = async () => {
    if (!seccionId || !userId || notasPendientes.length === 0 || asignaturasIncluidas.length === 0) return

    if (!window.confirm(`¿Confirmas guardar ${notasPendientes.length} notas del período ${periodo}?`)) return

    setGuardando(true)
    setMensaje({ texto: 'Guardando calificaciones masivas...', tipo: 'info' })
    try {
      const { error: insertError } = await supabase
        .from('calificaciones')
        .upsert(notasPendientes, { onConflict: 'estudiante_id,seccion_id,asignatura_id,periodo,competencia' })
      if (insertError) throw insertError

      setMensaje({ texto: `Calificaciones guardadas: ${notasPendientes.length} notas del período ${periodo}.`, tipo: 'exito' })
      limpiarImportacion()
    } catch (error) {
      setMensaje({ texto: 'Error al guardar las calificaciones masivas.', tipo: 'error' })
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return <div className="p-10 text-center text-sm font-medium text-slate-500">Cargando carga masiva...</div>
  if (!seccionId) return <div className="p-10 text-center text-sm font-semibold text-slate-500">Selecciona una sección en el Panel de Control.</div>

  const resumenItems = [
    ['Notas listas', resumen.aplicadas, 'text-slate-950'],
    ['Vacías', resumen.celdasVacias, 'text-slate-700'],
    ['Sin estudiante', resumen.sinEstudiante, 'text-amber-700'],
    ['Columnas inválidas', resumen.columnaInvalida, 'text-red-700'],
    ['Notas inválidas', resumen.notaInvalida, 'text-red-700'],
    ['Retirados', resumen.retirados, 'text-slate-700'],
  ] as const

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <header className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Calificaciones</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Carga masiva de notas</h1>
              <p className="mt-2 text-sm text-slate-500">
                {etiquetaSeccion(infoSeccion)}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[150px_1fr_1fr]">
              <select
                value={periodo}
                onChange={(e) => {
                  setPeriodo(e.target.value as Periodo)
                  limpiarImportacion()
                }}
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {periodos.map(item => <option key={item} value={item}>Período {item.replace('P', '')}</option>)}
              </select>
              <a
                href="/plantillas/plantilla_calificaciones.csv"
                download
                className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
              >
                Descargar plantilla
              </a>
              <input type="file" accept=".csv" ref={archivoCsvRef} onChange={importarCSV} className="hidden" />
              <button
                onClick={() => archivoCsvRef.current?.click()}
                className="h-10 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Importar matriz
              </button>
            </div>
          </div>
        </header>

        {mensaje.texto && (
          <div className={`mb-5 rounded-md border p-4 text-sm font-semibold ${mensaje.tipo === 'error' ? 'border-red-200 bg-red-50 text-red-700' : mensaje.tipo === 'exito' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
            {mensaje.texto}
          </div>
        )}

        <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {resumenItems.map(([label, value, tone]) => (
            <div key={label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
              <p className={`mt-2 text-2xl font-semibold ${tone}`}>{value}</p>
            </div>
          ))}
        </section>

        <section className="mb-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-950">Vista previa</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">No.</th>
                    <th className="px-4 py-3 font-semibold">Estudiante</th>
                    <th className="px-4 py-3 font-semibold">Asignatura</th>
                    <th className="px-4 py-3 text-center font-semibold">Competencia</th>
                    <th className="px-4 py-3 text-center font-semibold">Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {vistaPrevia.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-sm font-medium text-slate-400">
                        Sin matriz importada.
                      </td>
                    </tr>
                  ) : vistaPrevia.map((fila, index) => (
                    <tr key={`${fila.numero}-${fila.asignatura}-${fila.competencia}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="border-t border-slate-100 px-4 py-3 font-semibold text-slate-500">{fila.numero}</td>
                      <td className="border-t border-slate-100 px-4 py-3 font-medium text-slate-900">{fila.estudiante}</td>
                      <td className="border-t border-slate-100 px-4 py-3 text-slate-600">{fila.asignatura}</td>
                      <td className="border-t border-slate-100 px-4 py-3 text-center font-semibold text-blue-700">{fila.competencia}</td>
                      <td className="border-t border-slate-100 px-4 py-3 text-center font-semibold text-slate-950">{fila.nota}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-950">Columnas admitidas</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>Identidad: <span className="font-mono text-xs text-slate-800">numero_orden, sigerd_id</span></p>
              <p>Notas: <span className="font-mono text-xs text-slate-800">lengua_c1, matematica_c2, sociales_c3_rp</span></p>
              <p>El período activo se aplica a todo el archivo importado.</p>
            </div>
            <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-500">
              Al guardar, se reemplazan las notas del período seleccionado solo para las asignaturas incluidas en la matriz.
            </div>
          </aside>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={limpiarImportacion}
            disabled={notasPendientes.length === 0 || guardando}
            className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Limpiar
          </button>
          <button
            onClick={guardarNotas}
            disabled={notasPendientes.length === 0 || guardando}
            className="h-10 rounded-md bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : `Guardar ${notasPendientes.length} notas`}
          </button>
        </div>
      </div>
    </div>
  )
}
