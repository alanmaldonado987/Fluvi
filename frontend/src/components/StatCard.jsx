import { Money } from '@/components/Money'
import { cn } from '@/lib/utils'

const chips = { positive: 'bg-positive-soft text-positive', negative: 'bg-negative-soft text-negative' }

// Ondas de la marca como fondo de la tarjeta destacada.
function Ondas() {
  return (
    <svg aria-hidden="true" viewBox="0 0 400 120" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 w-full text-on-forest opacity-[0.08]">
      <path d="M0 60 C 60 30, 120 90, 200 60 S 340 30, 400 60 V120 H0Z" fill="currentColor" />
      <path d="M0 85 C 70 60, 130 110, 210 85 S 340 60, 400 85 V120 H0Z" fill="currentColor" />
    </svg>
  )
}

export function StatCard({ label, value, tone, signo = false, icon: Icon, hint, compacto = false, destacado = false, grande = false, className, style }) {
  const tamano = grande ? 'text-2xl md:text-4xl' : compacto ? 'text-sm md:text-xl' : 'text-lg md:text-2xl'
  const secundario = destacado ? 'text-on-forest/75' : 'text-muted-foreground'
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl',
        destacado ? 'bg-linear-to-br from-forest to-leaf text-on-forest shadow-elevated' : 'superficie',
        compacto ? 'px-2.5 py-2.5 md:px-4 md:py-3' : 'px-4 py-3 md:px-5 md:py-4',
        grande && 'flex flex-col justify-between md:py-5',
        className,
      )}
      style={style}
    >
      {destacado ? <Ondas /> : null}
      <div className={cn('relative flex items-center justify-between gap-2 text-xs font-medium md:text-sm', secundario)}>
        {label}
        {Icon ? (
          <span className={cn('hidden size-8 shrink-0 place-items-center rounded-full md:grid', destacado ? 'bg-on-forest/15 text-on-forest' : (chips[tone] ?? 'bg-muted text-muted-foreground'))}>
            <Icon className="size-4" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <div className="relative">
        {typeof value === 'number' ? (
          <Money value={value} tone={destacado ? 'neutral' : tone} signo={signo} className={cn('mt-1 block font-bold tracking-tight', tamano)} />
        ) : (
          <span className={cn('mt-1 block truncate font-bold tracking-tight', tamano)}>{value}</span>
        )}
        {hint ? <p className={cn('mt-1 text-xs', secundario)}>{hint}</p> : null}
      </div>
    </div>
  )
}
