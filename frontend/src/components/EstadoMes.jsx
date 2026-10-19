import { AlertTriangle, ChevronDown, CircleCheck, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Progreso } from '@/components/Progreso'
import { useFormatoMoneda } from '@/lib/privado'
import { cn } from '@/lib/utils'

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

// Estado del presupuesto en una pastilla junto al título; el detalle se abre al tocarla.
// `excedidas` son las categorías de egreso por encima de lo proyectado y `cumplidas` las que llegaron justo al tope.
export function EstadoMes({ excedidas, cumplidas, hayMovimientos }) {
  const formatCOP = useFormatoMoneda()
  const [abierto, setAbierto] = useState(false)
  if (!hayMovimientos) return null
  const mal = excedidas.length > 0
  const Icono = mal ? AlertTriangle : Sparkles
  const titulo = mal ? (excedidas.length === 1 ? '1 categoría supera el presupuesto' : `${excedidas.length} categorías superan el presupuesto`) : 'Mes saludable'

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              'inline-flex items-center gap-2 rounded-full py-1 pr-2.5 pl-1 text-sm font-semibold ring-1 transition-colors',
              foco,
              mal ? 'bg-negative-soft text-negative ring-negative/20 hover:bg-negative/15' : 'bg-positive-soft text-positive ring-positive/20 hover:bg-positive/15',
            )}
          />
        }
      >
        <span className={cn('grid size-6 place-items-center rounded-full', mal ? 'bg-negative/15' : 'bg-positive/15')}>
          <Icono className="size-3.5" aria-hidden="true" />
        </span>
        {titulo}
        <ChevronDown className={cn('size-3.5 transition-transform duration-200', abierto && 'rotate-180')} aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(24rem,calc(100vw-2rem))] p-0">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-bold">{mal ? 'Categorías por encima del presupuesto' : 'Todo dentro del presupuesto'}</h2>
          {mal ? null : <p className="mt-0.5 text-xs text-muted-foreground">Ningún egreso ha superado lo proyectado.</p>}
        </div>
        {mal ? (
          <ul className="grid gap-3 px-4 py-3">
            {excedidas.map((c) => (
              <li key={c.id}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate font-semibold">{c.nombre}</span>
                  <span className="shrink-0 font-semibold text-negative tabular-nums">+{formatCOP(c.real - c.proyectado)}</span>
                </div>
                <Progreso valor={1} tone="negative" className="mt-1.5 h-1.5" />
                <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                  {formatCOP(c.real)} de {formatCOP(c.proyectado)}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
        {cumplidas.length ? (
          <p className="flex items-start gap-2 border-t px-4 py-3 text-xs text-muted-foreground">
            <CircleCheck className="mt-px size-3.5 shrink-0 text-positive" aria-hidden="true" />
            <span>
              {cumplidas.length === 1 ? 'Ya cumpliste' : `Ya cumpliste ${cumplidas.length}`}: {cumplidas.map((c) => c.nombre).join(', ')}.
            </span>
          </p>
        ) : null}
        <div className="border-t px-4 py-2.5">
          <Link to="/flujo" onClick={() => setAbierto(false)} className={cn('text-sm font-semibold text-forest underline-offset-4 hover:underline', foco)}>
            Ver flujo de caja
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
