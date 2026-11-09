import { useEffect, useSyncExternalStore } from 'react'
import { cargarInvitaciones, suscribirInvitaciones } from './listasRepo'

// Invitaciones a listas compartidas que el usuario aún no responde. Viven fuera de React para que el menú, la campana y la
// pantalla de listas lean lo mismo. Un solo componente (el de la estructura de la app) las vigila con `useVigilarInvitaciones`.
const VACIO = []
const oyentes = new Set()
let estado = VACIO
let usuarioActual = null

const suscribir = (avisar) => {
  oyentes.add(avisar)
  return () => oyentes.delete(avisar)
}

const poner = (nuevo) => {
  if (JSON.stringify(nuevo) === JSON.stringify(estado)) return
  estado = nuevo
  oyentes.forEach((avisar) => avisar())
}

export async function refrescarInvitaciones() {
  if (!usuarioActual) return
  const para = usuarioActual
  try {
    const nuevas = await cargarInvitaciones(para)
    if (usuarioActual === para) poner(nuevas)
  } catch {
    /* sin conexión o módulo aún no instalado en la base: simplemente no hay avisos */
  }
}

export const useInvitaciones = () => useSyncExternalStore(suscribir, () => estado)

const CADA_MS = 60 * 1000

export function useVigilarInvitaciones(usuarioId) {
  useEffect(() => {
    usuarioActual = usuarioId
    refrescarInvitaciones()
    const alVolver = () => {
      if (document.visibilityState === 'visible') refrescarInvitaciones()
    }
    const id = setInterval(alVolver, CADA_MS)
    document.addEventListener('visibilitychange', alVolver)
    // Tiempo real: una invitación nueva llega al instante; la relectura periódica queda de respaldo.
    const darseDeBaja = usuarioId ? suscribirInvitaciones(usuarioId, refrescarInvitaciones) : () => {}
    return () => {
      darseDeBaja()
      clearInterval(id)
      document.removeEventListener('visibilitychange', alVolver)
      usuarioActual = null
      poner(VACIO)
    }
  }, [usuarioId])
}
