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
