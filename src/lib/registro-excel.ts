type Cell = string | number | null

const escapeXml = (value: string) => value
  .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const worksheet = (rows: Cell[][]) =>
  '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols><col min="1" max="1" width="9" customWidth="1"/><col min="2" max="2" width="38" customWidth="1"/><col min="3" max="17" width="14" customWidth="1"/></cols><sheetData>' +
  rows.map(row => '<row>' + row.map(value =>
    typeof value === 'number' && Number.isFinite(value)
      ? '<c><v>' + value + '</v></c>'
      : '<c t="inlineStr"><is><t xml:space="preserve">' + escapeXml(String(value ?? '')) + '</t></is></c>'
  ).join('') + '</row>').join('') + '</sheetData></worksheet>'

function crc32(bytes: Uint8Array) {
  let crc = -1
  for (const byte of bytes) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
  }
  return ~crc
}

export function descargarRegistroExcel(nombre: string, alumnos: Cell[][], asignaturas: { nombre: string; filas: Cell[][] }[]) {
  const nombres = new Set(['estudiantes'])
  const sheets: [string, Cell[][]][] = [['Estudiantes', alumnos]]
  for (const asignatura of asignaturas) {
    const base = asignatura.nombre.replace(/[\\/:?*\[\]']/g, ' ').trim() || 'Asignatura'
    let hoja = base.slice(0, 31)
    for (let numero = 2; nombres.has(hoja.toLowerCase()); numero++) {
      const sufijo = ' ' + numero
      hoja = base.slice(0, 31 - sufijo.length) + sufijo
    }
    nombres.add(hoja.toLowerCase())
    sheets.push([hoja, asignatura.filas])
  }
  const ns = 'http://schemas.openxmlformats.org/'
  const office = ns + 'officeDocument/2006/relationships'
  const rels = (items: string) => '<Relationships xmlns="' + ns + 'package/2006/relationships">' + items + '</Relationships>'
  const rel = (id: number, type: string, target: string) =>
    '<Relationship Id="rId' + id + '" Type="' + office + '/' + type + '" Target="' + target + '"/>'
  const files = [
    ['[Content_Types].xml', '<Types xmlns="' + ns + 'package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      sheets.map((_, i) => '<Override PartName="/xl/worksheets/sheet' + (i + 1) +
        '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('') + '</Types>'],
    ['_rels/.rels', rels(rel(1, 'officeDocument', 'xl/workbook.xml'))],
    ['xl/workbook.xml', '<workbook xmlns="' + ns + 'spreadsheetml/2006/main" xmlns:r="' + office + '"><sheets>' +
      sheets.map(([name], i) => '<sheet name="' + escapeXml(name) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>').join('') + '</sheets></workbook>'],
    ['xl/_rels/workbook.xml.rels', rels(sheets.map((_, i) => rel(i + 1, 'worksheet', 'worksheets/sheet' + (i + 1) + '.xml')).join(''))],
    ...sheets.map(([, rows], i) => ['xl/worksheets/sheet' + (i + 1) + '.xml', worksheet(rows)]),
  ]

  const encoder = new TextEncoder()
  const local: BlobPart[] = []
  const directory: BlobPart[] = []
  let offset = 0
  let directorySize = 0
  for (const [path, xml] of files) {
    const name = encoder.encode(path)
    const data = encoder.encode(xml)
    const checksum = crc32(data)
    const header = new DataView(new ArrayBuffer(30))
    header.setUint32(0, 0x04034b50, true)
    header.setUint16(4, 20, true)
    header.setUint16(12, 33, true)
    header.setUint32(14, checksum, true)
    header.setUint32(18, data.length, true)
    header.setUint32(22, data.length, true)
    header.setUint16(26, name.length, true)
    local.push(header.buffer, name, data)

    const entry = new DataView(new ArrayBuffer(46))
    entry.setUint32(0, 0x02014b50, true)
    entry.setUint16(4, 20, true)
    entry.setUint16(6, 20, true)
    entry.setUint16(14, 33, true)
    entry.setUint32(16, checksum, true)
    entry.setUint32(20, data.length, true)
    entry.setUint32(24, data.length, true)
    entry.setUint16(28, name.length, true)
    entry.setUint32(42, offset, true)
    directory.push(entry.buffer, name)
    offset += 30 + name.length + data.length
    directorySize += 46 + name.length
  }
  const end = new DataView(new ArrayBuffer(22))
  end.setUint32(0, 0x06054b50, true)
  end.setUint16(8, files.length, true)
  end.setUint16(10, files.length, true)
  end.setUint32(12, directorySize, true)
  end.setUint32(16, offset, true)

  const url = URL.createObjectURL(new Blob([...local, ...directory, end.buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }))
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre.replace(/[^\p{L}\p{N}_-]+/gu, '-') + '.xlsx'
  enlace.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
}
