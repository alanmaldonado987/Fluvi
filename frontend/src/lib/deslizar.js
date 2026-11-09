import { useRef, useState } from 'react'

const UMBRAL = 88
const MAXIMO = 140

// Gesto de deslizar una fila con el dedo: a la derecha y a la izquierda ejecutan una acción cada una (si se pasan). Solo con
// táctil o lápiz: con mouse chocaría con seleccionar texto. Devuelve el desplazamiento actual, el avance (0 a 1) y los
// manejadores que se ponen en la fila. Un deslizamiento vertical se deja pasar para que la página haga scroll.
export function useDeslizar({ alDerecha, alIzquierda }) {
  const [dx, setDx] = useState(0)
  const [suelto, setSuelto] = useState(true)
  const inicio = useRef(null)
  const activo = useRef(false)
  const actual = useRef(0)
  const bloquearClic = useRef(false)

  const reiniciar = () => {
    inicio.current = null
    activo.current = false
    actual.current = 0
    setDx(0)
    setSuelto(true)
  }

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' || e.button > 0) return
    if (e.target.closest?.('input, button, a, select, textarea, [data-no-deslizar]')) return
    inicio.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
    activo.current = false
    setSuelto(false)
  }

  const onPointerMove = (e) => {
    const i = inicio.current
    if (!i || i.id !== e.pointerId) return
    const mx = e.clientX - i.x
    const my = e.clientY - i.y
    if (!activo.current) {
      if (Math.abs(mx) > 10 && Math.abs(mx) > Math.abs(my) * 1.4) {
        activo.current = true
        try {
          e.currentTarget.setPointerCapture?.(e.pointerId)
        } catch {
          // Sin captura el gesto sigue funcionando mientras el dedo permanezca sobre la fila.
        }
      } else if (Math.abs(my) > 10) {
        reiniciar()
        return
      } else return
    }
    // Resistencia: cuanto más se estira, más cuesta; y no se puede deslizar hacia un lado sin acción.
    let valor = Math.sign(mx) * Math.min(MAXIMO, Math.abs(mx) * 0.9)
    if ((valor > 0 && !alDerecha) || (valor < 0 && !alIzquierda)) valor = 0
    actual.current = valor
    setDx(valor)
  }

  const terminar = () => {
    if (!inicio.current) return
    const fin = actual.current
    const huboGesto = activo.current
    reiniciar()
    if (!huboGesto) return
    bloquearClic.current = true
    setTimeout(() => (bloquearClic.current = false), 0)
    if (fin > UMBRAL && alDerecha) {
      navigator.vibrate?.(12)
      alDerecha()
    } else if (fin < -UMBRAL && alIzquierda) {
      navigator.vibrate?.(12)
      alIzquierda()
    }
  }

  return {
    dx,
    suelto,
    avance: Math.min(1, Math.abs(dx) / UMBRAL),
    manejadores: {
      onPointerDown,
      onPointerMove,
      onPointerUp: terminar,
      onPointerCancel: terminar,
      onClickCapture: (e) => {
        if (bloquearClic.current) {
          e.stopPropagation()
          e.preventDefault()
        }
      },
    },
  }
}
