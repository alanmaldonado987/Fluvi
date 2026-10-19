import { ArrowLeftRight, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { CategoriaIcono } from '@/components/CategoriaIcono'
import { Button } from '@/components/ui/button'
import { fechaCorta } from '@/lib/format'
import { useFormatoMoneda } from '@/lib/privado'
import { cn } from '@/lib/utils'

export const columnasMovimiento = 'md:grid-cols-[minmax(0,3fr)_minmax(0,1.4fr)_5rem_7.5rem_4rem]'

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

// El tipo se distingue también sin color: "+" para ingresos, "−" para egresos e ícono de flechas para transferencias.
function Monto({ movimiento, className }) {
  const formatear = useFormatoMoneda()
  const { tipo, valor } = movimiento
  if (tipo === 'Transferencia') {
    return (
      <span className={cn('inline-flex items-center justify-end gap-1 tabular-nums text-muted-foreground', className)}>
        <ArrowLeftRight className="size-3.5" aria-hidden="true" />
        <span className="sr-only">Transferencia </span>
        {formatear(valor)}
      </span>
    )
  }
  const ingreso = tipo === 'Ingreso'
  return (
    <span className={cn('tabular-nums', ingreso ? 'text-positive' : 'text-negative', className)}>
      <span className="sr-only">{ingreso ? 'Ingreso ' : 'Egreso '}</span>
      {ingreso ? '+' : '−'}
      {formatear(valor)}
    </span>
  )
}

export function MovimientoItem({ movimiento, categoria, icono = categoria, billetera, onEditar, onEliminar, tabla = false, mostrarFecha = true, className, style }) {
  const transferencia = movimiento.tipo === 'Transferencia'
  const nombre = movimiento.concepto || (transferencia ? 'Transferencia' : categoria)
  return (
    <li className={cn('con-acciones flex items-center gap-2', tabla && cn('md:grid md:gap-4', columnasMovimiento), className)} style={style}>
      <button type="button" onClick={onEditar} className={cn('flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-2 text-left transition-colors hover:bg-muted/60', foco)}>
        <CategoriaIcono nombre={icono} tipo={movimiento.tipo} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{nombre}</span>
          <span className={cn('flex gap-2 text-sm text-muted-foreground', tabla && 'md:hidden')}>
            <span className="truncate">{categoria}</span>
            {billetera ? <span className="shrink-0">{billetera}</span> : null}
            {mostrarFecha ? <span className="shrink-0">{fechaCorta(movimiento.fecha)}</span> : null}
          </span>
          {tabla && movimiento.observacion ? <span className="hidden truncate text-xs text-muted-foreground md:block">{movimiento.observacion}</span> : null}
        </span>
      </button>
      {tabla ? (
        <>
          <span className="hidden min-w-0 text-sm md:block">
            <span className="block truncate">{categoria}</span>
            {billetera ? <span className="block truncate text-xs text-muted-foreground">{billetera}</span> : null}
          </span>
          <span className="hidden text-sm text-muted-foreground md:block">{fechaCorta(movimiento.fecha)}</span>
        </>
      ) : null}
      <Monto movimiento={movimiento} className={cn('shrink-0 font-bold', tabla && 'md:text-right')} />
      <span className={cn('flex shrink-0 items-center justify-end', (tabla || onEliminar) && 'acciones-hover')}>
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
