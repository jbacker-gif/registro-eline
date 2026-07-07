'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../../../lib/supabase'
import { CsvRow, getCsvValue, readCsvFile } from '../../../../lib/csv'
import {
  asignaturasSecundaria,
  esSegundoCicloSecundaria,
  esSeccionSecundaria,
  etiquetaSeccion,
  normalizarTexto,
} from '../../../../lib/registroEscolar'
import {
  CompetenciaSecundaria,
  MatrizSecundaria,
  PeriodoSecundaria,
  calcularResultadoSecundaria,
  competenciasSecundaria,
  crearMatrizSecundariaVacia,
  normalizarPeriodoSecundaria,
  periodosSecundaria,
} from '../../../../lib/secundariaCalificaciones'

type Estudiante = {
  id: string
  numero_orden: number
  sigerd_id?: string | null
  rne?: string | null
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
  periodo: PeriodoSecundaria
  competencia: string
  nota: number
  nivel: string
  ano_escolar?: string | null
  tipo_registro: string
  es_recuperacion_pedagogica: boolean
  grupo_recuperacion: string | null
  metadata: Record<string, unknown>
}

type VistaPrevia = {
  estudiante: string
  numero: number
  asignatura: string
  competencia: string
  periodo: PeriodoSecundaria
  nota: number
  resultado70: number
  resultado30: number
  finalArea: number
}

type ResumenImportacion = {
  aplicadas: number
  celdasVacias: number
  sinEstudiante: number
  columnaInvalida: number
  notaInvalida: number
  retirados: number
  asignaturaSinCatalogo: number
}

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
  'rne',
  'estudiante',
  'nombre',
  'nombre_completo',
  'nombres',
  'apellidos',
]
const columnasFinales = ['promedio_competencias', 'resultado_70', 'resultado_30', 'final_area', 'calificacion_final', 'completiva', 'extraordinaria', 'especial', 'situacion']
const resumenVacio: ResumenImportacion = {
  aplicadas: 0,
  celdasVacias: 0,
  sinEstudiante: 0,
  columnaInvalida: 0,
  notaInvalida: 0,
  retirados: 0,
  asignaturaSinCatalogo: 0,
}

const normalizarCabecera = (valor = '') =>
  valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

const validarNota = (valor: string) => {
  if (!valor.trim()) return null
  const numero = Number(valor.replace(',', '.'))
  if (!Number.isFinite(numero) || numero < 0 || numero > 100) return undefined
  return numero
}

const crearAlias = (nombre: string) => normalizarCabecera(nombre)

const extraerColumnaSecundaria = (columna: string) => {
  const normalizada = normalizarCabecera(columna)
  const competenciaDirecta = normalizada.match(/^(c[1-7])_(p1|p2|rp|rp1|p2_rp|p3|p4|rp2|p4_rp)$/)
  if (competenciaDirecta) {
    return {
      asignaturaAlias: '',
      competencia: competenciaDirecta[1].toUpperCase() as CompetenciaSecundaria,
      periodo: normalizarPeriodoSecundaria(competenciaDirecta[2]),
    }
  }

  const match = normalizada.match(/^(.+)_(c[1-7])_(p1|p2|rp|rp1|p2_rp|p3|p4|rp2|p4_rp)$/)
  if (!match) return null
  return {
    asignaturaAlias: match[1],
    competencia: match[2].toUpperCase() as CompetenciaSecundaria,
    periodo: normalizarPeriodoSecundaria(match[3]),
  }
}

export default function CalificacionesMasivasSecundaria() {
  const archivoCsvRef = useRef<HTMLInputElement>(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' })
  const [seccionId, setSeccionId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [infoSeccion, setInfoSeccion] = useState<any>(null)
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [asignaturasCatalogo, setAsignaturasCatalogo] = useState<Asignatura[]>([])
  const [asignaturaActiva, setAsignaturaActiva] = useState('')
  const [notasPendientes, setNotasPendientes] = useState<NotaPendiente[]>([])
  const [vistaPrevia, setVistaPrevia] = useState<VistaPrevia[]>([])
  const [resumen, setResumen] = useState<ResumenImportacion>(resumenVacio)

  const asignaturasDelNivel = useMemo(() => {
    const base = [...asignaturasSecundaria]
    if (esSegundoCicloSecundaria(infoSeccion?.grado)) base.push(infoSeccion?.salida_optativa || 'Salida Optativa')
    return base
  }, [infoSeccion?.grado, infoSeccion?.salida_optativa])

  const asignaturasConCatalogo = useMemo(() => (
    asignaturasDelNivel.map(nombre => {
      const nombreNormalizado = normalizarCabecera(nombre)
      const registro = asignaturasCatalogo.find(asignatura => normalizarCabecera(asignatura.nombre) === nombreNormalizado)
      return {
        nombre,
        alias: crearAlias(nombre),
        registro,
      }
    })
  ), [asignaturasCatalogo, asignaturasDelNivel])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const secId = params.get('seccion_id')
    const materia = params.get('materia') || params.get('titulo') || ''
    if (materia) setAsignaturaActiva(materia)

    if (secId) {
      setSeccionId(secId)
      inicializar(secId, materia)
    } else {
      setCargando(false)
      setMensaje({ texto: 'Selecciona una seccion de Secundaria desde el Dashboard.', tipo: 'error' })
    }
  }, [])

  const inicializar = async (secId: string, materiaInicial: string) => {
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
        supabase.from('estudiantes').select('id, numero_orden, sigerd_id, rne, nombre_completo, estado').eq('seccion_id', secId).eq('user_id', session.user.id).order('numero_orden', { ascending: true }),
        supabase.from('asignaturas').select('id, nombre').order('nombre', { ascending: true }),
      ])

      if (!secData) {
        setMensaje({ texto: 'No tienes permisos para acceder a esta seccion.', tipo: 'error' })
        return
      }

      if (!esSeccionSecundaria(secData)) {
        setMensaje({ texto: 'Esta carga masiva es solo para Secundaria. Usa Calificaciones Primaria para esa seccion.', tipo: 'error' })
        return
      }

      setInfoSeccion(secData)
      setEstudiantes((listaEstudiantes || []) as Estudiante[])
      setAsignaturasCatalogo((listaAsignaturas || []) as Asignatura[])
      if (!materiaInicial) setAsignaturaActiva(asignaturasSecundaria[0])
    } catch {
      setMensaje({ texto: 'Error al cargar calificaciones masivas de Secundaria.', tipo: 'error' })
    } finally {
      setCargando(false)
    }
  }

  const limpiarImportacion = () => {
    setNotasPendientes([])
    setVistaPrevia([])
    setResumen(resumenVacio)
  }

  const buscarAsignatura = (nombreOAlias: string) => {
    const normalizada = normalizarCabecera(nombreOAlias)
    return asignaturasConCatalogo.find(item => item.alias === normalizada || normalizarCabecera(item.nombre) === normalizada) || null
  }

  const crearMetadataFila = (row: CsvRow, asignatura: string, matriz: MatrizSecundaria) => {
    const resultado = calcularResultadoSecundaria(matriz)
    return {
    formato: 'boletin_secundaria',
    asignatura,
    grado: infoSeccion?.grado,
    ciclo: esSegundoCicloSecundaria(infoSeccion?.grado) ? 'Segundo ciclo' : 'Primer ciclo general',
    modalidad: infoSeccion?.modalidad || null,
    salida_optativa: infoSeccion?.salida_optativa || null,
    resultado_70: resultado.resultado70,
    resultado_30: resultado.resultado30,
    suma_70: resultado.suma70,
    suma_30: resultado.suma30,
    final_area: resultado.final,
    calificacion_completiva: getCsvValue(row, ['completiva', 'cc']),
    calificacion_extraordinaria: getCsvValue(row, ['extraordinaria', 'ce']),
    evaluacion_especial: getCsvValue(row, ['especial', 'evaluacion_especial']),
    situacion_asignatura: getCsvValue(row, ['situacion', 'situacion_final']) || resultado.situacion,
  }}

  const agregarNota = (
    nuevasNotas: NotaPendiente[],
    nuevaVista: VistaPrevia[],
    estudiante: Estudiante,
    asignatura: { nombre: string; registro?: Asignatura },
    competencia: CompetenciaSecundaria,
    periodo: PeriodoSecundaria,
    nota: number,
    row: CsvRow,
    matriz: MatrizSecundaria,
    resumenActual: ResumenImportacion,
  ) => {
    if (!seccionId || !userId || !asignatura.registro?.id) {
      resumenActual.asignaturaSinCatalogo++
      return
    }

    const metadata = crearMetadataFila(row, asignatura.nombre, matriz)
    nuevasNotas.push({
      estudiante_id: estudiante.id,
      seccion_id: seccionId,
      user_id: userId,
      asignatura_id: asignatura.registro.id,
      periodo,
      competencia,
      nota,
      nivel: 'Secundario',
      ano_escolar: infoSeccion?.ano_escolar || null,
      tipo_registro: 'secundaria_boletin_calificaciones',
      es_recuperacion_pedagogica: periodo.startsWith('RP'),
      grupo_recuperacion: periodo.startsWith('RP') ? periodo : null,
      metadata,
    })

    if (nuevaVista.length < 50) {
      nuevaVista.push({
        estudiante: estudiante.nombre_completo,
        numero: estudiante.numero_orden,
        asignatura: asignatura.nombre,
        competencia,
        periodo,
        nota,
        resultado70: Number(metadata.resultado_70 || 0),
        resultado30: Number(metadata.resultado_30 || 0),
        finalArea: Number(metadata.final_area || 0),
      })
    }
    resumenActual.aplicadas++
  }

  const importarCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !seccionId || !userId) return

    try {
      const filas = await readCsvFile(file)
      const estudiantesPorNumero = new Map(estudiantes.map(est => [Number(est.numero_orden), est]))
      const estudiantesPorSigerd = new Map(
        estudiantes
          .flatMap(est => [est.sigerd_id, est.rne].filter(Boolean).map(id => [String(id).trim(), est] as const))
      )
      const nuevasNotas: NotaPendiente[] = []
      const nuevaVista: VistaPrevia[] = []
      const nuevoResumen = { ...resumenVacio }
      const asignaturaSeleccionada = buscarAsignatura(asignaturaActiva)

      filas.forEach((row: CsvRow) => {
        const numero = Number(getCsvValue(row, ['numero_orden', 'numero_de_orden', 'no_orden', 'no_lista', 'numero_lista', 'numero', 'orden']))
        const sigerd = getCsvValue(row, ['sigerd_id', 'id_sigerd', 'sigerd', 'rne']).trim()
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

        const pendientesFila: {
          asignatura: { nombre: string; registro?: Asignatura }
          competencia: CompetenciaSecundaria
          periodo: PeriodoSecundaria
          nota: number
        }[] = []
        const matrices = new Map<string, MatrizSecundaria>()

        Object.entries(row).forEach(([columna, valor]) => {
          const columnaNormalizada = normalizarCabecera(columna)
          if (columnasIdentidad.includes(columnaNormalizada) || columnasFinales.includes(columnaNormalizada)) return

          const nota = validarNota(valor)
          if (nota === null) {
            nuevoResumen.celdasVacias++
            return
          }
          if (nota === undefined) {
            nuevoResumen.notaInvalida++
            return
          }

          const datosColumna = extraerColumnaSecundaria(columnaNormalizada)
          const asignatura = datosColumna
            ? datosColumna.asignaturaAlias
              ? buscarAsignatura(datosColumna.asignaturaAlias)
              : asignaturaSeleccionada
            : null
          if (!datosColumna || !asignatura) {
            nuevoResumen.columnaInvalida++
            return
          }

          const matriz = matrices.get(asignatura.nombre) || crearMatrizSecundariaVacia()
          matriz[datosColumna.competencia][datosColumna.periodo] = String(nota)
          matrices.set(asignatura.nombre, matriz)
          pendientesFila.push({ asignatura, competencia: datosColumna.competencia, periodo: datosColumna.periodo, nota })
        })

        pendientesFila.forEach(item => {
          const matriz = matrices.get(item.asignatura.nombre) || crearMatrizSecundariaVacia()
          agregarNota(nuevasNotas, nuevaVista, estudiante, item.asignatura, item.competencia, item.periodo, item.nota, row, matriz, nuevoResumen)
        })
      })

      setNotasPendientes(nuevasNotas)
      setVistaPrevia(nuevaVista)
      setResumen(nuevoResumen)
      setMensaje({
        texto: `Matriz secundaria leida: ${nuevoResumen.aplicadas} calificaciones listas. Columnas invalidas: ${nuevoResumen.columnaInvalida}. Asignaturas sin catalogo: ${nuevoResumen.asignaturaSinCatalogo}.`,
        tipo: nuevoResumen.aplicadas > 0 ? 'exito' : 'error',
      })
    } catch {
      limpiarImportacion()
      setMensaje({ texto: 'Error al importar la matriz secundaria. Revisa el CSV.', tipo: 'error' })
    } finally {
      if (archivoCsvRef.current) archivoCsvRef.current.value = ''
    }
  }

  const guardarNotas = async () => {
    if (!seccionId || !userId || notasPendientes.length === 0) return
    if (!window.confirm(`Confirmas guardar ${notasPendientes.length} calificaciones de Secundaria?`)) return

    setGuardando(true)
    setMensaje({ texto: 'Guardando calificaciones de Secundaria...', tipo: 'info' })
    try {
      const { error } = await supabase
        .from('calificaciones')
        .upsert(notasPendientes, { onConflict: 'estudiante_id,seccion_id,asignatura_id,periodo,competencia' })
      if (error) throw error

      setMensaje({ texto: `Calificaciones de Secundaria guardadas: ${notasPendientes.length} registros.`, tipo: 'exito' })
      limpiarImportacion()
    } catch (error: any) {
      setMensaje({ texto: `Error al guardar calificaciones: ${error?.message || 'revisa la conexion.'}`, tipo: 'error' })
    } finally {
      setGuardando(false)
    }
  }

  const descargarPlantilla = () => {
    const nombre = asignaturaActiva || asignaturasDelNivel[0]
    const filas = [
      `numero_orden,sigerd_id,nombre_completo,${competenciasSecundaria.flatMap(comp => periodosSecundaria.map(periodo => `${comp.toLowerCase()}_${periodo.toLowerCase()}`)).join(',')},completiva,extraordinaria,especial,situacion`,
      ...estudiantes.slice(0, 3).map(est => `${est.numero_orden},${est.sigerd_id || est.rne || ''},"${est.nombre_completo}",${competenciasSecundaria.flatMap(() => periodosSecundaria.map(() => '')).join(',')},,,,Pendiente`),
    ]
    const blob = new Blob([filas.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `plantilla_secundaria_${crearAlias(nombre)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (cargando) return <div className="p-10 text-center text-sm font-medium text-slate-500">Cargando carga masiva secundaria...</div>
  if (!seccionId) return <div className="p-10 text-center text-sm font-semibold text-slate-500">Selecciona una seccion secundaria en el Dashboard.</div>

  const resumenItems = [
    ['Calificaciones listas', resumen.aplicadas, 'text-slate-950'],
    ['Vacias', resumen.celdasVacias, 'text-slate-700'],
    ['Sin estudiante', resumen.sinEstudiante, 'text-amber-700'],
    ['Columnas invalidas', resumen.columnaInvalida, 'text-rose-700'],
    ['Calificaciones invalidas', resumen.notaInvalida, 'text-rose-700'],
    ['Sin catalogo', resumen.asignaturaSinCatalogo, 'text-cyan-700'],
  ] as const

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <header className="mb-6 rounded-lg border border-teal-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-teal-700">Registro Escolar - Nivel Secundario</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Carga masiva por asignatura</h1>
              <p className="mt-2 text-sm text-slate-500">{etiquetaSeccion(infoSeccion)}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_auto_auto]">
              <select
                value={asignaturaActiva}
                onChange={(e) => {
                  setAsignaturaActiva(e.target.value)
                  limpiarImportacion()
                }}
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              >
                {asignaturasDelNivel.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
              <button onClick={descargarPlantilla} className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:text-teal-700">
                Plantilla CSV
              </button>
              <input type="file" accept=".csv" ref={archivoCsvRef} onChange={importarCSV} className="hidden" />
              <button onClick={() => archivoCsvRef.current?.click()} className="h-10 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800">
                Importar matriz
              </button>
            </div>
          </div>
        </header>

        <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {asignaturasConCatalogo.map((item, index) => (
            <button
              key={item.nombre}
              type="button"
              onClick={() => {
                setAsignaturaActiva(item.nombre)
                limpiarImportacion()
              }}
              className={`rounded-lg border p-4 text-left shadow-sm transition ${
                normalizarTexto(asignaturaActiva) === normalizarTexto(item.nombre)
                  ? 'border-teal-300 bg-teal-50'
                  : 'border-slate-200 bg-white hover:border-teal-200 hover:bg-slate-50'
              }`}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 font-mono text-xs font-bold text-white">{String(index + 1).padStart(2, '0')}</span>
              <span className="mt-3 block text-sm font-bold text-slate-950">{item.nombre}</span>
              <span className={`mt-1 block text-xs font-semibold ${item.registro ? 'text-teal-700' : 'text-amber-700'}`}>
                {item.registro ? 'Lista para guardar' : 'Falta en catalogo'}
              </span>
            </button>
          ))}
        </section>

        {mensaje.texto && (
          <div className={`mb-5 rounded-md border p-4 text-sm font-semibold ${mensaje.tipo === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : mensaje.tipo === 'exito' ? 'border-teal-200 bg-teal-50 text-teal-800' : 'border-cyan-200 bg-cyan-50 text-cyan-800'}`}>
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

        <section className="mb-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-950">Vista previa</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">No.</th>
                    <th className="px-4 py-3 font-semibold">Estudiante</th>
                    <th className="px-4 py-3 font-semibold">Asignatura</th>
                    <th className="px-4 py-3 text-center font-semibold">Competencia</th>
                    <th className="px-4 py-3 text-center font-semibold">Periodo</th>
                    <th className="px-4 py-3 text-center font-semibold">Calificacion</th>
                    <th className="px-4 py-3 text-center font-semibold">Final</th>
                  </tr>
                </thead>
                <tbody>
                  {vistaPrevia.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-sm font-medium text-slate-400">Sin matriz importada.</td>
                    </tr>
                  ) : vistaPrevia.map((fila, index) => (
                    <tr key={`${fila.numero}-${fila.asignatura}-${fila.competencia}-${fila.periodo}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="border-t border-slate-100 px-4 py-3 font-semibold text-slate-500">{fila.numero}</td>
                      <td className="border-t border-slate-100 px-4 py-3 font-medium text-slate-900">{fila.estudiante}</td>
                      <td className="border-t border-slate-100 px-4 py-3 text-slate-600">{fila.asignatura}</td>
                      <td className="border-t border-slate-100 px-4 py-3 text-center font-semibold text-cyan-700">{fila.competencia}</td>
                      <td className="border-t border-slate-100 px-4 py-3 text-center font-semibold text-teal-700">{fila.periodo}</td>
                      <td className="border-t border-slate-100 px-4 py-3 text-center font-semibold text-slate-950">{fila.nota}</td>
                      <td className="border-t border-slate-100 px-4 py-3 text-center font-semibold text-slate-700">{fila.finalArea || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-950">Formato de importacion</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>Por asignatura activa: <span className="font-mono text-xs text-slate-800">numero_orden, c1_p1, c1_p2, c1_rp1, c1_p3, c1_p4, c1_rp2</span></p>
              <p>Varias asignaturas: <span className="font-mono text-xs text-slate-800">matematica_c1_p1, matematica_c1_rp1</span></p>
              <p>Opcionales: <span className="font-mono text-xs text-slate-800">completiva, extraordinaria, especial, situacion</span></p>
            </div>
            <div className="mt-5 rounded-md border border-teal-100 bg-teal-50 p-3 text-xs leading-5 text-teal-900">
              Las calificaciones guardan `nivel=Secundario` y formato `secundaria_boletin_calificaciones`, separado de Primaria.
            </div>
          </aside>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button onClick={limpiarImportacion} disabled={notasPendientes.length === 0 || guardando} className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
            Limpiar
          </button>
          <button onClick={guardarNotas} disabled={notasPendientes.length === 0 || guardando} className="h-10 rounded-md bg-teal-700 px-5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50">
            {guardando ? 'Guardando...' : `Guardar ${notasPendientes.length} calificaciones`}
          </button>
        </div>
      </div>
    </div>
  )
}
