// Lógica de la función enviar-invitacion, separada de Deno y de Supabase para poder probarla sin enviar nada real.
//
// Qué hace: cuando alguien invita a otra persona a una lista compartida, la app llama a esta función y ella envía un correo a las
// personas invitadas por quien llama que todavía no recibieron su correo. El destinatario NUNCA viene de la petición: sale de la
// base de datos. Así la función no sirve para mandar correos a cualquiera.

export const MAX_POR_LLAMADA = 10
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export class ErrorDeSolicitud extends Error {
  constructor(mensaje, estado) {
    super(mensaje)
    this.estado = estado
  }
}

// Los nombres los escribe cada usuario: se escapan antes de ponerlos en el HTML y se limpian los saltos de línea del asunto.
export const escaparHtml = (texto) =>
  String(texto ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const SALTOS = new RegExp('[\r\n\u2028\u2029]+', 'g')
const sinSaltos = (texto, max = 80) => String(texto ?? '').replace(SALTOS, ' ').trim().slice(0, max)

export function plantillaInvitacion({ deQuien, lista, url }) {
  const quien = sinSaltos(deQuien) || 'Alguien'
  const nombreLista = sinSaltos(lista)
  const asunto = `${quien} te invitó a la lista «${nombreLista}» en Fluvi`
  const texto = `${quien} te invitó a la lista «${nombreLista}» en Fluvi.\n\nEntra a Fluvi para aceptar o rechazar la invitación: ${url}\n\nSi no esperabas esta invitación, puedes ignorar este correo.`
  const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <meta name="color-scheme" content="light" />
    <title>${escaparHtml(asunto)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f7f2;font-family:'Manrope','Segoe UI',Helvetica,Arial,sans-serif;color:#1f1a17;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Acepta la invitación para ver y editar la lista juntos.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7f2;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;">
            <tr>
              <td style="padding:0 8px 20px;font-size:22px;font-weight:800;color:#244d35;letter-spacing:-0.02em;">Fluvi</td>
            </tr>
            <tr>
              <td style="background:#ffffff;border-radius:24px;padding:36px 32px;">
                <h1 style="margin:0 0 12px;font-size:24px;line-height:1.2;font-weight:700;color:#244d35;">Te invitaron a una lista</h1>
                <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#5b6b60;">
                  <strong style="color:#1f1a17;">${escaparHtml(quien)}</strong> te invitó a la lista <strong style="color:#1f1a17;">«${escaparHtml(nombreLista)}»</strong> en Fluvi. Si aceptas, podrán agregar y marcar lo que van a comprar entre los dos.
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="background:#1f1a17;border-radius:12px;">
                      <a href="${escaparHtml(url)}" style="display:inline-block;padding:14px 24px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;">Ver la invitación</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#5b6b60;">
                  Entra con tu cuenta de Fluvi y encontrarás la invitación en la campana y en la sección Listas. Si el botón no funciona, copia esta dirección en tu navegador:<br />
                  <a href="${escaparHtml(url)}" style="color:#2e7d55;word-break:break-all;">${escaparHtml(url)}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 8px 0;font-size:12px;line-height:1.6;color:#5b6b60;">
                Si no esperabas esta invitación, ignora este correo: no pasa nada si no la aceptas.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
  return { asunto, texto, html }
}

/**
 * Envía el correo a las personas invitadas por `usuarioId` a la lista `listaId` que aún no lo recibieron.
 *
 * db: {
 *   obtenerLista(listaId)                          -> { id, nombre, user_id, compartida, propietario_nombre } | null
 *   pendientesSinCorreo(listaId, invitadoPor)      -> [{ usuario_id, email, nombre }]   (estado 'pendiente' y sin correo enviado)
 *   marcarCorreoEnviado(listaId, usuarioId, fecha) -> void
 * }
 * enviar({ para, asunto, texto, html }) -> Promise (lanza si el correo no salió)
 */
export async function enviarInvitaciones({ listaId, usuarioId, db, enviar, urlApp, ahora = () => new Date() }) {
  if (!usuarioId) throw new ErrorDeSolicitud('Se requiere una sesión activa', 401)
  if (typeof listaId !== 'string' || !UUID.test(listaId)) throw new ErrorDeSolicitud('lista_id no es válido', 400)

  const lista = await db.obtenerLista(listaId)
  // Mismo mensaje si no existe o si no es de quien llama, para no revelar listas ajenas.
  if (!lista || lista.user_id !== usuarioId) throw new ErrorDeSolicitud('Solo quien creó la lista puede enviar invitaciones', 403)
  if (!lista.compartida) throw new ErrorDeSolicitud('La lista no es compartida', 400)

  const pendientes = (await db.pendientesSinCorreo(listaId, usuarioId)).slice(0, MAX_POR_LLAMADA)
  const resultado = { enviados: 0, fallidos: 0 }
  for (const p of pendientes) {
    const correo = plantillaInvitacion({ deQuien: lista.propietario_nombre || 'Alguien', lista: lista.nombre, url: urlApp })
    try {
      await enviar({ para: p.email, ...correo })
    } catch {
      // No se marca como enviado: se podrá reintentar. Una falla no detiene al resto.
      resultado.fallidos++
      continue
    }
    await db.marcarCorreoEnviado(listaId, p.usuario_id, ahora().toISOString())
    resultado.enviados++
  }
  return resultado
}
