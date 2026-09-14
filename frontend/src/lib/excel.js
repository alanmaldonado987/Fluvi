import { MESES } from './format.js'

const HOJAS = ['Ingresos', 'Egresos', 'Caja', 'Registros']

export const limpiar = (s) => String(s ?? '').replace(/\s+/g, ' ').trim()
export const claveDe = (s) =>
  limpiar(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

const mesIndice = (nombre) => MESES.findIndex((m) => claveDe(m) === claveDe(nombre))
const numero = (v) => {
  if (typeof v === 'number') return v
  const n = Number(String(v ?? '').replace(/[^\d.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}
const dosDigitos = (n) => String(n).padStart(2, '0')
const iso = (d) => `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}`

function fechaDe(valor, mesNombre) {
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : iso(valor)
  if (typeof valor === 'number') {
    const d = new Date(Math.round((valor - 25569) * 86400000))
    return `${d.getUTCFullYear()}-${dosDigitos(d.getUTCMonth() + 1)}-${dosDigitos(d.getUTCDate())}`
  }
  const partes = String(valor ?? '').match(/(\d{1,4})[/-](\d{1,2})[/-](\d{1,4})/)
  if (!partes) return null
  const [a, b, c] = partes.slice(1).map(Number)
  let [dia, mes, anio] = a > 31 ? [c, b, a] : [a, b, c]
  if (anio < 100) anio += 2000
  const esperado = mesIndice(mesNombre) + 1
  if (esperado && mes !== esperado && dia === esperado) [dia, mes] = [mes, dia]
  const d = new Date(anio, mes - 1, dia)
  return Number.isNaN(d.getTime()) ? null : iso(d)
}

const trasEncabezado = (filas, patron) => {
  const indice = filas.findIndex((f) => f.slice(0, 3).some((c) => patron.test(limpiar(c))))
  if (indice < 0) throw new Error('No se encontró la fila de encabezado esperada.')
  return filas.slice(indice + 1)
}

const tablaMensual = (filas) =>
  trasEncabezado(filas, /^(concepto|entidad)$/i)
    .map((f) => ({ nombre: limpiar(f[1]), valores: f.slice(2, 14).map(numero) }))
    .filter((f) => f.nombre && claveDe(f.nombre) !== 'total')

export function analizar(XLSX, libro, nombreArchivo = '') {
  const hoja = (n) => libro.Sheets[libro.SheetNames.find((s) => claveDe(s) === claveDe(n))]
  const faltan = HOJAS.filter((n) => !hoja(n))
  if (faltan.length) throw new Error(`Al archivo le faltan las hojas: ${faltan.join(', ')}.`)
  const filas = (n) => XLSX.utils.sheet_to_json(hoja(n), { header: 1, raw: true, defval: null })

  const categorias = new Map()
  const registrar = (nombre, tipo, padre = null) => {
    const k = `${tipo}|${claveDe(padre)}|${claveDe(nombre)}`
    if (!categorias.has(k)) categorias.set(k, { nombre, tipo, padre })
    return categorias.get(k)
  }

  const presupuestos = []
  for (const [tipo, nombreHoja] of [
    ['Ingreso', 'Ingresos'],
    ['Egreso', 'Egresos'],
  ]) {
    for (const fila of tablaMensual(filas(nombreHoja))) {
      const cat = registrar(fila.nombre, tipo)
      fila.valores.forEach((valor, i) => valor && presupuestos.push({ categoria: cat.nombre, tipo, mes: i + 1, valor }))
    }
  }

  const billeteras = []
  const saldos = []
  for (const fila of tablaMensual(filas('Caja'))) {
    billeteras.push(fila.nombre)
    fila.valores.forEach((saldo, i) => saldo && saldos.push({ billetera: fila.nombre, mes: i + 1, saldo }))
  }

  const movimientos = []
  let omitidos = 0
  trasEncabezado(filas('Registros'), /^(n°|no\.?|fecha)$/i).forEach((f, i) => {
      const [, fechaCelda, mesNombre, movimiento, categoria, concepto, valorCelda, observacion] = f
      if (fechaCelda == null && valorCelda == null) return
      const fecha = fechaDe(fechaCelda, mesNombre)
      const valor = numero(valorCelda)
      const tipo = /^ingreso/i.test(limpiar(movimiento)) ? 'Ingreso' : /^egreso/i.test(limpiar(movimiento)) ? 'Egreso' : null
      const [padre, hija] = limpiar(categoria).split(/\s*\/\s*/)
      if (!fecha || !(valor > 0) || !tipo || !padre) {
        omitidos += 1
        return
      }
      const cat = registrar(padre, tipo)
      const sub = hija ? registrar(hija, tipo, cat.nombre) : null
      movimientos.push({ orden: i, fecha, tipo, categoria: cat.nombre, subcategoria: sub?.nombre ?? null, concepto: limpiar(concepto), valor, observacion: limpiar(observacion) })
  })

  const avisos = []
  if (omitidos) avisos.push(`${omitidos} ${omitidos === 1 ? 'fila de Registros se omitió' : 'filas de Registros se omitieron'} por no tener fecha, valor o categoría válidos.`)

  const conteo = new Map()
  for (const m of movimientos) conteo.set(m.fecha.slice(0, 4), (conteo.get(m.fecha.slice(0, 4)) || 0) + 1)
  const anioMovs = [...conteo.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
  const anio = Number(anioMovs ?? (nombreArchivo.match(/20\d{2}/) || [new Date().getFullYear()])[0])
  if (conteo.size > 1) avisos.push(`Registros tiene movimientos de ${conteo.size} años distintos. Solo se importarán los del año elegido.`)

  return { anio, categorias: [...categorias.values()], billeteras, presupuestos, saldos, movimientos, avisos }
}

export async function leerExcel(archivo) {
  const XLSX = await import('xlsx')
  const libro = XLSX.read(await archivo.arrayBuffer(), { cellDates: true })
  return analizar(XLSX, libro, archivo.name)
}

const NUM_FMT = '_-* #,##0_-;\\-* #,##0_-;_-* "-"??_-;_-@_-'
const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } }
const HEADER_FONT = { bold: true, size: 11, color: { argb: 'FFFFFFFF' }, name: 'Calibri' }
const DATA_FONT = { size: 11, name: 'Calibri' }
const BOLD_FONT = { bold: true, size: 11, name: 'Calibri' }
const THIN_BORDER = { style: 'thin', color: { argb: 'FFD9D9D9' } }
const BORDER_ALL = { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER }
const FILA_INICIO = 6

function agregarHojaMensual(libro, nombre, encabezado, filas) {
  const hoja = libro.addWorksheet(nombre)
  hoja.getColumn(1).width = 4
  hoja.getColumn(2).width = 38
  for (let i = 3; i <= 14; i++) hoja.getColumn(i).width = 16

  const encRow = hoja.getRow(FILA_INICIO)
  encRow.values = [null, encabezado, ...MESES]
  for (let c = 2; c <= 14; c++) {
    const cell = encRow.getCell(c)
    cell.fill = HEADER_FILL
    cell.font = HEADER_FONT
    cell.alignment = { horizontal: c === 2 ? 'left' : 'center' }
    cell.border = BORDER_ALL
  }
  encRow.height = 18

  filas.forEach((f, i) => {
    const row = hoja.getRow(FILA_INICIO + 1 + i)
    row.values = [null, f.nombre, ...f.valores]
    row.getCell(2).font = DATA_FONT
    row.getCell(2).border = BORDER_ALL
    for (let c = 3; c <= 14; c++) {
      const cell = row.getCell(c)
      cell.numFmt = NUM_FMT
      cell.font = DATA_FONT
      cell.border = BORDER_ALL
      cell.alignment = { horizontal: 'right' }
    }
    row.height = 17
  })

  if (filas.length) {
    const totalRow = hoja.getRow(FILA_INICIO + 1 + filas.length)
    totalRow.getCell(2).value = 'Total'
    totalRow.getCell(2).font = BOLD_FONT
    totalRow.getCell(2).border = BORDER_ALL
    for (let c = 3; c <= 14; c++) {
      const cell = totalRow.getCell(c)
      cell.value = { formula: `SUM(${cell.address.replace(/\d+/, String(FILA_INICIO + 1))}:${cell.address.replace(/\d+/, String(FILA_INICIO + filas.length))})` }
      cell.numFmt = NUM_FMT
      cell.font = BOLD_FONT
      cell.border = BORDER_ALL
      cell.alignment = { horizontal: 'right' }
    }
    totalRow.height = 18
  }
}

function agregarHojaRegistros(libro, movimientos) {
  const hoja = libro.addWorksheet('Registros')
  const anchos = [5, 13, 11, 13, 37, 35, 16, 41]
  anchos.forEach((w, i) => { hoja.getColumn(i + 1).width = w })

  const cols = ['N°', 'Fecha', 'Mes', 'Movimiento', 'Categoría', 'Nombre/Concepto', 'Valor', 'Observación']
  const encRow = hoja.getRow(FILA_INICIO)
  encRow.values = cols
  for (let c = 1; c <= 8; c++) {
    const cell = encRow.getCell(c)
    cell.fill = HEADER_FILL
    cell.font = HEADER_FONT
    cell.alignment = { horizontal: 'center' }
    cell.border = BORDER_ALL
  }
  encRow.height = 18

  movimientos.forEach((m, i) => {
    const row = hoja.getRow(FILA_INICIO + 1 + i)
    row.values = m
    for (let c = 1; c <= 8; c++) {
      const cell = row.getCell(c)
      cell.font = DATA_FONT
      cell.border = BORDER_ALL
    }
    row.getCell(1).alignment = { horizontal: 'center' }
    row.getCell(2).numFmt = 'dd/mm/yyyy'
    row.getCell(3).alignment = { horizontal: 'center' }
    row.getCell(4).alignment = { horizontal: 'center' }
    row.getCell(7).numFmt = NUM_FMT
    row.getCell(7).alignment = { horizontal: 'right' }
    row.height = 17
  })
}

export async function exportarExcel(state, anio) {
  const ExcelJS = await import('exceljs')
  const { categorias, presupuestos, billeteras, saldos, movimientos } = state
  const clave = (a, m, id) => `${a}-${m}-${id}`

  const padres = categorias.filter((c) => !c.padreId)
  const mapa = new Map(categorias.map((c) => [c.id, c]))
  const nombreCategoria = (id) => {
    const c = mapa.get(id)
    if (!c) return ''
    const padre = c.padreId ? mapa.get(c.padreId) : null
    return padre ? `${padre.nombre} / ${c.nombre}` : c.nombre
  }

  const filasPresupuesto = (tipo) =>
    padres.filter((c) => c.tipo === tipo).map((c) => ({
      nombre: c.nombre,
      valores: Array.from({ length: 12 }, (_, m) => presupuestos[clave(anio, m, c.id)] || 0),
    }))
  const filasCaja = billeteras.map((b) => ({
    nombre: b.nombre,
    valores: Array.from({ length: 12 }, (_, m) => saldos[clave(anio, m, b.id)] || 0),
  }))

  const movsAnio = movimientos
    .filter((m) => Number(m.fecha.slice(0, 4)) === anio)
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.consecutivo - b.consecutivo)
  const registros = movsAnio.map((m, i) => {
    const [y, mo, d] = m.fecha.split('-').map(Number)
    return [i + 1, new Date(y, mo - 1, d), MESES[mo - 1], m.tipo, m.deudaId ? 'Préstamo' : nombreCategoria(m.categoriaId), m.concepto, m.valor, m.observacion || '']
  })

  const libro = new ExcelJS.Workbook()
  libro.creator = 'Fluvi'
  agregarHojaMensual(libro, 'Ingresos', 'Concepto', filasPresupuesto('Ingreso'))
  agregarHojaMensual(libro, 'Egresos', 'Concepto', filasPresupuesto('Egreso'))
  agregarHojaMensual(libro, 'Caja', 'Entidad', filasCaja)
  agregarHojaRegistros(libro, registros)

  const buffer = await libro.xlsx.writeBuffer()
  const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  const enlace = Object.assign(document.createElement('a'), { href: url, download: `Finanzas ${anio}.xlsx` })
  enlace.click()
  URL.revokeObjectURL(url)
}
