import { Check, Flag } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { estiloPrioridad } from '@/lib/estiloPrioridad'
import { PRIORIDADES } from '@/lib/listas'
import { cn } from '@/lib/utils'

const etiquetaDe = (id) => PRIORIDADES.find((p) => p.id === id)?.etiqueta

// Ficha de prioridad de un ítem: muestra "Alta", "Media" o "Baja" y, si se puede editar, abre un menú para cambiarla.
export function FichaPrioridad({ item, puedeEditar, onCambiar }) {
  const actual = item.prioridad
  if (!actual && !puedeEditar) return null
  const ficha = (
    <>
      <Flag className="size-3" aria-hidden="true" />
      {actual ? etiquetaDe(actual) : 'Prioridad'}
    </>
  )
  const clases = cn(
    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lc-acento)]',
    actual ? estiloPrioridad[actual] : 'text-muted-foreground opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 data-[popup-open]:opacity-100 [@media(hover:none)]:opacity-60',
    puedeEditar && 'hover:brightness-95',
  )
  if (!puedeEditar) return <span className={clases}>{ficha}</span>
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<button type="button" className={clases} aria-label={actual ? `Prioridad de ${item.nombre}: ${etiquetaDe(actual)}. Tocar para cambiar` : `Agregar prioridad a ${item.nombre}`} />}>{ficha}</DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {PRIORIDADES.map((p) => (
          <DropdownMenuItem key={p.id} onClick={() => onCambiar({ prioridad: p.id })}>
            <Flag className={cn('size-4', estiloPrioridad[p.id].split(' ')[1])} /> {p.etiqueta} {actual === p.id ? <Check className="ml-auto size-4" /> : null}
          </DropdownMenuItem>
        ))}
        {actual ? <DropdownMenuItem onClick={() => onCambiar({ prioridad: null })}>Sin prioridad</DropdownMenuItem> : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Tres botones para elegir la prioridad al crear o editar; pulsar la elegida la quita.
export function SelectorPrioridad({ valor, onCambiar, className }) {
  return (
    <div role="group" aria-label="Prioridad" className={cn('flex gap-1.5', className)}>
      {PRIORIDADES.map((p) => {
        const activa = valor === p.id
        return (
          <button
            key={p.id}
            type="button"
            aria-pressed={activa}
            onClick={() => onCambiar(activa ? null : p.id)}
            className={cn(
              'inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--lc-acento)]',
              activa ? cn(estiloPrioridad[p.id], 'border-transparent') : 'text-muted-foreground hover:bg-muted',
            )}
          >
            <Flag className="size-3" aria-hidden="true" /> {p.etiqueta}
          </button>
        )
      })}
    </div>
  )
}
