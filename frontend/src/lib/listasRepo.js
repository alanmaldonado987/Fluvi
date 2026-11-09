import { aItem, aLista, aMiembro } from './listas'
import { consultar } from './repo'
import { resultado, supabase } from './supabase'

// Acceso a la base de datos del módulo de listas de compras (Supabase). Las reglas puras están en listas.js.

const columnasItem = { listaId: 'lista_id', fechaCompra: 'fecha_compra', compradoEn: 'comprado_en' }
const aFilaItem = (datos) => Object.fromEntries(Object.entries(datos).filter(([, v]) => v !== undefined).map(([k, v]) => [columnasItem[k] ?? k, v ?? null]))

// ---- Lectura ----------------------------------------------------------------------------------------------------------

export async function cargarListas() {
  const [listas, items, miembros] = await Promise.all([
    consultar('listas_compras', ['creado_en', 'id']),
    consultar('lista_items', ['creado_en', 'id']),
    consultar('lista_miembros', ['lista_id', 'usuario_id']),
  ])
  return { listas: listas.map(aLista), items: items.map(aItem), miembros: miembros.map(aMiembro) }
}

// Invitaciones pendientes del usuario, con el nombre de la lista y de quien la creó.
export async function cargarInvitaciones(usuarioId) {
  const filas = await supabase
    .from('lista_miembros')
    .select('lista_id, creado_en, lista:listas_compras(id, nombre, propietario_nombre, propietario_email)')
    .eq('usuario_id', usuarioId)
    .eq('estado', 'pendiente')
    .order('creado_en')
    .then(resultado)
  return filas
    .filter((f) => f.lista)
    .map((f) => ({ listaId: f.lista_id, nombre: f.lista.nombre, propietarioNombre: f.lista.propietario_nombre, propietarioEmail: f.lista.propietario_email }))
}

// ---- Escritura --------------------------------------------------------------------------------------------------------

// Una escritura que no toca ninguna fila no da error en la base (las políticas de seguridad simplemente la filtran): se
// detecta aquí para que la app avise y recargue en vez de mostrar un cambio que nunca se guardó.
const conAlgunaFila = (filas) => {
  if (!filas?.length) throw new Error('El cambio no se aplicó: el elemento ya no existe o no tienes permiso.')
}

// ---- Tiempo real y correo ------------------------------------------------------------------------------------------------

// Supabase Realtime (websocket): avisa de que algo cambió en las tablas del módulo. Solo es una señal, no trae los datos:
// la app vuelve a leerlos con su propia sesión, así las reglas de seguridad siempre se aplican. `alCambiarConexion(true|false)`
// dice si el websocket está conectado (si no lo está, la app relee cada cierto tiempo). Devuelve la función para darse de baja.
export function suscribirCambios(alCambiar, alCambiarConexion) {
  const canal = supabase.channel(`listas-${crypto.randomUUID()}`)
  for (const tabla of ['listas_compras', 'lista_items', 'lista_miembros']) {
    canal.on('postgres_changes', { event: '*', schema: 'public', table: tabla }, alCambiar)
  }
  canal.subscribe((estado) => alCambiarConexion?.(estado === 'SUBSCRIBED'))
  return () => {
    supabase.removeChannel(canal)
  }
}

// Avisa al instante cuando le llega o le cambia una invitación al usuario.
export function suscribirInvitaciones(usuarioId, alCambiar) {
  const canal = supabase
    .channel(`invitaciones-${crypto.randomUUID()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'lista_miembros', filter: `usuario_id=eq.${usuarioId}` }, alCambiar)
    .subscribe()
  return () => {
    supabase.removeChannel(canal)
  }
}

// Pide a la función enviar-invitacion que mande el correo a quienes acaban de ser invitados. Es un extra: si la función no está
// desplegada o el correo falla, la invitación igual existe y se ve dentro de la app. Devuelve si salió algún correo.
export async function enviarCorreoInvitacion(listaId) {
  try {
    const { data, error } = await supabase.functions.invoke('enviar-invitacion', { body: { lista_id: listaId } })
    return !error && (data?.enviados ?? 0) > 0
  } catch {
    return false
  }
}

export const crearLista = (l) => supabase.from('listas_compras').insert({ id: l.id, nombre: l.nombre, compartida: l.compartida }).then(resultado)
export const actualizarLista = (id, datos) => supabase.from('listas_compras').update(datos).eq('id', id).select('id').then(resultado).then(conAlgunaFila)
export const eliminarLista = (id) => supabase.from('listas_compras').delete().eq('id', id).select('id').then(resultado).then(conAlgunaFila)

// El orden de un ítem nuevo lo pone la base (la hora actual, así queda al final). Solo se manda al deshacer un borrado, para que
// vuelva a su lugar, y únicamente si la base ya tiene la columna.
export const crearItem = (item, conOrden = false) =>
  supabase.from('lista_items').insert(aFilaItem({ id: item.id, listaId: item.listaId, nombre: item.nombre, precio: item.precio, fechaCompra: item.fechaCompra, comprado: item.comprado, compradoEn: item.compradoEn, orden: conOrden ? item.orden : undefined, prioridad: item.prioridad || undefined })).then(resultado)
export const actualizarItem = (id, datos) => supabase.from('lista_items').update(aFilaItem(datos)).eq('id', id).select('id').then(resultado).then(conAlgunaFila)
export const eliminarItem = (id) => supabase.from('lista_items').delete().eq('id', id).select('id').then(resultado).then(conAlgunaFila)

export const invitar = (listaId, email) => supabase.rpc('invitar_a_lista', { p_lista: listaId, p_email: email }).then(resultado)
export const responderInvitacion = (listaId, aceptar) => supabase.rpc('responder_invitacion', { p_lista: listaId, p_aceptar: aceptar }).then(resultado)
export const cambiarPermisos = (listaId, usuarioId, { crear, editar, eliminar }) =>
  supabase.rpc('cambiar_permisos_miembro', { p_lista: listaId, p_usuario: usuarioId, p_crear: crear, p_editar: editar, p_eliminar: eliminar }).then(resultado)
export const quitarMiembro = (listaId, usuarioId) => supabase.from('lista_miembros').delete().eq('lista_id', listaId).eq('usuario_id', usuarioId).then(resultado)
export const quitarMiembros = (listaId) => supabase.from('lista_miembros').delete().eq('lista_id', listaId).then(resultado)
