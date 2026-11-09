// Pruebas de la lógica de enviar-invitacion, sin enviar correos ni tocar la base. Se ejecutan con:
//   deno test supabase/functions/enviar-invitacion/invitacion.test.js
import { ErrorDeSolicitud, enviarInvitaciones, escaparHtml, MAX_POR_LLAMADA, plantillaInvitacion } from './invitacion.js'

const afirmar = (cond, mensaje) => {
  if (!cond) throw new Error(mensaje)
}
const LISTA = '11111111-1111-4111-8111-111111111111'
const ANA = 'aaaaaaaa-0000-4000-8000-000000000001'
const BETO = 'bbbbbbbb-0000-4000-8000-000000000002'

// Base falsa: una sola lista de Ana, con los pendientes que se indiquen.
function falsa({ lista = { id: LISTA, nombre: 'Cumple', user_id: ANA, compartida: true, propietario_nombre: 'Ana' }, pendientes = [] } = {}) {
  const marcados = []
  return {
    marcados,
    db: {
      obtenerLista: async (id) => (lista && lista.id === id ? lista : null),
      pendientesSinCorreo: async () => pendientes,
      marcarCorreoEnviado: async (l, u, f) => marcados.push({ l, u, f }),
    },
  }
}
const rechaza = async (fn, estado) => {
  try {
    await fn()
  } catch (e) {
    afirmar(e instanceof ErrorDeSolicitud && e.estado === estado, `se esperaba ErrorDeSolicitud ${estado}, llegó: ${e}`)
    return
  }
  throw new Error('debió rechazar')
}

Deno.test('envía a los pendientes y los marca', async () => {
  const { db, marcados } = falsa({ pendientes: [{ usuario_id: BETO, email: 'beto@ejemplo.co', nombre: 'Beto' }] })
  const enviados = []
  const r = await enviarInvitaciones({ listaId: LISTA, usuarioId: ANA, db, enviar: async (c) => enviados.push(c), urlApp: 'https://fluvi.app/listas', ahora: () => new Date('2026-11-09T12:00:00Z') })
  afirmar(r.enviados === 1 && r.fallidos === 0, JSON.stringify(r))
  afirmar(enviados.length === 1 && enviados[0].para === 'beto@ejemplo.co', 'destinatario')
  afirmar(enviados[0].asunto === 'Ana te invitó a la lista «Cumple» en Fluvi', enviados[0].asunto)
  afirmar(enviados[0].html.includes('https://fluvi.app/listas') && enviados[0].texto.includes('https://fluvi.app/listas'), 'enlace')
  afirmar(marcados.length === 1 && marcados[0].u === BETO && marcados[0].f === '2026-11-09T12:00:00.000Z', JSON.stringify(marcados))
})

Deno.test('sin pendientes no envía nada', async () => {
  const { db, marcados } = falsa({ pendientes: [] })
  let llamadas = 0
  const r = await enviarInvitaciones({ listaId: LISTA, usuarioId: ANA, db, enviar: async () => llamadas++, urlApp: 'x' })
  afirmar(r.enviados === 0 && llamadas === 0 && marcados.length === 0, 'no debía enviar')
})

Deno.test('quien no es el propietario no puede enviar', async () => {
  const { db } = falsa({ pendientes: [{ usuario_id: BETO, email: 'beto@ejemplo.co', nombre: '' }] })
  await rechaza(() => enviarInvitaciones({ listaId: LISTA, usuarioId: BETO, db, enviar: async () => {}, urlApp: 'x' }), 403)
})

Deno.test('lista inexistente: mismo error que lista ajena (no revela nada)', async () => {
  const { db } = falsa()
  await rechaza(() => enviarInvitaciones({ listaId: '22222222-2222-4222-8222-222222222222', usuarioId: ANA, db, enviar: async () => {}, urlApp: 'x' }), 403)
})

Deno.test('lista que no es compartida', async () => {
  const { db } = falsa({ lista: { id: LISTA, nombre: 'x', user_id: ANA, compartida: false, propietario_nombre: 'Ana' } })
  await rechaza(() => enviarInvitaciones({ listaId: LISTA, usuarioId: ANA, db, enviar: async () => {}, urlApp: 'x' }), 400)
})

Deno.test('sin sesión', async () => {
  const { db } = falsa()
  await rechaza(() => enviarInvitaciones({ listaId: LISTA, usuarioId: null, db, enviar: async () => {}, urlApp: 'x' }), 401)
})

Deno.test('lista_id inválido o ausente', async () => {
  const { db } = falsa()
  for (const malo of [undefined, null, 5, '', 'no-es-uuid', "' or 1=1 --", LISTA + 'x']) {
    await rechaza(() => enviarInvitaciones({ listaId: malo, usuarioId: ANA, db, enviar: async () => {}, urlApp: 'x' }), 400)
  }
})

Deno.test('si el correo falla no se marca como enviado y los demás siguen', async () => {
  const pendientes = [
    { usuario_id: 'u1', email: 'malo@ejemplo.co', nombre: '' },
    { usuario_id: 'u2', email: 'bueno@ejemplo.co', nombre: '' },
  ]
  const { db, marcados } = falsa({ pendientes })
  const r = await enviarInvitaciones({
    listaId: LISTA,
    usuarioId: ANA,
    db,
    enviar: async ({ para }) => {
      if (para.startsWith('malo')) throw new Error('SMTP caído')
    },
    urlApp: 'x',
  })
  afirmar(r.enviados === 1 && r.fallidos === 1, JSON.stringify(r))
  afirmar(marcados.length === 1 && marcados[0].u === 'u2', 'solo el bueno se marca')
})

Deno.test('tope de correos por llamada', async () => {
  const pendientes = Array.from({ length: 25 }, (_, i) => ({ usuario_id: `u${i}`, email: `p${i}@ejemplo.co`, nombre: '' }))
  const { db } = falsa({ pendientes })
  let n = 0
  const r = await enviarInvitaciones({ listaId: LISTA, usuarioId: ANA, db, enviar: async () => n++, urlApp: 'x' })
  afirmar(n === MAX_POR_LLAMADA && r.enviados === MAX_POR_LLAMADA, `envió ${n}`)
})

Deno.test('el destinatario sale de la base, no de la petición', async () => {
  // enviarInvitaciones no recibe ningún correo del cliente: solo lista_id. Se comprueba que ignora campos extra.
  const { db } = falsa({ pendientes: [{ usuario_id: BETO, email: 'beto@ejemplo.co', nombre: '' }] })
  const enviados = []
  await enviarInvitaciones({ listaId: LISTA, usuarioId: ANA, db, enviar: async (c) => enviados.push(c), urlApp: 'x', para: 'victima@otro.co' })
  afirmar(enviados.length === 1 && enviados[0].para === 'beto@ejemplo.co', 'solo se envía al invitado de la base')
})

Deno.test('los nombres no inyectan HTML ni encabezados', () => {
  const { asunto, html, texto } = plantillaInvitacion({ deQuien: '<script>alert(1)</script>\r\nBcc: x@y.co', lista: '"><img src=x onerror=alert(1)>', url: 'https://f.app/listas?a=1&b="2"' })
  afirmar(!html.includes('<script>') && !html.includes('<img src=x'), 'HTML sin escapar')
  afirmar(html.includes('&lt;script&gt;') && html.includes('&quot;&gt;&lt;img'), 'no se escapó')
  afirmar(!/[\r\n]/.test(asunto), 'saltos de línea en el asunto')
  afirmar(html.includes('a=1&amp;b=&quot;2&quot;'), 'la URL debe escaparse en el atributo')
  afirmar(texto.includes('Entra a Fluvi'), 'texto plano')
})

Deno.test('nombres largos se recortan y el vacío se reemplaza', () => {
  const largo = 'x'.repeat(500)
  const { asunto } = plantillaInvitacion({ deQuien: largo, lista: largo, url: 'u' })
  afirmar(asunto.length < 250, `asunto demasiado largo: ${asunto.length}`)
  afirmar(plantillaInvitacion({ deQuien: '', lista: 'L', url: 'u' }).asunto.startsWith('Alguien te invitó'), 'sin nombre')
  afirmar(escaparHtml(null) === '' && escaparHtml(5) === '5', 'escaparHtml')
})
