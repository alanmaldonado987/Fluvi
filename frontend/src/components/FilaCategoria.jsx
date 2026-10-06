import { GripVertical } from 'lucide-react'
import { CategoriaIcono } from '@/components/CategoriaIcono'
import { Money } from '@/components/Money'
import { MoneyInput } from '@/components/MoneyInput'
import { Progreso } from '@/components/Progreso'
import { avance } from '@/lib/calc'
import { useFormatoMoneda, usePrivado } from '@/lib/privado'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/auth'

export function FilaCategoria({ ref, categoria, proyectado, real, onProyectado, porcentajeIngreso, acciones, dragHandleProps, className, style, children }) {
  const formatCOP = useFormatoMoneda()
  const privado = usePrivado()
  const { usuario } = useAuth()
  const umbral = (usuario?.preferencias?.umbralPresupuesto ?? 90) / 100
  const egreso = categoria.tipo === 'Egreso'
  const excede = egreso && real > proyectado
  const restante = proyectado - real
  const cerca = egreso && !excede && proyectado > 0 && real / proyectado >= umbral
  const tone = egreso ? (excede ? 'negative' : cerca ? 'warning' : 'positive') : real >= proyectado ? 'positive' : 'neutral'
  const detalle =
    !proyectado && !real ? 'Sin proyección' : egreso ? (excede ? `Excedido por ${formatCOP(-restante)}` : `Quedan ${formatCOP(restante)}`) : real >= proyectado ? 'Recibido' : `Faltan ${formatCOP(restante)}`

  return (
    <li ref={ref} className={cn('con-acciones flex items-center gap-3 py-3', className)} style={style}>
      {dragHandleProps ? (
        <button type="button" {...dragHandleProps} className="acciones-hover shrink-0 cursor-grab touch-none rounded-md text-muted-foreground/60 hover:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring active:cursor-grabbing" aria-label="Reordenar">
          <GripVertical className="size-5" />
        </button>
      ) : null}
      <CategoriaIcono nombre={categoria.nombre} tipo={categoria.tipo} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate font-semibold">{categoria.nombre}</p>
          <div className="flex shrink-0 items-center gap-1">
            {onProyectado ? (
              <MoneyInput aria-label={`Proyectado para ${categoria.nombre}`} className="h-8 w-28 border-transparent bg-muted/70 text-sm font-semibold hover:border-input md:w-32 dark:bg-input/30" value={proyectado} onValueChange={onProyectado} />
            ) : (
              <Money value={proyectado} className="text-sm text-muted-foreground" />
            )}
            {acciones ? <span className="acciones-hover flex">{acciones}</span> : null}
          </div>
        </div>
        <Progreso valor={avance(proyectado, real)} tone={tone} className="mt-2" />
        <div className="mt-1.5 flex justify-between gap-3 text-xs text-muted-foreground">
          <span>
            <Money value={real} className="font-semibold text-foreground" /> {egreso ? 'gastado' : 'recibido'}
            {porcentajeIngreso != null && !privado && <span className="ml-1 text-muted-foreground/70">· {porcentajeIngreso}% del ingreso</span>}
          </span>
          <span className={cn(excede && 'font-semibold text-negative')}>{detalle}</span>
        </div>
        {children}
      </div>
    </li>
  )
}
