import { useFormatoMoneda } from '@/lib/privado'
import { cn } from '@/lib/utils'

const tonos = { positive: 'text-positive', negative: 'text-negative', neutral: '' }

export function Money({ value, tone = 'neutral', signo = false, className }) {
  const formatear = useFormatoMoneda()
  return (
    <span className={cn('tabular-nums', tonos[tone], className)}>
      {signo && value > 0 ? '+' : ''}
      {formatear(value)}
    </span>
  )
}
