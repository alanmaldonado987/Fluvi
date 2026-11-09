// Edge Function: envía el correo de invitación a una lista compartida.
// La app la llama justo después de invitar a alguien (supabase.functions.invoke('enviar-invitacion', { body: { lista_id } })).
// Usa la misma cuenta de correo que ya tienes para Supabase Auth, pero por SMTP desde aquí, porque Supabase solo deja usar esa
// cuenta para sus propios correos (confirmar cuenta, restablecer contraseña...). La lógica está en invitacion.js.
//
// Secretos necesarios (supabase secrets set ...): SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM y APP_URL.
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los pone Supabase solos.

import { createClient } from 'npm:@supabase/supabase-js@2'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'
import { enviarInvitaciones, ErrorDeSolicitud } from './invitacion.js'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const responder = (cuerpo: unknown, estado = 200) => new Response(JSON.stringify(cuerpo), { status: estado, headers: { ...CORS, 'Content-Type': 'application/json' } })

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return responder({ error: 'Método no permitido' }, 405)

  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })

    // Quién llama: el usuario del token de la petición (nunca un dato que mande el cliente).
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
    const { data: sesion } = await admin.auth.getUser(token)
    const usuarioId = sesion?.user?.id ?? null

    const cuerpo = await req.json().catch(() => ({}))

    const db = {
      async obtenerLista(listaId: string) {
        const { data, error } = await admin.from('listas_compras').select('id, nombre, user_id, compartida, propietario_nombre').eq('id', listaId).maybeSingle()
        if (error) throw error
        return data
      },
      async pendientesSinCorreo(listaId: string, invitadoPor: string) {
        const { data, error } = await admin
          .from('lista_miembros')
          .select('usuario_id, email, nombre')
          .eq('lista_id', listaId)
          .eq('invitado_por', invitadoPor)
          .eq('estado', 'pendiente')
          .is('correo_enviado_en', null)
        if (error) throw error
        return data ?? []
      },
      async marcarCorreoEnviado(listaId: string, usuarioIdInvitado: string, fecha: string) {
        const { error } = await admin.from('lista_miembros').update({ correo_enviado_en: fecha }).eq('lista_id', listaId).eq('usuario_id', usuarioIdInvitado)
        if (error) throw error
      },
    }

    const smtp = new SMTPClient({
      connection: {
        hostname: Deno.env.get('SMTP_HOST')!,
        port: Number(Deno.env.get('SMTP_PORT') ?? '465'),
        tls: true,
        auth: { username: Deno.env.get('SMTP_USER')!, password: Deno.env.get('SMTP_PASS')! },
      },
    })
    const enviar = ({ para, asunto, texto, html }: { para: string; asunto: string; texto: string; html: string }) =>
      smtp.send({ from: Deno.env.get('SMTP_FROM')!, to: para, subject: asunto, content: texto, html })

    const urlApp = (Deno.env.get('APP_URL') ?? '').replace(/\/+$/, '') + '/listas'
    try {
      const resultado = await enviarInvitaciones({ listaId: cuerpo.lista_id, usuarioId, db, enviar, urlApp })
      return responder(resultado)
    } finally {
      try {
        await smtp.close()
      } catch {
        /* la conexión ya estaba cerrada */
      }
    }
  } catch (err) {
    if (err instanceof ErrorDeSolicitud) return responder({ error: err.message }, err.estado)
    console.error('enviar-invitacion falló:', err)
    return responder({ error: 'No se pudo enviar el correo' }, 500)
  }
})
