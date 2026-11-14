type Cell = string | number | null

const escapeXml = (value: string) => value
  .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const worksheet = (rows: Cell[][], matriz: boolean) => {
  const columnas = matriz ? 14 : 3
  const primeraFila = matriz ? 3 : 2
  const filas = matriz
    ? [['', '', 'P1', '', '', 'P2', '', '', 'P3', '', '', 'P4', '', ''], ...rows]
    : rows
  const ultimaColumna = matriz ? 'N' : 'C'
  const encabezado = matriz ? 2 : 1
  const cuerpo = filas.map((row, index) => {
    const numeroFila = index + 1
    const estiloBase = numeroFila <= encabezado ? 1 : (numeroFila - primeraFila) % 2 === 0 ? 2 : 3
    const cells = row.map((value, col) => {
      const referencia = String.fromCharCode(65 + col) + numeroFila
      const estilo = matriz && numeroFila <= encabezado && col >= 2
        ? 4 + Math.floor((col - 2) / 3) % 2
        : estiloBase
      const atributos = ' r="' + referencia + '" s="' + estilo + '"'
      return typeof value === 'number' && Number.isFinite(value)
        ? '<c' + atributos + '><v>' + value + '</v></c>'
        : '<c' + atributos + ' t="inlineStr"><is><t xml:space="preserve">' + escapeXml(String(value ?? '')) + '</t></is></c>'
    }).join('')
    return '<row r="' + numeroFila + '" ht="' + (numeroFila <= encabezado ? 24 : 20) + '" customHeight="1">' + cells + '</row>'
  }).join('')
  return '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<sheetViews><sheetView workbookViewId="0"><pane xSplit="2" ySplit="' + encabezado +
    '" topLeftCell="C' + primeraFila + '" activePane="bottomRight" state="frozen"/></sheetView></sheetViews>' +
    '<cols><col min="1" max="1" width="10" customWidth="1"/><col min="2" max="2" width="42" customWidth="1"/>' +
    '<col min="3" max="' + columnas + '" width="' + (matriz ? 12 : 19) + '" customWidth="1"/></cols>' +
    '<sheetData>' + cuerpo + '</sheetData>' +
    '<autoFilter ref="A' + encabezado + ':' + ultimaColumna + filas.length + '"/>' +
    (matriz ? '<mergeCells count="4"><mergeCell ref="C1:E1"/><mergeCell ref="F1:H1"/><mergeCell ref="I1:K1"/><mergeCell ref="L1:N1"/></mergeCells>' : '') +
    '</worksheet>'
}

const styles = '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<fonts count="2"><font><sz val="11"/><name val="Calibri"/><color rgb="FF172841"/></font>' +
  '<font><b/><sz val="11"/><name val="Calibri"/><color rgb="FFFFFFFF"/></font></fonts>' +
  '<fills count="6"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
  ['17365B', 'EDF4FB', '245587', '316D79'].map(color =>
    '<fill><patternFill patternType="solid"><fgColor rgb="FF' + color + '"/><bgColor indexed="64"/></patternFill></fill>'
  ).join('') + '</fills>' +
  '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="6">' +
  [[0, 0], [1, 2], [0, 0], [0, 3], [1, 4], [1, 5]].map(([font, fill]) =>
    '<xf numFmtId="0" fontId="' + font + '" fillId="' + fill + '" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1">' +
    '<alignment vertical="center"' + (font === 1 ? ' horizontal="center"' : '') + '/></xf>'
  ).join('') + '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'

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
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      sheets.map((_, i) => '<Override PartName="/xl/worksheets/sheet' + (i + 1) +
        '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('') + '</Types>'],
    ['_rels/.rels', rels(rel(1, 'officeDocument', 'xl/workbook.xml'))],
    ['xl/workbook.xml', '<workbook xmlns="' + ns + 'spreadsheetml/2006/main" xmlns:r="' + office + '"><sheets>' +
      sheets.map(([name], i) => '<sheet name="' + escapeXml(name) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>').join('') + '</sheets></workbook>'],
    ['xl/_rels/workbook.xml.rels', rels(sheets.map((_, i) => rel(i + 1, 'worksheet', 'worksheets/sheet' + (i + 1) + '.xml')).join('') + rel(sheets.length + 1, 'styles', 'styles.xml'))],
    ['xl/styles.xml', styles],
    ...sheets.map(([, rows], i) => ['xl/worksheets/sheet' + (i + 1) + '.xml', worksheet(rows, i > 0)]),
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
