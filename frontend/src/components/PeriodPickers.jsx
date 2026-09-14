import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { SelectField } from '@/components/SelectField'
import { MESES, MESES_CORTO } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useFinance } from '@/store/context'

const actual = new Date().getFullYear()
const anios = [actual - 1, actual, actual + 1].map((a) => ({ value: String(a), label: String(a) }))

function etiquetaMeses(mes) {
  if (mes === null) return 'Todo el año'
  if (typeof mes === 'number') return MESES[mes]
  if (mes.length <= 4) return mes.map((m) => MESES_CORTO[m]).join(', ')
  return `${mes.length} meses`
}

export function MonthPicker({ className }) {
  const { state, actions } = useFinance()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const { mes } = state
  const seleccion = mes === null ? new Set(Array.from({ length: 12 }, (_, i) => i)) : Array.isArray(mes) ? new Set(mes) : new Set([mes])
  const todos = seleccion.size === 12

  const aplicar = (next) => {
    if (next.size === 0 || next.size === 12) actions.setPeriodo({ mes: null })
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
    actions.setPeriodo({ mes: todos ? new Date().getMonth() : null })
  }

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Mes"
        className="flex h-10 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-card py-2 pr-2.5 pl-3 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50"
      >
        <span className="truncate">{etiquetaMeses(mes)}</span>
        <ChevronDown className="pointer-events-none size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-48 rounded-md border bg-card p-1 shadow-lg">
          <label className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm font-semibold hover:bg-accent">
            <input type="checkbox" className="size-4 accent-leaf" checked={todos} onChange={toggleTodos} />
            Todo el año
          </label>
          <div className="my-1 border-t" />
          {MESES.map((m, i) => (
            <label key={i} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent">
              <input type="checkbox" className="size-4 accent-leaf" checked={seleccion.has(i)} onChange={() => toggle(i)} />
              {m}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

export function YearPicker({ className }) {
  const { state, actions } = useFinance()
  return <SelectField aria-label="Año" className={cn('w-28', className)} value={String(state.anio)} onChange={(v) => actions.setPeriodo({ anio: Number(v) })} items={anios} />
}

export function PeriodoPicker({ className }) {
  return (
    <div className={cn('flex', className)} role="group" aria-label="Periodo" data-tour="periodo">
      <MonthPicker className="w-36 [&_button]:rounded-r-none" />
      <YearPicker className="-ml-px w-24 rounded-l-none" />
    </div>
  )
}
