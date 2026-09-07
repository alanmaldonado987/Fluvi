import { iconoCategoria } from '@/lib/iconos'
import { cn } from '@/lib/utils'

export function CategoriaIcono({ nombre, tipo, className }) {
  return (
    <span className={cn('grid size-10 shrink-0 place-items-center rounded-full', tipo === 'Ingreso' ? 'bg-positive-soft text-positive' : 'bg-mint text-forest', className)} aria-hidden="true">
      {iconoCategoria(nombre)}
    </span>
  )
}
