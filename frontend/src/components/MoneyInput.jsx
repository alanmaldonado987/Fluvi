import { Input } from '@/components/ui/input'
import { formatCOP } from '@/lib/format'
import { OCULTO, usePrivado } from '@/lib/privado'
import { cn } from '@/lib/utils'

const MAX_VALOR = 999_999_999

export function MoneyInput({ value, onValueChange, className, ...props }) {
  const privado = usePrivado()
  return (
    <Input
      inputMode="numeric"
      placeholder="$0"
      readOnly={privado}
      title={privado ? 'Desactiva el modo privado para editar' : undefined}
      className={cn('text-right tabular-nums', className)}
      value={privado ? OCULTO : value ? formatCOP(value) : ''}
      onChange={(e) => onValueChange(Math.min(Number(e.target.value.replace(/\D/g, '')) || 0, MAX_VALOR))}
      {...props}
    />
  )
}
