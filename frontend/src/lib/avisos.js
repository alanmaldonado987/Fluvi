import { useSyncExternalStore } from 'react'

// Estado de los avisos de la campana por usuario: cuáles ya se vieron y cuáles se descartaron.
// Se guarda en este dispositivo (sin base de datos) y vive fuera de React para que la campana del
// encabezado móvil y la de escritorio se mantengan sincronizadas.
const CLAVE = 'fluvi:avisos-leidos'
const VACIO = { leidos: [], descartados: [] }
const oyentes = new Set()

const normalizar = (valor) => (Array.isArray(valor) ? { leidos: valor, descartados: [] } : { leidos: valor?.leidos ?? [], descartados: valor?.descartados ?? [] })

const leer = () => {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE)) ?? {}
    return Object.fromEntries(Object.entries(guardado).map(([id, valor]) => [id, normalizar(valor)]))
  } catch {
    return {}
  }
}

let datos = leer()

const suscribir = (avisar) => {
  oyentes.add(avisar)
  return () => oyentes.delete(avisar)
}

export const useAvisos = (usuarioId) => useSyncExternalStore(suscribir, () => datos[usuarioId] ?? VACIO)

const mismos = (a, b) => a.length === b.length && a.every((id, i) => id === b[i])

// Actualiza el estado de los avisos. `vigentes` son los ids que existen ahora: lo que ya no está vigente se olvida,
// así un aviso que se resuelve y luego vuelve a aparecer cuenta otra vez como nuevo.
//  - leer: ids que pasan a vistos.
//  - descartar: ids que se ocultan (y quedan como vistos).
//  - restaurar: devuelve todos los descartados a la lista como avisos nuevos.
export function actualizarAvisos(usuarioId, vigentes, { leer = [], descartar = [], restaurar = false } = {}) {
  const antes = datos[usuarioId] ?? VACIO
  const unicos = (ids) => [...new Set(ids)].filter((id) => vigentes.includes(id))
  const descartados = restaurar ? [] : unicos([...antes.descartados, ...descartar])
  const leidos = unicos([...antes.leidos, ...leer, ...descartar]).filter((id) => !(restaurar && antes.descartados.includes(id)))
  if (mismos(leidos, antes.leidos) && mismos(descartados, antes.descartados)) return
  datos = { ...datos, [usuarioId]: { leidos, descartados } }
  try {
    localStorage.setItem(CLAVE, JSON.stringify(datos))
  } catch {
    /* sin almacenamiento: se recuerda solo en esta sesión */
  }
  oyentes.forEach((avisar) => avisar())
}
