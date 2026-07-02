'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabase'

type Pestana = 'listado' | 'formulario' | 'evaluacion' | 'informe'
type Periodo = 'P1' | 'P2' | 'P3' | 'P4'

const gradosSecundaria = ['1ro', '2do', '3ro', '4to', '5to', '6to']
const gradosPrimerCiclo = ['1ro', '2do', '3ro']
const gradosSegundoCiclo = ['4to', '5to', '6to']
const periodos: Periodo[] = ['P1', 'P2', 'P3', 'P4']
const competencias = [
  'Comunicativa',
  'Pensamiento logico, creativo y critico',
  'Resolucion de problemas',
  'Cientifica y tecnologica',
  'Etica y ciudadana',
  'Ambiental y de la salud',
  'Desarrollo personal y espiritual',
]
const asignaturasSecundaria = [
  'Lengua Espanola',
  'Lenguas Extranjeras - Ingles',
  'Lenguas Extranjeras - Frances',
  'Matematica',
  'Ciencias Sociales',
  'Ciencias de la Naturaleza',
  'Educacion Artistica',
  'Educacion Fisica',
  'Formacion Integral Humana y Religiosa',
]
const condiciones = ['Promovido', 'Repitente', 'Reingreso', 'Aplazado']
const resultados = ['Promovido', 'Reprobado', 'Pendiente', 'Retirado', 'Transferido']
const demo = [
  ['Ana Maria', 'Duarte Perez', 'F', '1ro', 'RNE-2026-001', 'Promovido'],
  ['Luis Rafael', 'Matos Rojas', 'M', '3ro', 'RNE-2026-003', 'Pendiente'],
  ['Camila', 'Santos Nunez', 'F', '6to', 'RNE-2026-006', 'Promovido'],
]

const normalizar = (valor = '') =>
  valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

const esSegundoCicloSecundaria = (grado = '') => gradosSegundoCiclo.includes(grado)
const cicloSecundaria = (grado = '') => gradosPrimerCiclo.includes(grado) ? 'Primer ciclo general' : 'Segundo ciclo'
const modalidadDeSeccion = (seccion: any) =>
  esSegundoCicloSecundaria(seccion?.grado) ? (seccion?.modalidad || 'Academica') : 'Primer ciclo general'

const notasVacias = () =>
  competencias.reduce((acc, _, index) => {
    acc[`C${index + 1}`] = { P1: '', P2: '', P3: '', P4: '' }
    return acc
  }, {} as Record<string, Record<Periodo, string>>)

const promedio = (valores: string[]) => {
  const numeros = valores.map(Number).filter(valor => Number.isFinite(valor) && valor > 0)
  return numeros.length ? Math.round(numeros.reduce((total, valor) => total + valor, 0) / numeros.length) : null
}

export default function RegistroSecundaria() {
  const [pestana, setPestana] = useState<Pestana>('listado')
  const [userId, setUserId] = useState('')
  const [secciones, setSecciones] = useState<any[]>([])
  const [seccionId, setSeccionId] = useState('')
  const [estudiantes, setEstudiantes] = useState<any[]>([])
  const [estudianteActivo, setEstudianteActivo] = useState<any | null>(null)
  const [asignaturas, setAsignaturas] = useState<any[]>([])
  const [catalogoCompetencias, setCatalogoCompetencias] = useState<any[]>([])
  const [asignaturaActiva, setAsignaturaActiva] = useState(asignaturasSecundaria[0])
  const [notas, setNotas] = useState(notasVacias())
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(true)
  const [form, setForm] = useState<any>(crearFormulario())
  const [busqueda, setBusqueda] = useState('')
  const [filtroResultado, setFiltroResultado] = useState('Todos')

  const seccionActiva = secciones.find(item => item.id === seccionId)
  const grado = seccionActiva?.grado || estudianteActivo?.grado || '1ro'
  const esSegundoCiclo = esSegundoCicloSecundaria(grado)
  const promedioFinal = useMemo(() => promedio(Object.values(notas).flatMap(item => Object.values(item))), [notas])
  const catalogoFiltrado = catalogoCompetencias.filter(item =>
    item.grado === grado && normalizar(item.asignatura_nombre) === normalizar(asignaturaActiva)
  )
  const competenciasVisibles = catalogoFiltrado.length > 0
    ? catalogoFiltrado.map(item => ({
        clave: item.competencia_codigo,
        etiqueta: item.competencia_fundamental,
        descripcion: item.descripcion,
      }))
    : competencias.map((competencia, index) => ({ clave: `C${index + 1}`, etiqueta: competencia, descripcion: '' }))
  const anosEscolares = Array.from(new Set(secciones.map(seccion => seccion.ano_escolar).filter(Boolean)))
  const opcionesCicloModalidad = Array.from(new Set(secciones.map(modalidadDeSeccion).filter(Boolean)))
  const estudiantesFiltrados = estudiantes.filter(estudiante => {
    const texto = `${estudiante.nombre_completo || ''} ${estudiante.rne || ''} ${estudiante.sigerd_id || ''} ${estudiante.cedula_pasaporte || ''}`
    const coincideBusqueda = normalizar(texto).includes(normalizar(busqueda))
    const coincideResultado = filtroResultado === 'Todos' || (estudiante.resultado_final || 'Pendiente') === filtroResultado
    return coincideBusqueda && coincideResultado
  })

  useEffect(() => {
    inicializar()
  }, [])

  useEffect(() => {
    if (seccionId && userId) cargarEstudiantes(seccionId, userId)
  }, [seccionId, userId])

  useEffect(() => {
    if (estudianteActivo?.id && userId && !String(estudianteActivo.id).startsWith('demo-')) cargarNotas(estudianteActivo.id)
  }, [estudianteActivo?.id, asignaturaActiva, userId])

  const inicializar = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setUserId(session.user.id)
      const [{ data: seccionesData }, { data: asignaturasData }, { data: competenciasData }] = await Promise.all([
        supabase.from('secciones').select('*').eq('user_id', session.user.id).order('ano_escolar', { ascending: false }),
        supabase.from('asignaturas').select('*').order('nombre', { ascending: true }),
        supabase.from('secundaria_competencias_catalogo').select('*').eq('activa', true).order('competencia_codigo', { ascending: true }),
      ])
      const secundarias = (seccionesData || []).filter(seccion =>
        seccion.nivel === 'Secundario' || (seccion.modalidad || seccion.salida_optativa)
      )
      setSecciones(secundarias)
      setAsignaturas(asignaturasData || [])
      setCatalogoCompetencias(competenciasData || [])
      if (secundarias[0]) setSeccionId(secundarias[0].id)
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
    setEstudiantes(data || [])
    setEstudianteActivo(data?.[0] || null)
  }

  const cargarNotas = async (estudianteId: string) => {
    const asignatura = asignaturas.find(item => normalizar(item.nombre) === normalizar(asignaturaActiva))
    if (!asignatura) return setNotas(notasVacias())
    const { data } = await supabase
      .from('calificaciones')
      .select('*')
      .eq('estudiante_id', estudianteId)
      .eq('asignatura_id', asignatura.id)
      .eq('user_id', userId)
    const matriz = notasVacias()
    ;(data || []).forEach((nota: any) => {
      if (matriz[nota.competencia]?.[nota.periodo as Periodo] !== undefined) {
        matriz[nota.competencia][nota.periodo as Periodo] = String(nota.nota)
      }
    })
    setNotas(matriz)
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
    const asignatura = asignaturas.find(item => normalizar(item.nombre) === normalizar(asignaturaActiva))
    if (!asignatura) return setMensaje('Aplica la migracion para crear asignaturas de secundaria.')
    const filas = Object.entries(notas).flatMap(([competencia, porPeriodo]) =>
      periodos.filter(periodo => porPeriodo[periodo] !== '').map(periodo => ({
        estudiante_id: estudianteActivo.id,
        seccion_id: seccionId,
        user_id: userId,
        asignatura_id: asignatura.id,
        periodo,
        competencia,
        nota: Number(porPeriodo[periodo]),
      }))
    )
    if (filas.length) {
      const { error } = await supabase
        .from('calificaciones')
        .upsert(filas, { onConflict: 'estudiante_id,seccion_id,asignatura_id,periodo,competencia' })
      if (error) return setMensaje(`No se pudieron guardar las notas: ${error.message}`)
    }
    setMensaje('Evaluacion guardada.')
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
    setNotas(notasVacias())
    setMensaje('Datos demo cargados en pantalla. Para persistir, crea una seccion secundaria y guarda las fichas.')
  }

  if (cargando) return <div className="p-10 text-center text-sm font-semibold text-slate-500">Cargando secundaria...</div>

  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 md:flex-row md:items-end md:justify-between md:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Registro Escolar - Nivel Secundario</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Registro Escolar - Nivel Secundario</h1>
            <p className="mt-1 text-sm text-slate-500">Fichas, competencias, calificaciones e informe preliminar segun los PDF del MINERD.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select value={seccionId} onChange={e => setSeccionId(e.target.value)} className="input-secundaria">
              <option value="">Seleccionar seccion secundaria</option>
              {secciones.map(seccion => (
                <option key={seccion.id} value={seccion.id}>{seccion.grado} "{seccion.identificador}" {seccion.tanda || ''} {seccion.ano_escolar || ''}</option>
              ))}
            </select>
            <button onClick={cargarDemo} className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-100">Ver demo</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        {mensaje && <div className="mb-5 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">{mensaje}</div>}

        <section className="mb-6 grid gap-3 md:grid-cols-5">
          <Resumen label="Ano escolar" value={seccionActiva?.ano_escolar || '2025-2026'} />
          <Resumen label="Grado y seccion" value={seccionActiva ? `${seccionActiva.grado} "${seccionActiva.identificador}"` : 'Demo'} />
          <Resumen label="Ciclo" value={cicloSecundaria(grado)} />
          <Resumen label="Modalidad" value={esSegundoCiclo ? modalidadDeSeccion(seccionActiva) : 'No aplica'} />
          <Resumen label="Salida optativa" value={seccionActiva?.salida_optativa || (esSegundoCiclo ? 'Pendiente' : 'No aplica')} />
        </section>

        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-5">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Ano escolar</span>
              <select
                value={seccionActiva?.ano_escolar || ''}
                onChange={e => {
                  const proxima = secciones.find(item => item.ano_escolar === e.target.value && (!seccionActiva || item.grado === seccionActiva.grado)) || secciones.find(item => item.ano_escolar === e.target.value)
                  if (proxima) setSeccionId(proxima.id)
                }}
                className="input-secundaria"
              >
                <option value="">Todos</option>
                {anosEscolares.map(ano => <option key={ano} value={ano}>{ano}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Grado</span>
              <select
                value={grado}
                onChange={e => {
                  const proxima = secciones.find(item => item.grado === e.target.value && item.ano_escolar === seccionActiva?.ano_escolar) || secciones.find(item => item.grado === e.target.value)
                  if (proxima) setSeccionId(proxima.id)
                }}
                className="input-secundaria"
              >
                {gradosSecundaria.map(item => <option key={item} value={item}>{item} Secundaria</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Ciclo / modalidad</span>
              <select
                value={modalidadDeSeccion(seccionActiva)}
                onChange={e => {
                  const proxima = secciones.find(item => modalidadDeSeccion(item) === e.target.value)
                  if (proxima) setSeccionId(proxima.id)
                }}
                className="input-secundaria"
              >
                {opcionesCicloModalidad.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Resultado</span>
              <select value={filtroResultado} onChange={e => setFiltroResultado(e.target.value)} className="input-secundaria">
                <option value="Todos">Todos</option>
                {resultados.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Buscar</span>
              <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Nombre, RNE o ID" className="input-secundaria" />
            </label>
          </div>
        </section>

        <div className="mb-5 flex flex-wrap gap-2 border-b border-slate-200">
          {[
            ['listado', 'Listado'],
            ['formulario', form.id ? 'Editar ficha' : 'Nueva ficha'],
            ['evaluacion', 'Evaluacion'],
            ['informe', 'Informe'],
          ].map(([clave, etiqueta]) => (
            <button key={clave} onClick={() => setPestana(clave as Pestana)} className={`rounded-t-md px-4 py-2 text-sm font-bold ${pestana === clave ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
              {etiqueta}
            </button>
          ))}
        </div>

        {pestana === 'listado' && (
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900">Registros secundarios</h2>
                <p className="text-sm text-slate-500">Consulta, edita y abre informes del grado activo.</p>
              </div>
              <button onClick={nuevoRegistro} className="h-10 rounded-md bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700">Crear registro</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <tr><th className="p-3">No.</th><th className="p-3">Estudiante</th><th className="p-3">RNE / ID</th><th className="p-3">Condicion</th><th className="p-3">Resultado</th><th className="p-3 text-right">Acciones</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {estudiantesFiltrados.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center font-semibold text-slate-400">No hay estudiantes secundarios en esta seccion.</td></tr>
                  ) : estudiantesFiltrados.map(estudiante => (
                    <tr key={estudiante.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-500">{estudiante.numero_orden}</td>
                      <td className="p-3"><button onClick={() => setEstudianteActivo(estudiante)} className="text-left font-black text-slate-900 hover:text-blue-700">{estudiante.nombre_completo}</button><span className="block text-xs font-semibold text-slate-400">{estudiante.sexo === 'F' ? 'Femenino' : 'Masculino'}</span></td>
                      <td className="p-3 font-medium text-slate-600">{estudiante.rne || estudiante.sigerd_id || estudiante.cedula_pasaporte || '-'}</td>
                      <td className="p-3 text-slate-600">{estudiante.condicion_inicial || '-'}</td>
                      <td className="p-3"><span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">{estudiante.resultado_final || 'Pendiente'}</span></td>
                      <td className="p-3 text-right">
                        <button onClick={() => { setEstudianteActivo(estudiante); setPestana('listado') }} className="mr-2 rounded-md bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200">Ver</button>
                        <button onClick={() => editar(estudiante)} className="mr-2 rounded-md bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100">Editar</button>
                        <button onClick={() => { setEstudianteActivo(estudiante); setPestana('evaluacion') }} className="mr-2 rounded-md bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100">Evaluacion</button>
                        <button onClick={() => { setEstudianteActivo(estudiante); setPestana('informe') }} className="rounded-md bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700">Informe</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

        {pestana === 'evaluacion' && (
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div><h2 className="text-base font-black text-slate-900">Evaluacion por competencias especificas</h2><p className="text-sm text-slate-500">{estudianteActivo?.nombre_completo || 'Selecciona un estudiante'} - minimo aprobatorio 70 puntos.</p></div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select value={estudianteActivo?.id || ''} onChange={e => setEstudianteActivo(estudiantes.find(item => item.id === e.target.value) || null)} className="input-secundaria">{estudiantes.map(estudiante => <option key={estudiante.id} value={estudiante.id}>{estudiante.nombre_completo}</option>)}</select>
                <select value={asignaturaActiva} onChange={e => setAsignaturaActiva(e.target.value)} className="input-secundaria">{asignaturasSecundaria.map(asignatura => <option key={asignatura}>{asignatura}</option>)}</select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] border-collapse text-sm">
                <thead className="bg-slate-900 text-white"><tr><th className="border border-slate-700 p-3 text-left">Competencia fundamental</th>{periodos.map(periodo => <th key={periodo} className="border border-slate-700 p-3">{periodo}</th>)}</tr></thead>
                <tbody>
                  {competenciasVisibles.map((competencia) => {
                    const clave = competencia.clave
                    return <tr key={clave} className="odd:bg-white even:bg-slate-50"><td className="border border-slate-200 p-3 font-semibold text-slate-800">{clave}. {competencia.etiqueta}<span className="mt-1 block text-xs font-medium text-slate-500">{competencia.descripcion}</span></td>{periodos.map(periodo => <td key={periodo} className="border border-slate-200 p-2"><input type="number" min={0} max={100} value={notas[clave]?.[periodo] || ''} onChange={e => setNotas({ ...notas, [clave]: { ...(notas[clave] || { P1: '', P2: '', P3: '', P4: '' }), [periodo]: e.target.value } })} className="h-10 w-full rounded-md border border-slate-200 text-center font-bold outline-none focus:ring-2 focus:ring-blue-100" /></td>)}</tr>
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm font-bold text-slate-700">Calificacion final estimada: {promedioFinal ?? '-'} - {promedioFinal === null ? 'Pendiente' : promedioFinal >= 70 ? 'Promovido' : 'Pendiente de recuperacion'}</p>
              <button onClick={guardarNotas} className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700">Guardar evaluacion</button>
            </div>
          </section>
        )}

        {pestana === 'informe' && (
          <section className="space-y-4">
            <div className="flex justify-end print:hidden"><button onClick={() => window.print()} className="rounded-md bg-slate-900 px-5 py-2 text-sm font-bold text-white">Imprimir</button></div>
            <div className="mx-auto max-w-4xl rounded-lg border border-slate-300 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
              <div className="border-b border-slate-200 pb-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Informe de Evaluacion de los Aprendizajes</p><h2 className="mt-2 text-2xl font-black text-slate-950">Nivel Secundario - {grado}</h2><p className="mt-1 text-sm text-slate-500">Vista preliminar editable basada en los informes oficiales.</p></div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Dato label="Estudiante" value={estudianteActivo?.nombre_completo} /><Dato label="RNE / ID o pasaporte" value={estudianteActivo?.rne || estudianteActivo?.cedula_pasaporte || estudianteActivo?.sigerd_id} /><Dato label="Seccion" value={seccionActiva ? `${seccionActiva.grado} "${seccionActiva.identificador}"` : 'Demo'} /><Dato label="No. orden" value={estudianteActivo?.numero_orden} /><Dato label="Condicion inicial" value={estudianteActivo?.condicion_inicial} /><Dato label="Resultado final" value={estudianteActivo?.resultado_final || (promedioFinal && promedioFinal >= 70 ? 'Promovido' : 'Pendiente')} />
              </div>
              <div className="mt-8 overflow-x-auto"><table className="w-full min-w-[700px] border-collapse text-sm"><thead className="bg-slate-100"><tr><th className="border border-slate-300 p-2 text-left">Asignatura</th>{periodos.map(periodo => <th key={periodo} className="border border-slate-300 p-2">{periodo}</th>)}<th className="border border-slate-300 p-2">CF</th></tr></thead><tbody>{asignaturasSecundaria.map(asignatura => <tr key={asignatura}><td className="border border-slate-300 p-2 font-semibold">{asignatura}</td>{periodos.map(periodo => <td key={periodo} className="border border-slate-300 p-2 text-center">{asignatura === asignaturaActiva ? promedio(Object.values(notas).map(item => item[periodo])) : ''}</td>)}<td className="border border-slate-300 p-2 text-center font-black">{asignatura === asignaturaActiva ? promedioFinal : ''}</td></tr>)}</tbody></table></div>
              <div className="mt-8 grid gap-6 md:grid-cols-3"><Firma label="Docente encargado" /><Firma label="Director/a" /><Firma label="Padre, madre o tutor" /></div>
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
