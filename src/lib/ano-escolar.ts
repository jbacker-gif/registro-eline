const fechaDominicana = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit',
})

export function anoEscolarCerrado(ano?: string | null) {
  const limpio = (ano ?? '').replace(/[\s/_.-]/g, '')
  const completo = /^20\d{2}20\d{2}$/.test(limpio) ? limpio
    : /^\d{4}$/.test(limpio) ? '20' + limpio.slice(0, 2) + '20' + limpio.slice(2) : ''
  if (!completo) return false
  const fin = completo.slice(4)
  return Number(fin) === Number(completo.slice(0, 4)) + 1 && fechaDominicana.format(new Date()) > fin + '-06-30'
}
