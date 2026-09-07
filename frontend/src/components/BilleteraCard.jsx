import { TrendingDown, TrendingUp } from 'lucide-react'
import { Money } from '@/components/Money'
import { MoneyInput } from '@/components/MoneyInput'
import { iconoBilletera } from '@/lib/iconos'
import { cn } from '@/lib/utils'

export function BilleteraCard({ billetera, saldo, anterior, actividad, onSaldo, acciones, className, style }) {
  const delta = anterior == null ? null : saldo - anterior
  return (
    <li className={cn('rounded-2xl bg-card p-4 ring-1 ring-border', className)} style={style}>
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-mint text-forest" aria-hidden="true">
          {iconoBilletera(billetera.nombre)}
        </span>
        <p className="min-w-0 flex-1 truncate font-semibold">{billetera.nombre}</p>
        {acciones}
      </div>
      <MoneyInput aria-label={`Saldo de ${billetera.nombre}`} className="mt-4 h-12 border-transparent bg-muted/60 text-left text-xl font-bold hover:border-input" value={saldo} onValueChange={onSaldo} />
      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
        {delta == null ? (
          'Sin saldo del mes anterior'
        ) : delta === 0 ? (
          'Igual que el mes anterior'
        ) : (
          <>
            {delta > 0 ? <TrendingUp className="size-3.5 text-positive" aria-hidden="true" /> : <TrendingDown className="size-3.5 text-negative" aria-hidden="true" />}
            <Money value={Math.abs(delta)} /> {delta > 0 ? 'más' : 'menos'} que el mes anterior
          </>
        )}
      </p>
      {actividad.entradas || actividad.salidas ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Este mes entraron <Money value={actividad.entradas} className="font-semibold text-positive" /> y salieron <Money value={actividad.salidas} className="font-semibold text-foreground" />
        </p>
      ) : null}
    </li>
  )
}
