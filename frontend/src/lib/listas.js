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
})

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

// Un ítem con fecha, sin comprar, cuya fecha ya pasó.
export const estaVencido = (item, fechaHoy) => Boolean(item.fechaCompra) && !item.comprado && item.fechaCompra < fechaHoy
