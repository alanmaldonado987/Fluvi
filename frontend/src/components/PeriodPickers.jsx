import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { SelectField } from '@/components/SelectField'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { MESES, MESES_CORTO } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useFinance } from '@/store/context'

const actual = new Date().getFullYear()
const anios = [actual - 1, actual, actual + 1].map((a) => ({ value: String(a), label: String(a) }))

function etiquetaMeses(mes) {
  if (mes === null) return 'Todo el año'
  if (typeof mes === 'number') return MESES[mes]
  if (mes.length === 0) return 'Ningún mes'
  if (mes.length <= 4) return mes.map((m) => MESES_CORTO[m]).join(', ')
  return `${mes.length} meses`
}

export function MonthPicker({ className }) {
  const { state, actions } = useFinance()
  const [open, setOpen] = useState(false)

  const { mes } = state
  const seleccion = mes === null ? new Set(Array.from({ length: 12 }, (_, i) => i)) : Array.isArray(mes) ? new Set(mes) : new Set([mes])
  const todos = seleccion.size === 12

  const aplicar = (next) => {
    if (next.size === 12) actions.setPeriodo({ mes: null })
    else if (next.size === 0) actions.setPeriodo({ mes: [] })
    else if (next.size === 1) actions.setPeriodo({ mes: [...next][0] })
    else actions.setPeriodo({ mes: [...next].sort((a, b) => a - b) })
  }

  const toggle = (i) => {
    const next = new Set(seleccion)
    if (next.has(i)) next.delete(i)
    else next.add(i)
    aplicar(next)
  }

  const toggleTodos = () => {
    actions.setPeriodo({ mes: todos ? [] : null })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label="Mes"
        className={cn(
          'flex h-10 items-center justify-between gap-1.5 rounded-lg border border-input bg-card py-2 pr-2.5 pl-3 text-sm whitespace-nowrap transition-colors outline-none select-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-muted dark:bg-input/30 dark:hover:bg-input/50',
          className,
        )}
      >
        <span className="truncate">{etiquetaMeses(mes)}</span>
        <ChevronDown className={cn('pointer-events-none size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out', open && 'rotate-180')} aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent className="w-68">
        <label className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-semibold hover:bg-accent">
          <Checkbox checked={todos} onCheckedChange={toggleTodos} />
          Todo el año
        </label>
        <div className="my-1 border-t" />
        <div className="grid grid-cols-2 gap-0.5">
          {MESES.map((m, i) => (
            <label key={i} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-accent">
              <Checkbox checked={seleccion.has(i)} onCheckedChange={() => toggle(i)} />
              {m}
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function YearPicker({ className }) {
  const { state, actions } = useFinance()
  return <SelectField aria-label="Año" className={cn('w-28', className)} value={String(state.anio)} onChange={(v) => actions.setPeriodo({ anio: Number(v) })} items={anios} />
}

export function PeriodoPicker({ className }) {
  return (
    <div className={cn('flex', className)} role="group" aria-label="Periodo" data-tour="periodo">
      <MonthPicker className="w-36 rounded-r-none" />
      <YearPicker className="-ml-px w-24 rounded-l-none" />
    </div>
  )
}
