import { ArrowUp, CalendarPlus, CircleDollarSign, Flag, X } from 'lucide-react'
import { useImperativeHandle, useRef, useState } from 'react'
import { MoneyInput } from '@/components/MoneyInput'
import { estiloPrioridad } from '@/lib/estiloPrioridad'
import { PRIORIDADES } from '@/lib/listas'
import { cn } from '@/lib/utils'

// Cada toque en la bandera pasa a la siguiente prioridad y, tras la baja, la quita.
const ciclo = { ninguna: 'alta', alta: 'media', media: 'baja', baja: null }

const chip = 'inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--lc-acento)]'

// Barra para agregar sin diálogos: se escribe, Enter agrega y el cursor queda listo para el siguiente. Precio y fecha son
// opcionales y aparecen solo si se piden. `ref` expone focus() para poder llevar el cursor aquí desde un atajo.
export function Compositor({ ref, onAgregar, conPrioridad = false, className }) {
  const [prioridad, setPrioridad] = useState(null)
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState(0)
  const [fecha, setFecha] = useState('')
  const [pidePrecio, setPidePrecio] = useState(false)
  const [pideFecha, setPideFecha] = useState(false)
  const entrada = useRef(null)
  const precioRef = useRef(null)
  const fechaRef = useRef(null)
  const listo = nombre.trim().length > 0

  useImperativeHandle(ref, () => ({ focus: () => entrada.current?.focus() }), [])

  const enviar = (e) => {
    e?.preventDefault()
    if (!listo) return
    onAgregar({ nombre, precio, fechaCompra: fecha, prioridad })
    setPrioridad(null)
    setNombre('')
    setPrecio(0)
    setFecha('')
    setPidePrecio(false)
    setPideFecha(false)
    entrada.current?.focus()
  }

  return (
    <form onSubmit={enviar} className={cn('flex items-center gap-1.5 rounded-full border bg-card py-1.5 pr-1.5 pl-4 shadow-elevated transition-shadow focus-within:ring-3 focus-within:ring-[var(--lc-acento)]/25', className)}>
      <input
        ref={entrada}
        aria-label="Nuevo ítem"
        maxLength={120}
        placeholder="Agrega algo a la lista…"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') e.currentTarget.blur()
        }}
        className="h-9 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
      />
      {pidePrecio ? (
        <span className="flex shrink-0 items-center">
          <MoneyInput ref={precioRef} autoFocus aria-label="Precio del ítem nuevo" className="h-8 w-28 rounded-full bg-muted/60 text-sm" value={precio} onValueChange={setPrecio} />
          <button type="button" aria-label="Quitar el precio" onClick={() => { setPidePrecio(false); setPrecio(0) }} className="grid size-6 place-items-center rounded-full text-muted-foreground hover:text-foreground">
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </span>
      ) : (
        <button type="button" onClick={() => setPidePrecio(true)} className={cn(chip, 'text-muted-foreground hover:bg-muted')} aria-label="Agregar precio">
          <CircleDollarSign className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Precio</span>
        </button>
      )}
      {pideFecha ? (
        <span className="flex shrink-0 items-center">
          <input ref={fechaRef} type="date" aria-label="Fecha para comprarlo" value={fecha} onChange={(e) => setFecha(e.target.value)} className="h-8 w-[8.5rem] rounded-full bg-muted/60 px-3 text-sm outline-none" />
          <button type="button" aria-label="Quitar la fecha" onClick={() => { setPideFecha(false); setFecha('') }} className="grid size-6 place-items-center rounded-full text-muted-foreground hover:text-foreground">
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </span>
      ) : (
        <button type="button" onClick={() => setPideFecha(true)} className={cn(chip, 'text-muted-foreground hover:bg-muted')} aria-label="Agregar fecha">
          <CalendarPlus className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Fecha</span>
        </button>
      )}
      {conPrioridad ? (
        <button
          type="button"
          onClick={() => setPrioridad(ciclo[prioridad ?? 'ninguna'])}
          aria-label={prioridad ? `Prioridad ${prioridad}. Tocar para cambiar` : 'Agregar prioridad'}
          className={cn(chip, prioridad ? estiloPrioridad[prioridad] : 'text-muted-foreground hover:bg-muted')}
        >
          <Flag className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">{prioridad ? PRIORIDADES.find((p) => p.id === prioridad).etiqueta : 'Prioridad'}</span>
        </button>
      ) : null}
      <button
        type="submit"
        aria-label="Agregar a la lista"
        disabled={!listo}
        className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--lc-acento)] text-white transition-[transform,opacity] duration-200 ease-out hover:scale-105 active:scale-95 disabled:scale-90 disabled:opacity-35"
      >
        <ArrowUp className="size-5" strokeWidth={2.6} aria-hidden="true" />
      </button>
    </form>
  )
}
