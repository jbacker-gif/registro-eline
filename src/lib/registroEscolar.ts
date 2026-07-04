export type NivelEducativo = 'Primaria' | 'Secundario'

export const gradosPrimaria = ['1ro', '2do', '3ro', '4to', '5to', '6to']
export const gradosSecundaria = ['1ro', '2do', '3ro', '4to', '5to', '6to']
export const gradosSecundariaPrimerCiclo = ['1ro', '2do', '3ro']
export const gradosSecundariaSegundoCiclo = ['4to', '5to', '6to']

export const asignaturasPrimaria = [
  { id: 1, nombre: 'Lengua Espanola', dbNombre: 'Lengua Espanola', abrevia: 'LE', tono: 'border-blue-200 bg-blue-50 text-blue-700' },
  { id: 2, nombre: 'Matematica', dbNombre: 'Matematica', abrevia: 'MA', tono: 'border-red-200 bg-red-50 text-red-700' },
  { id: 3, nombre: 'Ciencias Sociales', dbNombre: 'Ciencias Sociales', abrevia: 'CS', tono: 'border-amber-200 bg-amber-50 text-amber-700' },
  { id: 4, nombre: 'Ciencias de la Naturaleza', dbNombre: 'Ciencias de la Naturaleza', abrevia: 'CN', tono: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  { id: 5, nombre: 'Ingles', dbNombre: 'Lenguas Extranjeras - Ingles', abrevia: 'IN', tono: 'border-violet-200 bg-violet-50 text-violet-700' },
  { id: 6, nombre: 'Educacion Fisica', dbNombre: 'Educacion Fisica', abrevia: 'EF', tono: 'border-orange-200 bg-orange-50 text-orange-700' },
  { id: 7, nombre: 'Formacion Humana', dbNombre: 'Formacion Integral Humana y Religiosa', abrevia: 'FH', tono: 'border-teal-200 bg-teal-50 text-teal-700' },
  { id: 8, nombre: 'Educacion Artistica', dbNombre: 'Educacion Artistica', abrevia: 'EA', tono: 'border-pink-200 bg-pink-50 text-pink-700' },
]

export const asignaturasSecundaria = [
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

export const normalizarTexto = (valor = '') =>
  valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()

export const nivelDeSeccion = (seccion: any): NivelEducativo =>
  seccion?.nivel === 'Secundario' ? 'Secundario' : 'Primaria'

export const esSeccionPrimaria = (seccion: any) => nivelDeSeccion(seccion) === 'Primaria'
export const esSeccionSecundaria = (seccion: any) => nivelDeSeccion(seccion) === 'Secundario'

export const esSegundoCicloSecundaria = (grado = '') => gradosSecundariaSegundoCiclo.includes(grado)

export const cicloSecundaria = (grado = '') =>
  gradosSecundariaPrimerCiclo.includes(grado) ? 'Primer ciclo general' : 'Segundo ciclo'

export const modalidadDeSeccion = (seccion: any) =>
  esSegundoCicloSecundaria(seccion?.grado) ? (seccion?.modalidad || 'Academica') : 'No aplica'

export const etiquetaSeccion = (seccion: any) => {
  if (!seccion) return 'Sin seccion'
  const nivel = nivelDeSeccion(seccion)
  const base = `${seccion.grado || '-'} de ${nivel} - Seccion ${seccion.identificador || '-'}`
  const modalidad = nivel === 'Secundario' && esSegundoCicloSecundaria(seccion.grado)
    ? ` - Modalidad ${modalidadDeSeccion(seccion)}`
    : ''
  const tanda = seccion.tanda ? ` (${seccion.tanda})` : ''
  const ano = seccion.ano_escolar ? ` - ${seccion.ano_escolar}` : ''
  return `${base}${modalidad}${tanda}${ano}`
}

export const inicialesEstudiante = (nombre = '') => {
  const limpio = nombre.replace(',', ' ').trim()
  const partes = limpio.split(/\s+/).filter(Boolean)
  if (partes.length === 0) return 'ES'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase()
}

export const calcularEdad = (fecha?: string | null) => {
  if (!fecha) return null
  const nacimiento = new Date(`${fecha}T00:00:00`)
  if (Number.isNaN(nacimiento.getTime())) return null
  const hoy = new Date()
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const mes = hoy.getMonth() - nacimiento.getMonth()
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad -= 1
  return edad >= 0 ? edad : null
}

export const matriculaEstudiante = (estudiante: any) =>
  estudiante?.rne || estudiante?.sigerd_id || estudiante?.cedula_pasaporte || estudiante?.matricula || '-'

export const tutorPrincipal = (estudiante: any) =>
  estudiante?.responsable_principal?.nombre_completo || estudiante?.nombre_tutor || estudiante?.emergencia_nombre || 'No registrado'

export const telefonoTutor = (estudiante: any) =>
  estudiante?.responsable_principal?.telefono || estudiante?.telefono_contacto || estudiante?.emergencia_telefono || ''

export const estadoEstudiante = (estudiante: any) =>
  estudiante?.estado || estudiante?.resultado_final || estudiante?.condicion_inicial || 'Activo'

export const promedioMostrable = (estudiante: any) => {
  const valor = estudiante?.promedio_estudiante ?? estudiante?.promedio_final ?? estudiante?.promedio
  return typeof valor === 'number' && Number.isFinite(valor) ? Math.round(valor) : null
}
