import { useSyncExternalStore } from 'react'
import { formatCOP } from './format'

const CLAVE = 'fluvi:privado'
const oyentes = new Set()

const leer = () => {
  try {
    return localStorage.getItem(CLAVE) === '1'
  } catch {
    return false
  }
}

let privado = leer()

export const OCULTO = '$••••••'

export function alternarPrivado() {
  privado = !privado
  try {
    localStorage.setItem(CLAVE, privado ? '1' : '0')
  } catch {
    /* sin almacenamiento: aplica solo en esta sesión */
  }
  oyentes.forEach((avisar) => avisar())
}

const suscribir = (avisar) => {
  oyentes.add(avisar)
  return () => oyentes.delete(avisar)
}

export const usePrivado = () => useSyncExternalStore(suscribir, () => privado)

const ocultar = () => OCULTO

export function useFormatoMoneda() {
  return usePrivado() ? ocultar : formatCOP
}
