import { useSyncExternalStore } from 'react'
import { hoy } from './format'

// La fecha de hoy (AAAA-MM-DD, hora local) como estado vivo: avisa cuando cambia el día aunque la app siga abierta.
// Se revisa a la medianoche y también al volver a la pestaña o a la ventana, porque un equipo dormido no dispara temporizadores.
let actual = hoy()
let reloj = null
const oyentes = new Set()

function programar() {
  clearTimeout(reloj)
  const ahora = new Date()
  const manana = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1, 0, 0, 1)
  reloj = setTimeout(revisar, manana - ahora)
}

function revisar() {
  const nueva = hoy()
  if (nueva !== actual) {
    actual = nueva
    oyentes.forEach((avisar) => avisar())
  }
  if (oyentes.size) programar()
}

const alVolver = () => {
  if (document.visibilityState === 'visible') revisar()
}

export function suscribirHoy(avisar) {
  oyentes.add(avisar)
  if (oyentes.size === 1) {
    actual = hoy()
    programar()
    document.addEventListener('visibilitychange', alVolver)
    window.addEventListener('focus', revisar)
  }
  return () => {
    oyentes.delete(avisar)
    if (!oyentes.size) {
      clearTimeout(reloj)
      document.removeEventListener('visibilitychange', alVolver)
      window.removeEventListener('focus', revisar)
    }
  }
}

// Sin suscriptores el valor guardado puede estar viejo, así que se recalcula.
export const leerHoy = () => (oyentes.size ? actual : hoy())

export const useHoy = () => useSyncExternalStore(suscribirHoy, leerHoy)
