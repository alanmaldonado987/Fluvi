import { fechaIso } from './format'
import { exportarCopia, subirFilas } from './repo'
import { VERSION } from './version'

// Copia de seguridad completa en un archivo .json: todas las tablas, todos los años, y las preferencias de la cuenta.
// Las filas van tal como están en la base de datos, así que restaurarlas reproduce exactamente lo que había.
export const FORMATO = 1
export const MAX_BYTES = 80 * 1024 * 1024
const TANDA = 500
const CLAVE_ULTIMA = 'fluvi:ultima-copia'

// Orden de restauración: respeta las llaves foráneas (categorías antes de movimientos, billeteras antes de deudas, etc.)
// y lista las columnas permitidas de cada tabla; cualquier otra columna del archivo se ignora (incluido user_id).
const RESTAURABLES = [
  ['categorias', 'categorías', ['id', 'nombre', 'tipo', 'padre_id', 'orden', 'creado_en']],
  ['billeteras', 'billeteras', ['id', 'nombre', 'creado_en']],
  ['recurrentes', 'recurrentes', ['id', 'tipo', 'categoria_id', 'concepto', 'valor', 'dia', 'activo', 'creado_en']],
  ['deudas', 'deudas', ['id', 'persona', 'valor', 'billetera_id', 'concepto', 'fecha', 'pagada', 'billetera_pago_id', 'fecha_pago', 'creado_en']],
  ['movimientos', 'movimientos', ['id', 'consecutivo', 'fecha', 'tipo', 'categoria_id', 'concepto', 'valor', 'observacion', 'creado_en', 'recurrente_id', 'billetera_id', 'billetera_destino_id', 'deuda_id']],
  ['presupuestos', 'presupuestos', ['anio', 'mes', 'categoria_id', 'valor']],
  ['saldos_billetera', 'saldos de billeteras', ['anio', 'mes', 'billetera_id', 'saldo']],
  ['recurrentes_omitidos', 'recurrentes omitidos', ['recurrente_id', 'anio', 'mes']],
  ['metas', 'metas', ['id', 'nombre', 'objetivo', 'categoria_id', 'fecha_inicio', 'fecha_limite', 'creado_en']],
  ['notas_mes', 'notas del mes', ['anio', 'mes', 'texto', 'actualizado_en']],
  // Listas de compras propias (los participantes y las invitaciones no se copian: son de otras personas).
  ['listas_compras', 'listas de compras', ['id', 'nombre', 'compartida', 'creado_en']],
  ['lista_items', 'ítems de las listas', ['id', 'lista_id', 'nombre', 'precio', 'fecha_compra', 'comprado', 'comprado_en', 'creado_en']],
]
const TABLAS_CON_ID = new Set(['categorias', 'billeteras', 'recurrentes', 'deudas', 'movimientos', 'metas', 'listas_compras', 'lista_items'])
// El historial se guarda en la copia como registro, pero no se restaura: lo genera la propia base de datos.
const SOLO_REGISTRO = [['movimientos_historial', 'cambios en el historial']]

// Fecha local (no UTC): de noche en Colombia el nombre del archivo no debe llevar la fecha de mañana.
const fechaHoy = () => {
  const d = new Date()
  return fechaIso(d.getFullYear(), d.getMonth(), d.getDate())
}

export function ultimaCopia() {
  try {
    return localStorage.getItem(CLAVE_ULTIMA)
  } catch {
    return null
  }
}

export async function crearCopia(usuario) {
  const datos = await exportarCopia(usuario.id)
  return {
    app: 'fluvi',
    formato: FORMATO,
    version: VERSION,
    exportadoEn: new Date().toISOString(),
    usuario: { email: usuario.email, nombre: usuario.nombre },
    preferencias: usuario.preferencias,
    datos,
  }
}

export function descargarCopia(copia) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(copia)], { type: 'application/json' }))
  const enlace = Object.assign(document.createElement('a'), { href: url, download: `Fluvi copia completa ${fechaHoy()}.json` })
  enlace.click()
  URL.revokeObjectURL(url)
  try {
    localStorage.setItem(CLAVE_ULTIMA, copia.exportadoEn)
  } catch {
    /* sin almacenamiento: solo no se muestra la fecha de la última copia */
  }
}

// Resumen legible de lo que contiene una copia: [{ tabla, etiqueta, cantidad }], sin las tablas vacías.
export function resumirCopia(copia) {
  return [...RESTAURABLES, ...SOLO_REGISTRO].map(([tabla, etiqueta]) => ({ tabla, etiqueta, cantidad: copia.datos[tabla]?.length ?? 0 })).filter((r) => r.cantidad > 0)
}

// Lee y valida el texto de un archivo de copia. Lanza un Error con un mensaje claro si no sirve.
export function leerCopia(texto) {
  let copia
  try {
    copia = JSON.parse(texto)
  } catch {
    throw new Error('El archivo no es una copia válida de Fluvi.')
  }
  if (!copia || typeof copia !== 'object' || copia.app !== 'fluvi' || typeof copia.datos !== 'object' || copia.datos === null) {
    throw new Error('El archivo no es una copia válida de Fluvi.')
  }
  if (!Number.isInteger(copia.formato) || copia.formato > FORMATO) throw new Error('Esta copia es de una versión más nueva de Fluvi. Actualiza la app e inténtalo de nuevo.')
  for (const [tabla, etiqueta] of RESTAURABLES) {
    const filas = copia.datos[tabla] ?? []
    if (!Array.isArray(filas)) throw new Error(`La copia está dañada: ${etiqueta} no tiene el formato esperado.`)
    const mala = filas.find((f) => !f || typeof f !== 'object' || Array.isArray(f) || (TABLAS_CON_ID.has(tabla) && typeof f.id !== 'string'))
    if (mala !== undefined) throw new Error(`La copia está dañada: hay una fila inválida en ${etiqueta}.`)
  }
  return { copia, resumen: resumirCopia(copia) }
}

const soloColumnas = (fila, columnas) => Object.fromEntries(columnas.filter((c) => fila[c] !== undefined).map((c) => [c, fila[c]]))

// Cuántas filas se van a restaurar en total (para la barra de avance).
export const totalRestaurable = (copia) => RESTAURABLES.reduce((t, [tabla]) => t + (copia.datos[tabla]?.length ?? 0), 0)

// Restaura una copia: agrega lo que falta y actualiza lo que ya existe (por identificador). No borra nada.
// `alAvanzar(hechas, total)` se llama tras cada tanda.
export async function restaurarCopia(copia, alAvanzar = () => {}) {
  const total = totalRestaurable(copia)
  let hechas = 0
  for (const [tabla, etiqueta, columnas] of RESTAURABLES) {
    let filas = (copia.datos[tabla] ?? []).map((f) => soloColumnas(f, columnas))
    // Las subcategorías apuntan a su categoría principal: primero las principales.
    if (tabla === 'categorias') filas = [...filas.filter((f) => !f.padre_id), ...filas.filter((f) => f.padre_id)]
    for (let i = 0; i < filas.length; i += TANDA) {
      const tanda = filas.slice(i, i + TANDA)
      try {
        await subirFilas(tabla, tanda)
      } catch (err) {
        throw new Error(`No se pudo restaurar ${etiqueta}: ${err.message ?? 'error desconocido'}`, { cause: err })
      }
      hechas += tanda.length
      alAvanzar(hechas, total)
    }
  }
}
