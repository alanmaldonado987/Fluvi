import { ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { CategoriaIcono } from '@/components/CategoriaIcono'
import { Money } from '@/components/Money'
import { Button } from '@/components/ui/button'
import { fechaCorta } from '@/lib/format'
import { cn } from '@/lib/utils'

export const columnasMovimiento = 'md:grid-cols-[minmax(0,3fr)_minmax(0,1fr)_5rem_7.5rem_4rem]'

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

export function MovimientoItem({ movimiento, categoria, icono = categoria, onEditar, onEliminar, tabla = false, mostrarFecha = true, className, style }) {
  const ingreso = movimiento.tipo === 'Ingreso'
  const nombre = movimiento.concepto || categoria
  return (
    <li className={cn('flex items-center gap-2', tabla && cn('md:grid md:gap-4', columnasMovimiento), className)} style={style}>
      <button type="button" onClick={onEditar} className={cn('flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-2 text-left transition-colors hover:bg-muted/60', foco)}>
        <CategoriaIcono nombre={icono} tipo={movimiento.tipo} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{nombre}</span>
          <span className={cn('flex gap-2 text-sm text-muted-foreground', tabla && 'md:hidden')}>
            <span className="truncate">{categoria}</span>
            {mostrarFecha ? <span className="shrink-0">{fechaCorta(movimiento.fecha)}</span> : null}
          </span>
          {tabla && movimiento.observacion ? <span className="hidden truncate text-xs text-muted-foreground md:block">{movimiento.observacion}</span> : null}
        </span>
      </button>
      {tabla ? (
        <>
          <span className="hidden truncate text-sm md:block">{categoria}</span>
          <span className="hidden text-sm text-muted-foreground md:block">{fechaCorta(movimiento.fecha)}</span>
        </>
      ) : null}
      <Money value={movimiento.valor} tone={ingreso ? 'positive' : 'neutral'} signo={ingreso} className={cn('shrink-0 font-bold', tabla && 'md:text-right')} />
      <span className="flex shrink-0 items-center justify-end">
        <ChevronRight className={cn('size-4 text-muted-foreground', (tabla || onEliminar) && 'md:hidden')} aria-hidden="true" />
        {tabla ? (
          <Button variant="ghost" size="icon" className="hidden size-8 md:inline-flex" aria-label={`Editar ${nombre}`} onClick={onEditar}>
            <Pencil />
          </Button>
        ) : null}
        {onEliminar ? (
          <Button variant="ghost" size="icon" className="hidden size-8 md:inline-flex" aria-label={`Eliminar ${nombre}`} onClick={onEliminar}>
            <Trash2 />
          </Button>
        ) : null}
      </span>
    </li>
  )
}
