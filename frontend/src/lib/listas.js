// Módulo de listas de compras. Es independiente del resto de la app: tiene sus propias tablas, su propio estado y no
// toca saldos, billeteras ni movimientos. Este archivo solo tiene lógica pura; el acceso a la base está en listasRepo.js.

// ---- Conversión entre filas de la base y objetos de la app ----------------------------------------------------------

export const aLista = (r) => ({
  id: r.id,
  nombre: r.nombre,
  compartida: r.compartida,
  propietarioId: r.user_id,
  propietarioNombre: r.propietario_nombre,
  propietarioEmail: r.propietario_email,
})

export const aItem = (r) => ({
  id: r.id,
  listaId: r.lista_id,
  nombre: r.nombre,
  precio: Number(r.precio),
  fechaCompra: r.fecha_compra,
  comprado: r.comprado,
  compradoEn: r.comprado_en,
  creadoPor: r.creado_por,
  // Posición manual dentro de la lista; null si la base aún no tiene la columna (migración 20261110120000).
  orden: r.orden == null ? null : Number(r.orden),
  // 'alta' | 'media' | 'baja' | null; undefined si la base aún no tiene la columna (migración 20261111120000).
  prioridad: r.prioridad === undefined ? undefined : (r.prioridad ?? null),
})

export const PRIORIDADES = [
  { id: 'alta', etiqueta: 'Alta', peso: 1 },
  { id: 'media', etiqueta: 'Media', peso: 2 },
  { id: 'baja', etiqueta: 'Baja', peso: 3 },
]
export const pesoPrioridad = (p) => PRIORIDADES.find((x) => x.id === p)?.peso ?? 4

// La prioridad solo se ofrece si la base ya tiene la columna (ningún ítem cargado llega sin ella).
export const hayPrioridad = (items) => !items.some((i) => i.prioridad === undefined)

export const aMiembro = (r) => ({
  listaId: r.lista_id,
  usuarioId: r.usuario_id,
  email: r.email,
  nombre: r.nombre,
  estado: r.estado,
  puedeCrear: r.puede_crear,
  puedeEditar: r.puede_editar,
  puedeEliminar: r.puede_eliminar,
})

// El módulo necesita su migración en la base: si falta, las tablas no existen.
export const faltaMigracion = (err) => {
  const texto = `${err?.message ?? ''} ${err?.details ?? ''}`
  return err?.code === 'PGRST205' || err?.code === '42P01' || (/listas_compras|lista_items|lista_miembros/.test(texto) && /schema cache|does not exist|no existe/i.test(texto))
}

// ---- Reglas (sin base de datos) ------------------------------------------------------------------------------------------

// Qué puede hacer el usuario en una lista. El servidor aplica las mismas reglas; esto solo decide qué botones mostrar.
export function permisosDe(lista, miembros, usuarioId) {
  const ninguno = { propietario: false, ver: false, crear: false, editar: false, eliminar: false }
  if (!lista || !usuarioId) return ninguno
  if (lista.propietarioId === usuarioId) return { propietario: true, ver: true, crear: true, editar: true, eliminar: true }
  const m = lista.compartida ? miembros.find((x) => x.listaId === lista.id && x.usuarioId === usuarioId && x.estado === 'aceptada') : null
  if (!m) return ninguno
  return { propietario: false, ver: true, crear: m.puedeCrear, editar: m.puedeEditar, eliminar: m.puedeEliminar }
}

// Las listas que el usuario ve como suyas: las que creó y aquellas en las que participa (no las invitaciones pendientes).
export const listasVisibles = (listas, miembros, usuarioId) => listas.filter((l) => permisosDe(l, miembros, usuarioId).ver)

export const invitacionesPendientes = (listas, miembros, usuarioId) =>
  miembros
    .filter((m) => m.usuarioId === usuarioId && m.estado === 'pendiente')
    .map((m) => ({ miembro: m, lista: listas.find((l) => l.id === m.listaId) }))
    .filter((x) => x.lista)

export function resumenItems(items) {
  let total = 0
  let comprado = 0
  let cuantosComprados = 0
  for (const i of items) {
    total += i.precio
    if (i.comprado) {
      comprado += i.precio
      cuantosComprados++
    }
  }
  return { total, comprado, pendiente: total - comprado, cantidad: items.length, cuantosComprados }
}

// Revisión sencilla de un correo antes de invitar (la existencia de la cuenta la confirma el servidor al invitar).
export const esCorreoValido = (texto) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(texto ?? '').trim())

// Un ítem con fecha, sin comprar, cuya fecha ya pasó.
export const estaVencido = (item, fechaHoy) => Boolean(item.fechaCompra) && !item.comprado && item.fechaCompra < fechaHoy

// ---- Orden manual de los ítems --------------------------------------------------------------------------------------------

const SEPARACION_MINIMA = 1e-4
const PASO_RENUMERACION = 1000

// ¿Se puede ordenar a mano? Solo si la base ya tiene la columna `orden` (todos los ítems la traen).
export const hayOrden = (items) => items.length > 0 && items.every((i) => typeof i.orden === 'number')

// Ítems en el orden en que se ven: primero por `orden`; si no hay, tal como llegaron (por fecha de creación).
export const ordenarItems = (items) => (hayOrden(items) ? [...items].sort((a, b) => a.orden - b.orden) : items)

// Cambios de `orden` para mover `idMovido` a la posición `indiceDestino` de `lista` (ya ordenada, con ese ítem dentro).
// Normalmente es un solo cambio: el punto medio entre sus nuevos vecinos. Si los vecinos quedaron demasiado juntos para que
// quepa uno en medio, se renumera toda la lista. Devuelve [{ id, orden }].
export function moverItem(lista, idMovido, indiceDestino) {
  const resto = lista.filter((i) => i.id !== idMovido)
  const destino = Math.max(0, Math.min(indiceDestino, resto.length))
  const anterior = resto[destino - 1]?.orden
  const siguiente = resto[destino]?.orden
  if (anterior != null && siguiente != null && siguiente - anterior < SEPARACION_MINIMA) {
    const movido = lista.find((i) => i.id === idMovido)
    const final = [...resto.slice(0, destino), movido, ...resto.slice(destino)]
    return final.map((i, n) => ({ id: i.id, orden: (n + 1) * PASO_RENUMERACION }))
  }
  let orden = 1
  if (anterior == null && siguiente != null) orden = siguiente - 1
  else if (anterior != null && siguiente == null) orden = anterior + 1
  else if (anterior != null && siguiente != null) orden = (anterior + siguiente) / 2
  return [{ id: idMovido, orden }]
}

// Cambios para dejar `lista` en el orden dado (p. ej. "ordenar por precio"): renumera solo lo que cambia de posición.
export function reasignarOrden(listaEnNuevoOrden) {
  return listaEnNuevoOrden.map((i, n) => ({ id: i.id, orden: (n + 1) * PASO_RENUMERACION })).filter((c, n) => listaEnNuevoOrden[n].orden !== c.orden)
}
