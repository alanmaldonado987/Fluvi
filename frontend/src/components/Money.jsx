import { useFormatoMoneda } from '@/lib/privado'
import { cn } from '@/lib/utils'

const tonos = { positive: 'text-positive', negative: 'text-negative', neutral: '' }

export function Money({ value, tone = 'neutral', signo = false, menos = false, className }) {
  const formatear = useFormatoMoneda()
  return (
    <span className={cn('tabular-nums', tonos[tone === 'neutral' && value < 0 ? 'negative' : tone], className)}>
      {menos ? '−' : signo && value > 0 ? '+' : ''}
      {formatear(value)}
    </span>
  )
}
