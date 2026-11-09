import { useEffect, useRef, useState } from 'react'

// Un número que "cuenta" hasta su nuevo valor en vez de saltar. Con movimiento reducido llega de inmediato.
export function useNumeroAnimado(objetivo, duracion = 650) {
  const [valor, setValor] = useState(objetivo)
  const desde = useRef(objetivo)
  useEffect(() => {
    const reducido = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const total = reducido ? 1 : duracion
    const origen = desde.current
    const inicio = performance.now()
    let id
    const paso = (ahora) => {
      const p = Math.min(1, (ahora - inicio) / total)
      const suave = 1 - (1 - p) ** 3
      desde.current = origen + (objetivo - origen) * suave
      setValor(desde.current)
      if (p < 1) id = requestAnimationFrame(paso)
      else desde.current = objetivo
    }
    id = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(id)
  }, [objetivo, duracion])
  return Math.round(valor)
}
