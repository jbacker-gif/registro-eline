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

const detectDelimiter = (headerLine: string) => {
  const delimiters = [',', ';', '\t']
  return delimiters.reduce((best, delimiter) => {
    const pattern = delimiter === '\t' ? /\t/g : new RegExp(delimiter, 'g')
    const count = (headerLine.match(pattern) || []).length
    return count > best.count ? { delimiter, count } : best
  }, { delimiter: ',', count: 0 }).delimiter
}

export const parseCsv = (text: string): CsvRow[] => {
  const cleanText = text.replace(/^\uFEFF/, '')
  const lines = cleanText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)

  if (lines.length < 2) return []

  const delimiter = detectDelimiter(lines[0])
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

const decodeCsvText = (buffer: ArrayBuffer) => {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  } catch {
    return new TextDecoder('windows-1252').decode(buffer)
  }
}

export const readCsvFile = async (file: File) => {
  const buffer = await file.arrayBuffer()
  return parseCsv(decodeCsvText(buffer))
}
