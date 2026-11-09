import { useRef, useState } from 'react'
import { MoneyInput } from '@/components/MoneyInput'
import { cn } from '@/lib/utils'

// Texto o dinero que se edita en el mismo sitio: se toca, se escribe, Enter o salir del campo guardan y Escape cancela.
// `mostrar` es lo que se ve cuando no se está editando.
export function CampoEditable({ tipo = 'texto', valor, onGuardar, deshabilitado = false, mostrar, etiqueta, maxLength = 120, className, claseEdicion }) {
  const [editando, setEditando] = useState(false)
  const [borrador, setBorrador] = useState(valor)
  const cerrado = useRef(false)

  const abrir = () => {
    if (deshabilitado) return
    cerrado.current = false
    setBorrador(valor)
    setEditando(true)
  }
  const guardar = () => {
    if (cerrado.current) return
    cerrado.current = true
    setEditando(false)
    const limpio = tipo === 'texto' ? String(borrador).trim() : borrador
    if (tipo === 'texto' && !limpio) return
    if (limpio !== valor) onGuardar(limpio)
  }
  const cancelar = () => {
    cerrado.current = true
    setEditando(false)
  }
  const teclas = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      guardar()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      cancelar()
    }
  }

  if (editando) {
    return tipo === 'dinero' ? (
      <MoneyInput autoFocus aria-label={etiqueta} className={cn('h-8 w-32 rounded-lg bg-card text-sm font-semibold', claseEdicion)} value={borrador} onValueChange={setBorrador} onFocus={(e) => e.target.select()} onKeyDown={teclas} onBlur={guardar} />
    ) : (
      <input
        autoFocus
        aria-label={etiqueta}
        maxLength={maxLength}
        value={borrador}
        onChange={(e) => setBorrador(e.target.value)}
        onFocus={(e) => e.target.select()}
        onKeyDown={teclas}
        onBlur={guardar}
        className={cn('h-8 w-full min-w-0 rounded-lg border bg-card px-2 text-base font-medium outline-none focus-visible:border-[var(--lc-acento)] focus-visible:ring-3 focus-visible:ring-[var(--lc-acento)]/25', claseEdicion)}
      />
    )
  }
  return (
    <button
      type="button"
      onClick={abrir}
      disabled={deshabilitado}
      aria-label={etiqueta ? `${etiqueta}: tocar para cambiar` : undefined}
      className={cn('min-w-0 rounded-lg text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lc-acento)]', !deshabilitado && 'cursor-text hover:bg-muted/70', className)}
    >
      {mostrar}
    </button>
  )
}
