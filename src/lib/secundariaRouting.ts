type SearchParamValue = string | string[] | undefined

export type SecondaryTargetView = 'listado' | 'calificaciones' | 'boletin'

const firstParam = (value: SearchParamValue) => Array.isArray(value) ? value[0] : value

export function buildSecondaryModuleUrl(
  searchParams: Record<string, SearchParamValue>,
  vista: SecondaryTargetView,
  modulo?: string,
) {
  const params = new URLSearchParams()
  const seccionId = firstParam(searchParams.seccion_id)
  const materia = firstParam(searchParams.materia)
  const titulo = firstParam(searchParams.titulo)

  if (seccionId) params.set('seccion_id', seccionId)
  params.set('vista', vista)
  params.set('nivel', 'Secundario')
  if (modulo) params.set('modulo', modulo)
  if (materia) params.set('materia', materia)
  if (titulo) params.set('titulo', titulo)

  return `/dashboard/registro-secundaria?${params.toString()}`
}
