import { useSyncExternalStore } from 'react'

const CLAVE = 'fluvi:tema'
const sistema = window.matchMedia('(prefers-color-scheme: dark)')
const oyentes = new Set()

export const leerTema = () => {
  try {
    return localStorage.getItem(CLAVE) || 'sistema'
  } catch {
    return 'sistema'
  }
}

export const resolverTema = () => {
  const preferido = leerTema()
  return preferido === 'sistema' ? (sistema.matches ? 'oscuro' : 'claro') : preferido
}

export function aplicarTema() {
  document.documentElement.classList.toggle('dark', resolverTema() === 'oscuro')
  oyentes.forEach((avisar) => avisar())
}

export function guardarTema(preferido) {
  try {
    localStorage.setItem(CLAVE, preferido)
  } catch {
    /* sin almacenamiento: aplica solo en esta sesión */
  }
  aplicarTema()
}

sistema.addEventListener('change', aplicarTema)

const suscribir = (avisar) => {
  oyentes.add(avisar)
  return () => oyentes.delete(avisar)
}

export const useTema = () => useSyncExternalStore(suscribir, leerTema)
export const useTemaResuelto = () => useSyncExternalStore(suscribir, resolverTema)
