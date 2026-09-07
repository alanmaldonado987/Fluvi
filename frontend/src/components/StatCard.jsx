import { Money } from '@/components/Money'
import { cn } from '@/lib/utils'

export function StatCard({ label, value, tone, signo = false, icon: Icon, hint, compacto = false, destacado = false, className, style }) {
  const tamano = compacto ? 'text-sm md:text-xl' : 'text-lg md:text-2xl'
  const secundario = destacado ? 'text-on-forest/70' : 'text-muted-foreground'
  return (
    <div
      className={cn('rounded-2xl', destacado ? 'bg-forest text-on-forest' : 'bg-card ring-1 ring-border', compacto ? 'px-2.5 py-2.5 md:px-4 md:py-3' : 'px-4 py-3 md:px-5 md:py-4', className)}
      style={style}
    >
      <div className={cn('flex items-center justify-between gap-2 text-xs font-medium md:text-sm', secundario)}>
        {label}
        {Icon ? <Icon className="hidden size-4 md:block" aria-hidden="true" /> : null}
      </div>
      {typeof value === 'number' ? (
        <Money value={value} tone={destacado ? 'neutral' : tone} signo={signo} className={cn('mt-1 block font-bold tracking-tight', tamano)} />
      ) : (
        <span className={cn('mt-1 block truncate font-bold tracking-tight', tamano)}>{value}</span>
      )}
      {hint ? <p className={cn('mt-1 text-xs', secundario)}>{hint}</p> : null}
    </div>
  )
}
