export type PeriodoSecundaria = 'P1' | 'P2' | 'RP1' | 'P3' | 'P4' | 'RP2'
export type CompetenciaSecundaria = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'C7'

export const competenciasSecundaria: CompetenciaSecundaria[] = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7']
export const competenciasSecundaria70: CompetenciaSecundaria[] = ['C1', 'C2', 'C3', 'C4']
export const competenciasSecundaria30: CompetenciaSecundaria[] = ['C5', 'C6', 'C7']
export const periodosSecundaria: PeriodoSecundaria[] = ['P1', 'P2', 'RP1', 'P3', 'P4', 'RP2']

export type MatrizSecundaria = Record<CompetenciaSecundaria, Record<PeriodoSecundaria, string>>

export type ResultadoSecundaria = {
  suma70: number
  suma30: number
  resultado70: number
  resultado30: number
  final: number
  situacion: 'Aprobado' | 'Reprobado' | 'Pendiente'
}

export const crearMatrizSecundariaVacia = (): MatrizSecundaria =>
  competenciasSecundaria.reduce((acc, competencia) => {
    acc[competencia] = periodosSecundaria.reduce((periodos, periodo) => {
      periodos[periodo] = ''
      return periodos
    }, {} as Record<PeriodoSecundaria, string>)
    return acc
  }, {} as MatrizSecundaria)

export const normalizarPeriodoSecundaria = (periodo = ''): PeriodoSecundaria => {
  const valor = periodo.toUpperCase()
  if (valor === 'RP' || valor === 'RP1' || valor === 'P2_RP') return 'RP1'
  if (valor === 'RP2' || valor === 'P4_RP') return 'RP2'
  if (periodosSecundaria.includes(valor as PeriodoSecundaria)) return valor as PeriodoSecundaria
  return 'P1'
}

export const valorNumericoSecundaria = (valor: string | number | null | undefined) => {
  if (valor === null || valor === undefined || valor === '') return null
  const numero = typeof valor === 'number' ? valor : Number(String(valor).replace(',', '.'))
  return Number.isFinite(numero) ? numero : null
}

export const redondearSecundaria = (valor: number) => Math.round(valor + 1e-9)

export const calcularResultadoSecundaria = (matriz: MatrizSecundaria): ResultadoSecundaria => {
  const sumar = (competencias: CompetenciaSecundaria[]) =>
    competencias.reduce((total, competencia) => {
      return total + periodosSecundaria.reduce((subtotal, periodo) => {
        return subtotal + (valorNumericoSecundaria(matriz[competencia]?.[periodo]) || 0)
      }, 0)
    }, 0)

  const suma70 = sumar(competenciasSecundaria70)
  const suma30 = sumar(competenciasSecundaria30)
  const resultado70 = redondearSecundaria(suma70 * (0.70 / 16))
  const resultado30 = redondearSecundaria(suma30 * (0.30 / 12))
  const final = resultado70 + resultado30
  const hayValores = suma70 > 0 || suma30 > 0

  return {
    suma70,
    suma30,
    resultado70,
    resultado30,
    final,
    situacion: hayValores ? final >= 70 ? 'Aprobado' : 'Reprobado' : 'Pendiente',
  }
}

export const ejemploOficialSecundaria = () => {
  const matriz = crearMatrizSecundariaVacia()
  const valores70 = [75, 80, 60, 65, 25, 90, 89, 91, 84, 96, 80, 90, 70, 60, 75, 10, 85, 82]
  const valores30 = [90, 70, 90, 95, 91, 84, 80, 88, 75, 85, 82, 90]
  const slots70 = competenciasSecundaria70.flatMap(competencia => periodosSecundaria.map(periodo => [competencia, periodo] as const))
  const slots30 = competenciasSecundaria30.flatMap(competencia => periodosSecundaria.map(periodo => [competencia, periodo] as const))

  valores70.forEach((valor, index) => {
    const slot = slots70[index]
    if (slot) matriz[slot[0]][slot[1]] = String(valor)
  })
  valores30.forEach((valor, index) => {
    const slot = slots30[index]
    if (slot) matriz[slot[0]][slot[1]] = String(valor)
  })

  return calcularResultadoSecundaria(matriz)
}
