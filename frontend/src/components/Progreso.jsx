import { cn } from '@/lib/utils'

const tonos = { positive: 'bg-leaf', negative: 'bg-negative', neutral: 'bg-forest/40' }

export function Progreso({ valor, tone = 'positive', className }) {
  const escala = Math.min(Math.max(valor, 0), 1)
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(escala * 100)}>
      <div className={cn('h-full w-full origin-left rounded-full transition-[scale] duration-400 ease-out [scale:var(--p)_1] starting:[scale:0_1]', tonos[tone])} style={{ '--p': escala }} />
    </div>
  )
}
