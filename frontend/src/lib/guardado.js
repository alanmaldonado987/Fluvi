import { useSyncExternalStore } from 'react'

// Estado del guardado en Supabase, para el indicador de la pantalla: inactivo, guardando, guardado o error.
// Vive fuera de React para que cualquier componente lo lea sin pasar por el contexto de datos.
const oyentes = new Set()
let estado = { fase: 'inactivo' }
let enCurso = 0
let reloj = null

const poner = (fase) => {
  estado = { fase }
  oyentes.forEach((avisar) => avisar())
}

const volverAInactivo = (ms) => {
  clearTimeout(reloj)
  reloj = setTimeout(() => {
    if (enCurso === 0) poner('inactivo')
  }, ms)
}

const suscribir = (avisar) => {
  oyentes.add(avisar)
  return () => oyentes.delete(avisar)
}

export const useEstadoGuardado = () => useSyncExternalStore(suscribir, () => estado)

export function comenzarGuardado() {
  enCurso++
  clearTimeout(reloj)
  poner('guardando')
}

// Un error se queda visible unos segundos aunque otros guardados terminen bien después.
export function terminarGuardado(ok) {
  enCurso = Math.max(0, enCurso - 1)
  if (!ok) {
    poner('error')
    volverAInactivo(7000)
  } else if (enCurso === 0 && estado.fase !== 'error') {
    poner('guardado')
    volverAInactivo(2200)
  }
}
