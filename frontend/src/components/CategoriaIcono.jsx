import { ArrowLeftRight } from 'lucide-react'
import { iconoCategoria } from '@/lib/iconos'
import { cn } from '@/lib/utils'

const tonos = { Ingreso: 'bg-positive-soft text-positive', Transferencia: 'bg-muted text-foreground' }

export function CategoriaIcono({ nombre, tipo, className }) {
  return (
    <span className={cn('grid size-10 shrink-0 place-items-center rounded-full', tonos[tipo] ?? 'bg-mint text-forest', className)} aria-hidden="true">
      {tipo === 'Transferencia' ? <ArrowLeftRight className="size-5" /> : iconoCategoria(nombre)}
    </span>
  )
}
