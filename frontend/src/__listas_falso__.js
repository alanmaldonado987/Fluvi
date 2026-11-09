import { aItem, aLista, aMiembro } from '@/lib/listas'

const USUARIOS = [
  { id: 'ana', email: 'ana@ejemplo.co', nombre: 'Ana' },
  { id: 'beto', email: 'beto@ejemplo.co', nombre: 'Beto' },
  { id: 'carla', email: 'carla@ejemplo.co', nombre: 'Carla' },
]
if (!window.__servidor) window.__servidor = { usuarios: USUARIOS, listas_compras: [], lista_items: [], lista_miembros: [] }
if (!window.__registro) window.__registro = []
const S = () => window.__servidor
const yo = () => window.__usuarioActual
const clon = (x) => JSON.parse(JSON.stringify(x))
const log = (fn, args) => window.__registro.push({ usuario: yo(), fn, args: clon(args) })
const sinTabla = () => Promise.reject({ code: 'PGRST205', message: "Could not find the table 'public.listas_compras' in the schema cache" })
const lista = (id) => S().listas_compras.find((l) => l.id === id)
const miembro = (id, u) => S().lista_miembros.find((m) => m.lista_id === id && m.usuario_id === u)
const permiso = (id, u) => { const l = lista(id); if (!l) return false; if (l.user_id === u) return true; const m = miembro(id, u); return Boolean(m && m.estado === 'aceptada' && l.compartida) }

export function suscribirCambios(cb, conexion) { setTimeout(() => conexion?.(true), 20); return () => {} }
export function suscribirInvitaciones() { return () => {} }
export async function enviarCorreoInvitacion(id) { log('enviarCorreoInvitacion', [id]); return true }
export async function cargarListas() {
  log('cargarListas', [])
  if (window.__sinMigracion) return sinTabla()
  const u = yo()
  const listas = S().listas_compras.filter((l) => l.user_id === u || miembro(l.id, u))
  return clon({ listas: listas.map(aLista), items: S().lista_items.filter((i) => permiso(i.lista_id, u)).map(aItem), miembros: S().lista_miembros.filter((m) => m.usuario_id === u || lista(m.lista_id)?.user_id === u).map(aMiembro) })
}
export async function cargarInvitaciones(uid) {
  if (window.__sinMigracion) return sinTabla()
  return S().lista_miembros.filter((m) => m.usuario_id === uid && m.estado === 'pendiente').map((m) => ({ m, l: lista(m.lista_id) })).filter((x) => x.l).map(({ m, l }) => ({ listaId: m.lista_id, nombre: l.nombre, propietarioNombre: l.propietario_nombre, propietarioEmail: l.propietario_email }))
}
export async function crearLista(l) { log('crearLista', [l]); const x = S().usuarios.find((y) => y.id === yo()); S().listas_compras.push({ id: l.id, user_id: yo(), nombre: l.nombre, compartida: Boolean(l.compartida), propietario_nombre: x.nombre, propietario_email: x.email }) }
export async function actualizarLista(id, d) { Object.assign(lista(id), d) }
export async function eliminarLista(id) { S().listas_compras = S().listas_compras.filter((l) => l.id !== id) }
export async function crearItem(i) { S().lista_items.push({ id: i.id, lista_id: i.listaId, nombre: i.nombre, precio: i.precio ?? 0, fecha_compra: i.fechaCompra ?? null, comprado: false, comprado_en: null, creado_por: yo() }) }
export async function actualizarItem(id, d) { const it = S().lista_items.find((i) => i.id === id); const m = { fechaCompra: 'fecha_compra', compradoEn: 'comprado_en' }; for (const [k, v] of Object.entries(d)) it[m[k] ?? k] = v ?? null }
export async function eliminarItem(id) { S().lista_items = S().lista_items.filter((i) => i.id !== id) }
const inv = (uid, listaId, email) => {
  const dest = S().usuarios.find((x) => x.email === email.trim().toLowerCase())
  if (!dest) throw new Error('No hay un usuario de Fluvi con ese correo')
  if (!miembro(listaId, dest.id)) S().lista_miembros.push({ lista_id: listaId, usuario_id: dest.id, email: dest.email, nombre: dest.nombre, estado: 'pendiente', puede_crear: true, puede_editar: true, puede_eliminar: true })
}
export async function invitar(listaId, email) { log('invitar', [listaId, email]); inv(yo(), listaId, email) }
export async function responderInvitacion(listaId, ok) { const m = miembro(listaId, yo()); if (ok) m.estado = 'aceptada'; else S().lista_miembros = S().lista_miembros.filter((x) => x !== m) }
export async function cambiarPermisos() {}
export async function quitarMiembro(listaId, uid) { S().lista_miembros = S().lista_miembros.filter((m) => !(m.lista_id === listaId && m.usuario_id === uid)) }
export async function quitarMiembros(listaId) { S().lista_miembros = S().lista_miembros.filter((m) => m.lista_id !== listaId) }
window.__otro = {
  crearLista: (uid, nombre, compartida = true) => { const u = S().usuarios.find((x) => x.id === uid); const id = crypto.randomUUID(); S().listas_compras.push({ id, user_id: uid, nombre, compartida, propietario_nombre: u.nombre, propietario_email: u.email }); return id },
  invitar: (uid, listaId, email) => inv(uid, listaId, email),
}
