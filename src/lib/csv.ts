export type CsvRow = Record<string, string>

const normalizeHeader = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')

const splitCsvLine = (line: string, delimiter: string) => {
  const values: string[] = []
  let current = ''
  let quoted = false

  for (let index = 0; index < line.length; index++) {
    const char = line[index]
    const next = line[index + 1]

    if (char === '"' && quoted && next === '"') {
      current += '"'
      index++
      continue
    }

    if (char === '"') {
      quoted = !quoted
      continue
    }

    if (char === delimiter && !quoted) {
      values.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  values.push(current.trim())
  return values
}

export const parseCsv = (text: string): CsvRow[] => {
  const cleanText = text.replace(/^\uFEFF/, '')
  const lines = cleanText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)

  if (lines.length < 2) return []

  const delimiter = (lines[0].match(/;/g) || []).length > (lines[0].match(/,/g) || []).length ? ';' : ','
  const headers = splitCsvLine(lines[0], delimiter).map(normalizeHeader)

  return lines.slice(1).map(line => {
    const values = splitCsvLine(line, delimiter)
    return headers.reduce((row, header, index) => {
      row[header] = values[index]?.trim() || ''
      return row
    }, {} as CsvRow)
  })
}

export const getCsvValue = (row: CsvRow, keys: string[]) => {
  for (const key of keys) {
    const normalized = normalizeHeader(key)
    if (row[normalized]) return row[normalized]
  }
  return ''
}

export const readCsvFile = (file: File) =>
  new Promise<CsvRow[]>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = event => resolve(parseCsv(String(event.target?.result || '')))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file, 'UTF-8')
  })
